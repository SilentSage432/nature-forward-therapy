import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isDeveloper } from "@/lib/rbac";
import { BackupExportPanel } from "@/components/admin/BackupExportPanel";

export default async function AdminBackupPage() {
  const session = await auth();
  if (!isDeveloper(session?.user?.role)) {
    redirect("/admin");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-white">
          Site Backups
        </h1>
        <p className="mt-2 text-sage-light">
          Export a portable JSON archive of Nature-Forward CMS data for
          safekeeping or migration.
        </p>
      </div>
      <div className="rounded-2xl border border-sage-dark/30 bg-forest-soft/80 p-6">
        <BackupExportPanel />
      </div>
    </div>
  );
}
