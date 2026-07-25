import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isDeveloper } from "@/lib/rbac";
import { EmergencyControlsPanel } from "@/components/admin/EmergencyControlsPanel";
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
          System Settings
        </h1>
        <p className="mt-2 text-sage-light">
          Site metadata, emergency maintenance controls, and session security.
        </p>
      </div>

      <div className="rounded-2xl border border-sage-dark/30 bg-forest-soft/80 p-6">
        <h2 className="mb-4 font-heading text-xl font-semibold text-gold">
          Emergency Controls
        </h2>
        <EmergencyControlsPanel />
      </div>

      <div className="rounded-2xl border border-sage-dark/30 bg-forest-soft/80 p-6">
        <h2 className="mb-4 font-heading text-xl font-semibold text-gold">
          Site metadata
        </h2>
        <SettingsEditor />
      </div>
    </div>
  );
}
