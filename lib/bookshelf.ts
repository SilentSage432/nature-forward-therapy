import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { BookshelfItem } from "@prisma/client";
import {
  CACHE_TAGS,
  PUBLIC_REVALIDATE_SECONDS,
} from "@/lib/public-cache-shared";

export const BOOKSHELF_TYPES = [
  "Book",
  "Podcast",
  "Worksheet",
  "Audio/App",
] as const;

export const BOOKSHELF_CATEGORIES = [
  "Trauma & Healing",
  "Relationships",
  "Mindfulness",
] as const;

export type BookshelfType = (typeof BOOKSHELF_TYPES)[number];
export type BookshelfCategory = (typeof BOOKSHELF_CATEGORIES)[number];

export type PublicBookshelfItem = Pick<
  BookshelfItem,
  | "id"
  | "title"
  | "author"
  | "type"
  | "category"
  | "coverImage"
  | "personalNote"
  | "externalUrl"
>;

async function loadPublishedBookshelfItems(): Promise<PublicBookshelfItem[]> {
  try {
    return await prisma.bookshelfItem.findMany({
      where: { published: true },
      orderBy: [{ createdAt: "asc" }],
      select: {
        id: true,
        title: true,
        author: true,
        type: true,
        category: true,
        coverImage: true,
        personalNote: true,
        externalUrl: true,
      },
    });
  } catch {
    return [];
  }
}

const getCachedPublishedBookshelfItems = unstable_cache(
  loadPublishedBookshelfItems,
  ["published-bookshelf"],
  {
    revalidate: PUBLIC_REVALIDATE_SECONDS,
    tags: [CACHE_TAGS.bookshelf],
  },
);

/** All published shelf items (filter client-side so the page can stay ISR). */
export const getPublishedBookshelfItems = cache(
  async (): Promise<PublicBookshelfItem[]> => {
    return getCachedPublishedBookshelfItems();
  },
);

export async function getAllBookshelfItemsForAdmin(): Promise<BookshelfItem[]> {
  return prisma.bookshelfItem.findMany({
    orderBy: [{ updatedAt: "desc" }],
  });
}

export async function getBookshelfItemById(
  id: string,
): Promise<BookshelfItem | null> {
  return prisma.bookshelfItem.findUnique({ where: { id } });
}
