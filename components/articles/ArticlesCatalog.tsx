"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { ArticleFilters } from "@/components/articles/ArticleFilters";
import {
  ARTICLE_CATEGORIES,
  type PublicArticle,
} from "@/lib/articles";

function resolveCategory(raw: string | null): string {
  const requested = raw?.trim() || "All";
  if (
    requested === "All" ||
    (ARTICLE_CATEGORIES as readonly string[]).includes(requested)
  ) {
    return requested;
  }
  return "All";
}

function ArticlesCatalogInner({ articles }: { articles: PublicArticle[] }) {
  const searchParams = useSearchParams();
  const category = resolveCategory(searchParams.get("category"));

  const filtered = useMemo(() => {
    if (category === "All") return articles;
    return articles.filter((article) => article.category === category);
  }, [articles, category]);

  return (
    <>
      <div className="mx-auto mb-10 max-w-4xl">
        <ArticleFilters active={category} />
      </div>

      {filtered.length === 0 ? (
        <p className="mx-auto max-w-xl text-center text-sage-light">
          No essays in this topic yet. Check back soon, or browse all
          reflections.
        </p>
      ) : (
        <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </>
  );
}

/** Client catalog so the server page can stay ISR-cacheable without searchParams. */
export function ArticlesCatalog({ articles }: { articles: PublicArticle[] }) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto mb-10 h-10 max-w-4xl animate-pulse rounded-full bg-stone-900/40" />
      }
    >
      <ArticlesCatalogInner articles={articles} />
    </Suspense>
  );
}
