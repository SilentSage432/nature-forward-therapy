import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CANONICAL_SITE_DESIGN,
  cloneCanonicalSiteDesign,
} from "@/lib/site-design/defaults";
import {
  parseSiteDesign,
  parseSiteDesignJson,
  SITE_DESIGN_SCHEMA_VERSION,
} from "@/lib/site-design/schema";
import { resolvePublishedPresentationFromRow } from "@/lib/site-design/resolve-published";

describe("SiteDesign canonical default", () => {
  it("validates against the V1 schema", () => {
    const result = parseSiteDesign(CANONICAL_SITE_DESIGN);
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.design.schemaVersion, SITE_DESIGN_SCHEMA_VERSION);
      assert.equal(result.design.theme.presetId, "forest-gold");
      assert.equal(result.design.typography.fontFamilyId, "classic");
      assert.equal(result.design.typography.headingScaleId, "comfortable");
      assert.equal(result.design.typography.bodyScaleId, "comfortable");
      assert.deepEqual(result.design.sections.order, [
        "hero",
        "about",
        "specialties",
        "contact",
      ]);
    }
  });

  it("clone is deep and independent", () => {
    const a = cloneCanonicalSiteDesign();
    const b = cloneCanonicalSiteDesign();
    a.hero.focalPoint.x = 0.1;
    assert.equal(b.hero.focalPoint.x, 0.5);
    assert.equal(CANONICAL_SITE_DESIGN.hero.focalPoint.x, 0.5);
  });
});

describe("SiteDesign validation", () => {
  it("rejects unsupported schema versions", () => {
    const result = parseSiteDesign({
      ...CANONICAL_SITE_DESIGN,
      schemaVersion: 99,
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.match(result.reason, /failed schema validation/i);
      assert.ok(
        result.issues?.some((issue) => issue.includes("schemaVersion")),
      );
    }
  });

  it("rejects invalid theme identifiers", () => {
    const result = parseSiteDesign({
      ...CANONICAL_SITE_DESIGN,
      theme: { presetId: "neon-cyber" },
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.ok(result.issues?.some((issue) => issue.includes("theme")));
    }
  });

  it("accepts curated alternate themes", () => {
    for (const presetId of ["dusk-sage", "clay-sand"] as const) {
      const result = parseSiteDesign({
        ...CANONICAL_SITE_DESIGN,
        theme: { presetId },
      });
      assert.equal(result.ok, true);
      if (result.ok) {
        assert.equal(result.design.theme.presetId, presetId);
      }
    }
  });

  it("normalizes legacy typography.presetId classic drafts", () => {
    const legacy = {
      ...CANONICAL_SITE_DESIGN,
      typography: { presetId: "classic" },
    };
    const result = parseSiteDesign(legacy);
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.design.typography.fontFamilyId, "classic");
      assert.equal(result.design.typography.headingScaleId, "comfortable");
      assert.equal(result.design.typography.bodyScaleId, "comfortable");
    }
  });

  it("rejects arbitrary font URLs and CSS injection keys", () => {
    const result = parseSiteDesign({
      ...CANONICAL_SITE_DESIGN,
      typography: {
        ...CANONICAL_SITE_DESIGN.typography,
        fontUrl: "https://evil.example/font.css",
        customCss: "body{display:none}",
      },
    });
    assert.equal(result.ok, false);
  });

  it("rejects unknown keys (strict)", () => {
    const result = parseSiteDesign({
      ...CANONICAL_SITE_DESIGN,
      arbitraryCss: "color: red",
    });
    assert.equal(result.ok, false);
  });

  it("rejects incomplete section order", () => {
    const result = parseSiteDesign({
      ...CANONICAL_SITE_DESIGN,
      sections: {
        ...CANONICAL_SITE_DESIGN.sections,
        order: ["hero", "about", "contact"],
      },
    });
    assert.equal(result.ok, false);
  });

  it("rejects hiding required sections in V1", () => {
    const result = parseSiteDesign({
      ...CANONICAL_SITE_DESIGN,
      sections: {
        ...CANONICAL_SITE_DESIGN.sections,
        visibility: {
          hero: true,
          about: true,
          specialties: true,
          contact: false,
        },
      },
    });
    assert.equal(result.ok, false);
  });

  it("handles malformed JSON strings without mutating input", () => {
    const raw = "{not-json";
    const result = parseSiteDesignJson(raw);
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.match(result.reason, /malformed/i);
    }
    assert.equal(raw, "{not-json");
  });

  it("handles empty JSON as soft failure", () => {
    const result = parseSiteDesignJson("   ");
    assert.equal(result.ok, false);
  });
});

describe("Published presentation fallback", () => {
  it("uses canonical-default when state is missing", () => {
    const resolved = resolvePublishedPresentationFromRow(null);
    assert.equal(resolved.source, "canonical-default");
    assert.equal(resolved.themePresetId, "forest-gold");
    assert.equal(resolved.publishedRevision, null);
    assert.deepEqual(resolved.design, CANONICAL_SITE_DESIGN);
  });

  it("uses fallback for invalid published JSON without inventing a write", () => {
    const resolved = resolvePublishedPresentationFromRow({
      publishedJson: { schemaVersion: 1, broken: true },
      publishedRevision: 7,
    });
    assert.equal(resolved.source, "fallback");
    assert.equal(resolved.themePresetId, "forest-gold");
    assert.equal(resolved.publishedRevision, null);
    assert.ok(resolved.diagnostic?.reason);
  });

  it("accepts a valid published document", () => {
    const design = cloneCanonicalSiteDesign();
    const resolved = resolvePublishedPresentationFromRow({
      publishedJson: design,
      publishedRevision: 3,
    });
    assert.equal(resolved.source, "published");
    assert.equal(resolved.publishedRevision, 3);
    assert.equal(resolved.design.theme.presetId, "forest-gold");
  });
});

describe("Draft leakage guard (contract)", () => {
  it("published resolver never reads a draftJson field", () => {
    const sneaky = {
      publishedJson: cloneCanonicalSiteDesign(),
      publishedRevision: 1,
      draftJson: {
        ...cloneCanonicalSiteDesign(),
        theme: { presetId: "neon-cyber" },
      },
    };
    const resolved = resolvePublishedPresentationFromRow(sneaky);
    assert.equal(resolved.source, "published");
    assert.equal(resolved.design.theme.presetId, "forest-gold");
    assert.equal(
      Object.prototype.hasOwnProperty.call(resolved.design, "draftJson"),
      false,
    );
  });
});
