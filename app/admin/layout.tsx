import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { AuthSessionProvider } from "@/components/providers/AuthSessionProvider";
import { auth } from "@/lib/auth";
import { isDeveloper } from "@/lib/rbac";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const developer = isDeveloper(session.user.role);

  return (
    <AuthSessionProvider session={session}>
      <AdminShell developer={developer} email={session.user.email}>
        {children}
      </AdminShell>
    </AuthSessionProvider>
  );
}
