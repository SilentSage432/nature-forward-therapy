"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { BOOKSHELF_TYPES } from "@/lib/bookshelf";
import { prisma } from "@/lib/prisma";
import { isEditor } from "@/lib/rbac";

export type ActionResult = {
  ok: boolean;
  message: string;
  id?: string;
};

const itemSchema = z.object({
  title: z.string().min(1).max(200),
  author: z.string().min(1).max(200),
  type: z.enum(BOOKSHELF_TYPES),
  category: z.string().trim().min(1).max(80),
  coverImage: z.string().max(1_500_000).optional().nullable(),
  personalNote: z.string().min(1).max(2000),
  externalUrl: z.string().max(2000).optional().nullable(),
  published: z.boolean(),
});

function revalidateBookshelfSurfaces() {
  revalidatePath("/");
  revalidatePath("/bookshelf");
  revalidatePath("/admin/bookshelf");
}

export async function createBookshelfItem(
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth();
  if (!isEditor(session?.user?.role)) {
    return { ok: false, message: "Unauthorized." };
  }

  const coverRaw = String(formData.get("coverImage") ?? "").trim();
  const urlRaw = String(formData.get("externalUrl") ?? "").trim();

  const parsed = itemSchema.safeParse({
    title: formData.get("title"),
    author: formData.get("author"),
    type: formData.get("type"),
    category: formData.get("category"),
    coverImage: coverRaw || null,
    personalNote: formData.get("personalNote"),
    externalUrl: urlRaw || null,
    published: formData.get("published") === "true",
  });

  if (!parsed.success) {
    return { ok: false, message: "Please check the form fields and try again." };
  }

  const item = await prisma.bookshelfItem.create({ data: parsed.data });
  revalidateBookshelfSurfaces();
  return { ok: true, message: "Bookshelf item saved.", id: item.id };
}

export async function updateBookshelfItem(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth();
  if (!isEditor(session?.user?.role)) {
    return { ok: false, message: "Unauthorized." };
  }

  const existing = await prisma.bookshelfItem.findUnique({ where: { id } });
  if (!existing) {
    return { ok: false, message: "Item not found." };
  }

  const coverRaw = String(formData.get("coverImage") ?? "").trim();
  const urlRaw = String(formData.get("externalUrl") ?? "").trim();

  const parsed = itemSchema.safeParse({
    title: formData.get("title"),
    author: formData.get("author"),
    type: formData.get("type"),
    category: formData.get("category"),
    coverImage: coverRaw || null,
    personalNote: formData.get("personalNote"),
    externalUrl: urlRaw || null,
    published: formData.get("published") === "true",
  });

  if (!parsed.success) {
    return { ok: false, message: "Please check the form fields and try again." };
  }

  await prisma.bookshelfItem.update({
    where: { id },
    data: parsed.data,
  });

  revalidateBookshelfSurfaces();
  return { ok: true, message: "Bookshelf item updated.", id };
}

export async function deleteBookshelfItem(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!isEditor(session?.user?.role)) {
    return { ok: false, message: "Unauthorized." };
  }

  const existing = await prisma.bookshelfItem.findUnique({ where: { id } });
  if (!existing) {
    return { ok: false, message: "Item not found." };
  }

  await prisma.bookshelfItem.delete({ where: { id } });
  revalidateBookshelfSurfaces();
  return { ok: true, message: "Bookshelf item deleted." };
}

export async function toggleBookshelfPublished(
  id: string,
): Promise<ActionResult> {
  const session = await auth();
  if (!isEditor(session?.user?.role)) {
    return { ok: false, message: "Unauthorized." };
  }

  const existing = await prisma.bookshelfItem.findUnique({ where: { id } });
  if (!existing) {
    return { ok: false, message: "Item not found." };
  }

  await prisma.bookshelfItem.update({
    where: { id },
    data: { published: !existing.published },
  });

  revalidateBookshelfSurfaces();
  return {
    ok: true,
    message: existing.published ? "Item unpublished." : "Item published.",
    id,
  };
}
