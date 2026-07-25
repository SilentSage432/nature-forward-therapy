import { prisma } from "@/lib/prisma";

export type AuditActor = {
  id: string;
  email: string;
};

export type WriteAuditInput = {
  actor: AuditActor;
  action: string;
  entity: string;
  entityId?: string | null;
  previousState?: unknown;
  newState?: unknown;
};

export type AuditLogRecord = {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  entity: string;
  entityId: string | null;
  previousState: string | null;
  newState: string | null;
  createdAt: string;
};

function snapshot(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}

export async function writeAuditLog(input: WriteAuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.actor.id,
        userEmail: input.actor.email,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        previousState: snapshot(input.previousState),
        newState: snapshot(input.newState),
      },
    });
  } catch (error) {
    console.error("[audit-log]", error);
  }
}

export async function listAuditLogs(options?: {
  q?: string;
  entity?: string;
  limit?: number;
}): Promise<AuditLogRecord[]> {
  const limit = Math.min(Math.max(options?.limit ?? 50, 1), 200);
  const q = options?.q?.trim();
  const entity = options?.entity?.trim();

  const rows = await prisma.auditLog.findMany({
    where: {
      AND: [
        entity ? { entity } : {},
        q
          ? {
              OR: [
                { action: { contains: q, mode: "insensitive" } },
                { entity: { contains: q, mode: "insensitive" } },
                { userEmail: { contains: q, mode: "insensitive" } },
                { entityId: { contains: q, mode: "insensitive" } },
              ],
            }
          : {},
      ],
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    userEmail: row.userEmail,
    action: row.action,
    entity: row.entity,
    entityId: row.entityId,
    previousState: row.previousState,
    newState: row.newState,
    createdAt: row.createdAt.toISOString(),
  }));
}

type JsonRecord = Record<string, unknown>;

function asRecord(raw: string | null): JsonRecord | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }
    return parsed as JsonRecord;
  } catch {
    return null;
  }
}

function stripMeta(record: JsonRecord): JsonRecord {
  const next = { ...record };
  delete next.id;
  delete next.createdAt;
  delete next.updatedAt;
  return next;
}

export async function rollbackAuditLog(
  auditId: string,
  actor: AuditActor,
): Promise<{ ok: true; message: string } | { ok: false; message: string }> {
  try {
    const log = await prisma.auditLog.findUnique({ where: { id: auditId } });
    if (!log) {
      return { ok: false, message: "Audit entry not found." };
    }
    if (!log.previousState) {
      return {
        ok: false,
        message: "No previous snapshot available for this entry.",
      };
    }

    const previous = asRecord(log.previousState);
    if (!previous) {
      return { ok: false, message: "Previous snapshot is invalid JSON." };
    }

    // Support nested PracticeDetail snapshots from CHANGE_INSURANCE.
    const practiceNested =
      previous.practice &&
      typeof previous.practice === "object" &&
      !Array.isArray(previous.practice)
        ? (previous.practice as JsonRecord)
        : null;
    const snapshot = practiceNested ?? previous;

    const entityId =
      log.entityId ??
      (typeof snapshot.id === "string" ? snapshot.id : null) ??
      (typeof previous.id === "string" ? previous.id : null);

    if (!entityId && log.action !== "CREATE") {
      return { ok: false, message: "Missing entity id for rollback." };
    }

    let restored: unknown = null;

    switch (log.entity) {
      case "BlogPost": {
        if (log.action === "CREATE" && entityId) {
          await prisma.blogPost
            .delete({ where: { id: entityId } })
            .catch(() => null);
          restored = { deleted: entityId };
          break;
        }
        if (!entityId) {
          return { ok: false, message: "Missing BlogPost id." };
        }
        const data = stripMeta(snapshot);
        restored = await prisma.blogPost.update({
          where: { id: entityId },
          data: {
            title: String(data.title ?? ""),
            slug: String(data.slug ?? ""),
            excerpt: String(data.excerpt ?? ""),
            content: String(data.content ?? ""),
            category: String(data.category ?? ""),
            coverImage:
              data.coverImage === null || data.coverImage === undefined
                ? null
                : String(data.coverImage),
            published: Boolean(data.published),
            publishedAt: data.publishedAt
              ? new Date(String(data.publishedAt))
              : null,
          },
        });
        break;
      }
      case "BookshelfItem": {
        if (log.action === "CREATE" && entityId) {
          await prisma.bookshelfItem
            .delete({ where: { id: entityId } })
            .catch(() => null);
          restored = { deleted: entityId };
          break;
        }
        if (!entityId) {
          return { ok: false, message: "Missing BookshelfItem id." };
        }
        const data = stripMeta(snapshot);
        restored = await prisma.bookshelfItem.update({
          where: { id: entityId },
          data: {
            title: String(data.title ?? ""),
            author: String(data.author ?? ""),
            type: String(data.type ?? "Book"),
            category: String(data.category ?? ""),
            coverImage:
              data.coverImage === null || data.coverImage === undefined
                ? null
                : String(data.coverImage),
            personalNote: String(data.personalNote ?? ""),
            externalUrl:
              data.externalUrl === null || data.externalUrl === undefined
                ? null
                : String(data.externalUrl),
            published: Boolean(data.published ?? true),
          },
        });
        break;
      }
      case "PractitionerProfile": {
        if (!entityId) {
          return { ok: false, message: "Missing PractitionerProfile id." };
        }
        const data = stripMeta(snapshot);
        restored = await prisma.practitionerProfile.update({
          where: { id: entityId },
          data: {
            name: String(data.name ?? ""),
            credentials: String(data.credentials ?? ""),
            location: String(data.location ?? ""),
            tagline: String(data.tagline ?? ""),
            bio: String(data.bio ?? ""),
            bioHighlight: String(data.bioHighlight ?? ""),
            headshotPath: String(data.headshotPath ?? ""),
            headwayUrl: String(data.headwayUrl ?? ""),
            psychologyTodayUrl: String(data.psychologyTodayUrl ?? ""),
            heroBackgroundUrl: String(data.heroBackgroundUrl ?? ""),
            aboutImageUrl: String(data.aboutImageUrl ?? ""),
            specialtiesImageUrl: String(data.specialtiesImageUrl ?? ""),
            contactImageUrl: String(data.contactImageUrl ?? ""),
            footerCredit: String(data.footerCredit ?? ""),
          },
        });
        break;
      }
      case "AnnouncementBanner": {
        if (!entityId) {
          return { ok: false, message: "Missing AnnouncementBanner id." };
        }
        const data = stripMeta(snapshot);
        restored = await prisma.announcementBanner.update({
          where: { id: entityId },
          data: {
            text: String(data.text ?? ""),
            link:
              data.link === null || data.link === undefined
                ? null
                : String(data.link),
            linkText:
              data.linkText === null || data.linkText === undefined
                ? null
                : String(data.linkText),
            isActive: Boolean(data.isActive),
            isDismissible: Boolean(data.isDismissible),
            alignment: String(data.alignment ?? "center"),
            theme: String(data.theme ?? "amber"),
            fontStyle: String(data.fontStyle ?? "sans"),
          },
        });
        break;
      }
      case "SiteConfig": {
        if (!entityId) {
          return { ok: false, message: "Missing SiteConfig id." };
        }
        const data = stripMeta(snapshot);
        restored = await prisma.siteConfig.update({
          where: { id: entityId },
          data: {
            siteTitle: String(data.siteTitle ?? ""),
            siteDescription: String(data.siteDescription ?? ""),
          },
        });
        break;
      }
      case "PracticeDetail": {
        if (!entityId) {
          return { ok: false, message: "Missing PracticeDetail id." };
        }
        const data = stripMeta(snapshot);
        restored = await prisma.practiceDetail.update({
          where: { id: entityId },
          data: {
            expertise: (data.expertise as object) ?? [],
            paymentMethods: (data.paymentMethods as object) ?? [],
            therapyTypes: (data.therapyTypes as object) ?? [],
            processSteps: (data.processSteps as object) ?? [],
          },
        });

        // Restore insurance list when snapshot includes it.
        if (Array.isArray(previous.insurances)) {
          await prisma.insurance.deleteMany();
          const rows = previous.insurances
            .map((row, index) => {
              if (typeof row === "string") {
                return { name: row, sortOrder: index };
              }
              if (row && typeof row === "object" && "name" in row) {
                return {
                  name: String((row as { name: unknown }).name),
                  sortOrder:
                    typeof (row as { sortOrder?: unknown }).sortOrder ===
                    "number"
                      ? (row as { sortOrder: number }).sortOrder
                      : index,
                };
              }
              return null;
            })
            .filter((row): row is { name: string; sortOrder: number } =>
              Boolean(row?.name),
            );
          if (rows.length > 0) {
            await prisma.insurance.createMany({ data: rows });
          }
        }
        break;
      }
      default:
        return {
          ok: false,
          message: `Rollback is not supported for entity “${log.entity}”.`,
        };
    }

    let priorNew: unknown = null;
    if (log.newState) {
      try {
        priorNew = JSON.parse(log.newState);
      } catch {
        priorNew = null;
      }
    }

    await writeAuditLog({
      actor,
      action: "ROLLBACK",
      entity: log.entity,
      entityId,
      previousState: priorNew,
      newState: restored,
    });

    return {
      ok: true,
      message: `Reverted ${log.entity} to the prior snapshot.`,
    };
  } catch (error) {
    console.error("[audit-rollback]", error);
    return {
      ok: false,
      message:
        error instanceof Error
          ? `Rollback failed: ${error.message}`
          : "Rollback failed due to an unexpected error.",
    };
  }
}
