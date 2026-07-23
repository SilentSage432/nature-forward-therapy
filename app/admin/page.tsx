import { redirect } from "next/navigation";
import { DeveloperPortalHome } from "@/components/admin/DeveloperPortalHome";
import { EditorDashboard } from "@/components/admin/EditorDashboard";
import { auth } from "@/lib/auth";
import { getSiteContent } from "@/lib/content";
import { isDeveloper } from "@/lib/rbac";
import { getSystemHealth } from "@/lib/system-health";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminHomePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const content = await getSiteContent();
  const firstName =
    session.user.name?.split(" ")[0] ||
    content.profile.name.split(" ")[0] ||
    "Nicole";

  if (isDeveloper(session.user.role)) {
    const health = await getSystemHealth();
    return (
      <DeveloperPortalHome
        health={health}
        editorFirstName={firstName}
        content={content}
      />
    );
  }

  return <EditorDashboard firstName={firstName} content={content} />;
}
