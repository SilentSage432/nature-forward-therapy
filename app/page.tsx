import { HomePresentation } from "@/components/site/HomePresentation";
import { PublicFontScope } from "@/components/site/PublicFontScope";
import { getActiveAnnouncement } from "@/lib/articles";
import { getSiteContent } from "@/lib/content";
import { getPublishedPresentationConfig } from "@/lib/site-design/published";

export const revalidate = 60;

export default async function HomePage() {
  const [content, banner, presentation] = await Promise.all([
    getSiteContent(),
    getActiveAnnouncement(),
    getPublishedPresentationConfig(),
  ]);

  return (
    <PublicFontScope>
      <HomePresentation
        content={content}
        banner={banner}
        presentation={presentation}
      />
    </PublicFontScope>
  );
}
