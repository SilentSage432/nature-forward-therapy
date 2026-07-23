import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { ForcePasswordModal } from "@/components/admin/ForcePasswordModal";
import { AuthSessionProvider } from "@/components/providers/AuthSessionProvider";
import { auth, signOut } from "@/lib/auth";
import { isDeveloper } from "@/lib/rbac";

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
  const forcePassword = Boolean(session.user.mustChangePassword);

  return (
    <AuthSessionProvider>
      <div className="min-h-screen bg-forest text-body-text">
        {forcePassword ? <ForcePasswordModal open /> : null}
        <header className="border-b border-sage-dark/40 bg-forest-soft/80">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
            <div>
              <p className="font-heading text-lg font-semibold text-gold">
                {developer
                  ? "Nature-Forward Control Plane"
                  : "Nature-Forward Practice Portal"}
              </p>
              <p className="text-xs text-sage-light">
                {session.user.email} · {session.user.role}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={developer ? "/" : "https://flockoffox.org"}
                {...(developer
                  ? {}
                  : { target: "_blank", rel: "noopener noreferrer" })}
                className="rounded-lg border border-sage-dark/40 px-3 py-2 text-sm text-sage-light hover:border-gold hover:text-gold"
              >
                {developer ? "View site" : "Live site ↗"}
              </Link>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/login" });
                }}
              >
                <button
                  type="submit"
                  className="rounded-lg border border-sage-dark/40 px-3 py-2 text-sm text-sage-light hover:border-gold hover:text-gold"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </header>

        <div
          className={`mx-auto grid max-w-6xl gap-8 px-6 py-8 md:grid-cols-[240px_1fr] ${
            forcePassword ? "pointer-events-none select-none opacity-40" : ""
          }`}
          aria-hidden={forcePassword}
        >
          <AdminSidebar isDeveloper={developer} />
          <main className="min-w-0">{children}</main>
        </div>
      </div>
    </AuthSessionProvider>
  );
}
