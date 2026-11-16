/**
 * Pure helpers for Website Studio History restore UX (NFT-STUDIO-007D-ENG02).
 *
 * Does not call the database or server actions. Presentation layers compose
 * these with restoreSiteDesignVersionAction.
 *
 * Restore copies a historical published snapshot into the private draft only.
 * It never publishes and never changes the live website.
 */

import { typographySummaryLabel } from "@/lib/site-design/publish-ui";
import { themeDisplayLabel } from "@/lib/site-design/options";
import type { SiteDesign } from "@/lib/site-design/schema";
import type {
  DesignOperationResult,
  SiteDesignVersionSummary,
} from "@/lib/site-design/types";

export type RestoreDesignResultData = {
  draft: SiteDesign;
  draftRevision: number;
  publishedRevision: number;
  sourceRevision: number;
};

export type RestoreConfirmSnapshot = {
  versionId: string;
  sourceRevision: number;
  publishedAtLabel: string | null;
  publishedByEmail: string | null;
  themeLabel: string | null;
  typographyLabel: string | null;
  isCurrentlyLive: boolean;
  currentDraftRevision: number;
  currentPublishedRevision: number;
  replacesCurrentDraft: true;
  changesPublicWebsite: false;
  requiresSeparatePublish: true;
};

export type RestoreNotice =
  | {
      tone: "success";
      message: string;
      draftRevision: number;
      publishedRevision: number;
      sourceRevision: number;
    }
  | {
      tone: "conflict";
      message: string;
      actualDraftRevision?: number;
      actualPublishedRevision?: number;
    }
  | {
      tone: "error";
      message: string;
      issues?: string[];
      code?: string;
    };

/** True when this published revision is the one currently live. */
export function isCurrentlyLiveVersion(
  version: Pick<SiteDesignVersionSummary, "revision">,
  publishedRevision: number,
): boolean {
  return publishedRevision > 0 && version.revision === publishedRevision;
}

export function buildRestoreConfirmSnapshot(input: {
  version: SiteDesignVersionSummary;
  draftRevision: number;
  publishedRevision: number;
  publishedAtLabel: string | null;
}): RestoreConfirmSnapshot {
  return {
    versionId: input.version.id,
    sourceRevision: input.version.revision,
    publishedAtLabel: input.publishedAtLabel,
    publishedByEmail: input.version.publishedByEmail || null,
    themeLabel: input.version.themeLabel ?? null,
    typographyLabel: input.version.typographyLabel ?? null,
    isCurrentlyLive: isCurrentlyLiveVersion(
      input.version,
      input.publishedRevision,
    ),
    currentDraftRevision: input.draftRevision,
    currentPublishedRevision: input.publishedRevision,
    replacesCurrentDraft: true,
    changesPublicWebsite: false,
    requiresSeparatePublish: true,
  };
}

/** Arguments for restoreSiteDesignVersionAction — draft-only, no publish. */
export function buildRestoreActionInput(input: {
  versionId: string;
  expectedDraftRevision: number;
}): {
  versionId: string;
  expectedDraftRevision: number;
} {
  return {
    versionId: input.versionId,
    expectedDraftRevision: input.expectedDraftRevision,
  };
}

/**
 * Map restoreSiteDesignVersionAction results to recoverable Studio notices.
 * Does not retry. Never claims the public website changed.
 */
export function mapRestoreActionResult(
  result: DesignOperationResult<RestoreDesignResultData>,
): RestoreNotice {
  if (result.ok) {
    return {
      tone: "success",
      draftRevision: result.data.draftRevision,
      publishedRevision: result.data.publishedRevision,
      sourceRevision: result.data.sourceRevision,
      message:
        result.message ||
        `Published revision ${result.data.sourceRevision} restored into the private draft (now draft revision ${result.data.draftRevision}). The live website was not changed. Open Design to review, then Publish separately if you want it live.`,
    };
  }

  if (result.code === "CONFLICT") {
    return {
      tone: "conflict",
      message:
        result.message ||
        "Draft was updated elsewhere. Reload History before restoring.",
      actualDraftRevision: result.actualDraftRevision,
      actualPublishedRevision: result.actualPublishedRevision,
    };
  }

  if (result.code === "UNAUTHORIZED") {
    return {
      tone: "error",
      code: result.code,
      message:
        result.message ||
        "Sign in as an editor or developer to restore design history.",
    };
  }

  if (result.code === "NOT_FOUND") {
    return {
      tone: "error",
      code: result.code,
      message: result.message || "That design version was not found.",
    };
  }

  if (result.code === "INVALID_DESIGN") {
    return {
      tone: "error",
      code: result.code,
      message:
        result.message ||
        "Historical snapshot failed validation and was not copied into draft.",
      issues: result.issues,
    };
  }

  return {
    tone: "error",
    code: result.code,
    message:
      result.message ||
      "Restore failed. The draft and live website were not changed. Reload before trying again — no automatic retry was performed.",
  };
}

/** Presentation labels from a validated SiteDesign — null fields never invented. */
export function presentationLabelsFromDesign(design: SiteDesign): {
  themeLabel: string;
  typographyLabel: string;
} {
  return {
    themeLabel: themeDisplayLabel(design.theme.presetId),
    typographyLabel: typographySummaryLabel(design),
  };
}

/** Confirm that restore never implies auto-publish in helper contracts. */
export function restoreLeavesPublishedUnchanged(input: {
  beforePublishedRevision: number;
  afterPublishedRevision: number;
}): boolean {
  return input.beforePublishedRevision === input.afterPublishedRevision;
}
