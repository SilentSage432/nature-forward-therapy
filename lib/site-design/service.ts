import { Prisma } from "@prisma/client";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { revalidatePublicSurfaces } from "@/lib/public-cache";
import { cloneCanonicalSiteDesign } from "@/lib/site-design/defaults";
import { parseSiteDesign } from "@/lib/site-design/schema";
import type { SiteDesign } from "@/lib/site-design/schema";
import {
  SITE_DESIGN_HISTORY_LIMIT,
  SITE_DESIGN_STATE_KEY,
  type DesignActor,
  type DesignOperationResult,
  type PublishDesignResult,
  type SiteDesignVersionSummary,
  type SiteDesignWorkspace,
  type SiteDesignWorkspaceInvalid,
  type WorkspaceReadResult,
} from "@/lib/site-design/types";

function asJson(value: SiteDesign): Prisma.InputJsonValue {
  return value as unknown as Prisma.InputJsonValue;
}

function toIso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

/**
 * Ensure the singleton design row exists for authenticated Studio operations.
 * Seeds draft + published with the canonical default. Does NOT append history
 * and does NOT revalidate public caches (no visitor-visible change).
 */
export async function ensureSiteDesignState(): Promise<{
  id: string;
  created: boolean;
}> {
  const existing = await prisma.siteDesignState.findUnique({
    where: { key: SITE_DESIGN_STATE_KEY },
    select: { id: true },
  });
  if (existing) {
    return { id: existing.id, created: false };
  }

  const canonical = cloneCanonicalSiteDesign();
  try {
    const created = await prisma.siteDesignState.create({
      data: {
        key: SITE_DESIGN_STATE_KEY,
        publishedJson: asJson(canonical),
        draftJson: asJson(canonical),
        publishedRevision: 0,
        draftRevision: 0,
      },
      select: { id: true },
    });
    return { id: created.id, created: true };
  } catch (error) {
    // Concurrent ensure — another writer likely won the unique key race.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const raced = await prisma.siteDesignState.findUnique({
        where: { key: SITE_DESIGN_STATE_KEY },
        select: { id: true },
      });
      if (raced) return { id: raced.id, created: false };
    }
    throw error;
  }
}

export async function readSiteDesignWorkspace(): Promise<WorkspaceReadResult> {
  await ensureSiteDesignState();
  const row = await prisma.siteDesignState.findUnique({
    where: { key: SITE_DESIGN_STATE_KEY },
  });
  if (!row) {
    return {
      ok: false,
      code: "NOT_FOUND",
      message: "Site design state was not found.",
    };
  }

  const draftParsed = parseSiteDesign(row.draftJson);
  const publishedParsed = parseSiteDesign(row.publishedJson);

  if (draftParsed.ok && publishedParsed.ok) {
    const data: SiteDesignWorkspace = {
      draft: draftParsed.design,
      published: publishedParsed.design,
      draftRevision: row.draftRevision,
      publishedRevision: row.publishedRevision,
      draftUpdatedAt: toIso(row.draftUpdatedAt),
      draftUpdatedByEmail: row.draftUpdatedByEmail,
      publishedAt: toIso(row.publishedAt),
      publishedByEmail: row.publishedByEmail,
      draftValid: true,
      publishedValid: true,
    };
    return { ok: true, data };
  }

  const invalid: SiteDesignWorkspaceInvalid = {
    draft: draftParsed.ok ? draftParsed.design : null,
    published: publishedParsed.ok ? publishedParsed.design : null,
    draftRevision: row.draftRevision,
    publishedRevision: row.publishedRevision,
    draftUpdatedAt: toIso(row.draftUpdatedAt),
    draftUpdatedByEmail: row.draftUpdatedByEmail,
    publishedAt: toIso(row.publishedAt),
    publishedByEmail: row.publishedByEmail,
    draftValid: draftParsed.ok,
    publishedValid: publishedParsed.ok,
    draftIssues: draftParsed.ok ? undefined : draftParsed.issues,
    publishedIssues: publishedParsed.ok ? undefined : publishedParsed.issues,
    rawDraftJson: row.draftJson,
    rawPublishedJson: row.publishedJson,
  };

  return {
    ok: false,
    code: "INVALID_DESIGN",
    message:
      "Stored SiteDesign JSON failed validation. Raw documents were preserved; nothing was overwritten.",
    issues: [
      ...(draftParsed.ok ? [] : draftParsed.issues ?? [draftParsed.reason]),
      ...(publishedParsed.ok
        ? []
        : publishedParsed.issues ?? [publishedParsed.reason]),
    ],
    data: invalid,
  };
}

export async function saveSiteDesignDraft(input: {
  actor: DesignActor;
  design: unknown;
  expectedDraftRevision: number;
}): Promise<
  DesignOperationResult<{
    draft: SiteDesign;
    draftRevision: number;
    publishedRevision: number;
  }>
> {
  const parsed = parseSiteDesign(input.design);
  if (!parsed.ok) {
    return {
      ok: false,
      code: "INVALID_DESIGN",
      message: parsed.reason,
      issues: parsed.issues,
    };
  }

  await ensureSiteDesignState();

  const result = await prisma.$transaction(async (tx) => {
    const current = await tx.siteDesignState.findUnique({
      where: { key: SITE_DESIGN_STATE_KEY },
    });
    if (!current) {
      return {
        ok: false as const,
        code: "NOT_FOUND" as const,
        message: "Site design state was not found.",
      };
    }

    if (current.draftRevision !== input.expectedDraftRevision) {
      return {
        ok: false as const,
        code: "CONFLICT" as const,
        message:
          "Draft was updated elsewhere. Reload the latest draft before saving.",
        expectedDraftRevision: input.expectedDraftRevision,
        actualDraftRevision: current.draftRevision,
        actualPublishedRevision: current.publishedRevision,
      };
    }

    const nextRevision = current.draftRevision + 1;
    const updatedCount = await tx.siteDesignState.updateMany({
      where: {
        key: SITE_DESIGN_STATE_KEY,
        draftRevision: input.expectedDraftRevision,
      },
      data: {
        draftJson: asJson(parsed.design),
        draftRevision: nextRevision,
        draftUpdatedAt: new Date(),
        draftUpdatedById: input.actor.id,
        draftUpdatedByEmail: input.actor.email,
      },
    });

    if (updatedCount.count !== 1) {
      const raced = await tx.siteDesignState.findUnique({
        where: { key: SITE_DESIGN_STATE_KEY },
      });
      return {
        ok: false as const,
        code: "CONFLICT" as const,
        message:
          "Draft was updated elsewhere. Reload the latest draft before saving.",
        expectedDraftRevision: input.expectedDraftRevision,
        actualDraftRevision: raced?.draftRevision,
        actualPublishedRevision: raced?.publishedRevision,
      };
    }

    return {
      ok: true as const,
      data: {
        draft: parsed.design,
        draftRevision: nextRevision,
        publishedRevision: current.publishedRevision,
      },
      previousDraft: current.draftJson,
      previousRevision: current.draftRevision,
    };
  });

  if (!result.ok) {
    return result;
  }

  await writeAuditLog({
    actor: input.actor,
    action: "UPDATE_SITE_DESIGN_DRAFT",
    entity: "SiteDesignState",
    entityId: SITE_DESIGN_STATE_KEY,
    previousState: {
      draftRevision: result.previousRevision,
      draftJson: result.previousDraft,
    },
    newState: {
      draftRevision: result.data.draftRevision,
      draftJson: result.data.draft,
    },
  });

  return {
    ok: true,
    data: result.data,
    message: "Design draft saved.",
  };
}

type PublishTxSuccess = {
  ok: true;
  data: {
    published: SiteDesign;
    publishedRevision: number;
    draftRevision: number;
    versionId: string;
  };
  previousPublished: unknown;
  previousPublishedRevision: number;
};

type PublishTxFailure = Extract<
  DesignOperationResult<PublishDesignResult>,
  { ok: false }
>;

async function publishSiteDesignTransaction(input: {
  actor: DesignActor;
  expectedDraftRevision: number;
  expectedPublishedRevision: number;
  note?: string | null;
  sourceRevision?: number | null;
}): Promise<PublishTxSuccess | PublishTxFailure> {
  return prisma.$transaction(async (tx) => {
    const current = await tx.siteDesignState.findUnique({
      where: { key: SITE_DESIGN_STATE_KEY },
    });
    if (!current) {
      return {
        ok: false as const,
        code: "NOT_FOUND" as const,
        message: "Site design state was not found.",
      };
    }

    if (
      current.draftRevision !== input.expectedDraftRevision ||
      current.publishedRevision !== input.expectedPublishedRevision
    ) {
      return {
        ok: false as const,
        code: "CONFLICT" as const,
        message:
          "Design revisions changed elsewhere. Reload before publishing.",
        expectedDraftRevision: input.expectedDraftRevision,
        expectedPublishedRevision: input.expectedPublishedRevision,
        actualDraftRevision: current.draftRevision,
        actualPublishedRevision: current.publishedRevision,
      };
    }

    const draftParsed = parseSiteDesign(current.draftJson);
    if (!draftParsed.ok) {
      return {
        ok: false as const,
        code: "INVALID_DESIGN" as const,
        message:
          "Draft SiteDesign is invalid and cannot be published. Raw draft was preserved.",
        issues: draftParsed.issues,
      };
    }

    const nextPublishedRevision = current.publishedRevision + 1;
    const now = new Date();

    const updatedCount = await tx.siteDesignState.updateMany({
      where: {
        key: SITE_DESIGN_STATE_KEY,
        draftRevision: input.expectedDraftRevision,
        publishedRevision: input.expectedPublishedRevision,
      },
      data: {
        publishedJson: asJson(draftParsed.design),
        publishedRevision: nextPublishedRevision,
        publishedAt: now,
        publishedById: input.actor.id,
        publishedByEmail: input.actor.email,
      },
    });

    if (updatedCount.count !== 1) {
      const raced = await tx.siteDesignState.findUnique({
        where: { key: SITE_DESIGN_STATE_KEY },
      });
      return {
        ok: false as const,
        code: "CONFLICT" as const,
        message:
          "Design revisions changed elsewhere. Reload before publishing.",
        expectedDraftRevision: input.expectedDraftRevision,
        expectedPublishedRevision: input.expectedPublishedRevision,
        actualDraftRevision: raced?.draftRevision,
        actualPublishedRevision: raced?.publishedRevision,
      };
    }

    const version = await tx.siteDesignVersion.create({
      data: {
        revision: nextPublishedRevision,
        snapshotJson: asJson(draftParsed.design),
        publishedAt: now,
        publishedById: input.actor.id,
        publishedByEmail: input.actor.email,
        note: input.note?.trim() ? input.note.trim().slice(0, 280) : null,
        sourceRevision:
          typeof input.sourceRevision === "number"
            ? input.sourceRevision
            : null,
      },
    });

    return {
      ok: true as const,
      data: {
        published: draftParsed.design,
        publishedRevision: nextPublishedRevision,
        draftRevision: current.draftRevision,
        versionId: version.id,
      },
      previousPublished: current.publishedJson,
      previousPublishedRevision: current.publishedRevision,
    };
  });
}

export async function publishSiteDesign(input: {
  actor: DesignActor;
  expectedDraftRevision: number;
  expectedPublishedRevision: number;
  note?: string | null;
  sourceRevision?: number | null;
}): Promise<DesignOperationResult<PublishDesignResult>> {
  await ensureSiteDesignState();

  let txResult: PublishTxSuccess | PublishTxFailure;
  try {
    txResult = await publishSiteDesignTransaction(input);
  } catch (error) {
    // Unique revision races / hard DB failures must not look like success.
    console.error("[site-design-publish-tx]", error);
    return {
      ok: false,
      code: "ERROR",
      message:
        "Publish transaction failed. No partial publication was committed.",
    };
  }

  if (!txResult.ok) {
    return txResult;
  }

  await writeAuditLog({
    actor: input.actor,
    action: "PUBLISH_SITE_DESIGN",
    entity: "SiteDesignState",
    entityId: SITE_DESIGN_STATE_KEY,
    previousState: {
      publishedRevision: txResult.previousPublishedRevision,
      publishedJson: txResult.previousPublished,
    },
    newState: {
      publishedRevision: txResult.data.publishedRevision,
      publishedJson: txResult.data.published,
      versionId: txResult.data.versionId,
    },
  });

  let revalidation: PublishDesignResult["revalidation"] = "ok";
  let revalidationError: string | undefined;
  try {
    revalidatePublicSurfaces({
      includeHome: true,
      includeArticles: true,
      includeBookshelf: true,
    });
  } catch (error) {
    revalidation = "failed";
    revalidationError =
      error instanceof Error ? error.message : "Unknown revalidation error";
    console.error("[site-design-publish-revalidate]", error);
  }

  return {
    ok: true,
    data: {
      ...txResult.data,
      revalidation,
      revalidationError,
    },
    message:
      revalidation === "ok"
        ? "Design published."
        : "Design published, but public cache revalidation failed. Retry cache flush if needed.",
  };
}

export async function listSiteDesignVersions(options?: {
  limit?: number;
}): Promise<SiteDesignVersionSummary[]> {
  const limit = Math.min(
    Math.max(options?.limit ?? SITE_DESIGN_HISTORY_LIMIT, 1),
    100,
  );

  const rows = await prisma.siteDesignVersion.findMany({
    orderBy: { revision: "desc" },
    take: limit,
    select: {
      id: true,
      revision: true,
      publishedAt: true,
      publishedByEmail: true,
      note: true,
      sourceRevision: true,
    },
  });

  return rows.map((row) => ({
    id: row.id,
    revision: row.revision,
    publishedAt: row.publishedAt.toISOString(),
    publishedByEmail: row.publishedByEmail,
    note: row.note,
    sourceRevision: row.sourceRevision,
  }));
}

/**
 * Restore a historical published snapshot into the private draft only.
 * Live published design is unchanged until an explicit publish.
 */
export async function restoreSiteDesignVersionToDraft(input: {
  actor: DesignActor;
  versionId: string;
  expectedDraftRevision: number;
}): Promise<
  DesignOperationResult<{
    draft: SiteDesign;
    draftRevision: number;
    publishedRevision: number;
    sourceRevision: number;
  }>
> {
  await ensureSiteDesignState();

  const txResult = await prisma.$transaction(async (tx) => {
    const version = await tx.siteDesignVersion.findUnique({
      where: { id: input.versionId },
    });
    if (!version) {
      return {
        ok: false as const,
        code: "NOT_FOUND" as const,
        message: "Design version was not found.",
      };
    }

    const snapshotParsed = parseSiteDesign(version.snapshotJson);
    if (!snapshotParsed.ok) {
      return {
        ok: false as const,
        code: "INVALID_DESIGN" as const,
        message:
          "Historical snapshot failed validation and was not copied into draft.",
        issues: snapshotParsed.issues,
      };
    }

    const current = await tx.siteDesignState.findUnique({
      where: { key: SITE_DESIGN_STATE_KEY },
    });
    if (!current) {
      return {
        ok: false as const,
        code: "NOT_FOUND" as const,
        message: "Site design state was not found.",
      };
    }

    if (current.draftRevision !== input.expectedDraftRevision) {
      return {
        ok: false as const,
        code: "CONFLICT" as const,
        message:
          "Draft was updated elsewhere. Reload before restoring history.",
        expectedDraftRevision: input.expectedDraftRevision,
        actualDraftRevision: current.draftRevision,
        actualPublishedRevision: current.publishedRevision,
      };
    }

    const nextRevision = current.draftRevision + 1;
    const updatedCount = await tx.siteDesignState.updateMany({
      where: {
        key: SITE_DESIGN_STATE_KEY,
        draftRevision: input.expectedDraftRevision,
      },
      data: {
        draftJson: asJson(snapshotParsed.design),
        draftRevision: nextRevision,
        draftUpdatedAt: new Date(),
        draftUpdatedById: input.actor.id,
        draftUpdatedByEmail: input.actor.email,
      },
    });

    if (updatedCount.count !== 1) {
      const raced = await tx.siteDesignState.findUnique({
        where: { key: SITE_DESIGN_STATE_KEY },
      });
      return {
        ok: false as const,
        code: "CONFLICT" as const,
        message:
          "Draft was updated elsewhere. Reload before restoring history.",
        expectedDraftRevision: input.expectedDraftRevision,
        actualDraftRevision: raced?.draftRevision,
        actualPublishedRevision: raced?.publishedRevision,
      };
    }

    return {
      ok: true as const,
      data: {
        draft: snapshotParsed.design,
        draftRevision: nextRevision,
        publishedRevision: current.publishedRevision,
        sourceRevision: version.revision,
      },
      previousDraft: current.draftJson,
      previousRevision: current.draftRevision,
    };
  });

  if (!txResult.ok) {
    return txResult;
  }

  await writeAuditLog({
    actor: input.actor,
    action: "RESTORE_SITE_DESIGN_DRAFT",
    entity: "SiteDesignState",
    entityId: SITE_DESIGN_STATE_KEY,
    previousState: {
      draftRevision: txResult.previousRevision,
      draftJson: txResult.previousDraft,
    },
    newState: {
      draftRevision: txResult.data.draftRevision,
      draftJson: txResult.data.draft,
      sourceRevision: txResult.data.sourceRevision,
    },
  });

  return {
    ok: true,
    data: txResult.data,
    message:
      "Historical design restored into draft. Publish explicitly to go live.",
  };
}
