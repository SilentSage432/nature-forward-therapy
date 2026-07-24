import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleBody } from "@/components/articles/ArticleBody";
import { ShareButtons } from "@/components/articles/ShareButtons";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import {
  estimateReadMinutes,
  formatPublishedDate,
  getActiveAnnouncement,
  getPublishedArticleBySlug,
} from "@/lib/articles";
import { getSiteContent } from "@/lib/content";

const SITE_URL = process.env.NEXTAUTH_URL ?? "https://flockoffox.org";

export const dynamic = "force-dynamic";

type ArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);
  if (!article) {
    return { title: "Essay not found | Flock of Fox, LLC" };
  }
  return {
    title: `${article.title} | Flock of Fox, LLC`,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: "article",
      images: article.coverImage ? [{ url: article.coverImage }] : undefined,
    },
  };
}

export default async function ArticleReadingPage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const [article, content, banner] = await Promise.all([
    getPublishedArticleBySlug(slug),
    getSiteContent(),
    getActiveAnnouncement(),
  ]);

  if (!article) {
    notFound();
  }

  const readMinutes = estimateReadMinutes(article.content);
  const dateLabel = formatPublishedDate(
    article.publishedAt ?? article.createdAt,
  );
  const shareUrl = `${SITE_URL}/articles/${article.slug}`;

  return (
    <>
      <Navbar banner={banner} />
      <main className="px-5 pt-28 pb-20 sm:px-6">
        <article className="mx-auto max-w-3xl">
          <Link
            href="/articles"
            className="mb-8 inline-flex text-sm font-medium text-sage-light transition hover:text-gold"
          >
            ← Back to Reflections
          </Link>

          <div className="mb-6 flex flex-wrap items-center gap-3 text-xs tracking-wide text-sage-dark uppercase">
            <span className="rounded-full border border-gold/40 bg-gold/10 px-3 py-1 font-semibold text-gold normal-case tracking-normal">
              {article.category}
            </span>
            {dateLabel ? <span>{dateLabel}</span> : null}
            <span>{readMinutes} min read</span>
          </div>

          <h1 className="font-serif text-4xl leading-tight text-parchment italic sm:text-5xl">
            {article.title}
          </h1>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-b border-stone-800 pb-6">
            <p className="text-sm text-sage-light">
              By{" "}
              <span className="font-semibold text-parchment">
                {content.profile.name}, {content.profile.credentials}
              </span>
            </p>
            <ShareButtons title={article.title} url={shareUrl} />
          </div>

          {article.coverImage ? (
            <div className="relative my-8 aspect-[16/9] overflow-hidden rounded-2xl border border-stone-800">
              {article.coverImage.startsWith("data:") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={article.coverImage}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <Image
                  src={article.coverImage}
                  alt=""
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 768px"
                />
              )}
            </div>
          ) : null}

          <div className="mt-8">
            <ArticleBody content={article.content} />
          </div>

          <aside className="mt-14 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-900/20 via-stone-900/50 to-forest-soft/80 p-6 sm:p-8">
            <h2 className="font-heading text-xl font-semibold text-gold">
              Feel aligned with this approach?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-sage-light sm:text-base">
              If these reflections resonate, you are welcome to book a
              consultation and explore whether we might work well together.
            </p>
            <a
              href={content.profile.headwayUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold mt-6 inline-flex items-center justify-center rounded-lg px-5 py-3 font-heading text-sm font-semibold"
            >
              Book a Consultation on Headway
            </a>
          </aside>
        </article>
      </main>
      <Footer profile={content.profile} />
    </>
  );
}
