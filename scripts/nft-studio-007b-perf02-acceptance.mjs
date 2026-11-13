/**
 * NFT-STUDIO-007B-PERF02 — public/Studio font delivery acceptance.
 * Isolated local DB only. Artifacts under tmp/ (gitignored).
 *
 * Self-contained constants (no @/ TS path imports) so plain Node can run
 * against a production-mode server.
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
// Resolve playwright from the project even when cwd differs.
const { chromium: pwChromium } = require("playwright");
const browserFactory = pwChromium ?? chromium;

const SITE_TYPOGRAPHY_PAIRINGS = [
  { id: "classic" },
  { id: "editorial" },
  { id: "modern" },
  { id: "literary" },
  { id: "warm-serif" },
  { id: "scholarly" },
  { id: "distinctive" },
  { id: "soft-sans" },
  { id: "contemporary" },
];

const ADMIN_CHROME_FACE_IDS = [
  "inter",
  "montserrat",
  "cormorant-garamond",
];

const PAIRING_FACES = {
  classic: ["montserrat", "inter"],
  editorial: ["cormorant-garamond", "inter"],
  modern: ["inter", "inter"],
  literary: ["playfair-display", "source-sans-3"],
  "warm-serif": ["lora", "source-sans-3"],
  scholarly: ["libre-baskerville", "source-sans-3"],
  distinctive: ["fraunces", "source-sans-3"],
  "soft-sans": ["nunito-sans", "nunito-sans"],
  contemporary: ["manrope", "dm-sans"],
};

function publicDeliveryFaceIds(fontFamilyId) {
  const faces = PAIRING_FACES[fontFamilyId] || PAIRING_FACES.classic;
  return [...new Set([...ADMIN_CHROME_FACE_IDS, ...faces])];
}

function cloneCanonicalSiteDesign() {
  return {
    schemaVersion: 1,
    theme: { presetId: "forest-gold" },
    typography: {
      fontFamilyId: "classic",
      headingScaleId: "comfortable",
      bodyScaleId: "comfortable",
    },
    hero: {
      layoutId: "centered-portrait",
      focalPoint: { x: 0.5, y: 0.5 },
    },
    sections: {
      order: ["hero", "about", "specialties", "contact"],
      visibility: {
        hero: true,
        about: true,
        specialties: true,
        contact: true,
      },
      layouts: {
        about: "stacked",
        specialties: "cards-with-aside",
        contact: "path-and-image",
      },
    },
    media: {
      slots: {
        "hero.background": null,
        "hero.headshot": null,
        "about.image": null,
        "specialties.image": null,
        "contact.image": null,
      },
    },
  };
}

const BASE = process.env.ACCEPTANCE_BASE_URL || "http://127.0.0.1:3035";
const EMAIL = process.env.SEED_DEVELOPER_EMAIL || "dev@flockoffox.org";
const PASSWORD = process.env.SEED_DEVELOPER_PASSWORD || "ChangeMeDev!";
const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://silentsage@127.0.0.1:5433/nft_studio_007a_44117";
const OUT = path.resolve("tmp/nft-studio-007b-perf02");
mkdirSync(OUT, { recursive: true });

function assertLoopback(url) {
  const u = new URL(url);
  if (u.hostname !== "127.0.0.1" && u.hostname !== "localhost") {
    throw new Error(`Refusing non-loopback DATABASE_URL host ${u.hostname}`);
  }
}

assertLoopback(DATABASE_URL);

const results = {
  ok: true,
  errors: [],
  public: {},
  routes: {},
  publishedPairings: {},
  studio: {},
  restore: {},
};

function fail(msg) {
  results.ok = false;
  results.errors.push(msg);
  console.error("FAIL:", msg);
}

function isFont(url, mime = "") {
  return /\.woff2?(\?|$)/i.test(url) || mime.includes("font") || mime.includes("woff");
}

async function measurePath(context, pathName, { cacheDisabled = true } = {}) {
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled });
  const fonts = [];
  const meta = new Map();
  cdp.on("Network.responseReceived", (e) => {
    meta.set(e.requestId, {
      url: e.response.url,
      status: e.response.status,
      mime: e.response.mimeType,
    });
  });
  cdp.on("Network.loadingFinished", (e) => {
    const m = meta.get(e.requestId);
    if (!m || !isFont(m.url, m.mime)) return;
    fonts.push({ url: m.url, bytes: e.encodedDataLength || 0, status: m.status });
  });
  await page.goto(`${BASE}${pathName}`, {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  await page.waitForTimeout(1200);
  const html = await page.content();
  const preloads = [...html.matchAll(/<link[^>]+rel="preload"[^>]*>/gi)]
    .map((m) => m[0])
    .filter((t) => /font|woff/i.test(t));
  const theme = await page.evaluate(() => {
    const el = document.querySelector("[data-site-theme]");
    const h1 = document.querySelector("h1");
    return {
      theme: el?.getAttribute("data-site-theme"),
      font: el?.getAttribute("data-site-font"),
      headingFamily: h1 ? getComputedStyle(h1).fontFamily : null,
      bodyFamily: el ? getComputedStyle(el).fontFamily : null,
      scope: document.querySelector("[data-public-font-scope]")?.getAttribute(
        "data-public-font-scope",
      ),
      delivery: document.documentElement.getAttribute("data-font-delivery"),
    };
  });
  const cls = await page
    .evaluate(() =>
      performance.getEntriesByType("layout-shift").reduce((s, e) => {
        if (!e.hadRecentInput) s += e.value;
        return s;
      }, 0),
    )
    .catch(() => null);
  const uniq = new Map();
  for (const f of fonts) {
    const cur = uniq.get(f.url) || { url: f.url, bytes: 0, n: 0 };
    cur.bytes += f.bytes;
    cur.n += 1;
    uniq.set(f.url, cur);
  }
  await page.close();
  return {
    path: pathName,
    unique: uniq.size,
    bytes: [...uniq.values()].reduce((s, x) => s + x.bytes, 0),
    preload: preloads.length,
    files: [...uniq.keys()].map((u) => u.split("/").pop()),
    theme,
    cls,
  };
}

async function setPublishedFont(fontFamilyId) {
  const prisma = new PrismaClient({ datasources: { db: { url: DATABASE_URL } } });
  try {
    const design = cloneCanonicalSiteDesign();
    design.typography.fontFamilyId = fontFamilyId;
    await prisma.siteDesignState.upsert({
      where: { key: "default" },
      create: {
        key: "default",
        draftJson: design,
        publishedJson: design,
        draftRevision: 1,
        publishedRevision: 1,
        publishedAt: new Date(),
      },
      update: {
        publishedJson: design,
        draftJson: design,
        publishedRevision: { increment: 1 },
        draftRevision: { increment: 1 },
        publishedAt: new Date(),
      },
    });
  } finally {
    await prisma.$disconnect();
  }
}

async function clearPublishedDesign() {
  const prisma = new PrismaClient({ datasources: { db: { url: DATABASE_URL } } });
  try {
    // publishedJson is NOT NULL in schema — store canonical design with
    // publishedRevision 0 (unpublished). Never write JSON null (breaks Studio).
    const canonical = cloneCanonicalSiteDesign();
    await prisma.siteDesignState.updateMany({
      where: { key: "default" },
      data: {
        publishedJson: canonical,
        publishedRevision: 0,
        publishedAt: null,
        draftRevision: 0,
        draftJson: canonical,
      },
    });
  } finally {
    await prisma.$disconnect();
  }
}

async function revalidatePublic(page) {
  const res = await page.request.post(`${BASE}/api/admin/revalidate`, {
    data: {},
  });
  if (!res.ok()) {
    throw new Error(`revalidate failed: ${res.status()} ${await res.text()}`);
  }
}

const browser = await browserFactory.launch({ headless: true });

try {
  // Ensure canonical classic published (null published → canonical classic)
  await clearPublishedDesign();

  const coldCtx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  results.public.homeClassic = await measurePath(coldCtx, "/");
  console.log(
    "home classic",
    results.public.homeClassic.unique,
    "kb",
    Math.round(results.public.homeClassic.bytes / 1024),
    "preload",
    results.public.homeClassic.preload,
  );
  if (results.public.homeClassic.unique > 5) {
    fail(
      `classic home still loading too many fonts: ${results.public.homeClassic.unique}`,
    );
  }
  if (results.public.homeClassic.bytes > 220 * 1024) {
    fail(
      `classic home transfer too high: ${results.public.homeClassic.bytes}`,
    );
  }
  if (results.public.homeClassic.theme?.font !== "classic") {
    fail(`expected classic theme font, got ${results.public.homeClassic.theme?.font}`);
  }
  // Warm
  results.public.homeWarm = await measurePath(coldCtx, "/", {
    cacheDisabled: false,
  });
  await coldCtx.close();

  for (const route of ["/", "/articles", "/bookshelf", "/login"]) {
    const ctx = await browser.newContext({
      viewport: { width: 1280, height: 900 },
    });
    results.routes[route] = await measurePath(ctx, route);
    console.log(
      "route",
      route,
      results.routes[route].unique,
      "preload",
      results.routes[route].preload,
      "kb",
      Math.round(results.routes[route].bytes / 1024),
    );
    if (results.routes[route].unique > 6) {
      fail(`route ${route} unique fonts ${results.routes[route].unique}`);
    }
    await ctx.close();
  }

  // Authenticated session for revalidate + Studio acceptance
  const studioCtx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  const page = await studioCtx.newPage();
  const cdp = await studioCtx.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  let phase = "login";
  const events = [];
  const meta = new Map();
  cdp.on("Network.responseReceived", (e) => {
    meta.set(e.requestId, {
      url: e.response.url,
      mime: e.response.mimeType,
      status: e.response.status,
    });
  });
  cdp.on("Network.loadingFinished", (e) => {
    const m = meta.get(e.requestId);
    if (!m || !isFont(m.url, m.mime)) return;
    events.push({ phase, url: m.url, bytes: e.encodedDataLength || 0 });
  });

  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.fill("#email", EMAIL);
  await page.fill("#password", PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/admin/, { timeout: 30000 });

  // Dynamic published pairings — mutate iso DB then flush public cache
  for (const pairing of SITE_TYPOGRAPHY_PAIRINGS) {
    await setPublishedFont(pairing.id);
    await revalidatePublic(page);
    const ctx = await browser.newContext({
      viewport: { width: 1280, height: 900 },
    });
    const measured = await measurePath(ctx, `/?perf02=${pairing.id}&t=${Date.now()}`);
    const expectedFaces = publicDeliveryFaceIds(pairing.id);
    results.publishedPairings[pairing.id] = {
      ...measured,
      expectedFaceCount: expectedFaces.length,
      expectedFaces,
    };
    console.log(
      "published",
      pairing.id,
      "unique",
      measured.unique,
      "fontAttr",
      measured.theme?.font,
      "scope",
      measured.theme?.scope,
      "kb",
      Math.round(measured.bytes / 1024),
    );
    if (measured.theme?.font !== pairing.id) {
      fail(
        `published ${pairing.id} font attr ${measured.theme?.font} (after revalidate)`,
      );
    }
    if (measured.theme?.scope !== pairing.id) {
      fail(
        `published ${pairing.id} public scope ${measured.theme?.scope}`,
      );
    }
    // Should not load the entire curated library (11 faces → often 12 preloads)
    if (measured.unique >= 11) {
      fail(`published ${pairing.id} still loading full library (${measured.unique})`);
    }
    await ctx.close();
  }

  await clearPublishedDesign();
  await revalidatePublic(page);
  results.restore.cleared = true;

  phase = "studio-open";
  const openStart = events.length;
  // Fresh navigation after restoring valid draft documents.
  await page.goto(`${BASE}/admin/studio/design`, {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });
  // If a prior invalid-document banner appears, fail with context.
  const paused = await page
    .getByText("Visual editing is paused")
    .isVisible()
    .catch(() => false);
  if (paused) {
    fail("Studio design editor paused — draft documents invalid after restore");
  }
  await page.waitForSelector("[data-font-gallery]", { timeout: 60000 });
  await page.waitForTimeout(2000);
  const openFonts = events.slice(openStart);
  const openUniq = new Set(openFonts.map((e) => e.url));
  results.studio.open = {
    unique: openUniq.size,
    bytes: openFonts.reduce((s, e) => s + e.bytes, 0),
  };
  console.log("studio open fonts", results.studio.open);

  const frame = page.frameLocator('iframe[src*="preview-frame"]');
  await frame.locator("[data-site-theme]").waitFor({ timeout: 20000 });

  results.studio.switches = {};
  for (const pairing of SITE_TYPOGRAPHY_PAIRINGS) {
    phase = `switch-${pairing.id}`;
    const start = events.length;
    await page.locator(`#font-family-${pairing.id}`).check({ force: true });
    await page.waitForTimeout(500);
    const font = await frame
      .locator("[data-site-theme]")
      .getAttribute("data-site-font");
    const heading = await frame.locator("h1").evaluate((el) =>
      getComputedStyle(el).fontFamily,
    );
    const extra = events.slice(start).filter((e) => isFont(e.url));
    results.studio.switches[pairing.id] = {
      font,
      heading: heading.split(",")[0],
      extraUnique: new Set(extra.map((e) => e.url)).size,
    };
    if (font !== pairing.id) fail(`studio switch ${pairing.id} got ${font}`);
    if (extra.length > 0) {
      // First switches may still fetch unicode-range subsets; allow small extras
      // but fail if an entire new family preload batch appears (>3).
      if (new Set(extra.map((e) => e.url)).size > 4) {
        fail(`studio switch ${pairing.id} unexpected font burst ${extra.length}`);
      }
    }
  }

  await page.screenshot({
    path: path.join(OUT, "studio-design.png"),
    fullPage: false,
  });
  await studioCtx.close();
} catch (err) {
  fail(err instanceof Error ? err.message : String(err));
  try {
    await clearPublishedDesign();
  } catch {
    /* ignore */
  }
} finally {
  await browser.close();
  writeFileSync(path.join(OUT, "results.json"), JSON.stringify(results, null, 2));
}

if (!results.ok) {
  console.error("NFT-STUDIO-007B-PERF02 ACCEPTANCE FAILED");
  console.error(results.errors);
  process.exit(1);
}

console.log(JSON.stringify({
  homeClassic: {
    unique: results.public.homeClassic?.unique,
    kb: Math.round((results.public.homeClassic?.bytes || 0) / 1024),
    preload: results.public.homeClassic?.preload,
  },
  studioOpen: {
    unique: results.studio.open?.unique,
    kb: Math.round((results.studio.open?.bytes || 0) / 1024),
  },
  chromeFaces: ADMIN_CHROME_FACE_IDS,
}, null, 2));
console.log("NFT-STUDIO-007B-PERF02 BROWSER ACCEPTANCE PASSED");
console.log("artifacts:", OUT);
