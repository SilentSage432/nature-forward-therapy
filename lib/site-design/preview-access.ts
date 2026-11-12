import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isEditor } from "@/lib/rbac";

/**
 * Narrow server-side gate for the private Studio preview iframe route.
 * Complements proxy + admin/studio layout checks — never trust client role.
 */
export async function requireStudioPreviewAccess(): Promise<void> {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=%2Fadmin%2Fstudio%2Fpreview-frame");
  }
  if (!isEditor(session.user.role)) {
    redirect("/admin");
  }
}
