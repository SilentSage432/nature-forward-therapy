import Image from "next/image";
import Link from "next/link";
import {
  estimateReadMinutes,
  formatPublishedDate,
  type PublicArticle,
} from "@/lib/articles";

type ArticleCardProps = {
  article: PublicArticle;
};

export function ArticleCard({ article }: ArticleCardProps) {
  const readMinutes = estimateReadMinutes(article.content);
  const dateLabel = formatPublishedDate(
    article.publishedAt ?? article.createdAt,
  );

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-stone-800 bg-stone-950/85 transition hover:border-amber-500/40">
      <div className="relative aspect-[16/10] overflow-hidden bg-forest-soft">
        {article.coverImage ? (
          article.coverImage.startsWith("data:") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={article.coverImage}
              alt=""
              className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <Image
              src={article.coverImage}
              alt=""
              fill
              quality={80}
              className="object-cover transition duration-500 group-hover:scale-[1.03]"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          )
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-forest-soft via-forest to-stone-900" />
        )}
        <span className="absolute top-3 left-3 rounded-full border border-gold/40 bg-stone-950/90 px-3 py-1 text-xs font-semibold tracking-wide text-gold">
          {article.category}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <p className="text-xs tracking-wide text-sage-dark uppercase">
          {dateLabel ? `${dateLabel} · ` : ""}
          {readMinutes} min read
        </p>
        <h2 className="font-heading text-xl leading-snug font-semibold text-parchment transition group-hover:text-gold">
          <Link href={`/articles/${article.slug}`}>{article.title}</Link>
        </h2>
        <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-sage-light">
          {article.excerpt}
        </p>
        <Link
          href={`/articles/${article.slug}`}
          className="mt-1 inline-flex items-center text-sm font-medium text-gold transition hover:text-amber-200"
        >
          Read Essay →
        </Link>
      </div>
    </article>
  );
}
