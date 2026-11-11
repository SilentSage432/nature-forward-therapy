import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { AnnouncementBanner, BlogPost } from "@prisma/client";
import {
  articleTag,
  CACHE_TAGS,
  PUBLIC_REVALIDATE_SECONDS,
} from "@/lib/public-cache-shared";

export const ARTICLE_CATEGORIES = [
  "Life Transitions",
  "Relational Health",
  "Mindfulness",
  "Guides",
] as const;

export type ArticleCategory = (typeof ARTICLE_CATEGORIES)[number];

export type PublicArticle = Pick<
  BlogPost,
  | "id"
  | "title"
  | "slug"
  | "excerpt"
  | "content"
  | "category"
  | "coverImage"
  | "publishedAt"
  | "createdAt"
>;

export type AnnouncementBannerData = Pick<
  AnnouncementBanner,
  | "id"
  | "text"
  | "link"
  | "linkText"
  | "isActive"
  | "isDismissible"
  | "alignment"
  | "theme"
  | "fontStyle"
>;

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function estimateReadMinutes(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function formatPublishedDate(date: Date | null | undefined): string {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

async function loadPublishedArticles(): Promise<PublicArticle[]> {
  try {
    return await prisma.blogPost.findMany({
      where: { published: true },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        category: true,
        coverImage: true,
        publishedAt: true,
        createdAt: true,
      },
    });
  } catch {
    return [];
  }
}

const getCachedPublishedArticles = unstable_cache(
  loadPublishedArticles,
  ["published-articles"],
  {
    revalidate: PUBLIC_REVALIDATE_SECONDS,
    tags: [CACHE_TAGS.articles],
  },
);

/** All published essays (filter client-side so the hub page can stay ISR). */
export const getPublishedArticles = cache(async (): Promise<PublicArticle[]> => {
  return getCachedPublishedArticles();
});

async function loadPublishedArticleBySlug(
  slug: string,
): Promise<PublicArticle | null> {
  try {
    return await prisma.blogPost.findFirst({
      where: { slug, published: true },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        category: true,
        coverImage: true,
        publishedAt: true,
        createdAt: true,
      },
    });
  } catch {
    return null;
  }
}

export const getPublishedArticleBySlug = cache(
  async (slug: string): Promise<PublicArticle | null> => {
    return unstable_cache(
      () => loadPublishedArticleBySlug(slug),
      ["published-article", slug],
      {
        revalidate: PUBLIC_REVALIDATE_SECONDS,
        tags: [CACHE_TAGS.articles, articleTag(slug)],
      },
    )();
  },
);

export async function getAllArticlesForAdmin(): Promise<BlogPost[]> {
  return prisma.blogPost.findMany({
    orderBy: [{ updatedAt: "desc" }],
  });
}

export async function getArticleById(id: string): Promise<BlogPost | null> {
  return prisma.blogPost.findUnique({ where: { id } });
}

async function loadActiveAnnouncement(): Promise<AnnouncementBannerData | null> {
  try {
    const banner = await prisma.announcementBanner.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        text: true,
        link: true,
        linkText: true,
        isActive: true,
        isDismissible: true,
        alignment: true,
        theme: true,
        fontStyle: true,
      },
    });
    return banner;
  } catch {
    return null;
  }
}

const getCachedActiveAnnouncement = unstable_cache(
  loadActiveAnnouncement,
  ["active-announcement"],
  {
    revalidate: PUBLIC_REVALIDATE_SECONDS,
    tags: [CACHE_TAGS.announcements],
  },
);

export const getActiveAnnouncement = cache(
  async (): Promise<AnnouncementBannerData | null> => {
    return getCachedActiveAnnouncement();
  },
);

export async function getAnnouncementForAdmin(): Promise<AnnouncementBanner | null> {
  return prisma.announcementBanner.findFirst({
    orderBy: { updatedAt: "desc" },
  });
}
