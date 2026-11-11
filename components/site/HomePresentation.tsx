import { About } from "@/components/About";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { Navbar } from "@/components/Navbar";
import { Specialties } from "@/components/Specialties";
import { SiteTheme } from "@/components/site/SiteTheme";
import type { AnnouncementBannerData } from "@/lib/articles";
import type { SiteContent } from "@/lib/types";

export type HomePresentationProps = {
  /** CMS-composed site content from the server route. */
  content: SiteContent;
  /** Active announcement strip; null when none. */
  banner?: AnnouncementBannerData | null;
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
}: HomePresentationProps) {
  return (
    <SiteTheme>
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
