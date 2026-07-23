import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isDeveloper } from "@/lib/rbac";
import { SettingsEditor } from "@/components/admin/SettingsEditor";

export default async function AdminSettingsPage() {
  const session = await auth();
  if (!isDeveloper(session?.user?.role)) {
    redirect("/admin");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-white">
          Site Settings
        </h1>
        <p className="mt-2 text-sage-light">
          Developer-only metadata used for page title and description.
        </p>
      </div>
      <div className="rounded-2xl border border-sage-dark/30 bg-forest-soft/80 p-6">
        <SettingsEditor />
      </div>
    </div>
  );
}
