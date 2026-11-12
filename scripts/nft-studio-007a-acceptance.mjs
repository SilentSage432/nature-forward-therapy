/**
 * NFT-STUDIO-007A isolated browser acceptance.
 * Requires a local Next.js server pointed at loopback PostgreSQL.
 * Does not Save Draft or Publish.
 */
import { chromium } from "playwright";

const {
  SITE_PALETTE_DEFINITIONS,
  resolvePaletteCssTokens,
} = await import("../lib/site-design/palette-registry.ts");

const BASE = process.env.ACCEPTANCE_BASE_URL || "http://127.0.0.1:3017";
// Prefer DEVELOPER seed to avoid first-login force-password modal.
const EMAIL = process.env.SEED_DEVELOPER_EMAIL || "dev@flockoffox.org";
const PASSWORD = process.env.SEED_DEVELOPER_PASSWORD || "ChangeMeDev!";

const TOKEN_CHECKS = [
  ["--site-surface-page", "surfacePage"],
  ["--site-accent", "accent"],
  ["--site-foreground", "foreground"],
  ["--site-foreground-heading", "foregroundHeading"],
  ["--site-accent-foreground", "accentForeground"],
];

function rgbToHex(rgb) {
  const m = String(rgb)
    .trim()
    .match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!m) return String(rgb).trim().toLowerCase();
  return (
    "#" +
    [m[1], m[2], m[3]]
      .map((n) => Number(n).toString(16).padStart(2, "0"))
      .join("")
  );
}

function normalizeCssColor(value) {
  const v = String(value).trim().toLowerCase();
  if (v.startsWith("#")) {
    if (v.length === 4) {
      return (
        "#" +
        v
          .slice(1)
          .split("")
          .map((c) => c + c)
          .join("")
      );
    }
    return v;
  }
  return rgbToHex(v);
}

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.fill('input[name="email"], input[type="email"]', EMAIL);
  await page.fill('input[name="password"], input[type="password"]', PASSWORD);
  await Promise.all([
    page.waitForURL(/\/admin/, { timeout: 30000 }),
    page.click('button[type="submit"]'),
  ]);
}

async function openDesignStudio(page) {
  await page.goto(`${BASE}/admin/studio/design`, { waitUntil: "networkidle" });
  await page.waitForSelector('iframe[title*="Preview"], iframe[src*="preview-frame"]', {
    timeout: 30000,
  });
}

async function selectPalette(page, id) {
  const input = page.locator(`#theme-palette-${id}`);
  await input.scrollIntoViewIfNeeded();
  await input.check({ force: true });
}

async function previewFrame(page) {
  const frameEl = page.locator('iframe[src*="preview-frame"]').first();
  const handle = await frameEl.elementHandle();
  const frame = await handle.contentFrame();
  if (!frame) throw new Error("preview frame missing");
  // Preview content is intentionally aria-hidden/inert — wait for attached, not visible.
  await frame.waitForSelector("[data-site-theme]", {
    timeout: 20000,
    state: "attached",
  });
  return frame;
}

async function readThemeState(frame) {
  return frame.evaluate((tokenNames) => {
    const root = document.querySelector("[data-site-theme]");
    if (!root) return null;
    const styles = getComputedStyle(root);
    const tokens = {};
    for (const name of tokenNames) {
      tokens[name] = styles.getPropertyValue(name).trim();
    }
    const about = document.querySelector("#about");
    const specialties = document.querySelector("#specialties");
    const contact = document.querySelector("#contact");
    const btn = document.querySelector(".btn-gold");
    return {
      theme: root.getAttribute("data-site-theme"),
      font: root.getAttribute("data-site-font"),
      tokens,
      aboutBg: about ? getComputedStyle(about).backgroundColor : null,
      specialtiesBg: specialties
        ? getComputedStyle(specialties).backgroundColor
        : null,
      contactBg: contact ? getComputedStyle(contact).backgroundColor : null,
      buttonColor: btn ? getComputedStyle(btn).color : null,
      buttonBg: btn ? getComputedStyle(btn).backgroundImage : null,
      overflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
    };
  }, TOKEN_CHECKS.map(([cssVar]) => cssVar));
}

const results = {
  ok: true,
  palettes: [],
  forestGold: {},
  keyboard: {},
  typography: {},
  handshake: {},
  errors: [],
};

function fail(msg) {
  results.ok = false;
  results.errors.push(msg);
  console.error("FAIL:", msg);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

try {
  console.log("BASE", BASE);
  await login(page);
  await openDesignStudio(page);

  // Handshake: wait until forest-gold preview is live, then switch and back.
  let frame = await previewFrame(page);
  await selectPalette(page, "forest-gold");
  await page.waitForTimeout(400);
  frame = await previewFrame(page);
  let state = await readThemeState(frame);
  if (state?.theme !== "forest-gold") {
    fail(`initial theme expected forest-gold got ${state?.theme}`);
  }
  results.handshake.initial = state?.theme;

  await selectPalette(page, "dusk-sage");
  await page.waitForTimeout(500);
  frame = await previewFrame(page);
  state = await readThemeState(frame);
  results.handshake.afterDusk = state?.theme;
  if (state?.theme !== "dusk-sage") {
    fail(`handshake dusk-sage failed: ${state?.theme}`);
  }

  // Forest & Gold preservation snapshot at three widths.
  for (const width of [390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await selectPalette(page, "forest-gold");
    await page.waitForTimeout(450);
    frame = await previewFrame(page);
    state = await readThemeState(frame);
    const expected = resolvePaletteCssTokens("forest-gold");
    const accentOk =
      normalizeCssColor(state.tokens["--site-accent"]) ===
      normalizeCssColor(expected.accent);
    const surfaceOk =
      normalizeCssColor(state.tokens["--site-surface-page"]) ===
      normalizeCssColor(expected.surfacePage);
    results.forestGold[width] = {
      theme: state.theme,
      accentOk,
      surfaceOk,
      overflowX: state.overflowX,
    };
    if (state.theme !== "forest-gold" || !accentOk || !surfaceOk) {
      fail(`forest-gold preservation failed at ${width}`);
    }
    if (state.overflowX) fail(`unexpected overflow at ${width} forest-gold`);
  }

  await page.setViewportSize({ width: 1280, height: 900 });

  // Every palette in iframe.
  for (const palette of SITE_PALETTE_DEFINITIONS) {
    await selectPalette(page, palette.id);
    await page.waitForTimeout(450);
    frame = await previewFrame(page);
    state = await readThemeState(frame);
    const expected = resolvePaletteCssTokens(palette.id);
    const tokenMatches = {};
    let tokensOk = true;
    for (const [cssVar, key] of TOKEN_CHECKS) {
      const actual = normalizeCssColor(state.tokens[cssVar]);
      const want = normalizeCssColor(expected[key]);
      const match = actual === want;
      tokenMatches[cssVar] = { actual, want, match };
      if (!match) tokensOk = false;
    }
    const selectedControl = await page.locator(`#theme-palette-${palette.id}`).isChecked();
    const entry = {
      id: palette.id,
      themeAttr: state.theme,
      selectedControl,
      tokensOk,
      tokenMatches,
      aboutBg: state.aboutBg,
      specialtiesBg: state.specialtiesBg,
      contactBg: state.contactBg,
      buttonColor: state.buttonColor,
      overflowX: state.overflowX,
    };
    results.palettes.push(entry);
    console.log(
      palette.id,
      state.theme === palette.id && tokensOk ? "OK" : "BAD",
      state.theme,
    );
    if (state.theme !== palette.id) fail(`${palette.id} theme attr mismatch`);
    if (!selectedControl) fail(`${palette.id} radio not selected`);
    if (!tokensOk) fail(`${palette.id} token mismatch`);
    if (state.overflowX) fail(`${palette.id} overflow`);
  }

  // Typography presets with a light and dark palette.
  for (const font of ["classic", "editorial", "modern"]) {
    for (const theme of ["forest-gold", "botanical-cream"]) {
      await selectPalette(page, theme);
      await page.locator(`#font-family-${font}`).check({ force: true });
      await page.waitForTimeout(400);
      frame = await previewFrame(page);
      const attrs = await frame.evaluate(() => {
        const root = document.querySelector("[data-site-theme]");
        return {
          theme: root?.getAttribute("data-site-theme"),
          font: root?.getAttribute("data-site-font"),
        };
      });
      results.typography[`${theme}:${font}`] = attrs;
      if (attrs.theme !== theme || attrs.font !== font) {
        fail(`typography combo ${theme}:${font} -> ${JSON.stringify(attrs)}`);
      }
    }
  }

  // Keyboard gallery: focus first palette radio and move with arrows / space.
  await page.locator("#theme-palette-forest-gold").focus();
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(200);
  const activeId = await page.evaluate(() => document.activeElement?.id || "");
  results.keyboard.activeAfterArrow = activeId;
  if (!activeId.startsWith("theme-palette-")) {
    fail(`keyboard focus left palette gallery: ${activeId}`);
  }
  // Ensure visible focus styling path exists (outline utility on label).
  const focusVisible = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el) return false;
    const label = el.closest("label");
    if (!label) return false;
    return label.className.includes("focus-within:outline");
  });
  results.keyboard.focusWithinClass = focusVisible;
  if (!focusVisible) fail("palette label missing focus-within outline class");

  // Zoom/reflow spot check on light + dark.
  for (const theme of ["forest-gold", "coastal-mist"]) {
    await selectPalette(page, theme);
    await page.waitForTimeout(300);
    frame = await previewFrame(page);
    await frame.evaluate(() => {
      document.body.style.zoom = "2";
    });
    const overflow = await frame.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 2,
    );
    results.keyboard[`zoom2:${theme}`] = { overflow };
    await frame.evaluate(() => {
      document.body.style.zoom = "1";
    });
    if (overflow) fail(`zoom overflow on ${theme}`);
  }
} catch (error) {
  fail(String(error?.stack || error));
} finally {
  await browser.close();
}

console.log(JSON.stringify(results, null, 2));
if (!results.ok) process.exit(1);
console.log("NFT-STUDIO-007A BROWSER ACCEPTANCE PASSED");
