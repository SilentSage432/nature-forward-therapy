import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CANONICAL_SITE_DESIGN,
  cloneCanonicalSiteDesign,
} from "@/lib/site-design/defaults";
import { presentationFromDesign } from "@/lib/site-design/presentation";
import { parseSiteDesign } from "@/lib/site-design/schema";
import {
  FOREST_GOLD_TOKENS,
  SITE_BODY_SCALE_TOKENS,
  SITE_FONT_STACKS,
  SITE_HEADING_SCALE_TOKENS,
  SITE_PALETTE_TOKENS,
  fontStacksAreDistinct,
  resolveFontStack,
  resolvePaletteTokens,
} from "@/lib/site-design/visual-tokens";

describe("canonical forest-gold token resolution", () => {
  it("resolves production-equivalent forest-gold accent and surfaces", () => {
    const tokens = resolvePaletteTokens("forest-gold");
    assert.equal(tokens.accent, "#d4af37");
    assert.equal(tokens.surfacePage, "#162221");
    assert.equal(tokens.surfacePageSoft, "#2d3a35");
    assert.equal(tokens.foregroundSupporting, "#a8c3b5");
    assert.equal(tokens.foregroundSoft, "#f4f2ed");
    assert.equal(tokens.foregroundWarm, "#c4b8a8");
    assert.equal(tokens.borderOrganic, "#5a7266");
    assert.deepEqual(tokens, FOREST_GOLD_TOKENS);
  });

  it("keeps canonical default presentation on forest-gold classic comfortable", () => {
    assert.equal(CANONICAL_SITE_DESIGN.theme.presetId, "forest-gold");
    assert.equal(CANONICAL_SITE_DESIGN.typography.fontFamilyId, "classic");
    assert.equal(CANONICAL_SITE_DESIGN.typography.headingScaleId, "comfortable");
    assert.equal(CANONICAL_SITE_DESIGN.typography.bodyScaleId, "comfortable");
  });
});

describe("curated palette token resolution", () => {
  it("exposes distinct accents for every curated palette", () => {
    const accents = Object.values(SITE_PALETTE_TOKENS).map((t) => t.accent);
    assert.deepEqual(new Set(accents).size, accents.length);
    assert.equal(resolvePaletteTokens("dusk-sage").accent, "#9fbfad");
    assert.equal(resolvePaletteTokens("clay-sand").accent, "#d4a574");
  });

  it("keeps alternate palettes visually different beyond accent alone", () => {
    const forest = resolvePaletteTokens("forest-gold");
    const dusk = resolvePaletteTokens("dusk-sage");
    const clay = resolvePaletteTokens("clay-sand");
    assert.notEqual(forest.surfacePage, dusk.surfacePage);
    assert.notEqual(forest.surfacePage, clay.surfacePage);
    assert.notEqual(dusk.foregroundSupporting, clay.foregroundSupporting);
    assert.notEqual(forest.heroOverlayMid, dusk.heroOverlayMid);
  });
});

describe("typography preset mapping", () => {
  it("maps curated presets to loaded font variables with meaningful differences", () => {
    assert.equal(resolveFontStack("classic").headingVar, "--font-montserrat");
    assert.equal(resolveFontStack("classic").bodyVar, "--font-inter");
    assert.equal(resolveFontStack("editorial").headingVar, "--font-cormorant");
    assert.equal(resolveFontStack("editorial").headingKind, "serif");
    assert.equal(resolveFontStack("modern").headingVar, "--font-inter");
    assert.equal(resolveFontStack("modern").bodyVar, "--font-inter");
    assert.ok(fontStacksAreDistinct("classic", "modern"));
    assert.ok(fontStacksAreDistinct("classic", "editorial"));
    assert.ok(fontStacksAreDistinct("editorial", "modern"));
  });

  it("does not claim Classic and Modern share the same heading stack", () => {
    assert.notEqual(
      SITE_FONT_STACKS.classic.headingVar,
      SITE_FONT_STACKS.modern.headingVar,
    );
  });
});

describe("heading and body scale mapping", () => {
  it("keeps comfortable as the canonical live-site scale", () => {
    assert.match(SITE_HEADING_SCALE_TOKENS.comfortable.hero, /3\.75rem/);
    assert.equal(SITE_BODY_SCALE_TOKENS.comfortable.copy, "1rem");
  });

  it("makes prominent larger and compact smaller than comfortable", () => {
    assert.match(SITE_HEADING_SCALE_TOKENS.prominent.hero, /4\.1rem/);
    assert.match(SITE_HEADING_SCALE_TOKENS.compact.hero, /3\.25rem/);
    assert.equal(SITE_BODY_SCALE_TOKENS.relaxed.copy, "1.0625rem");
    assert.equal(SITE_BODY_SCALE_TOKENS.compact.copy, "0.9375rem");
  });
});

describe("legacy typography normalization still intact", () => {
  it("normalizes legacy typography.presetId classic drafts", () => {
    const result = parseSiteDesign({
      ...cloneCanonicalSiteDesign(),
      typography: { presetId: "classic" },
    });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.design.typography.fontFamilyId, "classic");
    assert.equal(result.design.typography.headingScaleId, "comfortable");
    assert.equal(result.design.typography.bodyScaleId, "comfortable");
  });
});

describe("public/preview shared rendering config", () => {
  it("builds the same presentation shape for draft preview and published", () => {
    const design = cloneCanonicalSiteDesign();
    design.theme.presetId = "clay-sand";
    design.typography.fontFamilyId = "modern";
    design.typography.headingScaleId = "prominent";
    design.typography.bodyScaleId = "relaxed";

    const draft = presentationFromDesign(design, "canonical-default", null);
    const published = presentationFromDesign(design, "published", 3);

    assert.equal(draft.themePresetId, published.themePresetId);
    assert.deepEqual(draft.typography, published.typography);
    assert.equal(draft.design.theme.presetId, "clay-sand");
    assert.equal(published.source, "published");
    assert.equal(draft.source, "canonical-default");
    assert.equal(draft.publishedRevision, null);
    assert.equal(published.publishedRevision, 3);
  });
});

describe("strict SiteDesign validation preserved", () => {
  it("rejects arbitrary theme and font values", () => {
    const badTheme = parseSiteDesign({
      ...cloneCanonicalSiteDesign(),
      theme: { presetId: "neon-pink" },
    });
    assert.equal(badTheme.ok, false);

    const badFont = parseSiteDesign({
      ...cloneCanonicalSiteDesign(),
      typography: {
        ...CANONICAL_SITE_DESIGN.typography,
        fontFamilyId: "comic-sans",
      },
    });
    assert.equal(badFont.ok, false);
  });
});
