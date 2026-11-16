/**
 * Pure helpers for Website Studio publish UX (NFT-STUDIO-007D-ENG01).
 *
 * Does not call the database or server actions. Presentation layers compose
 * these with publishSiteDesignAction.
 */

import {
  evaluateDesignAccessibility,
  type DesignAccessibilityEvaluation,
} from "@/lib/site-design/accessibility-evaluation";
import {
  BODY_SCALE_OPTIONS,
  HEADING_SCALE_OPTIONS,
  fontFamilyDisplayLabel,
  themeDisplayLabel,
} from "@/lib/site-design/options";
import type { SiteDesign } from "@/lib/site-design/schema";
import { designsEqual } from "@/lib/site-design/studio-status";
import type {
  DesignOperationResult,
  PublishDesignResult,
} from "@/lib/site-design/types";

export type PublishBlockReason =
  | "unsaved"
  | "matches-published"
  | "pending"
  | "confirm-required";

export type PublishEligibility =
  | { canRequestPublish: false; reason: PublishBlockReason }
  | { canRequestPublish: true };

export type PublishConfirmSnapshot = {
  liveThemeLabel: string;
  liveTypographyLabel: string;
  liveRevisionLabel: string;
  candidateThemeLabel: string;
  candidateTypographyLabel: string;
  draftRevision: number;
  publishedRevision: number;
  accessibility: DesignAccessibilityEvaluation;
  changesPublicWebsite: true;
  conformanceClaim: null;
};

export type PublishNotice =
  | {
      tone: "success";
      message: string;
      publishedRevision?: number;
      revalidation?: "ok" | "failed";
    }
  | {
      tone: "warning";
      message: string;
      publishedRevision?: number;
      revalidation: "failed";
      revalidationError?: string;
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

function scaleLabel(
  options: { id: string; label: string }[],
  id: string,
): string {
  return options.find((option) => option.id === id)?.label ?? id;
}

export function typographySummaryLabel(design: SiteDesign): string {
  const family = fontFamilyDisplayLabel(design.typography.fontFamilyId);
  const heading = scaleLabel(
    HEADING_SCALE_OPTIONS,
    design.typography.headingScaleId,
  );
  const body = scaleLabel(BODY_SCALE_OPTIONS, design.typography.bodyScaleId);
  return `${family} · headings ${heading} · body ${body}`;
}

/**
 * Whether the Design UI may open the publish confirmation.
 * Never implies automatic publish — confirmation remains required.
 */
export function getPublishEligibility(input: {
  dirty: boolean;
  pending: boolean;
  draft: SiteDesign;
  published: SiteDesign | null | undefined;
}): PublishEligibility {
  if (input.pending) {
    return { canRequestPublish: false, reason: "pending" };
  }
  if (input.dirty) {
    return { canRequestPublish: false, reason: "unsaved" };
  }
  if (designsEqual(input.draft, input.published)) {
    return { canRequestPublish: false, reason: "matches-published" };
  }
  return { canRequestPublish: true };
}

/** Human-facing reason under the Publish control (not a WCAG claim). */
export function publishEligibilityHint(
  eligibility: PublishEligibility,
): string | null {
  if (eligibility.canRequestPublish) {
    return null;
  }
  switch (eligibility.reason) {
    case "unsaved":
      return "Save the draft before publishing. Publishing never saves for you.";
    case "matches-published":
      return "This saved draft already matches what is live. Nothing new to publish.";
    case "pending":
      return "Wait for the current save or publish to finish.";
    case "confirm-required":
      return "Confirm in the dialog to change the public website.";
  }
}

export function buildPublishConfirmSnapshot(input: {
  draft: SiteDesign;
  published: SiteDesign;
  draftRevision: number;
  publishedRevision: number;
}): PublishConfirmSnapshot {
  const accessibility = evaluateDesignAccessibility(input.draft);
  const liveRevisionLabel =
    input.publishedRevision > 0
      ? `Published revision ${input.publishedRevision}`
      : "Canonical default (no custom publish yet)";

  return {
    liveThemeLabel: themeDisplayLabel(input.published.theme.presetId),
    liveTypographyLabel: typographySummaryLabel(input.published),
    liveRevisionLabel,
    candidateThemeLabel: themeDisplayLabel(input.draft.theme.presetId),
    candidateTypographyLabel: typographySummaryLabel(input.draft),
    draftRevision: input.draftRevision,
    publishedRevision: input.publishedRevision,
    accessibility,
    changesPublicWebsite: true,
    conformanceClaim: null,
  };
}

/** Honest one-line a11y summary for the confirm dialog (no WCAG claim). */
export function accessibilityConfirmSummary(
  evaluation: DesignAccessibilityEvaluation,
): string {
  if (evaluation.failingCount > 0) {
    return `${evaluation.summaryLabel}: ${evaluation.failingCount} solid-color pair${evaluation.failingCount === 1 ? "" : "s"} need attention. This is not a WCAG certificate.`;
  }
  if (evaluation.overallStatus === "review-recommended") {
    return `${evaluation.summaryLabel}. Rendered and manual review remain separate. This is not a WCAG certificate.`;
  }
  if (evaluation.nearThresholdCount > 0) {
    return `${evaluation.summaryLabel} (${evaluation.nearThresholdCount} close to the Studio minimum). Rendered/manual review still recommended. Not a WCAG certificate.`;
  }
  return `${evaluation.summaryLabel}. Rendered and manual review remain separate. This is not a WCAG certificate.`;
}

/**
 * Map publishSiteDesignAction results to recoverable Studio notices.
 * Does not retry. Does not claim public refresh unless revalidation === "ok".
 */
export function mapPublishActionResult(
  result: DesignOperationResult<PublishDesignResult>,
): PublishNotice {
  if (result.ok) {
    if (result.data.revalidation === "failed") {
      return {
        tone: "warning",
        publishedRevision: result.data.publishedRevision,
        revalidation: "failed",
        revalidationError: result.data.revalidationError,
        message:
          result.message ||
          "Design published to the database, but public cache revalidation failed. The live site may take longer to show the new design — use Developer cache refresh if needed.",
      };
    }
    return {
      tone: "success",
      publishedRevision: result.data.publishedRevision,
      revalidation: "ok",
      message:
        result.message ||
        "Design published. The public website now uses this saved draft.",
    };
  }

  if (result.code === "CONFLICT") {
    return {
      tone: "conflict",
      message:
        result.message ||
        "Design revisions changed elsewhere. Reload before publishing.",
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
        "Sign in as an editor or developer to publish site design.",
    };
  }

  if (result.code === "INVALID_DESIGN") {
    return {
      tone: "error",
      code: result.code,
      message: result.message || "Draft failed validation and was not published.",
      issues: result.issues,
    };
  }

  return {
    tone: "error",
    code: result.code,
    message:
      result.message ||
      "Publish failed. The public website was not changed. Do not assume a retry is safe without reloading.",
  };
}

/** Arguments for publishSiteDesignAction — no silent design payload. */
export function buildPublishActionInput(input: {
  expectedDraftRevision: number;
  expectedPublishedRevision: number;
  note?: string | null;
}): {
  expectedDraftRevision: number;
  expectedPublishedRevision: number;
  note?: string | null;
} {
  return {
    expectedDraftRevision: input.expectedDraftRevision,
    expectedPublishedRevision: input.expectedPublishedRevision,
    ...(input.note !== undefined ? { note: input.note } : {}),
  };
}
