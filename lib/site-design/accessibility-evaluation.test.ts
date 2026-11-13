import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  NEAR_THRESHOLD_MARGIN,
  classifyContrastPairResult,
  evaluateDesignAccessibility,
  formatContrastRatio,
  formatContrastThreshold,
} from "@/lib/site-design/accessibility-evaluation";
import {
  EXCLUDED_PALETTE_CONTRAST_NOTES,
  REQUIRED_PALETTE_CONTRAST_PAIRS,
} from "@/lib/site-design/palette-contrast-contract";
import { SITE_THEME_PRESET_IDS } from "@/lib/site-design/palette-registry";
import { cloneCanonicalSiteDesign } from "@/lib/site-design/defaults";
import {
  CONTRAST_THRESHOLDS,
  contrastRatioForCssColors,
  evaluateContrastPair,
} from "@/lib/site-design/contrast";

describe("design accessibility evaluation — palette matrix", () => {
  it("evaluates all 15 curated palettes against required pairs", () => {
    assert.equal(SITE_THEME_PRESET_IDS.length, 15);
    assert.equal(REQUIRED_PALETTE_CONTRAST_PAIRS.length, 15);

    for (const paletteId of SITE_THEME_PRESET_IDS) {
      const design = cloneCanonicalSiteDesign();
      design.theme.presetId = paletteId;
      const evaluation = evaluateDesignAccessibility(design);

      assert.equal(evaluation.themePresetId, paletteId);
      assert.equal(evaluation.requiredPairCount, 15);
      assert.equal(evaluation.pairs.length, 15);
      assert.equal(evaluation.conformanceClaim, null);
      assert.equal(evaluation.evaluatedAtKind, "deterministic-unsaved-design");
      assert.equal(evaluation.failingCount, 0);
      assert.equal(evaluation.renderedReviewFromPairsCount, 0);
      assert.equal(
        evaluation.passingCount,
        evaluation.passing.length + evaluation.nearThreshold.length,
      );
      assert.ok(
        evaluation.overallStatus === "deterministic-passed",
        `${paletteId} should pass deterministic checks`,
      );
      assert.match(evaluation.summaryLabel, /Deterministic checks passed/);
      assert.doesNotMatch(
        evaluation.summaryDetail,
        /WCAG compliant|fully accessible/i,
      );
    }
  });

  it("applies correct thresholds for normal and large text pairs", () => {
    const design = cloneCanonicalSiteDesign();
    const evaluation = evaluateDesignAccessibility(design);
    const body = evaluation.pairs.find((p) => p.id === "body-on-page");
    const heading = evaluation.pairs.find((p) => p.id === "heading-on-page");
    assert.ok(body);
    assert.ok(heading);
    assert.equal(body.threshold, "normal-text");
    assert.equal(body.minimum, CONTRAST_THRESHOLDS["normal-text"]);
    assert.equal(heading.threshold, "large-text");
    assert.equal(heading.minimum, CONTRAST_THRESHOLDS["large-text"]);
    assert.ok((body.ratio ?? 0) >= body.minimum);
    assert.ok((heading.ratio ?? 0) >= heading.minimum);
  });
});

describe("near-threshold advisory behavior", () => {
  it("documents a fixed advisory margin and never fails a passing pair for proximity", () => {
    assert.equal(NEAR_THRESHOLD_MARGIN, 0.15);

    // warm-terracotta has a known tight button pair (~4.51) — advisory, not fail.
    const design = cloneCanonicalSiteDesign();
    design.theme.presetId = "warm-terracotta";
    const evaluation = evaluateDesignAccessibility(design);
    assert.equal(evaluation.failingCount, 0);
    assert.equal(evaluation.overallStatus, "deterministic-passed");

    const tight = evaluation.pairs.find(
      (p) => p.id === "button-label-on-accent-strong",
    );
    assert.ok(tight);
    assert.ok(tight.ratio != null);
    assert.ok(tight.ratio >= tight.minimum);
    assert.ok(
      tight.ratio < tight.minimum * (1 + NEAR_THRESHOLD_MARGIN),
      "expected warm-terracotta accent-strong button pair in the advisory band",
    );
    assert.equal(tight.classification, "pass-near-threshold");
    assert.ok(evaluation.nearThreshold.some((p) => p.id === tight.id));
  });

  it("classifies comfortable-margin passes as pass, not near-threshold", () => {
    const design = cloneCanonicalSiteDesign();
    design.theme.presetId = "forest-gold";
    const evaluation = evaluateDesignAccessibility(design);
    const body = evaluation.pairs.find((p) => p.id === "body-on-page");
    assert.ok(body?.ratio != null);
    assert.ok(body.ratio >= body.minimum * (1 + NEAR_THRESHOLD_MARGIN));
    assert.equal(body.classification, "pass");
  });
});

describe("translucent / excluded review classification", () => {
  it("surfaces excluded decorative notes as rendered/manual review reminders", () => {
    const evaluation = evaluateDesignAccessibility(cloneCanonicalSiteDesign());
    assert.ok(evaluation.reviewReminders.length >= EXCLUDED_PALETTE_CONTRAST_NOTES.length);
    assert.ok(
      evaluation.reviewReminders.some((r) => r.kind === "rendered-review"),
    );
    assert.ok(
      evaluation.reviewReminders.some((r) => r.kind === "manual-review"),
    );
    assert.ok(
      evaluation.reviewReminders.some((r) =>
        /photography|hero/i.test(r.detail),
      ),
    );
  });

  it("maps translucent colors to requires-rendered-review without inventing a ratio", () => {
    const raw = contrastRatioForCssColors(
      "rgba(212, 175, 55, 0.55)",
      "#162221",
    );
    assert.equal(raw.status, "requires-rendered-review");
    assert.equal(raw.ratio, null);

    const pair = evaluateContrastPair(
      {
        id: "focus-sample",
        label: "Focus ring sample",
        foregroundToken: "focusRing",
        backgroundToken: "surfacePage",
        threshold: "ui-non-text",
      },
      "rgba(212, 175, 55, 0.55)",
      "#162221",
    );
    assert.equal(pair.status, "requires-rendered-review");
    assert.equal(pair.ratio, null);
    assert.equal(
      classifyContrastPairResult(pair),
      "requires-rendered-review",
    );

    // Curated required pairs remain opaque solids — no fabricated translucent passes.
    const evaluation = evaluateDesignAccessibility(cloneCanonicalSiteDesign());
    assert.equal(evaluation.pairRenderedReview.length, 0);
  });
});

describe("unsaved design + typography context", () => {
  it("updates when the unsaved palette selection changes", () => {
    const design = cloneCanonicalSiteDesign();
    const forest = evaluateDesignAccessibility(design);
    design.theme.presetId = "coastal-mist";
    const coastal = evaluateDesignAccessibility(design);
    assert.equal(forest.themePresetId, "forest-gold");
    assert.equal(coastal.themePresetId, "coastal-mist");
    assert.notEqual(forest.themeLabel, coastal.themeLabel);
    // Ratios differ across light/dark systems for at least one pair.
    const forestBody = forest.pairs.find((p) => p.id === "body-on-page");
    const coastalBody = coastal.pairs.find((p) => p.id === "body-on-page");
    assert.ok(forestBody && coastalBody);
    assert.notEqual(forestBody.ratio, coastalBody.ratio);
  });

  it("reports curated typography as informational context without legibility scores", () => {
    const design = cloneCanonicalSiteDesign();
    design.typography.fontFamilyId = "literary";
    design.typography.headingScaleId = "prominent";
    design.typography.bodyScaleId = "relaxed";
    const evaluation = evaluateDesignAccessibility(design);

    assert.equal(evaluation.typography.fontFamilyId, "literary");
    assert.equal(evaluation.typography.fontFamilyLabel, "Literary");
    assert.equal(evaluation.typography.headingFaceLabel, "Playfair Display");
    assert.equal(evaluation.typography.bodyFaceLabel, "Source Sans 3");
    assert.equal(evaluation.typography.headingScaleLabel, "Prominent");
    assert.equal(evaluation.typography.bodyScaleLabel, "Relaxed");
    assert.match(evaluation.typography.curatedNote, /curated/i);
    assert.match(
      evaluation.typography.renderedEvaluationNote,
      /zoom|reflow|wrapping|readability/i,
    );
    assert.doesNotMatch(
      JSON.stringify(evaluation.typography),
      /legibility score|readability score/i,
    );
  });

  it("is a pure function with no publish or persistence side effects", () => {
    const design = cloneCanonicalSiteDesign();
    design.theme.presetId = "dusk-sage";
    const before = structuredClone(design);
    const first = evaluateDesignAccessibility(design);
    const second = evaluateDesignAccessibility(design);
    assert.deepEqual(design, before);
    assert.equal(first.themePresetId, second.themePresetId);
    assert.equal(first.failingCount, second.failingCount);
    assert.equal(first.conformanceClaim, null);
  });
});

describe("formatting helpers", () => {
  it("formats ratios and thresholds for Nicole-facing copy", () => {
    assert.equal(formatContrastRatio(4.5123), "4.51:1");
    assert.equal(formatContrastRatio(null), "—");
    assert.match(
      formatContrastThreshold(4.5, "normal-text"),
      /4\.5:1.*everyday text/,
    );
    assert.match(
      formatContrastThreshold(3, "large-text"),
      /3:1.*large text/,
    );
  });
});
