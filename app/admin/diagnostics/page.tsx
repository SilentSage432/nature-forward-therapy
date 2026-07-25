import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isDeveloper } from "@/lib/rbac";
import { DiagnosticsPanel } from "@/components/admin/DiagnosticsPanel";

export default async function AdminDiagnosticsPage() {
  const session = await auth();
  if (!isDeveloper(session?.user?.role)) {
    redirect("/admin");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-white">
          External Link Diagnostics
        </h1>
        <p className="mt-2 text-sage-light">
          Connectivity checks for booking and inbox destinations used on the
          public site.
        </p>
      </div>
      <div className="rounded-2xl border border-sage-dark/30 bg-forest-soft/80 p-6">
        <DiagnosticsPanel />
      </div>
    </div>
  );
}
