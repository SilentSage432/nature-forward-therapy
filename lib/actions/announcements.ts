"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import {
  BANNER_ALIGNMENTS,
  BANNER_FONT_STYLES,
  BANNER_THEMES,
} from "@/lib/announcement-banner";
import { prisma } from "@/lib/prisma";
import { isEditor } from "@/lib/rbac";

export type ActionResult = {
  ok: boolean;
  message: string;
};

const bannerSchema = z.object({
  text: z.string().min(1).max(280),
  link: z.string().max(2000).optional().nullable(),
  linkText: z.string().max(80).optional().nullable(),
  isActive: z.boolean(),
  isDismissible: z.boolean(),
  alignment: z.enum(BANNER_ALIGNMENTS),
  theme: z.enum(BANNER_THEMES),
  fontStyle: z.enum(BANNER_FONT_STYLES),
});

export async function upsertAnnouncementBanner(
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth();
  if (!isEditor(session?.user?.role)) {
    return { ok: false, message: "Unauthorized." };
  }

  const linkRaw = String(formData.get("link") ?? "").trim();
  const linkTextRaw = String(formData.get("linkText") ?? "").trim();

  const parsed = bannerSchema.safeParse({
    text: formData.get("text"),
    link: linkRaw || null,
    linkText: linkTextRaw || null,
    isActive: formData.get("isActive") === "true",
    isDismissible: formData.get("isDismissible") === "true",
    alignment: formData.get("alignment") ?? "center",
    theme: formData.get("theme") ?? "amber",
    fontStyle: formData.get("fontStyle") ?? "sans",
  });

  if (!parsed.success) {
    return { ok: false, message: "Please check the banner fields and try again." };
  }

  if (parsed.data.isActive) {
    await prisma.announcementBanner.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });
  }

  const existing = await prisma.announcementBanner.findFirst({
    orderBy: { updatedAt: "desc" },
  });

  if (existing) {
    const updated = await prisma.announcementBanner.update({
      where: { id: existing.id },
      data: parsed.data,
    });
    await writeAuditLog({
      actor: { id: session!.user!.id, email: session!.user!.email },
      action: "UPDATE_ANNOUNCEMENT",
      entity: "AnnouncementBanner",
      entityId: updated.id,
      previousState: existing,
      newState: updated,
    });
  } else {
    const created = await prisma.announcementBanner.create({
      data: parsed.data,
    });
    await writeAuditLog({
      actor: { id: session!.user!.id, email: session!.user!.email },
      action: "CREATE_ANNOUNCEMENT",
      entity: "AnnouncementBanner",
      entityId: created.id,
      previousState: null,
      newState: created,
    });
  }

  revalidatePath("/");
  revalidatePath("/articles");
  revalidatePath("/bookshelf");
  revalidatePath("/admin/announcements");

  return { ok: true, message: "Announcement banner saved." };
}
