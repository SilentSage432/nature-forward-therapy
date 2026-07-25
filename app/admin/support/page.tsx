import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isDeveloper } from "@/lib/rbac";
import { SupportDesk } from "@/components/admin/SupportDesk";

export default async function AdminSupportPage() {
  const session = await auth();
  if (!isDeveloper(session?.user?.role)) {
    redirect("/admin");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-white">
          💬 Client Support Desk
        </h1>
        <p className="mt-2 text-sage-light">
          Live thread with Nicole from the practice portal. Reply here and mark
          topics resolved when done.
        </p>
      </div>
      <div className="rounded-2xl border border-sage-dark/30 bg-forest-soft/80 p-6">
        <SupportDesk />
      </div>
    </div>
  );
}
