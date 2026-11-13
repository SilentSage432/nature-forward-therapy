import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { join } from "node:path";
import { cloneCanonicalSiteDesign } from "@/lib/site-design/defaults";
import { FONT_FAMILY_GROUPS, FONT_FAMILY_OPTIONS } from "@/lib/site-design/options";
import { parseSiteDesign } from "@/lib/site-design/schema";
import {
  FONT_PAIRING_GALLERY_LAYOUT,
} from "@/components/admin/studio/DesignControlPanel";
import {
  LEGACY_FONT_FAMILY_IDS,
  SITE_FONT_FACES,
  SITE_FONT_FAMILY_IDS,
  SITE_TYPOGRAPHY_PAIRINGS,
  formatTypographyCssBlock,
  isSiteFontFamilyId,
  resolveTypographyStack,
} from "@/lib/site-design/typography-registry";
import {
  SITE_FONT_STACKS,
  fontStacksAreDistinct,
  resolveFontStack,
} from "@/lib/site-design/visual-tokens";

const GLOBALS_CSS = readFileSync(
  join(process.cwd(), "app/globals.css"),
  "utf8",
);
const LAYOUT_TSX = readFileSync(join(process.cwd(), "app/layout.tsx"), "utf8");
const CHROME_TS = readFileSync(
  join(process.cwd(), "lib/site-design/site-font-chrome.ts"),
  "utf8",
);
const LOADERS_TS = readFileSync(
  join(process.cwd(), "lib/site-design/site-font-loaders.ts"),
  "utf8",
);

describe("typography registry completeness", () => {
  it("exposes 8–12 curated pairings with classic first", () => {
    assert.ok(SITE_TYPOGRAPHY_PAIRINGS.length >= 8);
    assert.ok(SITE_TYPOGRAPHY_PAIRINGS.length <= 12);
    assert.equal(SITE_TYPOGRAPHY_PAIRINGS[0]?.id, "classic");
    assert.deepEqual([...SITE_FONT_FAMILY_IDS], FONT_FAMILY_OPTIONS.map((o) => o.id));
  });

  it("preserves legacy pairing IDs and stacks", () => {
    assert.deepEqual([...LEGACY_FONT_FAMILY_IDS], [
      "classic",
      "editorial",
      "modern",
    ]);
    assert.equal(resolveFontStack("classic").headingVar, "--font-montserrat");
    assert.equal(resolveFontStack("classic").bodyVar, "--font-inter");
    assert.equal(resolveFontStack("editorial").headingVar, "--font-cormorant");
    assert.equal(resolveFontStack("editorial").bodyVar, "--font-inter");
    assert.equal(resolveFontStack("modern").headingVar, "--font-inter");
    assert.equal(resolveFontStack("modern").bodyVar, "--font-inter");
  });

  it("assigns valid heading/body faces and meaningful differences", () => {
    const signatures = new Set<string>();
    for (const pairing of SITE_TYPOGRAPHY_PAIRINGS) {
      const stack = resolveTypographyStack(pairing.id);
      assert.ok(stack.headingVar.startsWith("--font-"));
      assert.ok(stack.bodyVar.startsWith("--font-"));
      assert.ok(pairing.label.length > 0);
      assert.ok(pairing.description.length > 0);
      assert.ok(pairing.sampleHeading.length > 0);
      assert.ok(pairing.sampleBody.length > 0);
      signatures.add(`${stack.headingVar}|${stack.bodyVar}`);
    }
    assert.equal(signatures.size, SITE_TYPOGRAPHY_PAIRINGS.length);
    assert.ok(fontStacksAreDistinct("classic", "literary"));
    assert.ok(fontStacksAreDistinct("soft-sans", "contemporary"));
  });

  it("documents OFL licensing and next/font provenance for every face", () => {
    const loaderSurface = `${CHROME_TS}\n${LOADERS_TS}`;
    for (const face of SITE_FONT_FACES) {
      assert.equal(face.license, "OFL-1.1");
      assert.equal(face.source, "Google Fonts via next/font");
      assert.ok(face.weights.length > 0);
      assert.match(loaderSurface, new RegExp(face.nextFontExport));
      assert.match(loaderSurface, new RegExp(`variable:\\s*"${face.cssVar}"`));
    }
  });

  it("keeps root layout chrome-only (PERF02 public/Studio separation)", () => {
    assert.match(LAYOUT_TSX, /ROOT_CHROME_FONT_VARIABLE_CLASSNAME/);
    assert.match(LAYOUT_TSX, /data-font-delivery="chrome"/);
    assert.doesNotMatch(LAYOUT_TSX, /site-font-loaders/);
    assert.doesNotMatch(LAYOUT_TSX, /Playfair_Display|Fraunces|Manrope/);
  });

  it("maps every non-chrome pairing to a static supplemental class in loaders", () => {
    const loaders = readFileSync(
      join(process.cwd(), "lib/site-design/site-font-loaders.ts"),
      "utf8",
    );
    assert.match(loaders, /PUBLIC_SUPPLEMENTAL_CLASS_BY_PAIRING/);
    for (const id of [
      "literary",
      "warm-serif",
      "scholarly",
      "distinctive",
      "soft-sans",
      "contemporary",
    ] as const) {
      assert.match(loaders, new RegExp(`"${id}"|${id}:`));
    }
    assert.doesNotMatch(loaders, /Playfair_Display\([\s\S]*Playfair_Display\(/);
  });
});

describe("typography CSS and Studio option consistency", () => {
  it("mirrors every pairing block in globals.css", () => {
    for (const id of SITE_FONT_FAMILY_IDS) {
      const expected = formatTypographyCssBlock(id);
      // Compare core variable assignments; whitespace-normalized.
      const compactExpected = expected.replace(/\s+/g, " ").trim();
      const compactCss = GLOBALS_CSS.replace(/\s+/g, " ");
      assert.ok(
        compactCss.includes(compactExpected),
        `missing CSS block for ${id}`,
      );
    }
  });

  it("keeps Studio options and groups aligned with the registry", () => {
    assert.ok(FONT_FAMILY_GROUPS.length >= 3);
    assert.equal(
      FONT_FAMILY_GROUPS.reduce((n, g) => n + g.options.length, 0),
      SITE_TYPOGRAPHY_PAIRINGS.length,
    );
    assert.match(FONT_PAIRING_GALLERY_LAYOUT.gridClassName, /grid-cols-1/);
  });

  it("maps visual-token stacks from the registry", () => {
    for (const id of SITE_FONT_FAMILY_IDS) {
      const fromRegistry = resolveTypographyStack(id);
      const fromTokens = SITE_FONT_STACKS[id];
      assert.equal(fromTokens.headingVar, fromRegistry.headingVar);
      assert.equal(fromTokens.bodyVar, fromRegistry.bodyVar);
      assert.equal(fromTokens.headingKind, fromRegistry.headingKind);
    }
  });
});

describe("SiteDesign V1 typography compatibility", () => {
  it("accepts every curated pairing and rejects unknown IDs", () => {
    for (const id of SITE_FONT_FAMILY_IDS) {
      const design = cloneCanonicalSiteDesign();
      design.typography.fontFamilyId = id;
      const parsed = parseSiteDesign(design);
      assert.equal(parsed.ok, true, `expected ${id} to validate`);
      assert.equal(isSiteFontFamilyId(id), true);
    }

    const bad = parseSiteDesign({
      ...cloneCanonicalSiteDesign(),
      typography: {
        ...cloneCanonicalSiteDesign().typography,
        fontFamilyId: "comic-sans",
      },
    });
    assert.equal(bad.ok, false);
    assert.equal(isSiteFontFamilyId("comic-sans"), false);
  });

  it("keeps canonical default on classic / forest-gold", () => {
    const design = cloneCanonicalSiteDesign();
    assert.equal(design.typography.fontFamilyId, "classic");
    assert.equal(design.theme.presetId, "forest-gold");
    assert.equal(design.schemaVersion, 1);
  });

  it("still normalizes legacy typography.presetId classic drafts", () => {
    const result = parseSiteDesign({
      ...cloneCanonicalSiteDesign(),
      typography: { presetId: "classic" },
    });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.design.typography.fontFamilyId, "classic");
  });
});
