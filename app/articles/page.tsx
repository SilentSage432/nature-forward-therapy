import { ArticlesCatalog } from "@/components/articles/ArticlesCatalog";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { PublicFontScope } from "@/components/site/PublicFontScope";
import { SiteTheme } from "@/components/site/SiteTheme";
import {
  getActiveAnnouncement,
  getPublishedArticles,
} from "@/lib/articles";
import { getSiteContent } from "@/lib/content";
import { PUBLIC_MAIN_CONTENT_ID } from "@/lib/site-design/public-keyboard";

export const revalidate = 60;

export async function generateMetadata() {
  return {
    title: "Reflections & Essays | Flock of Fox, LLC",
    description:
      "Reflections, essays, and practice resources from Nicole Garcia, LCSW-C.",
  };
}

export default async function ArticlesPage() {
  const [content, articles, banner] = await Promise.all([
    getSiteContent(),
    getPublishedArticles(),
    getActiveAnnouncement(),
  ]);

  return (
    <PublicFontScope>
    <SiteTheme>
      <Navbar banner={banner} />
      <main
        id={PUBLIC_MAIN_CONTENT_ID}
        tabIndex={-1}
        className="px-5 pt-28 pb-16 sm:px-6"
      >
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

        <ArticlesCatalog articles={articles} />
      </main>
      <Footer profile={content.profile} />
    </SiteTheme>
    </PublicFontScope>
  );
}
