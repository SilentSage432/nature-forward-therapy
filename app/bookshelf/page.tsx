import { Suspense } from "react";
import { BookshelfCard } from "@/components/bookshelf/BookshelfCard";
import { BookshelfFilters } from "@/components/bookshelf/BookshelfFilters";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { getActiveAnnouncement } from "@/lib/articles";
import {
  BOOKSHELF_CATEGORIES,
  getPublishedBookshelfItems,
} from "@/lib/bookshelf";
import { getSiteContent } from "@/lib/content";

export const dynamic = "force-dynamic";

type BookshelfPageProps = {
  searchParams: Promise<{ category?: string }>;
};

export async function generateMetadata() {
  return {
    title: "Reading Shelf & Recommended Tools | Flock of Fox, LLC",
    description:
      "Books, podcasts, and practices Nicole Garcia, LCSW-C regularly recommends to clients.",
  };
}

export default async function BookshelfPage({
  searchParams,
}: BookshelfPageProps) {
  const params = await searchParams;
  const requested = params.category?.trim() ?? "All";
  const category =
    requested === "All" ||
    (BOOKSHELF_CATEGORIES as readonly string[]).includes(requested)
      ? requested
      : "All";

  const [content, items, banner] = await Promise.all([
    getSiteContent(),
    getPublishedBookshelfItems(category === "All" ? null : category),
    getActiveAnnouncement(),
  ]);

  return (
    <>
      <Navbar banner={banner} />
      <main className="px-5 pt-28 pb-16 sm:px-6">
        <header className="mx-auto max-w-3xl pb-10 text-center">
          <p className="mb-3 text-xs font-semibold tracking-[0.2em] text-gold uppercase">
            Curated Resources
          </p>
          <h1 className="font-serif text-4xl leading-tight text-parchment italic sm:text-5xl md:text-6xl">
            Nicole&apos;s Reading Shelf &amp; Recommended Tools
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-sage-light sm:text-lg">
            A warm shelf of books, podcasts, and practices I regularly recommend
            in session—companions for curiosity, healing, and everyday
            resilience.
          </p>
        </header>

        <div className="mx-auto mb-10 max-w-4xl">
          <Suspense
            fallback={
              <div className="h-10 animate-pulse rounded-full bg-stone-900/40" />
            }
          >
            <BookshelfFilters active={category} />
          </Suspense>
        </div>

        {items.length === 0 ? (
          <p className="mx-auto max-w-xl text-center text-sage-light">
            No resources in this topic yet. Browse all recommendations, or check
            back soon.
          </p>
        ) : (
          <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <BookshelfCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </main>
      <Footer profile={content.profile} />
    </>
  );
}
