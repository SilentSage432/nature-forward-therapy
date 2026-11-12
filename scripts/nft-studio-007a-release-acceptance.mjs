/**
 * NFT-STUDIO-007A release browser acceptance + rendered accessibility sampling.
 * Isolated local DB only. No Save Draft / Publish.
 */
import { chromium } from "playwright";

const {
  SITE_PALETTE_DEFINITIONS,
  resolvePaletteCssTokens,
} = await import("../lib/site-design/palette-registry.ts");
const { contrastRatioForCssColors } =
  await import("../lib/site-design/contrast.ts");

const BASE = process.env.ACCEPTANCE_BASE_URL || "http://127.0.0.1:3018";
const EMAIL = process.env.SEED_DEVELOPER_EMAIL || "dev@flockoffox.org";
const PASSWORD = process.env.SEED_DEVELOPER_PASSWORD || "ChangeMeDev!";
const A11Y_PALETTES = [
  "forest-gold",
  "coastal-mist",
  "botanical-cream",
  "midnight-garden",
  "rosewood",
  "warm-terracotta", // lowest button margin historically
];

function rgbToHex(rgb) {
  const m = String(rgb).trim().match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
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
  if (v === "tan") return "#d2b48c";
  return rgbToHex(v);
}

const results = {
  ok: true,
  errors: [],
  palettes: [],
  forestGold: {},
  a11y: {},
  keyboard: {},
  handshake: {},
  typography: {},
  dirtyNav: {},
  zoom: {},
};

function fail(msg) {
  results.ok = false;
  results.errors.push(msg);
  console.error("FAIL:", msg);
}

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.fill("#email", EMAIL);
  await page.fill("#password", PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/admin/, { timeout: 30000 });
}

async function openDesign(page) {
  await page.goto(`${BASE}/admin/studio/design`, { waitUntil: "networkidle" });
  await page.waitForSelector('iframe[src*="preview-frame"]', { timeout: 30000 });
}

async function previewFrame(page) {
  const handle = await page.locator('iframe[src*="preview-frame"]').first().elementHandle();
  const frame = await handle.contentFrame();
  if (!frame) throw new Error("missing preview frame");
  await frame.waitForSelector("[data-site-theme]", {
    timeout: 20000,
    state: "attached",
  });
  return frame;
}

async function selectPalette(page, id) {
  const input = page.locator(`#theme-palette-${id}`);
  await input.scrollIntoViewIfNeeded();
  await input.check({ force: true });
}

async function readTheme(frame) {
  return frame.evaluate(() => {
    const root = document.querySelector("[data-site-theme]");
    const styles = getComputedStyle(root);
    const btn = document.querySelector(".btn-gold");
    const outline = document.querySelector(".btn-outline");
    const navLink = document.querySelector("nav a.site-fg-supporting, nav a");
    const about = document.querySelector("#about");
    const specialties = document.querySelector("#specialties");
    return {
      theme: root.getAttribute("data-site-theme"),
      font: root.getAttribute("data-site-font"),
      surface: styles.getPropertyValue("--site-surface-page").trim(),
      accent: styles.getPropertyValue("--site-accent").trim(),
      foreground: styles.getPropertyValue("--site-foreground").trim(),
      heading: styles.getPropertyValue("--site-foreground-heading").trim(),
      accentFg: styles.getPropertyValue("--site-accent-foreground").trim(),
      focusRing: styles.getPropertyValue("--site-focus-ring").trim(),
      aboutBg: about ? getComputedStyle(about).backgroundColor : null,
      specialtiesBg: specialties
        ? getComputedStyle(specialties).backgroundColor
        : null,
      buttonColor: btn ? getComputedStyle(btn).color : null,
      buttonBgImage: btn ? getComputedStyle(btn).backgroundImage : null,
      outlineColor: outline ? getComputedStyle(outline).color : null,
      outlineBorder: outline ? getComputedStyle(outline).borderColor : null,
      navColor: navLink ? getComputedStyle(navLink).color : null,
      overflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
    };
  });
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

try {
  console.log("BASE", BASE);
  await login(page);
  await openDesign(page);

  // Initial handshake
  let frame = await previewFrame(page);
  await selectPalette(page, "forest-gold");
  await page.waitForTimeout(400);
  frame = await previewFrame(page);
  let state = await readTheme(frame);
  results.handshake.initial = state.theme;
  if (state.theme !== "forest-gold") fail(`initial theme ${state.theme}`);

  // Post-load palette change
  await selectPalette(page, "dusk-sage");
  await page.waitForTimeout(500);
  frame = await previewFrame(page);
  state = await readTheme(frame);
  results.handshake.afterDusk = state.theme;
  if (state.theme !== "dusk-sage") fail(`post-load dusk got ${state.theme}`);

  // Iframe reload + unsaved restoration via parent SET_DESIGN after READY
  await selectPalette(page, "botanical-cream");
  await page.waitForTimeout(400);
  await page.locator('iframe[src*="preview-frame"]').evaluate((el) => {
    el.contentWindow.location.reload();
  });
  await page.waitForTimeout(1500);
  frame = await previewFrame(page);
  // Parent should re-handshake and push latest unsaved design
  for (let i = 0; i < 10; i++) {
    state = await readTheme(frame);
    if (state.theme === "botanical-cream") break;
    await page.waitForTimeout(300);
  }
  results.handshake.afterReload = state.theme;
  if (state.theme !== "botanical-cream") {
    fail(`reload restore expected botanical-cream got ${state.theme}`);
  }

  // Forest & Gold at 3 widths
  for (const width of [390, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await selectPalette(page, "forest-gold");
    await page.waitForTimeout(450);
    frame = await previewFrame(page);
    state = await readTheme(frame);
    const expected = resolvePaletteCssTokens("forest-gold");
    const accentOk =
      normalizeCssColor(state.accent) === normalizeCssColor(expected.accent);
    const surfaceOk =
      normalizeCssColor(state.surface) ===
      normalizeCssColor(expected.surfacePage);
    results.forestGold[width] = {
      theme: state.theme,
      accentOk,
      surfaceOk,
      overflowX: state.overflowX,
      accent: state.accent,
      surface: state.surface,
    };
    if (!(state.theme === "forest-gold" && accentOk && surfaceOk)) {
      fail(`forest-gold preservation ${width}`);
    }
    if (state.overflowX) fail(`overflow forest-gold ${width}`);

    // Mobile nav open check at 390
    if (width === 390) {
      const menuBtn = frame.locator('button[aria-label*="menu" i], button[aria-label*="Menu" i], button.md\\:hidden').first();
      if (await menuBtn.count()) {
        // Preview is pointer-events-none/inert — inspect existence only
        results.forestGold.mobileMenuPresent = true;
      } else {
        results.forestGold.mobileMenuPresent = false;
      }
    }
  }

  await page.setViewportSize({ width: 1280, height: 900 });

  // All 15 palettes
  for (const palette of SITE_PALETTE_DEFINITIONS) {
    await selectPalette(page, palette.id);
    await page.waitForTimeout(400);
    frame = await previewFrame(page);
    state = await readTheme(frame);
    const expected = resolvePaletteCssTokens(palette.id);
    const accentOk =
      normalizeCssColor(state.accent) === normalizeCssColor(expected.accent);
    const surfaceOk =
      normalizeCssColor(state.surface) ===
      normalizeCssColor(expected.surfacePage);
    const selected = await page.locator(`#theme-palette-${palette.id}`).isChecked();
    const entry = {
      id: palette.id,
      theme: state.theme,
      accentOk,
      surfaceOk,
      selected,
      aboutBg: state.aboutBg,
      specialtiesBg: state.specialtiesBg,
      overflowX: state.overflowX,
    };
    results.palettes.push(entry);
    console.log(palette.id, accentOk && surfaceOk && state.theme === palette.id ? "OK" : "BAD");
    if (state.theme !== palette.id || !accentOk || !surfaceOk || !selected) {
      fail(`palette ${palette.id}`);
    }
    if (state.overflowX) fail(`overflow ${palette.id}`);
  }

  // Rendered accessibility sampling
  for (const id of A11Y_PALETTES) {
    await selectPalette(page, id);
    await page.waitForTimeout(400);
    frame = await previewFrame(page);
    state = await readTheme(frame);
    const expected = resolvePaletteCssTokens(id);
    const pairs = [
      ["body", state.foreground, state.surface, 4.5],
      ["heading", state.heading, state.surface, 3],
      ["button", state.accentFg, state.accent, 4.5],
      ["accent-link", state.accent, state.surface, 4.5],
    ];
    const measured = {};
    let ok = true;
    for (const [name, fg, bg, min] of pairs) {
      const evaled = contrastRatioForCssColors(
        normalizeCssColor(fg),
        normalizeCssColor(bg),
      );
      const ratio = evaled.ratio;
      const passed = evaled.status === "ok" && ratio != null && ratio + 1e-9 >= min;
      measured[name] = {
        fg: normalizeCssColor(fg),
        bg: normalizeCssColor(bg),
        ratio: ratio?.toFixed(2) ?? null,
        status: evaled.status,
        passed,
      };
      if (!passed) ok = false;
    }
    // Focus ring translucent — record review, inspect presence
    const focusReview = contrastRatioForCssColors(
      expected.focusRing,
      expected.surfacePage,
    );
    // Gallery selected vs unselected
    const gallery = await page.evaluate((paletteId) => {
      const selected = document.querySelector(`#theme-palette-${paletteId}`)?.closest("label");
      const other = document.querySelector(
        `input[name="theme-palette"]:not(#theme-palette-${paletteId})`,
      )?.closest("label");
      return {
        selectedClass: selected?.className || "",
        otherClass: other?.className || "",
        selectedHasRing: selected?.className.includes("ring-") || selected?.className.includes("border-gold"),
        otherDifferent: selected?.className !== other?.className,
      };
    }, id);
    results.a11y[id] = {
      measured,
      ok,
      focusReview: focusReview.status,
      gallery,
      buttonBgImagePresent: Boolean(state.buttonBgImage && state.buttonBgImage !== "none"),
      outlineBorder: state.outlineBorder,
      navColor: state.navColor,
    };
    if (!ok) fail(`rendered a11y ${id}`);
    if (!gallery.selectedHasRing || !gallery.otherDifferent) {
      fail(`gallery selected state ${id}`);
    }
  }

  // Typography combos
  for (const font of ["classic", "editorial", "modern"]) {
    for (const theme of ["forest-gold", "coastal-mist"]) {
      await selectPalette(page, theme);
      await page.locator(`#font-family-${font}`).check({ force: true });
      await page.waitForTimeout(350);
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
        fail(`typography ${theme}:${font}`);
      }
    }
  }

  // Keyboard gallery
  await page.locator("#theme-palette-forest-gold").focus();
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(200);
  const activeId = await page.evaluate(() => document.activeElement?.id || "");
  results.keyboard.activeAfterArrow = activeId;
  if (!activeId.startsWith("theme-palette-")) fail(`keyboard ${activeId}`);
  const focusVisible = await page.evaluate(() => {
    const label = document.activeElement?.closest("label");
    return Boolean(label?.className.includes("focus-within:outline"));
  });
  results.keyboard.focusWithinClass = focusVisible;
  if (!focusVisible) fail("missing focus-within class");

  // Dirty-state navigation protection (use a visibly rendered Studio subnav link)
  await selectPalette(page, "slate-sky");
  await page.waitForTimeout(300);
  const mediaLink = page.getByRole("link", { name: /^Media$/i }).first();
  await mediaLink.scrollIntoViewIfNeeded();
  await mediaLink.click({ timeout: 10000 });
  await page.waitForTimeout(500);
  const dialogCount = await page.locator('[role="dialog"]').count();
  const discardText = await page.getByText(/Discard|unsaved changes/i).count();
  results.dirtyNav.dialogObserved = dialogCount > 0 || discardText > 0;
  results.dirtyNav.urlAfterClick = page.url();
  const stay = page.getByRole("button", { name: /Stay|Keep editing/i });
  const cancel = page.getByRole("button", { name: /^Cancel$/i });
  if (await stay.count()) {
    await stay.first().click();
    results.dirtyNav.stayed = true;
  } else if (await cancel.count()) {
    await cancel.first().click();
    results.dirtyNav.stayed = true;
  } else {
    results.dirtyNav.stayed = page.url().includes("/design");
  }
  if (!results.dirtyNav.dialogObserved && !page.url().includes("/design")) {
    fail("dirty navigation guard not observed");
  }

  // Zoom checks (stay on design page; avoid networkidle hang on re-navigation)
  for (const theme of ["forest-gold", "coastal-mist"]) {
    if (!page.url().includes("/admin/studio/design")) {
      await page.goto(`${BASE}/admin/studio/design`, {
        waitUntil: "domcontentloaded",
      });
      await page.waitForSelector('iframe[src*="preview-frame"]', {
        timeout: 30000,
      });
    }
    await selectPalette(page, theme);
    await page.waitForTimeout(450);
    frame = await previewFrame(page);
    await frame.evaluate(() => {
      document.body.style.zoom = "2";
    });
    const overflow = await frame.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 2,
    );
    results.zoom[theme] = { overflow };
    await frame.evaluate(() => {
      document.body.style.zoom = "1";
    });
    if (overflow) fail(`zoom overflow ${theme}`);
  }
} catch (error) {
  fail(String(error?.stack || error));
} finally {
  await browser.close();
}

console.log(JSON.stringify(results, null, 2));
if (!results.ok) process.exit(1);
console.log("NFT-STUDIO-007A RELEASE BROWSER ACCEPTANCE PASSED");
