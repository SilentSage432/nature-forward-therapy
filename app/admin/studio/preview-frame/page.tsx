import { StudioPreviewFrameClient } from "@/components/admin/studio/StudioPreviewFrameClient";
import { requireStudioPreviewAccess } from "@/lib/site-design/preview-access";
import { loadStudioPreviewContent } from "@/lib/site-design/studio-load";

export const dynamic = "force-dynamic";

/**
 * Authenticated iframe target for accurate desktop/mobile draft preview.
 * Receives private draft design updates via same-origin postMessage only.
 * Authorization is enforced here in addition to proxy + studio layout.
 */
export default async function StudioPreviewFramePage() {
  await requireStudioPreviewAccess();
  const { content, banner } = await loadStudioPreviewContent();

  return (
    <div className="min-h-screen bg-forest">
      <StudioPreviewFrameClient content={content} banner={banner} />
    </div>
  );
}
