import { About } from "@/components/About";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { Navbar } from "@/components/Navbar";
import { Specialties } from "@/components/Specialties";
import { SiteTheme } from "@/components/site/SiteTheme";
import type { AnnouncementBannerData } from "@/lib/articles";
import type { PublishedPresentationConfig } from "@/lib/site-design/resolve-published";
import type { SiteContent } from "@/lib/types";

export type HomePresentationProps = {
  /** CMS-composed site content from the server route. */
  content: SiteContent;
  /** Active announcement strip; null when none. */
  banner?: AnnouncementBannerData | null;
  /**
   * Safe published presentation config from the design reader.
   * When omitted, SiteTheme uses the forest-gold default (parity with NFT-STUDIO-003).
   *
   * Reserved design dimensions (order / visibility / media / focal) are not
   * applied here yet — section markup stays fixed for visual parity.
   */
  presentation?: PublishedPresentationConfig | null;
};

/**
 * Shared homepage presentation.
 *
 * Public `/` and a future authenticated Studio preview both render through
 * this module so section markup cannot drift. Data loading, auth, cache, and
 * draft/publish policy stay at the route boundary — this component only paints.
 *
 * Section order and anchor ids (`hero`, `about`, `specialties`, `contact`)
 * are fixed to preserve in-page navigation from Essays and bookmarks.
 */
export function HomePresentation({
  content,
  banner = null,
  presentation = null,
}: HomePresentationProps) {
  const themePreset = presentation?.themePresetId ?? "forest-gold";
  const typography = presentation?.typography ?? {
    fontFamilyId: "classic" as const,
    headingScaleId: "comfortable" as const,
    bodyScaleId: "comfortable" as const,
  };

  return (
    <SiteTheme
      preset={themePreset}
      fontFamilyId={typography.fontFamilyId}
      headingScaleId={typography.headingScaleId}
      bodyScaleId={typography.bodyScaleId}
    >
      <Navbar banner={banner} />
      <main>
        <Hero profile={content.profile} />
        <About profile={content.profile} />
        <Specialties
          profile={content.profile}
          specialties={content.specialties}
          focusTags={content.focusTags}
          practice={content.practice}
        />
        <Contact
          profile={content.profile}
          processSteps={content.practice.processSteps}
        />
      </main>
      <Footer profile={content.profile} />
    </SiteTheme>
  );
}
