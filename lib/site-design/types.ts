import type { SiteDesign } from "@/lib/site-design/schema";

export const SITE_DESIGN_STATE_KEY = "default" as const;

export const SITE_DESIGN_HISTORY_LIMIT = 20;

export type DesignActor = {
  id: string;
  email: string;
};

export type DesignOperationOk<T> = {
  ok: true;
  data: T;
  message?: string;
};

export type DesignOperationConflict = {
  ok: false;
  code: "CONFLICT";
  message: string;
  expectedDraftRevision?: number;
  expectedPublishedRevision?: number;
  actualDraftRevision?: number;
  actualPublishedRevision?: number;
};

export type DesignOperationUnauthorized = {
  ok: false;
  code: "UNAUTHORIZED";
  message: string;
};

export type DesignOperationInvalid = {
  ok: false;
  code: "INVALID_DESIGN";
  message: string;
  issues?: string[];
};

export type DesignOperationNotFound = {
  ok: false;
  code: "NOT_FOUND";
  message: string;
};

export type DesignOperationError =
  | DesignOperationConflict
  | DesignOperationUnauthorized
  | DesignOperationInvalid
  | DesignOperationNotFound
  | {
      ok: false;
      code: "ERROR";
      message: string;
    };

export type DesignOperationResult<T> =
  | DesignOperationOk<T>
  | DesignOperationError;

export type SiteDesignWorkspace = {
  draft: SiteDesign;
  published: SiteDesign;
  draftRevision: number;
  publishedRevision: number;
  draftUpdatedAt: string | null;
  draftUpdatedByEmail: string | null;
  publishedAt: string | null;
  publishedByEmail: string | null;
  draftValid: true;
  publishedValid: true;
};

export type SiteDesignWorkspaceInvalid = {
  draft: SiteDesign | null;
  published: SiteDesign | null;
  draftRevision: number;
  publishedRevision: number;
  draftUpdatedAt: string | null;
  draftUpdatedByEmail: string | null;
  publishedAt: string | null;
  publishedByEmail: string | null;
  draftValid: boolean;
  publishedValid: boolean;
  draftIssues?: string[];
  publishedIssues?: string[];
  /** Raw stored documents preserved for diagnosis — never auto-reset. */
  rawDraftJson: unknown;
  rawPublishedJson: unknown;
};

export type SiteDesignVersionSummary = {
  id: string;
  revision: number;
  publishedAt: string;
  publishedByEmail: string;
  note: string | null;
  sourceRevision: number | null;
};

export type PublishDesignResult = {
  published: SiteDesign;
  publishedRevision: number;
  draftRevision: number;
  versionId: string;
  revalidation: "ok" | "failed";
  revalidationError?: string;
};

/**
 * Typed workspace read: INVALID_DESIGN includes preserved raw documents
 * for Studio diagnosis without mutating storage.
 */
export type WorkspaceReadResult =
  | { ok: true; data: SiteDesignWorkspace }
  | {
      ok: false;
      code: "INVALID_DESIGN";
      message: string;
      issues?: string[];
      data: SiteDesignWorkspaceInvalid;
    }
  | {
      ok: false;
      code: "UNAUTHORIZED" | "NOT_FOUND" | "ERROR" | "CONFLICT";
      message: string;
    };
