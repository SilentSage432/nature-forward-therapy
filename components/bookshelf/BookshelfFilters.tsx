"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BOOKSHELF_CATEGORIES } from "@/lib/bookshelf";

const FILTERS = ["All", ...BOOKSHELF_CATEGORIES] as const;

type BookshelfFiltersProps = {
  active: string;
};

export function BookshelfFilters({ active }: BookshelfFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function select(category: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (category === "All") {
      params.delete("category");
    } else {
      params.set("category", category);
    }
    const query = params.toString();
    router.push(query ? `/bookshelf?${query}` : "/bookshelf");
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {FILTERS.map((category) => {
        const isActive = active === category;
        return (
          <button
            key={category}
            type="button"
            onClick={() => select(category)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
              isActive
                ? "border-gold/60 bg-gold/15 text-gold"
                : "border-stone-700 bg-stone-900/30 text-sage-light hover:border-amber-500/40 hover:text-gold"
            }`}
          >
            {category}
          </button>
        );
      })}
      <noscript>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((category) => (
            <Link
              key={`ns-${category}`}
              href={
                category === "All"
                  ? "/bookshelf"
                  : `/bookshelf?category=${encodeURIComponent(category)}`
              }
              className="rounded-full border border-stone-700 px-3 py-1 text-xs text-sage-light"
            >
              {category}
            </Link>
          ))}
        </div>
      </noscript>
    </div>
  );
}
