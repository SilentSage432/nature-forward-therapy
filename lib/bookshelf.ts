import { prisma } from "@/lib/prisma";
import type { BookshelfItem } from "@prisma/client";

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

export async function getPublishedBookshelfItems(
  category?: string | null,
): Promise<PublicBookshelfItem[]> {
  try {
    return await prisma.bookshelfItem.findMany({
      where: {
        published: true,
        ...(category && category !== "All" ? { category } : {}),
      },
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
