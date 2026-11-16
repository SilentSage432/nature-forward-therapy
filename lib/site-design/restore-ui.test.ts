/**
 * NFT-STUDIO-007D-ENG02 — restore UX helpers (no production DB writes).
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { cloneCanonicalSiteDesign } from "@/lib/site-design/defaults";
import {
  buildRestoreActionInput,
  buildRestoreConfirmSnapshot,
  isCurrentlyLiveVersion,
  mapRestoreActionResult,
  presentationLabelsFromDesign,
  restoreLeavesPublishedUnchanged,
} from "@/lib/site-design/restore-ui";
import type { SiteDesignVersionSummary } from "@/lib/site-design/types";

function sampleVersion(
  overrides: Partial<SiteDesignVersionSummary> = {},
): SiteDesignVersionSummary {
  return {
    id: "ver_abc",
    revision: 3,
    publishedAt: "2026-11-15T12:00:00.000Z",
    publishedByEmail: "editor@example.test",
    note: "evening look",
    sourceRevision: null,
    themeLabel: "Dusk & Sage",
    typographyLabel: "Classic · headings Comfortable · body Comfortable",
    ...overrides,
  };
}

describe("isCurrentlyLiveVersion", () => {
  it("marks the matching published revision as live", () => {
    assert.equal(isCurrentlyLiveVersion({ revision: 3 }, 3), true);
    assert.equal(isCurrentlyLiveVersion({ revision: 2 }, 3), false);
  });

  it("never treats revision 0 published state as live custom version", () => {
    assert.equal(isCurrentlyLiveVersion({ revision: 0 }, 0), false);
    assert.equal(isCurrentlyLiveVersion({ revision: 1 }, 0), false);
  });
});

describe("buildRestoreConfirmSnapshot", () => {
  it("identifies the selected version and draft replacement semantics", () => {
    const snapshot = buildRestoreConfirmSnapshot({
      version: sampleVersion(),
      draftRevision: 5,
      publishedRevision: 3,
      publishedAtLabel: "Nov 15, 2026, 5:00 AM",
    });
    assert.equal(snapshot.versionId, "ver_abc");
    assert.equal(snapshot.sourceRevision, 3);
    assert.equal(snapshot.isCurrentlyLive, true);
    assert.equal(snapshot.replacesCurrentDraft, true);
    assert.equal(snapshot.changesPublicWebsite, false);
    assert.equal(snapshot.requiresSeparatePublish, true);
    assert.equal(snapshot.currentDraftRevision, 5);
    assert.equal(snapshot.currentPublishedRevision, 3);
    assert.equal(snapshot.themeLabel, "Dusk & Sage");
    assert.equal(snapshot.publishedByEmail, "editor@example.test");
  });

  it("does not invent missing palette or typography labels", () => {
    const snapshot = buildRestoreConfirmSnapshot({
      version: sampleVersion({
        themeLabel: null,
        typographyLabel: null,
        publishedByEmail: "",
      }),
      draftRevision: 1,
      publishedRevision: 2,
      publishedAtLabel: null,
    });
    assert.equal(snapshot.themeLabel, null);
    assert.equal(snapshot.typographyLabel, null);
    assert.equal(snapshot.publishedByEmail, null);
    assert.equal(snapshot.isCurrentlyLive, false);
  });
});

describe("buildRestoreActionInput", () => {
  it("passes versionId and expectedDraftRevision only", () => {
    const input = buildRestoreActionInput({
      versionId: "ver_1",
      expectedDraftRevision: 4,
    });
    assert.deepEqual(input, {
      versionId: "ver_1",
      expectedDraftRevision: 4,
    });
    assert.equal("design" in input, false);
    assert.equal("expectedPublishedRevision" in input, false);
    assert.equal("publish" in input, false);
  });
});

describe("mapRestoreActionResult", () => {
  it("maps success without claiming the public website changed", () => {
    const draft = cloneCanonicalSiteDesign();
    const notice = mapRestoreActionResult({
      ok: true,
      data: {
        draft,
        draftRevision: 6,
        publishedRevision: 3,
        sourceRevision: 2,
      },
      message:
        "Historical design restored into draft. Publish explicitly to go live.",
    });
    assert.equal(notice.tone, "success");
    assert.equal(notice.draftRevision, 6);
    assert.equal(notice.publishedRevision, 3);
    assert.equal(notice.sourceRevision, 2);
    assert.match(notice.message, /not changed|Publish explicitly|live/i);
    assert.doesNotMatch(notice.message, /website now uses/i);
  });

  it("maps stale draft revision conflicts for recovery", () => {
    const notice = mapRestoreActionResult({
      ok: false,
      code: "CONFLICT",
      message: "Draft was updated elsewhere. Reload before restoring history.",
      expectedDraftRevision: 4,
      actualDraftRevision: 5,
      actualPublishedRevision: 3,
    });
    assert.equal(notice.tone, "conflict");
    assert.equal(notice.actualDraftRevision, 5);
    assert.equal(notice.actualPublishedRevision, 3);
  });

  it("maps unauthorized restoration", () => {
    const notice = mapRestoreActionResult({
      ok: false,
      code: "UNAUTHORIZED",
      message: "Sign in as an editor or developer to manage site design.",
    });
    assert.equal(notice.tone, "error");
    assert.equal(notice.code, "UNAUTHORIZED");
  });

  it("maps missing historical versions", () => {
    const notice = mapRestoreActionResult({
      ok: false,
      code: "NOT_FOUND",
      message: "Design version was not found.",
    });
    assert.equal(notice.tone, "error");
    assert.equal(notice.code, "NOT_FOUND");
  });

  it("maps invalid historical snapshots with issues", () => {
    const notice = mapRestoreActionResult({
      ok: false,
      code: "INVALID_DESIGN",
      message:
        "Historical snapshot failed validation and was not copied into draft.",
      issues: ["theme.presetId: Invalid"],
    });
    assert.equal(notice.tone, "error");
    assert.deepEqual(notice.issues, ["theme.presetId: Invalid"]);
  });

  it("maps hard errors without automatic retry semantics", () => {
    const withMessage = mapRestoreActionResult({
      ok: false,
      code: "ERROR",
      message: "Unexpected failure",
    });
    assert.equal(withMessage.tone, "error");
    assert.equal(withMessage.message, "Unexpected failure");

    const fallback = mapRestoreActionResult({
      ok: false,
      code: "ERROR",
      message: "",
    });
    assert.equal(fallback.tone, "error");
    assert.match(fallback.message, /not changed|Reload|retry/i);
  });
});

describe("restoreLeavesPublishedUnchanged", () => {
  it("requires published revision preservation after restore", () => {
    assert.equal(
      restoreLeavesPublishedUnchanged({
        beforePublishedRevision: 3,
        afterPublishedRevision: 3,
      }),
      true,
    );
    assert.equal(
      restoreLeavesPublishedUnchanged({
        beforePublishedRevision: 3,
        afterPublishedRevision: 4,
      }),
      false,
    );
  });
});

describe("presentationLabelsFromDesign", () => {
  it("derives labels from a validated design without inventing ids", () => {
    const design = cloneCanonicalSiteDesign();
    const labels = presentationLabelsFromDesign(design);
    assert.match(labels.themeLabel, /Forest/i);
    assert.match(labels.typographyLabel, /Classic|classic/i);
  });
});

describe("restore UX safety invariants", () => {
  it("confirmation snapshot never sets changesPublicWebsite", () => {
    const snapshot = buildRestoreConfirmSnapshot({
      version: sampleVersion(),
      draftRevision: 1,
      publishedRevision: 1,
      publishedAtLabel: null,
    });
    assert.equal(snapshot.changesPublicWebsite, false);
    assert.equal(snapshot.requiresSeparatePublish, true);
  });

  it("action input cannot encode an automatic publish", () => {
    const input = buildRestoreActionInput({
      versionId: "ver_x",
      expectedDraftRevision: 0,
    });
    assert.deepEqual(Object.keys(input).sort(), [
      "expectedDraftRevision",
      "versionId",
    ]);
  });
});
