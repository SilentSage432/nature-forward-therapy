import { themeDisplayLabel } from "@/lib/site-design/options";
import type { SiteDesign } from "@/lib/site-design/schema";
import type {
  SiteDesignWorkspace,
  SiteDesignWorkspaceInvalid,
} from "@/lib/site-design/types";

/**
 * Friendly presentation status for Website Studio.
 * Distinguishes canonical live default, published designs, and unpublished drafts.
 */

export type StudioLiveMode =
  | "canonical-default"
  | "published-design"
  | "invalid-published";

export type StudioDraftRelation =
  | "matches-published"
  | "unpublished-changes"
  | "invalid-draft"
  | "unknown";

export type StudioWorkspaceStatus = {
  liveMode: StudioLiveMode;
  draftRelation: StudioDraftRelation;
  themeLabel: string;
  draftRevision: number;
  publishedRevision: number;
  publishedAt: string | null;
  publishedByEmail: string | null;
  draftUpdatedAt: string | null;
  draftUpdatedByEmail: string | null;
  hasBeenPublished: boolean;
  liveSummary: string;
  draftSummary: string;
};

function stableDesignPayload(design: SiteDesign): string {
  return JSON.stringify(design);
}

export function designsEqual(
  a: SiteDesign | null | undefined,
  b: SiteDesign | null | undefined,
): boolean {
  if (!a || !b) return false;
  return stableDesignPayload(a) === stableDesignPayload(b);
}

export function themeDisplayName(presetId: string | undefined | null): string {
  return themeDisplayLabel(presetId ?? "forest-gold");
}

export function formatStudioTimestamp(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function deriveStudioWorkspaceStatus(
  workspace: SiteDesignWorkspace | SiteDesignWorkspaceInvalid,
): StudioWorkspaceStatus {
  const hasBeenPublished = workspace.publishedRevision > 0;
  const publishedValid =
    "publishedValid" in workspace ? workspace.publishedValid : true;
  const draftValid = "draftValid" in workspace ? workspace.draftValid : true;

  let liveMode: StudioLiveMode;
  if (!publishedValid) {
    liveMode = "invalid-published";
  } else if (hasBeenPublished) {
    liveMode = "published-design";
  } else {
    liveMode = "canonical-default";
  }

  let draftRelation: StudioDraftRelation = "unknown";
  if (!draftValid) {
    draftRelation = "invalid-draft";
  } else if (
    draftValid &&
    publishedValid &&
    workspace.draft &&
    workspace.published
  ) {
    draftRelation = designsEqual(workspace.draft, workspace.published)
      ? "matches-published"
      : "unpublished-changes";
  }

  const themeId =
    (draftValid && workspace.draft?.theme.presetId) ||
    (publishedValid && workspace.published?.theme.presetId) ||
    "forest-gold";

  const liveSummary =
    liveMode === "published-design"
      ? "The live website is using a published design."
      : liveMode === "invalid-published"
        ? "The stored published design is invalid. The live site safely falls back to the default look."
        : "The live website is using the established Forest & Gold default. No custom design has been published yet.";

  const draftSummary =
    draftRelation === "unpublished-changes"
      ? "The private draft differs from what is live. Publishing is not available in this workspace shell yet."
      : draftRelation === "invalid-draft"
        ? "The private draft failed validation and was preserved without changes."
        : draftRelation === "matches-published"
          ? hasBeenPublished
            ? "The private draft matches the published design."
            : "The private draft matches the current default design."
          : "Draft status could not be compared.";

  return {
    liveMode,
    draftRelation,
    themeLabel: themeDisplayName(themeId),
    draftRevision: workspace.draftRevision,
    publishedRevision: workspace.publishedRevision,
    publishedAt: workspace.publishedAt,
    publishedByEmail: workspace.publishedByEmail,
    draftUpdatedAt: workspace.draftUpdatedAt,
    draftUpdatedByEmail: workspace.draftUpdatedByEmail,
    hasBeenPublished,
    liveSummary,
    draftSummary,
  };
}
