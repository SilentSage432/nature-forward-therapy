import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isEditor } from "@/lib/rbac";

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

  if (isPreviewFrame) {
    return children;
  }

  return <div className="space-y-6">{children}</div>;
}
