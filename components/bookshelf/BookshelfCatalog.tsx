"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { BookshelfCard } from "@/components/bookshelf/BookshelfCard";
import { BookshelfFilters } from "@/components/bookshelf/BookshelfFilters";
import {
  BOOKSHELF_CATEGORIES,
  type PublicBookshelfItem,
} from "@/lib/bookshelf";

function resolveCategory(raw: string | null): string {
  const requested = raw?.trim() || "All";
  if (
    requested === "All" ||
    (BOOKSHELF_CATEGORIES as readonly string[]).includes(requested)
  ) {
    return requested;
  }
  return "All";
}

function BookshelfCatalogInner({
  items,
}: {
  items: PublicBookshelfItem[];
}) {
  const searchParams = useSearchParams();
  const category = resolveCategory(searchParams.get("category"));

  const filtered = useMemo(() => {
    if (category === "All") return items;
    return items.filter((item) => item.category === category);
  }, [items, category]);

  return (
    <>
      <div className="mx-auto mb-10 max-w-4xl">
        <BookshelfFilters active={category} />
      </div>

      {filtered.length === 0 ? (
        <p className="mx-auto max-w-xl text-center text-sage-light">
          No resources in this topic yet. Browse all recommendations, or check
          back soon.
        </p>
      ) : (
        <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <BookshelfCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </>
  );
}

/** Client catalog so the server page can stay ISR-cacheable without searchParams. */
export function BookshelfCatalog({ items }: { items: PublicBookshelfItem[] }) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto mb-10 h-10 max-w-4xl animate-pulse rounded-full bg-stone-900/40" />
      }
    >
      <BookshelfCatalogInner items={items} />
    </Suspense>
  );
}
