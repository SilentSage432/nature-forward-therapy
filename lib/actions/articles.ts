"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { slugify } from "@/lib/articles";
import { prisma } from "@/lib/prisma";
import { isEditor } from "@/lib/rbac";

export type ActionResult = {
  ok: boolean;
  message: string;
  id?: string;
};

const articleSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(120),
  excerpt: z.string().min(1).max(1000),
  content: z.string().min(1).max(100_000),
  category: z.string().trim().min(1).max(80),
  coverImage: z.string().max(2000).optional().nullable(),
  published: z.boolean(),
});

function revalidateArticleSurfaces(slug?: string) {
  revalidatePath("/");
  revalidatePath("/articles");
  revalidatePath("/admin/articles");
  if (slug) {
    revalidatePath(`/articles/${slug}`);
  }
}

export async function createArticle(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!isEditor(session?.user?.role)) {
    return { ok: false, message: "Unauthorized." };
  }

  const rawSlug = String(formData.get("slug") ?? "").trim();
  const title = String(formData.get("title") ?? "");
  const coverRaw = String(formData.get("coverImage") ?? "").trim();

  const parsed = articleSchema.safeParse({
    title,
    slug: slugify(rawSlug || title),
    excerpt: formData.get("excerpt"),
    content: formData.get("content"),
    category: formData.get("category"),
    coverImage: coverRaw || null,
    published: formData.get("published") === "true",
  });

  if (!parsed.success) {
    return { ok: false, message: "Please check the form fields and try again." };
  }

  const existing = await prisma.blogPost.findUnique({
    where: { slug: parsed.data.slug },
  });
  if (existing) {
    return { ok: false, message: "That slug is already in use. Choose another." };
  }

  const post = await prisma.blogPost.create({
    data: {
      ...parsed.data,
      publishedAt: parsed.data.published ? new Date() : null,
    },
  });

  revalidateArticleSurfaces(post.slug);
  return { ok: true, message: "Essay saved.", id: post.id };
}

export async function updateArticle(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth();
  if (!isEditor(session?.user?.role)) {
    return { ok: false, message: "Unauthorized." };
  }

  const existing = await prisma.blogPost.findUnique({ where: { id } });
  if (!existing) {
    return { ok: false, message: "Article not found." };
  }

  const rawSlug = String(formData.get("slug") ?? "").trim();
  const title = String(formData.get("title") ?? "");
  const coverRaw = String(formData.get("coverImage") ?? "").trim();

  const parsed = articleSchema.safeParse({
    title,
    slug: slugify(rawSlug || title),
    excerpt: formData.get("excerpt"),
    content: formData.get("content"),
    category: formData.get("category"),
    coverImage: coverRaw || null,
    published: formData.get("published") === "true",
  });

  if (!parsed.success) {
    return { ok: false, message: "Please check the form fields and try again." };
  }

  const slugTaken = await prisma.blogPost.findFirst({
    where: { slug: parsed.data.slug, NOT: { id } },
  });
  if (slugTaken) {
    return { ok: false, message: "That slug is already in use. Choose another." };
  }

  let publishedAt = existing.publishedAt;
  if (parsed.data.published && !existing.published) {
    publishedAt = new Date();
  } else if (!parsed.data.published) {
    publishedAt = null;
  }

  const post = await prisma.blogPost.update({
    where: { id },
    data: {
      ...parsed.data,
      publishedAt,
    },
  });

  revalidateArticleSurfaces(post.slug);
  if (existing.slug !== post.slug) {
    revalidatePath(`/articles/${existing.slug}`);
  }

  return { ok: true, message: "Essay updated.", id: post.id };
}

export async function deleteArticle(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!isEditor(session?.user?.role)) {
    return { ok: false, message: "Unauthorized." };
  }

  const existing = await prisma.blogPost.findUnique({ where: { id } });
  if (!existing) {
    return { ok: false, message: "Article not found." };
  }

  await prisma.blogPost.delete({ where: { id } });
  revalidateArticleSurfaces(existing.slug);
  return { ok: true, message: "Essay deleted." };
}
