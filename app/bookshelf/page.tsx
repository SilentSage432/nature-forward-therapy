import { BookshelfCatalog } from "@/components/bookshelf/BookshelfCatalog";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { getActiveAnnouncement } from "@/lib/articles";
import { getPublishedBookshelfItems } from "@/lib/bookshelf";
import { getSiteContent } from "@/lib/content";

export const revalidate = 60;

export async function generateMetadata() {
  return {
    title: "Reading Shelf & Recommended Tools | Flock of Fox, LLC",
    description:
      "Books, podcasts, and practices Nicole Garcia, LCSW-C regularly recommends to clients.",
  };
}

export default async function BookshelfPage() {
  const [content, items, banner] = await Promise.all([
    getSiteContent(),
    getPublishedBookshelfItems(),
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

        <BookshelfCatalog items={items} />
      </main>
      <Footer profile={content.profile} />
    </>
  );
}
