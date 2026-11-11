import { HomePresentation } from "@/components/site/HomePresentation";
import { getActiveAnnouncement } from "@/lib/articles";
import { getSiteContent } from "@/lib/content";

export const revalidate = 60;

export default async function HomePage() {
  const [content, banner] = await Promise.all([
    getSiteContent(),
    getActiveAnnouncement(),
  ]);

  return <HomePresentation content={content} banner={banner} />;
}
