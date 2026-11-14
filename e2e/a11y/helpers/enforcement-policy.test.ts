import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  PUBLISHED_DEFAULT_PALETTE_ID,
  advisoryViolationsAreAcceptable,
  axeEnforcementForPaletteSample,
  axeEnforcementForPrePublishCandidate,
  buildEmptyEnforcementSummary,
  enforcedAxeShouldFail,
} from "./enforcement-policy";

describe("a11y harness enforcement policy (FIX01)", () => {
  it("enforces axe for the published/default palette only", () => {
    assert.equal(PUBLISHED_DEFAULT_PALETTE_ID, "forest-gold");
    assert.equal(axeEnforcementForPaletteSample("forest-gold"), "enforced");
    assert.equal(axeEnforcementForPaletteSample("coastal-mist"), "advisory");
    assert.equal(axeEnforcementForPaletteSample("lavender-meadow"), "advisory");
    assert.equal(axeEnforcementForPaletteSample("midnight-garden"), "advisory");
  });

  it("treats zero advisory violations as valid", () => {
    assert.equal(advisoryViolationsAreAcceptable(0), true);
    assert.equal(advisoryViolationsAreAcceptable(3), true);
  });

  it("fails the enforced lane when any axe violation is present", () => {
    assert.equal(enforcedAxeShouldFail(0), false);
    assert.equal(enforcedAxeShouldFail(1), true);
  });

  it("exposes pre-publish strict enforcement without wiring publish", () => {
    assert.equal(axeEnforcementForPrePublishCandidate("coastal-mist"), "enforced");
    const summary = buildEmptyEnforcementSummary();
    assert.equal(summary.prePublishStrictAvailable, true);
    assert.equal(summary.prePublishStrictWiredToPublishService, false);
    assert.equal(summary.advisory.zeroViolationsIsValid, true);
  });

  it("does not invert expectations (known gaps are not required)", () => {
    // Historical ENG03 inverted check required lightGaps.length > 0.
    // Policy helpers must never encode that requirement.
    const source = [
      advisoryViolationsAreAcceptable.toString(),
      axeEnforcementForPaletteSample.toString(),
    ].join("\n");
    assert.doesNotMatch(source, /lightGaps|toBeGreaterThan\(0\)/);
    assert.equal(advisoryViolationsAreAcceptable(0), true);
  });
});

describe("a11y harness production-write boundary (contract)", () => {
  it("documents that palette sampling helpers do not call save/publish", async () => {
    const { readFileSync } = await import("node:fs");
    const { resolve } = await import("node:path");
    const files = [
      "palette.ts",
      "enforcement-policy.ts",
      "../palette-typography.spec.ts",
      "../public-routes.spec.ts",
      "../keyboard.spec.ts",
    ];
    for (const rel of files) {
      const text = readFileSync(resolve(import.meta.dirname, rel), "utf8");
      assert.doesNotMatch(
        text,
        /saveSiteDesignDraft|publishSiteDesign|prisma\.(siteDesign|\$transaction)/i,
      );
      assert.doesNotMatch(text, /SEED_.*PASSWORD|fill\(.*password/i);
    }
  });
});
