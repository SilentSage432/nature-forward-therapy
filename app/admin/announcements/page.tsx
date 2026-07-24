import { AnnouncementBannerEditor } from "@/components/admin/AnnouncementBannerEditor";
import { getAnnouncementForAdmin } from "@/lib/articles";

export default async function AdminAnnouncementsPage() {
  const banner = await getAnnouncementForAdmin();
  return <AnnouncementBannerEditor banner={banner} />;
}
