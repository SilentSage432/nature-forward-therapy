import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { AuthSessionProvider } from "@/components/providers/AuthSessionProvider";
import { auth, signOut } from "@/lib/auth";
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
  const forcePassword = session.user.mustChangePassword === true;

  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <AuthSessionProvider session={session}>
      <AdminShell
        developer={developer}
        forcePassword={forcePassword}
        email={session.user.email}
        signOutAction={signOutAction}
      >
        {children}
      </AdminShell>
    </AuthSessionProvider>
  );
}
