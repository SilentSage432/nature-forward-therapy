import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { cloneCanonicalSiteDesign } from "@/lib/site-design/defaults";
import {
  BODY_SCALE_OPTIONS,
  FONT_FAMILY_OPTIONS,
  HEADING_SCALE_OPTIONS,
  THEME_PALETTE_OPTIONS,
} from "@/lib/site-design/options";
import { presentationFromDesign } from "@/lib/site-design/presentation";
import { parseSiteDesign } from "@/lib/site-design/schema";
import { designsEqual } from "@/lib/site-design/studio-status";
import {
  createStudioPreviewReadyMessage,
  isStudioPreviewMessage,
  parseStudioPreviewMessage,
} from "@/lib/site-design/preview-protocol";

describe("curated design options", () => {
  it("exposes only safe palette and typography catalogs", () => {
    assert.deepEqual(
      THEME_PALETTE_OPTIONS.map((o) => o.id),
      ["forest-gold", "dusk-sage", "clay-sand"],
    );
    assert.deepEqual(
      FONT_FAMILY_OPTIONS.map((o) => o.id),
      ["classic", "editorial", "modern"],
    );
    assert.deepEqual(
      HEADING_SCALE_OPTIONS.map((o) => o.id),
      ["comfortable", "prominent", "compact"],
    );
    assert.deepEqual(
      BODY_SCALE_OPTIONS.map((o) => o.id),
      ["comfortable", "relaxed", "compact"],
    );
  });

  it("validates every catalogued option through SiteDesign schema", () => {
    for (const theme of THEME_PALETTE_OPTIONS) {
      for (const font of FONT_FAMILY_OPTIONS) {
        const design = cloneCanonicalSiteDesign();
        design.theme.presetId = theme.id;
        design.typography.fontFamilyId = font.id;
        design.typography.headingScaleId = "prominent";
        design.typography.bodyScaleId = "relaxed";
        const parsed = parseSiteDesign(design);
        assert.equal(parsed.ok, true);
      }
    }
  });
});

describe("local draft equality", () => {
  it("detects visual control changes without using revision numbers", () => {
    const a = cloneCanonicalSiteDesign();
    const b = cloneCanonicalSiteDesign();
    assert.equal(designsEqual(a, b), true);
    b.theme.presetId = "dusk-sage";
    assert.equal(designsEqual(a, b), false);
    b.theme.presetId = "forest-gold";
    b.typography.headingScaleId = "compact";
    assert.equal(designsEqual(a, b), false);
  });
});

describe("draft presentation isolation", () => {
  it("builds draft presentation from design without marking published", () => {
    const design = cloneCanonicalSiteDesign();
    design.theme.presetId = "clay-sand";
    const presentation = presentationFromDesign(
      design,
      "canonical-default",
      null,
    );
    assert.equal(presentation.themePresetId, "clay-sand");
    assert.equal(presentation.typography.fontFamilyId, "classic");
    assert.equal(presentation.source, "canonical-default");
    assert.equal(presentation.publishedRevision, null);
  });

  it("rejects forged preview messages that are not SiteDesign", () => {
    assert.equal(
      isStudioPreviewMessage({
        source: "nft-studio-preview",
        protocolVersion: 1,
        type: "STUDIO_PREVIEW_SET_DESIGN",
        design: { evil: true },
      }),
      false,
    );
    assert.equal(isStudioPreviewMessage(createStudioPreviewReadyMessage()), true);
    assert.equal(
      parseStudioPreviewMessage({
        source: "nft-studio-preview",
        type: "STUDIO_PREVIEW_READY",
      }).ok,
      false,
    );
  });
});
