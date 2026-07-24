import type { PublicBookshelfItem } from "@/lib/bookshelf";

type BookshelfCardProps = {
  item: PublicBookshelfItem;
};

export function BookshelfCard({ item }: BookshelfCardProps) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-amber-900/30 bg-gradient-to-b from-stone-900/70 via-forest-soft/80 to-stone-950/90 shadow-[inset_0_1px_0_rgba(212,175,55,0.08)] transition hover:border-amber-500/40">
      <div className="relative aspect-[3/4] overflow-hidden bg-forest">
        {item.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.coverImage}
            alt=""
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-amber-900/30 via-forest-soft to-stone-950 px-4 text-center">
            <p className="font-serif text-lg text-parchment/80 italic">
              {item.title}
            </p>
          </div>
        )}
        <span className="absolute top-3 left-3 rounded-full border border-gold/40 bg-forest/85 px-3 py-1 text-xs font-semibold tracking-wide text-gold backdrop-blur-sm">
          {item.type}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <span className="text-xs tracking-wide text-sage-dark uppercase">
          {item.category}
        </span>
        <h2 className="font-heading text-lg leading-snug font-semibold text-parchment">
          {item.title}
        </h2>
        <p className="text-sm text-sage-light">{item.author}</p>

        <div className="mt-1 rounded-xl border border-amber-500/25 bg-gradient-to-br from-amber-100/95 via-parchment to-amber-50/90 px-3.5 py-3 text-forest shadow-inner">
          <p className="mb-1 text-[10px] font-semibold tracking-[0.14em] text-amber-900/70 uppercase">
            Nicole&apos;s Note
          </p>
          <p className="font-serif text-sm leading-relaxed text-forest/90 italic">
            “{item.personalNote}”
          </p>
        </div>

        {item.externalUrl ? (
          <a
            href={item.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-auto inline-flex items-center justify-center gap-1 rounded-lg border border-gold/40 bg-gold/10 px-4 py-2.5 text-sm font-medium text-gold transition hover:border-gold hover:bg-gold/20"
          >
            Explore Resource ↗
          </a>
        ) : (
          <span className="mt-auto inline-flex items-center justify-center rounded-lg border border-stone-700 px-4 py-2.5 text-sm text-sage-dark">
            Coming soon
          </span>
        )}
      </div>
    </article>
  );
}
