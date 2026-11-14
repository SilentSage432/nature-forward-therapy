/**
 * NFT-STUDIO-007C-ENG03-FIX01 — accessibility harness enforcement policy.
 *
 * Separates:
 * A) Enforced checks for the published/default public design
 * B) Advisory diagnostics for alternate (non-published) palette sampling
 * C) Manual-review requirements
 *
 * Pre-publish strict evaluation is defined here for a future authorized tranche.
 * It is NOT wired to SiteDesign publish/save and does not write the database.
 */

/** Canonical published / default public palette at ENG03 time. */
export const PUBLISHED_DEFAULT_PALETTE_ID = "forest-gold" as const;

export type AxeEnforcementClass = "enforced" | "advisory";

/**
 * How axe results for a palette sample are treated in the current harness.
 *
 * - enforced: violations fail the Playwright test
 * - advisory: violations are recorded and reported; zero violations is valid
 */
export function axeEnforcementForPaletteSample(
  paletteId: string,
): AxeEnforcementClass {
  return paletteId === PUBLISHED_DEFAULT_PALETTE_ID ? "enforced" : "advisory";
}

/**
 * Future pre-publication candidate evaluation.
 *
 * When a Studio operator is preparing to publish an alternate palette, axe
 * results for that candidate should be enforced. This helper exists so the
 * harness can grow a strict pre-publish job without inventing SiteDesign writes
 * or coupling to the publish service.
 *
 * Not activated by `npm run test:a11y` today.
 */
export function axeEnforcementForPrePublishCandidate(
  paletteId: string,
): "enforced" {
  void paletteId; // reserved for future per-candidate policy
  return "enforced";
}

export type HarnessFindingLane =
  | "enforced"
  | "advisory"
  | "manual-review";

export type EnforcementSummary = {
  disclaimer: string;
  enforced: {
    passed: boolean;
    notes: string[];
  };
  advisory: {
    violationSamples: Array<{
      paletteId: string;
      fontId?: string;
      violationCount: number;
      ruleIds: string[];
    }>;
    zeroViolationsIsValid: true;
    note: string;
  };
  manualReview: {
    items: string[];
  };
  prePublishStrictAvailable: boolean;
  prePublishStrictWiredToPublishService: false;
};

export const HARNESS_DISCLAIMER =
  "Passing enforced tests is not a WCAG certificate. Advisory palette samples may still record axe violations. axe-core findings are heuristics.";

export function buildEmptyEnforcementSummary(): EnforcementSummary {
  return {
    disclaimer: HARNESS_DISCLAIMER,
    enforced: {
      passed: true,
      notes: [],
    },
    advisory: {
      violationSamples: [],
      zeroViolationsIsValid: true,
      note:
        "Alternate-palette axe violations are diagnostic evidence only. Zero advisory violations is a valid outcome.",
    },
    manualReview: {
      items: [
        "axe incomplete / needs-review nodes",
        "True browser chrome zoom / OS display scaling (not CSS zoom or viewport resize)",
        "Image-backed / translucent hero and glass contrast",
        "Unverified palette × typography combinations outside the representative sample",
      ],
    },
    prePublishStrictAvailable: true,
    prePublishStrictWiredToPublishService: false,
  };
}

/** Pure helper: advisory recording never requires violations to exist. */
export function advisoryViolationsAreAcceptable(
  violationCount: number,
): boolean {
  return violationCount >= 0;
}

/** Pure helper: enforced lane fails when any violation is present. */
export function enforcedAxeShouldFail(violationCount: number): boolean {
  return violationCount > 0;
}
