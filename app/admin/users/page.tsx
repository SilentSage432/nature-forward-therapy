import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isDeveloper } from "@/lib/rbac";
import { UsersManager } from "@/components/admin/UsersManager";

export default async function AdminUsersPage() {
  const session = await auth();
  if (!isDeveloper(session?.user?.role)) {
    redirect("/admin");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-white">
          Users &amp; Security
        </h1>
        <p className="mt-2 text-sage-light">
          Manage accounts, temporary passwords, and first-login password
          requirements. Developer access only.
        </p>
      </div>
      <div className="rounded-2xl border border-sage-dark/30 bg-forest-soft/80 p-6">
        <UsersManager />
      </div>
    </div>
  );
}
