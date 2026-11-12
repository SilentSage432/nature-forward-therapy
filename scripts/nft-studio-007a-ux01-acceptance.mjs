/**
 * NFT-STUDIO-007A-UX01 — palette gallery geometry + Studio acceptance.
 * Isolated local DB only. No Save Draft / Publish.
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const { SITE_PALETTE_DEFINITIONS, resolvePaletteCssTokens } = await import(
  "../lib/site-design/palette-registry.ts"
);

const BASE = process.env.ACCEPTANCE_BASE_URL || "http://127.0.0.1:3019";
const EMAIL = process.env.SEED_DEVELOPER_EMAIL || "dev@flockoffox.org";
const PASSWORD = process.env.SEED_DEVELOPER_PASSWORD || "ChangeMeDev!";
const PANEL_WIDTHS = [280, 320, 360, 420, 520, 640];
const VIEWPORTS = [390, 768, 1280, 1536];
const SHOT_DIR = path.resolve("tmp/nft-studio-007a-ux01");

mkdirSync(SHOT_DIR, { recursive: true });

const results = {
  ok: true,
  errors: [],
  panelWidths: {},
  viewports: {},
  selection: {},
  keyboard: {},
  dirtyNav: {},
};

function fail(msg) {
  results.ok = false;
  results.errors.push(msg);
  console.error("FAIL:", msg);
}

function overlaps(a, b, pad = 0.5) {
  return !(
    a.right <= b.left + pad ||
    a.left >= b.right - pad ||
    a.bottom <= b.top + pad ||
    a.top >= b.bottom - pad
  );
}

function contained(inner, outer, pad = 0.5) {
  return (
    inner.left >= outer.left - pad &&
    inner.right <= outer.right + pad &&
    inner.top >= outer.top - pad &&
    inner.bottom <= outer.bottom + pad
  );
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
  await page.waitForSelector("[data-palette-gallery]", { timeout: 30000 });
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

async function measureGallery(page) {
  return page.evaluate(() => {
    const gallery = document.querySelector("[data-palette-gallery]");
    const cards = [...document.querySelectorAll("[data-palette-card]")];
    const grids = [...document.querySelectorAll("[data-palette-grid]")];
    function box(el) {
      const r = el.getBoundingClientRect();
      return {
        left: r.left,
        top: r.top,
        right: r.right,
        bottom: r.bottom,
        width: r.width,
        height: r.height,
      };
    }
    return {
      galleryWidth: gallery?.getBoundingClientRect().width ?? 0,
      columnCounts: grids.map((g) => getComputedStyle(g).gridTemplateColumns.split(" ").length),
      cards: cards.map((card) => {
        const title = card.querySelector(".text-sm.font-semibold");
        const desc = [...card.querySelectorAll("span")].find((s) =>
          s.className.includes("text-xs"),
        );
        const radio = card.querySelector('input[type="radio"]');
        const swatches = [...card.querySelectorAll("[data-palette-swatch]")];
        return {
          id: card.getAttribute("data-palette-card"),
          selected: card.getAttribute("data-palette-selected") === "true",
          card: box(card),
          title: title ? box(title) : null,
          desc: desc ? box(desc) : null,
          radio: radio ? box(radio) : null,
          swatches: swatches.map(box),
        };
      }),
    };
  });
}

function assertGeometry(label, measured) {
  const report = {
    galleryWidth: measured.galleryWidth,
    columnCounts: measured.columnCounts,
    cardCount: measured.cards.length,
    issues: [],
  };

  if (measured.cards.length !== 15) {
    report.issues.push(`expected 15 cards, got ${measured.cards.length}`);
  }

  // Narrow panels must stay single-column.
  if (measured.galleryWidth < 400) {
    const multi = measured.columnCounts.some((n) => n > 1);
    if (multi) report.issues.push("multi-column below ~400px container width");
  }

  for (let i = 0; i < measured.cards.length; i++) {
    const card = measured.cards[i];
    for (const swatch of card.swatches) {
      if (!contained(swatch, card.card)) {
        report.issues.push(`${card.id}: swatch escapes card`);
      }
      if (card.title && overlaps(swatch, card.title)) {
        report.issues.push(`${card.id}: swatch overlaps title`);
      }
      if (card.desc && overlaps(swatch, card.desc)) {
        report.issues.push(`${card.id}: swatch overlaps description`);
      }
      if (card.radio && overlaps(swatch, card.radio)) {
        report.issues.push(`${card.id}: swatch overlaps radio`);
      }
    }
    if (card.title && card.radio && overlaps(card.title, card.radio, 0)) {
      // small natural adjacency is ok; require substantial overlap
      const overlapW =
        Math.min(card.title.right, card.radio.right) -
        Math.max(card.title.left, card.radio.left);
      const overlapH =
        Math.min(card.title.bottom, card.radio.bottom) -
        Math.max(card.title.top, card.radio.top);
      if (overlapW > 4 && overlapH > 4) {
        report.issues.push(`${card.id}: radio overlaps title`);
      }
    }
    // Title should not be an extreme single-character stack
    if (card.title && card.title.width < 24 && card.title.height > 60) {
      report.issues.push(`${card.id}: unreadable title stacking`);
    }
    for (let j = i + 1; j < measured.cards.length; j++) {
      const other = measured.cards[j];
      for (const swatch of card.swatches) {
        if (overlaps(swatch, other.card, 1)) {
          report.issues.push(`${card.id}: swatch overlaps card ${other.id}`);
        }
      }
    }
  }

  const overflowX = measured.cards.some(
    (c) => c.card.right > measured.galleryWidth + (typeof window === "undefined" ? 1e9 : 0),
  );
  // Overflow vs gallery: compare in page coords via max right
  const maxRight = Math.max(...measured.cards.map((c) => c.card.right), 0);
  const minLeft = Math.min(...measured.cards.map((c) => c.card.left), Infinity);
  if (maxRight - minLeft > measured.galleryWidth + 2) {
    report.issues.push("cards extend beyond gallery content width");
  }

  results.panelWidths[label] = report;
  for (const issue of report.issues) fail(`${label}: ${issue}`);
  console.log(
    label,
    `w=${Math.round(measured.galleryWidth)}`,
    `cols=${measured.columnCounts.join(",")}`,
    report.issues.length ? "BAD" : "OK",
  );
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

try {
  await login(page);
  await openDesign(page);

  // Controlled panel-width harness: resize the gallery container via inline style.
  for (const width of PANEL_WIDTHS) {
    await page.evaluate((w) => {
      const gallery = document.querySelector("[data-palette-gallery]");
      if (!gallery) return;
      gallery.style.width = `${w}px`;
      gallery.style.maxWidth = `${w}px`;
      gallery.style.boxSizing = "border-box";
    }, width);
    await page.waitForTimeout(200);
    const measured = await measureGallery(page);
    assertGeometry(`panel-${width}`, measured);
    if (width === 280 || width === 360 || width === 640) {
      await page.locator("[data-palette-gallery]").screenshot({
        path: path.join(SHOT_DIR, `panel-${width}.png`),
      });
    }
  }

  // Reset harness width
  await page.evaluate(() => {
    const gallery = document.querySelector("[data-palette-gallery]");
    if (!gallery) return;
    gallery.style.width = "";
    gallery.style.maxWidth = "";
  });

  // Full Studio viewports
  for (const width of VIEWPORTS) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(250);
    const measured = await measureGallery(page);
    assertGeometry(`viewport-${width}`, measured);
    if (width === 390 || width === 1280) {
      await page.screenshot({
        path: path.join(SHOT_DIR, `viewport-${width}.png`),
        fullPage: false,
      });
    }
  }

  await page.setViewportSize({ width: 1280, height: 900 });

  // Selection + preview regression for every palette
  for (const palette of SITE_PALETTE_DEFINITIONS) {
    await page.locator(`#theme-palette-${palette.id}`).check({ force: true });
    await page.waitForTimeout(350);
    const frame = await previewFrame(page);
    const state = await frame.evaluate(() => {
      const root = document.querySelector("[data-site-theme]");
      const styles = getComputedStyle(root);
      return {
        theme: root?.getAttribute("data-site-theme"),
        accent: styles.getPropertyValue("--site-accent").trim(),
        surface: styles.getPropertyValue("--site-surface-page").trim(),
      };
    });
    const expected = resolvePaletteCssTokens(palette.id);
    const selected = await page.locator(`#theme-palette-${palette.id}`).isChecked();
    results.selection[palette.id] = { ...state, selected };
    if (state.theme !== palette.id || !selected) {
      fail(`selection/preview ${palette.id}`);
    }
    if (state.accent.toLowerCase() !== expected.accent.toLowerCase()) {
      fail(`accent token ${palette.id}`);
    }
  }

  // Keyboard
  await page.locator("#theme-palette-forest-gold").focus();
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(150);
  const activeId = await page.evaluate(() => document.activeElement?.id || "");
  results.keyboard.activeAfterArrow = activeId;
  if (!activeId.startsWith("theme-palette-")) fail(`keyboard ${activeId}`);

  // Focus outline not clipped: focused card outline offset should remain measurable
  const focusGeom = await page.evaluate(() => {
    const card = document.activeElement?.closest("[data-palette-card]");
    if (!card) return null;
    const style = getComputedStyle(card);
    const r = card.getBoundingClientRect();
    return {
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
      outlineOffset: style.outlineOffset,
      width: r.width,
      height: r.height,
    };
  });
  results.keyboard.focusGeom = focusGeom;
  if (!focusGeom) fail("missing focused palette card");

  // Dirty-nav still works
  await page.locator("#theme-palette-slate-sky").check({ force: true });
  await page.waitForTimeout(200);
  const media = page.getByRole("link", { name: /^Media$/i }).first();
  await media.click({ timeout: 10000 });
  await page.waitForTimeout(400);
  const dialog = (await page.locator('[role="dialog"]').count()) > 0;
  const stay = page.getByRole("button", { name: /Stay|Keep editing/i });
  if (await stay.count()) await stay.first().click();
  results.dirtyNav = { dialog, stayedOnDesign: page.url().includes("/design") };
  if (!dialog && !page.url().includes("/design")) fail("dirty nav missing");
} catch (error) {
  fail(String(error?.stack || error));
} finally {
  await browser.close();
}

writeFileSync(
  path.join(SHOT_DIR, "results.json"),
  JSON.stringify(results, null, 2),
);
console.log(JSON.stringify(results, null, 2));
if (!results.ok) process.exit(1);
console.log("NFT-STUDIO-007A-UX01 BROWSER ACCEPTANCE PASSED");
console.log("screenshots:", SHOT_DIR);
