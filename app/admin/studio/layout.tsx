import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isEditor } from "@/lib/rbac";
import { studioDeliveryFaceIds } from "@/lib/site-design/font-delivery";
import { fontVariableClassName } from "@/lib/site-design/site-font-loaders";

/**
 * Studio layout (NFT-STUDIO-007B-PERF02).
 *
 * Root layout delivers only chrome faces (Inter / Montserrat / Cormorant).
 * This layout attaches the full curated library for Design samples and the
 * authenticated preview-frame iframe document so draft switching stays local.
 */
export default async function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!isEditor(session?.user?.role)) {
    redirect("/login");
  }

  const pathname = (await headers()).get("x-pathname") ?? "";
  const isPreviewFrame = pathname.startsWith("/admin/studio/preview-frame");
  const studioFontClasses = fontVariableClassName(studioDeliveryFaceIds());

  if (isPreviewFrame) {
    return (
      <div className={studioFontClasses} data-studio-font-delivery="preview">
        {children}
      </div>
    );
  }

  return (
    <div
      className={`space-y-6 ${studioFontClasses}`}
      data-studio-font-delivery="shell"
    >
      {children}
    </div>
  );
}
