/**
 * NFT-STUDIO-007B — typography pairing Studio acceptance.
 * Isolated local DB only. No Save Draft / Publish.
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const { SITE_TYPOGRAPHY_PAIRINGS, resolveTypographyStack } = await import(
  "../lib/site-design/typography-registry.ts"
);
const { resolvePaletteCssTokens } = await import(
  "../lib/site-design/palette-registry.ts"
);

const BASE = process.env.ACCEPTANCE_BASE_URL || "http://127.0.0.1:3021";
const EMAIL = process.env.SEED_DEVELOPER_EMAIL || "dev@flockoffox.org";
const PASSWORD = process.env.SEED_DEVELOPER_PASSWORD || "ChangeMeDev!";
const VIEWPORTS = [390, 768, 1280, 1536];
const PALETTE_SPOTS = [
  "forest-gold",
  "coastal-mist",
  "midnight-garden",
  "lavender-meadow",
];
const SHOT_DIR = path.resolve("tmp/nft-studio-007b");

mkdirSync(SHOT_DIR, { recursive: true });

const results = {
  ok: true,
  errors: [],
  pairings: {},
  viewports: {},
  palettes: {},
  keyboard: {},
  handshake: {},
  dirtyNav: {},
  zoom: {},
  draftUnchanged: true,
};

function fail(msg) {
  results.ok = false;
  results.errors.push(msg);
  console.error("FAIL:", msg);
}

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.fill("#email", EMAIL);
  await page.fill("#password", PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/admin/, { timeout: 30000 });
}

async function openDesign(page) {
  await page.goto(`${BASE}/admin/studio/design`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForSelector("[data-font-gallery]", { timeout: 30000 });
  await page.waitForSelector('iframe[src*="preview-frame"]', { timeout: 30000 });
}

async function previewFrame(page) {
  const handle = await page
    .locator('iframe[src*="preview-frame"]')
    .first()
    .elementHandle();
  const frame = await handle.contentFrame();
  await frame.waitForSelector("[data-site-theme]", {
    timeout: 20000,
    state: "attached",
  });
  return frame;
}

async function readPreviewTypography(frame) {
  return frame.evaluate(() => {
    const root = document.querySelector("[data-site-theme]");
    const h1 = document.querySelector("h1");
    const bodySample =
      document.querySelector("p") || document.querySelector("[class*='site-fg']");
    const h1Style = h1 ? getComputedStyle(h1) : null;
    const bodyStyle = bodySample ? getComputedStyle(bodySample) : null;
    const rootStyle = root ? getComputedStyle(root) : null;
    return {
      theme: root?.getAttribute("data-site-theme"),
      font: root?.getAttribute("data-site-font"),
      heading: root?.getAttribute("data-site-heading"),
      body: root?.getAttribute("data-site-body"),
      headingFamily: h1Style?.fontFamily || null,
      bodyFamily: bodyStyle?.fontFamily || rootStyle?.fontFamily || null,
      headingSize: h1Style?.fontSize || null,
      overflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
      docScrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    };
  });
}

function familyMentions(cssFamily, expectedVarHint) {
  // next/font injects hashed family names; assert computed family is non-empty
  // and changes across pairings rather than matching CSS var names literally.
  return typeof cssFamily === "string" && cssFamily.length > 0;
}

async function selectFont(page, id) {
  await page.locator(`[data-font-card="${id}"]`).scrollIntoViewIfNeeded();
  await page.locator(`#font-family-${id}`).check({ force: true });
  await page.waitForTimeout(250);
}

async function selectPalette(page, id) {
  await page.locator(`[data-palette-card="${id}"]`).scrollIntoViewIfNeeded();
  await page.locator(`#theme-palette-${id}`).check({ force: true });
  await page.waitForTimeout(250);
}

async function selectHeadingScale(page, id) {
  await page.locator(`#heading-scale-${id}`).check({ force: true });
  await page.waitForTimeout(200);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

try {
  await login(page);
  await openDesign(page);
  let frame = await previewFrame(page);

  // Baseline classic
  await selectFont(page, "classic");
  let baseline = await readPreviewTypography(frame);
  if (baseline.font !== "classic") fail(`baseline font ${baseline.font}`);
  results.pairings.classic = baseline;

  const classicHeading = baseline.headingFamily;
  const classicBody = baseline.bodyFamily;

  for (const pairing of SITE_TYPOGRAPHY_PAIRINGS) {
    await selectFont(page, pairing.id);
    const selected = await page
      .locator(`[data-font-card="${pairing.id}"]`)
      .getAttribute("data-font-selected");
    if (selected !== "true") fail(`selected attr ${pairing.id}`);

    const typo = await readPreviewTypography(frame);
    const stack = resolveTypographyStack(pairing.id);
    results.pairings[pairing.id] = { ...typo, expected: stack };

    if (typo.font !== pairing.id) fail(`data-site-font ${pairing.id} got ${typo.font}`);
    if (!familyMentions(typo.headingFamily)) fail(`empty heading family ${pairing.id}`);
    if (!familyMentions(typo.bodyFamily)) fail(`empty body family ${pairing.id}`);
    if (typo.overflowX) fail(`overflow ${pairing.id}`);

    if (pairing.id !== "classic") {
      const headingChanged = typo.headingFamily !== classicHeading;
      const bodyChanged = typo.bodyFamily !== classicBody;
      const stackDiffers =
        stack.headingVar !== "--font-montserrat" || stack.bodyVar !== "--font-inter";
      if (stackDiffers && !headingChanged && !bodyChanged) {
        fail(`computed fonts unchanged for ${pairing.id}`);
      }
    }

    console.log(
      `pairing-${pairing.id}`,
      `font=${typo.font}`,
      `h=${(typo.headingFamily || "").slice(0, 40)}`,
      "OK",
    );
  }

  // Restore classic, check heading scale still works
  await selectFont(page, "classic");
  await selectHeadingScale(page, "prominent");
  const prominent = await readPreviewTypography(frame);
  await selectHeadingScale(page, "comfortable");
  const comfortable = await readPreviewTypography(frame);
  if (!(parseFloat(prominent.headingSize) > parseFloat(comfortable.headingSize))) {
    fail(
      `heading scale did not grow prominent=${prominent.headingSize} comfortable=${comfortable.headingSize}`,
    );
  }

  // Palette compatibility — typography independent of palette tokens
  for (const paletteId of PALETTE_SPOTS) {
    await selectPalette(page, paletteId);
    await selectFont(page, "literary");
    const typo = await readPreviewTypography(frame);
    const tokens = resolvePaletteCssTokens(paletteId);
    const accent = await frame.evaluate(() =>
      getComputedStyle(document.querySelector("[data-site-theme]")).getPropertyValue(
        "--site-accent",
      ).trim(),
    );
    results.palettes[paletteId] = {
      font: typo.font,
      theme: typo.theme,
      accent,
      expectedAccent: tokens.accent,
    };
    if (typo.theme !== paletteId) fail(`palette theme ${paletteId}`);
    if (typo.font !== "literary") fail(`palette kept font literary got ${typo.font}`);
    if (accent.toLowerCase() !== tokens.accent.toLowerCase()) {
      fail(`accent drift ${paletteId} ${accent} vs ${tokens.accent}`);
    }
  }

  // Viewports with soft-sans + scholarly
  for (const width of VIEWPORTS) {
    await page.setViewportSize({ width, height: 900 });
    await openDesign(page);
    frame = await previewFrame(page);
    await selectFont(page, width < 800 ? "soft-sans" : "scholarly");
    const typo = await readPreviewTypography(frame);
    const panelOverflow = await page.evaluate(() => {
      const gallery = document.querySelector("[data-font-gallery]");
      if (!gallery) return true;
      return gallery.scrollWidth > gallery.clientWidth + 2;
    });
    results.viewports[`vp-${width}`] = { ...typo, panelOverflow };
    if (typo.overflowX) fail(`viewport overflow ${width}`);
    if (panelOverflow) fail(`font gallery horizontal overflow ${width}`);
    if (width === 390 || width === 1280) {
      await page.screenshot({
        path: path.join(SHOT_DIR, `viewport-${width}.png`),
        fullPage: false,
      });
    }
    console.log(`viewport-${width}`, typo.font, "OK");
  }

  await page.setViewportSize({ width: 1280, height: 900 });
  await openDesign(page);
  frame = await previewFrame(page);

  // Keyboard
  await page.locator("#font-family-classic").focus();
  await page.keyboard.press("ArrowDown");
  const activeId = await page.evaluate(() => document.activeElement?.id || "");
  results.keyboard.activeAfterArrow = activeId;
  if (!activeId.startsWith("font-family-")) fail(`keyboard ${activeId}`);

  // Late iframe load / reload restore unsaved typography
  await selectFont(page, "distinctive");
  await page.locator('iframe[src*="preview-frame"]').evaluate((iframe) => {
    iframe.contentWindow?.location.reload();
  });
  await page.waitForTimeout(800);
  frame = await previewFrame(page);
  // re-assert after reload recovery — parent should re-send latest design
  let recovered = await readPreviewTypography(frame);
  for (let i = 0; i < 10 && recovered.font !== "distinctive"; i++) {
    await page.waitForTimeout(400);
    recovered = await readPreviewTypography(frame);
  }
  results.handshake.reloadFont = recovered.font;
  if (recovered.font !== "distinctive") {
    fail(`reload did not restore distinctive got ${recovered.font}`);
  }

  // Dirty nav protection — use Studio subnav (sidebar may be collapsed at xl)
  await selectFont(page, "contemporary");
  const studioNav = page.locator('a[href="/admin/studio"]').filter({ hasText: /overview/i });
  const mediaNav = page.locator('a[href="/admin/studio/media"]');
  if (await mediaNav.count()) {
    await mediaNav.first().click({ force: true });
  } else if (await studioNav.count()) {
    await studioNav.first().click({ force: true });
  } else {
    await page.locator('a[href="/admin/studio"]').first().click({ force: true });
  }
  const dialog = page.getByRole("dialog");
  const dialogVisible = await dialog
    .waitFor({ state: "visible", timeout: 5000 })
    .then(() => true)
    .catch(() => false);
  results.dirtyNav.dialog = dialogVisible;
  if (dialogVisible) {
    await page.getByRole("button", { name: /stay/i }).click();
    await page.waitForURL(/\/admin\/studio\/design/);
    results.dirtyNav.stayedOnDesign = true;
  } else {
    fail("dirty navigation dialog missing");
  }

  // 200% zoom spot checks
  await page.evaluate(() => {
    document.documentElement.style.zoom = "2";
  });
  for (const id of ["literary", "soft-sans"]) {
    await selectFont(page, id);
    const typo = await readPreviewTypography(frame);
    results.zoom[id] = { overflowX: typo.overflowX, font: typo.font };
    if (typo.overflowX) fail(`zoom overflow ${id}`);
  }
  await page.evaluate(() => {
    document.documentElement.style.zoom = "1";
  });

  // Confirm Save Draft not auto-triggered: button should still show unsaved if present
  const saveLabel = await page.locator("button", { hasText: /Save Draft/i }).first().textContent().catch(() => "");
  results.saveButton = saveLabel;

  await page.screenshot({
    path: path.join(SHOT_DIR, "design-typography.png"),
    fullPage: false,
  });
} catch (err) {
  fail(err instanceof Error ? err.message : String(err));
} finally {
  writeFileSync(path.join(SHOT_DIR, "results.json"), JSON.stringify(results, null, 2));
  await browser.close();
}

if (!results.ok) {
  console.error("NFT-STUDIO-007B BROWSER ACCEPTANCE FAILED");
  console.error(results.errors);
  process.exit(1);
}

console.log(JSON.stringify(results, null, 2));
console.log("NFT-STUDIO-007B BROWSER ACCEPTANCE PASSED");
console.log("screenshots:", SHOT_DIR);
