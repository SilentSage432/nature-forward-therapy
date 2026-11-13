/**
 * Deterministic accessibility evaluation for Website Studio (NFT-STUDIO-007C-ENG01).
 *
 * Composes the existing contrast engine + palette contrast contract. Does not
 * duplicate WCAG math, invent opacity blending, or claim conformance.
 *
 * Scope: solid (opaque) curated palette pairs + informational typography
 * context + documented rendered/manual review reminders.
 */

import {
  CONTRAST_THRESHOLDS,
  type ContrastPairResult,
  type ContrastThresholdKind,
} from "@/lib/site-design/contrast";
import {
  EXCLUDED_PALETTE_CONTRAST_NOTES,
  REQUIRED_PALETTE_CONTRAST_PAIRS,
  evaluatePaletteContrast,
} from "@/lib/site-design/palette-contrast-contract";
import {
  SITE_PALETTE_BY_ID,
  isSiteThemePresetId,
} from "@/lib/site-design/palette-registry";
import type { SiteDesign } from "@/lib/site-design/schema";
import {
  BODY_SCALE_OPTIONS,
  HEADING_SCALE_OPTIONS,
  themeDisplayLabel,
  fontFamilyDisplayLabel,
} from "@/lib/site-design/options";
import {
  SITE_FONT_FACE_BY_ID,
  SITE_TYPOGRAPHY_BY_ID,
  isSiteFontFamilyId,
} from "@/lib/site-design/typography-registry";

/**
 * Advisory band above the minimum ratio.
 * A pair that meets the threshold but sits below minimum × (1 + margin)
 * is reported as a near-threshold advisory — never as a failure.
 */
export const NEAR_THRESHOLD_MARGIN = 0.15;

export type DeterministicPairClassification =
  | "pass"
  | "pass-near-threshold"
  | "fail"
  | "requires-rendered-review";

export type DesignAccessibilityOverallStatus =
  | "deterministic-passed"
  | "deterministic-issues"
  | "review-recommended";

export type DesignAccessibilityPairFinding = {
  id: string;
  label: string;
  foregroundToken: string;
  backgroundToken: string;
  foreground: string;
  background: string;
  threshold: ContrastThresholdKind;
  minimum: number;
  ratio: number | null;
  classification: DeterministicPairClassification;
  /** Nicole-facing short status without claiming WCAG compliance. */
  statusLabel: string;
  message: string;
};

export type DesignAccessibilityReviewReminder = {
  id: string;
  kind: "rendered-review" | "manual-review";
  label: string;
  detail: string;
};

export type DesignAccessibilityTypographyContext = {
  fontFamilyId: string;
  fontFamilyLabel: string;
  headingFaceLabel: string;
  bodyFaceLabel: string;
  headingScaleId: string;
  headingScaleLabel: string;
  bodyScaleId: string;
  bodyScaleLabel: string;
  curatedNote: string;
  renderedEvaluationNote: string;
};

export type DesignAccessibilityEvaluation = {
  themePresetId: string;
  themeLabel: string;
  overallStatus: DesignAccessibilityOverallStatus;
  /** High-level summary for aria / status region (stable, concise). */
  summaryLabel: string;
  summaryDetail: string;
  requiredPairCount: number;
  passingCount: number;
  nearThresholdCount: number;
  failingCount: number;
  renderedReviewFromPairsCount: number;
  pairs: DesignAccessibilityPairFinding[];
  passing: DesignAccessibilityPairFinding[];
  nearThreshold: DesignAccessibilityPairFinding[];
  failing: DesignAccessibilityPairFinding[];
  pairRenderedReview: DesignAccessibilityPairFinding[];
  reviewReminders: DesignAccessibilityReviewReminder[];
  typography: DesignAccessibilityTypographyContext;
  /** Explicit non-claim for UI copy and tests. */
  conformanceClaim: null;
  evaluatedAtKind: "deterministic-unsaved-design";
};

function scaleLabel(
  options: { id: string; label: string }[],
  id: string,
): string {
  return options.find((option) => option.id === id)?.label ?? id;
}

/** Classify a contrast-engine pair result without inventing opaque ratios. */
export function classifyContrastPairResult(
  result: ContrastPairResult,
): DeterministicPairClassification {
  if (result.status === "requires-rendered-review") {
    return "requires-rendered-review";
  }
  if (result.status === "fail" || !result.passed) {
    return "fail";
  }
  if (
    result.ratio != null &&
    result.ratio < result.minimum * (1 + NEAR_THRESHOLD_MARGIN)
  ) {
    return "pass-near-threshold";
  }
  return "pass";
}

function statusLabelFor(
  classification: DeterministicPairClassification,
): string {
  switch (classification) {
    case "pass":
      return "Looks good";
    case "pass-near-threshold":
      return "Close to the minimum";
    case "fail":
      return "Needs attention";
    case "requires-rendered-review":
      return "Needs a visual check";
  }
}

function enrichPair(result: ContrastPairResult): DesignAccessibilityPairFinding {
  const classification = classifyContrastPairResult(result);
  return {
    id: result.id,
    label: result.label,
    foregroundToken: result.foregroundToken,
    backgroundToken: result.backgroundToken,
    foreground: result.foreground,
    background: result.background,
    threshold: result.threshold,
    minimum: result.minimum,
    ratio: result.ratio,
    classification,
    statusLabel: statusLabelFor(classification),
    message: result.message,
  };
}

function buildReviewReminders(): DesignAccessibilityReviewReminder[] {
  const fromExclusions: DesignAccessibilityReviewReminder[] =
    EXCLUDED_PALETTE_CONTRAST_NOTES.map((note, index) => ({
      id: `excluded-${index + 1}`,
      kind: "rendered-review" as const,
      label: "Visual check still needed",
      detail: note,
    }));

  return [
    ...fromExclusions,
    {
      id: "manual-hero-photography",
      kind: "manual-review",
      label: "Manual review recommended",
      detail:
        "Text over photography (hero and section images) should be checked by eye — overlays and photos cannot be certified from color tokens alone.",
    },
    {
      id: "manual-keyboard-focus",
      kind: "manual-review",
      label: "Manual review recommended",
      detail:
        "Keyboard focus visibility, zoom, wrapping, and reflow still need a rendered page check. These palette checks do not cover them.",
    },
  ];
}

function buildTypographyContext(
  design: SiteDesign,
): DesignAccessibilityTypographyContext {
  const fontFamilyId = design.typography.fontFamilyId;
  const pairing = isSiteFontFamilyId(fontFamilyId)
    ? SITE_TYPOGRAPHY_BY_ID[fontFamilyId]
    : null;

  const headingFaceLabel = pairing
    ? SITE_FONT_FACE_BY_ID[pairing.headingFaceId].familyName
    : fontFamilyId;
  const bodyFaceLabel = pairing
    ? SITE_FONT_FACE_BY_ID[pairing.bodyFaceId].familyName
    : fontFamilyId;

  return {
    fontFamilyId,
    fontFamilyLabel: fontFamilyDisplayLabel(fontFamilyId),
    headingFaceLabel,
    bodyFaceLabel,
    headingScaleId: design.typography.headingScaleId,
    headingScaleLabel: scaleLabel(
      HEADING_SCALE_OPTIONS,
      design.typography.headingScaleId,
    ),
    bodyScaleId: design.typography.bodyScaleId,
    bodyScaleLabel: scaleLabel(
      BODY_SCALE_OPTIONS,
      design.typography.bodyScaleId,
    ),
    curatedNote:
      "This font pairing is curated. Solid-color contrast checks do not score fonts for readability.",
    renderedEvaluationNote:
      "Actual readability, text wrapping, zoom, and page reflow still need a visual check on the preview or live page.",
  };
}

function overallFromPairs(
  failingCount: number,
  nearThresholdCount: number,
  pairRenderedReviewCount: number,
): {
  overallStatus: DesignAccessibilityOverallStatus;
  summaryLabel: string;
  summaryDetail: string;
} {
  if (failingCount > 0) {
    return {
      overallStatus: "deterministic-issues",
      summaryLabel: "Deterministic issues detected",
      summaryDetail:
        "Some solid text and button color combinations do not meet the Studio contrast minimums. You can keep experimenting — Save Draft is still available.",
    };
  }

  if (pairRenderedReviewCount > 0) {
    return {
      overallStatus: "review-recommended",
      summaryLabel: "Rendered review required",
      summaryDetail:
        "Some required color pairs could not be judged as solid colors. A visual check is needed before treating them as settled.",
    };
  }

  if (nearThresholdCount > 0) {
    return {
      overallStatus: "deterministic-passed",
      summaryLabel: "Deterministic checks passed",
      summaryDetail:
        "Solid color combinations meet Studio minimums. A few sit close to the line — worth a quick look, but they are not failures. Soft borders, focus rings, and text over photos still need a visual check.",
    };
  }

  return {
    overallStatus: "deterministic-passed",
    summaryLabel: "Deterministic checks passed",
    summaryDetail:
      "Solid text and button colors for this palette meet Studio minimums. Soft borders, translucent focus styles, and text over photos still need a visual check — this is not a full accessibility certificate.",
  };
}

/**
 * Evaluate the current (possibly unsaved) SiteDesign for Studio feedback.
 * Pure: no I/O, no database, no publish side effects.
 */
export function evaluateDesignAccessibility(
  design: SiteDesign,
): DesignAccessibilityEvaluation {
  const themePresetId = design.theme.presetId;
  const themeLabel = isSiteThemePresetId(themePresetId)
    ? SITE_PALETTE_BY_ID[themePresetId].label
    : themeDisplayLabel(themePresetId);

  const contrastSummary = evaluatePaletteContrast(themePresetId);
  const pairs = contrastSummary.results.map(enrichPair);

  const passing = pairs.filter((p) => p.classification === "pass");
  const nearThreshold = pairs.filter(
    (p) => p.classification === "pass-near-threshold",
  );
  const failing = pairs.filter((p) => p.classification === "fail");
  const pairRenderedReview = pairs.filter(
    (p) => p.classification === "requires-rendered-review",
  );

  const { overallStatus, summaryLabel, summaryDetail } = overallFromPairs(
    failing.length,
    nearThreshold.length,
    pairRenderedReview.length,
  );

  return {
    themePresetId,
    themeLabel,
    overallStatus,
    summaryLabel,
    summaryDetail,
    requiredPairCount: REQUIRED_PALETTE_CONTRAST_PAIRS.length,
    passingCount: passing.length + nearThreshold.length,
    nearThresholdCount: nearThreshold.length,
    failingCount: failing.length,
    renderedReviewFromPairsCount: pairRenderedReview.length,
    pairs,
    passing,
    nearThreshold,
    failing,
    pairRenderedReview,
    reviewReminders: buildReviewReminders(),
    typography: buildTypographyContext(design),
    conformanceClaim: null,
    evaluatedAtKind: "deterministic-unsaved-design",
  };
}

/** Format a ratio for Nicole-facing UI. */
export function formatContrastRatio(ratio: number | null): string {
  if (ratio == null || !Number.isFinite(ratio)) return "—";
  return `${ratio.toFixed(2)}:1`;
}

export function formatContrastThreshold(
  minimum: number,
  threshold: ContrastThresholdKind,
): string {
  const kindLabel =
    threshold === "normal-text"
      ? "everyday text"
      : threshold === "large-text"
        ? "large text"
        : "non-text UI";
  return `${minimum}:1 (${kindLabel})`;
}

export {
  CONTRAST_THRESHOLDS,
  REQUIRED_PALETTE_CONTRAST_PAIRS,
  EXCLUDED_PALETTE_CONTRAST_NOTES,
};
