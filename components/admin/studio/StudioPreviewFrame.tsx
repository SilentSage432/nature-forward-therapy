import { HomePresentation } from "@/components/site/HomePresentation";
import type { AnnouncementBannerData } from "@/lib/articles";
import type { PublishedPresentationConfig } from "@/lib/site-design/resolve-published";
import type { SiteContent } from "@/lib/types";

type StudioPreviewFrameProps = {
  content: SiteContent;
  banner: AnnouncementBannerData | null;
  presentation: PublishedPresentationConfig;
  caption: string;
};

/**
 * Read-only public presentation preview using real HomePresentation.
 *
 * Isolation:
 * - `inert` removes the subtree from mouse/touch/keyboard focus and activation
 * - `pointer-events-none` remains as a CSS defense-in-depth layer
 * - Surrounding Studio chrome stays fully interactive
 *
 * This is NOT a draft preview until draft rendering is intentionally wired.
 */
export function StudioPreviewFrame({
  content,
  banner,
  presentation,
  caption,
}: StudioPreviewFrameProps) {
  return (
    <section
      aria-label="Current site preview"
      className="overflow-hidden rounded-2xl border border-sage-dark/30 bg-forest-soft/40"
    >
      <div className="flex flex-col gap-1 border-b border-sage-dark/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-lg font-semibold text-white">
            Current site preview
          </h2>
          <p className="text-sm text-sage-light">{caption}</p>
        </div>
        <p className="text-xs font-semibold tracking-wide text-gold/90 uppercase">
          Read-only
        </p>
      </div>
      <div className="bg-black/20 p-3 sm:p-4">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-xl border border-sage-dark/40 bg-forest shadow-inner">
          <div className="max-h-[70vh] overflow-auto">
            <div
              inert
              aria-hidden="true"
              className="pointer-events-none origin-top scale-[0.92] select-none sm:scale-100"
              data-studio-preview-inert="true"
            >
              <HomePresentation
                content={content}
                banner={banner}
                presentation={presentation}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
