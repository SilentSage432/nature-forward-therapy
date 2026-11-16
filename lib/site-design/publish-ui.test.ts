/**
 * NFT-STUDIO-007D-ENG01 — publish UX helpers (no production DB writes).
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { cloneCanonicalSiteDesign } from "@/lib/site-design/defaults";
import {
  accessibilityConfirmSummary,
  buildPublishActionInput,
  buildPublishConfirmSnapshot,
  getPublishEligibility,
  mapPublishActionResult,
  publishEligibilityHint,
  typographySummaryLabel,
} from "@/lib/site-design/publish-ui";
import type { PublishDesignResult } from "@/lib/site-design/types";

function differingDraft() {
  const draft = cloneCanonicalSiteDesign();
  draft.theme = { presetId: "dusk-sage" };
  return draft;
}

describe("getPublishEligibility", () => {
  it("blocks unsaved drafts from requesting publish", () => {
    const published = cloneCanonicalSiteDesign();
    const draft = differingDraft();
    const eligibility = getPublishEligibility({
      dirty: true,
      pending: false,
      draft,
      published,
    });
    assert.deepEqual(eligibility, {
      canRequestPublish: false,
      reason: "unsaved",
    });
    assert.match(publishEligibilityHint(eligibility) ?? "", /Save the draft/i);
  });

  it("allows a saved draft that differs from published", () => {
    const eligibility = getPublishEligibility({
      dirty: false,
      pending: false,
      draft: differingDraft(),
      published: cloneCanonicalSiteDesign(),
    });
    assert.deepEqual(eligibility, { canRequestPublish: true });
    assert.equal(publishEligibilityHint(eligibility), null);
  });

  it("blocks when saved draft already matches published (no duplicate publish)", () => {
    const design = cloneCanonicalSiteDesign();
    const eligibility = getPublishEligibility({
      dirty: false,
      pending: false,
      draft: design,
      published: cloneCanonicalSiteDesign(),
    });
    assert.deepEqual(eligibility, {
      canRequestPublish: false,
      reason: "matches-published",
    });
    assert.match(
      publishEligibilityHint(eligibility) ?? "",
      /already matches/i,
    );
  });

  it("blocks while a save or publish is pending", () => {
    const eligibility = getPublishEligibility({
      dirty: false,
      pending: true,
      draft: differingDraft(),
      published: cloneCanonicalSiteDesign(),
    });
    assert.deepEqual(eligibility, {
      canRequestPublish: false,
      reason: "pending",
    });
  });

  it("does not imply publish without confirmation (eligibility is request-only)", () => {
    const eligibility = getPublishEligibility({
      dirty: false,
      pending: false,
      draft: differingDraft(),
      published: cloneCanonicalSiteDesign(),
    });
    assert.equal(eligibility.canRequestPublish, true);
    // Confirmation remains a separate UI step — helpers never auto-publish.
    assert.equal("autoPublish" in eligibility, false);
  });
});

describe("buildPublishConfirmSnapshot", () => {
  it("shows live vs candidate palette/typography and draft revision", () => {
    const published = cloneCanonicalSiteDesign();
    const draft = differingDraft();
    draft.typography = {
      ...draft.typography,
      fontFamilyId: "classic",
      headingScaleId: "prominent",
    };
    const snapshot = buildPublishConfirmSnapshot({
      draft,
      published,
      draftRevision: 4,
      publishedRevision: 2,
    });
    assert.equal(snapshot.changesPublicWebsite, true);
    assert.equal(snapshot.conformanceClaim, null);
    assert.equal(snapshot.draftRevision, 4);
    assert.equal(snapshot.publishedRevision, 2);
    assert.match(snapshot.liveRevisionLabel, /Published revision 2/);
    assert.match(snapshot.liveThemeLabel, /Forest/i);
    assert.notEqual(snapshot.candidateThemeLabel, snapshot.liveThemeLabel);
    assert.match(snapshot.candidateTypographyLabel, /prominent/i);
    assert.ok(snapshot.accessibility.requiredPairCount > 0);
    assert.equal(snapshot.accessibility.conformanceClaim, null);
  });

  it("labels canonical default when nothing has been published", () => {
    const snapshot = buildPublishConfirmSnapshot({
      draft: differingDraft(),
      published: cloneCanonicalSiteDesign(),
      draftRevision: 1,
      publishedRevision: 0,
    });
    assert.match(snapshot.liveRevisionLabel, /Canonical default/i);
  });

  it("surfaces deterministic accessibility findings honestly", () => {
    const snapshot = buildPublishConfirmSnapshot({
      draft: differingDraft(),
      published: cloneCanonicalSiteDesign(),
      draftRevision: 1,
      publishedRevision: 0,
    });
    const summary = accessibilityConfirmSummary(snapshot.accessibility);
    assert.match(summary, /not a WCAG certificate/i);
    assert.ok(
      summary.includes(snapshot.accessibility.summaryLabel) ||
        /attention|review|passed/i.test(summary),
    );
  });
});

describe("buildPublishActionInput", () => {
  it("passes both expected revisions and never embeds a design payload", () => {
    const input = buildPublishActionInput({
      expectedDraftRevision: 3,
      expectedPublishedRevision: 1,
      note: "operator publish",
    });
    assert.deepEqual(input, {
      expectedDraftRevision: 3,
      expectedPublishedRevision: 1,
      note: "operator publish",
    });
    assert.equal("design" in input, false);
  });
});

describe("mapPublishActionResult", () => {
  const publishedPayload: PublishDesignResult = {
    published: cloneCanonicalSiteDesign(),
    publishedRevision: 5,
    draftRevision: 4,
    versionId: "ver_1",
    revalidation: "ok",
  };

  it("maps successful publication with verified revalidation", () => {
    const notice = mapPublishActionResult({
      ok: true,
      data: publishedPayload,
      message: "Design published.",
    });
    assert.equal(notice.tone, "success");
    assert.equal(notice.publishedRevision, 5);
    assert.equal(notice.revalidation, "ok");
    assert.match(notice.message, /published/i);
  });

  it("maps cache revalidation failure without claiming a fresh public cache", () => {
    const notice = mapPublishActionResult({
      ok: true,
      data: {
        ...publishedPayload,
        revalidation: "failed",
        revalidationError: "boom",
      },
      message: "Design published, but public cache revalidation failed.",
    });
    assert.equal(notice.tone, "warning");
    assert.equal(notice.revalidation, "failed");
    assert.match(notice.message, /revalidation failed/i);
    assert.doesNotMatch(notice.message, /website now uses/i);
  });

  it("maps revision conflicts with actual revisions for recovery", () => {
    const notice = mapPublishActionResult({
      ok: false,
      code: "CONFLICT",
      message: "Design revisions changed elsewhere. Reload before publishing.",
      expectedDraftRevision: 2,
      expectedPublishedRevision: 1,
      actualDraftRevision: 3,
      actualPublishedRevision: 2,
    });
    assert.equal(notice.tone, "conflict");
    assert.equal(notice.actualDraftRevision, 3);
    assert.equal(notice.actualPublishedRevision, 2);
  });

  it("maps unauthorized publish attempts", () => {
    const notice = mapPublishActionResult({
      ok: false,
      code: "UNAUTHORIZED",
      message: "Sign in as an editor or developer to manage site design.",
    });
    assert.equal(notice.tone, "error");
    assert.equal(notice.code, "UNAUTHORIZED");
  });

  it("maps validation failures with issues", () => {
    const notice = mapPublishActionResult({
      ok: false,
      code: "INVALID_DESIGN",
      message: "Draft SiteDesign is invalid and cannot be published.",
      issues: ["theme.presetId: Invalid"],
    });
    assert.equal(notice.tone, "error");
    assert.deepEqual(notice.issues, ["theme.presetId: Invalid"]);
  });

  it("maps hard errors without implying a safe automatic retry", () => {
    const notice = mapPublishActionResult({
      ok: false,
      code: "ERROR",
      message:
        "Publish transaction failed. No partial publication was committed.",
    });
    assert.equal(notice.tone, "error");
    assert.match(notice.message, /not|failed/i);
  });
});

describe("typographySummaryLabel", () => {
  it("includes family and scale labels", () => {
    const label = typographySummaryLabel(cloneCanonicalSiteDesign());
    assert.match(label, /Classic|classic/i);
    assert.match(label, /comfortable/i);
  });
});

describe("publish UX safety invariants", () => {
  it("never treats dirty+matching as publishable", () => {
    // Unsaved edits that coincidentally equal published still block (dirty first).
    const design = cloneCanonicalSiteDesign();
    assert.deepEqual(
      getPublishEligibility({
        dirty: true,
        pending: false,
        draft: design,
        published: design,
      }),
      { canRequestPublish: false, reason: "unsaved" },
    );
  });

  it("does not include restore or save semantics in publish action input", () => {
    const input = buildPublishActionInput({
      expectedDraftRevision: 1,
      expectedPublishedRevision: 0,
    });
    assert.equal("versionId" in input, false);
    assert.equal("design" in input, false);
    assert.equal("expectedDraftRevision" in input, true);
    assert.equal("expectedPublishedRevision" in input, true);
  });
});
