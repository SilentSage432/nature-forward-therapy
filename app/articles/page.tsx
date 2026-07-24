import { Suspense } from "react";
import { ArticleCard } from "@/components/articles/ArticleCard";
import { ArticleFilters } from "@/components/articles/ArticleFilters";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import {
  ARTICLE_CATEGORIES,
  getActiveAnnouncement,
  getPublishedArticles,
} from "@/lib/articles";
import { getSiteContent } from "@/lib/content";

export const dynamic = "force-dynamic";

type ArticlesPageProps = {
  searchParams: Promise<{ category?: string }>;
};

export async function generateMetadata() {
  return {
    title: "Reflections & Essays | Flock of Fox, LLC",
    description:
      "Reflections, essays, and practice resources from Nicole Garcia, LCSW-C.",
  };
}

export default async function ArticlesPage({ searchParams }: ArticlesPageProps) {
  const params = await searchParams;
  const requested = params.category?.trim() ?? "All";
  const category =
    requested === "All" ||
    (ARTICLE_CATEGORIES as readonly string[]).includes(requested)
      ? requested
      : "All";

  const [content, articles, banner] = await Promise.all([
    getSiteContent(),
    getPublishedArticles(category === "All" ? null : category),
    getActiveAnnouncement(),
  ]);

  return (
    <>
      <Navbar banner={banner} />
      <main className="px-5 pt-28 pb-16 sm:px-6">
        <header className="mx-auto max-w-3xl pb-10 text-center">
          <p className="mb-3 text-xs font-semibold tracking-[0.2em] text-gold uppercase">
            Publication Hub
          </p>
          <h1 className="font-serif text-4xl leading-tight text-parchment italic sm:text-5xl md:text-6xl">
            Reflections, Essays &amp; Practice Resources
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-sage-light sm:text-lg">
            Gentle essays on transitions, relationships, and mindfulness—written
            to offer grounding between sessions.
          </p>
        </header>

        <div className="mx-auto mb-10 max-w-4xl">
          <Suspense
            fallback={
              <div className="h-10 animate-pulse rounded-full bg-stone-900/40" />
            }
          >
            <ArticleFilters active={category} />
          </Suspense>
        </div>

        {articles.length === 0 ? (
          <p className="mx-auto max-w-xl text-center text-sage-light">
            No essays in this topic yet. Check back soon, or browse all
            reflections.
          </p>
        ) : (
          <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </main>
      <Footer profile={content.profile} />
    </>
  );
}
