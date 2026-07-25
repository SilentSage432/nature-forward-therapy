import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isDeveloper } from "@/lib/rbac";
import { AuditActivityPanel } from "@/components/admin/AuditActivityPanel";

export default async function AdminActivityPage() {
  const session = await auth();
  if (!isDeveloper(session?.user?.role)) {
    redirect("/admin");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-white">
          Activity Log &amp; Rollback
        </h1>
        <p className="mt-2 text-sage-light">
          Audit trail of CMS changes by Nicole and developers, with snapshot
          rollback where available.
        </p>
      </div>
      <div className="rounded-2xl border border-sage-dark/30 bg-forest-soft/80 p-6">
        <AuditActivityPanel />
      </div>
    </div>
  );
}
