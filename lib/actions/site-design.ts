"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { resolveDesignActor } from "@/lib/site-design/actor";
import { siteDesignSchema } from "@/lib/site-design/schema";
import {
  listSiteDesignVersions,
  publishSiteDesign,
  readSiteDesignWorkspace,
  restoreSiteDesignVersionToDraft,
  saveSiteDesignDraft,
} from "@/lib/site-design/service";
import type {
  DesignOperationResult,
  PublishDesignResult,
  SiteDesignVersionSummary,
  WorkspaceReadResult,
} from "@/lib/site-design/types";
import type { SiteDesign } from "@/lib/site-design/schema";

function unauthorized<T>(): DesignOperationResult<T> {
  return {
    ok: false,
    code: "UNAUTHORIZED",
    message: "Sign in as an editor or developer to manage site design.",
  };
}

async function requireDesignActor() {
  return resolveDesignActor(await auth());
}

/** Read draft + published design metadata for authenticated Studio use. */
export async function getSiteDesignWorkspaceAction(): Promise<WorkspaceReadResult> {
  const actor = await requireDesignActor();
  if (!actor) {
    return {
      ok: false,
      code: "UNAUTHORIZED",
      message: "Sign in as an editor or developer to manage site design.",
    };
  }

  return readSiteDesignWorkspace();
}

const saveDraftSchema = z.object({
  expectedDraftRevision: z.number().int().min(0),
  design: siteDesignSchema,
});

/** Persist a validated draft. Never mutates published state or public caches. */
export async function saveSiteDesignDraftAction(
  input: unknown,
): Promise<
  DesignOperationResult<{
    draft: SiteDesign;
    draftRevision: number;
    publishedRevision: number;
  }>
> {
  const actor = await requireDesignActor();
  if (!actor) return unauthorized();

  const parsed = saveDraftSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      code: "INVALID_DESIGN",
      message: "Draft payload failed validation.",
      issues: parsed.error.issues.map((issue) => {
        const path = issue.path.length > 0 ? issue.path.join(".") : "(root)";
        return `${path}: ${issue.message}`;
      }),
    };
  }

  return saveSiteDesignDraft({
    actor,
    design: parsed.data.design,
    expectedDraftRevision: parsed.data.expectedDraftRevision,
  });
}

const publishSchema = z.object({
  expectedDraftRevision: z.number().int().min(0),
  expectedPublishedRevision: z.number().int().min(0),
  note: z.string().max(280).optional().nullable(),
  sourceRevision: z.number().int().min(1).optional().nullable(),
});

/**
 * Publish the current draft into live public design.
 * Requires explicit call — draft saves never publish.
 */
export async function publishSiteDesignAction(
  input: unknown,
): Promise<DesignOperationResult<PublishDesignResult>> {
  const actor = await requireDesignActor();
  if (!actor) return unauthorized();

  const parsed = publishSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      code: "INVALID_DESIGN",
      message: "Publish request failed validation.",
      issues: parsed.error.issues.map((issue) => {
        const path = issue.path.length > 0 ? issue.path.join(".") : "(root)";
        return `${path}: ${issue.message}`;
      }),
    };
  }

  return publishSiteDesign({
    actor,
    expectedDraftRevision: parsed.data.expectedDraftRevision,
    expectedPublishedRevision: parsed.data.expectedPublishedRevision,
    note: parsed.data.note,
    sourceRevision: parsed.data.sourceRevision,
  });
}

/** List recent published design snapshots (metadata only). */
export async function listSiteDesignVersionsAction(options?: {
  limit?: number;
}): Promise<
  DesignOperationResult<{ versions: SiteDesignVersionSummary[] }>
> {
  const actor = await requireDesignActor();
  if (!actor) return unauthorized();

  try {
    const versions = await listSiteDesignVersions({
      limit: options?.limit,
    });
    return { ok: true, data: { versions } };
  } catch (error) {
    console.error("[site-design-list-versions]", error);
    return {
      ok: false,
      code: "ERROR",
      message:
        "Unable to list design history. Tables may be pending migration.",
    };
  }
}

const restoreSchema = z.object({
  versionId: z.string().min(1).max(64),
  expectedDraftRevision: z.number().int().min(0),
});

/**
 * Copy a historical published snapshot into the private draft.
 * Live published design is unchanged until an explicit publish.
 */
export async function restoreSiteDesignVersionAction(
  input: unknown,
): Promise<
  DesignOperationResult<{
    draft: SiteDesign;
    draftRevision: number;
    publishedRevision: number;
    sourceRevision: number;
  }>
> {
  const actor = await requireDesignActor();
  if (!actor) return unauthorized();

  const parsed = restoreSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      code: "INVALID_DESIGN",
      message: "Restore request failed validation.",
      issues: parsed.error.issues.map((issue) => {
        const path = issue.path.length > 0 ? issue.path.join(".") : "(root)";
        return `${path}: ${issue.message}`;
      }),
    };
  }

  return restoreSiteDesignVersionToDraft({
    actor,
    versionId: parsed.data.versionId,
    expectedDraftRevision: parsed.data.expectedDraftRevision,
  });
}
