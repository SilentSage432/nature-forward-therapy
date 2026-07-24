"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AuthLoadingScreen } from "@/components/admin/AuthLoadingScreen";
import { ForcePasswordModal } from "@/components/admin/ForcePasswordModal";

type AdminShellProps = {
  developer: boolean;
  email: string;
  children: React.ReactNode;
};

export function AdminShell({ developer, email, children }: AdminShellProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [signingOut, setSigningOut] = useState(false);

  const showForcePassword =
    status === "authenticated" &&
    session?.user?.role === "EDITOR" &&
    session.user.mustChangePassword === true;

  useEffect(() => {
    if (status === "unauthenticated" && !signingOut) {
      router.replace("/login");
    }
  }, [status, router, signingOut]);

  async function handleSignOut() {
    setSigningOut(true);
    await signOut({ callbackUrl: "/", redirect: true });
  }

  if (status === "loading" || signingOut) {
    return (
      <AuthLoadingScreen
        label={signingOut ? "Signing out…" : undefined}
      />
    );
  }

  if (status === "unauthenticated") {
    return <AuthLoadingScreen label="Redirecting…" />;
  }

  return (
    <div className="min-h-screen bg-forest text-body-text">
      {showForcePassword ? <ForcePasswordModal /> : null}
      <header className="border-b border-sage-dark/40 bg-forest-soft/80">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div>
            <p className="font-heading text-lg font-semibold text-gold">
              {developer
                ? "Nature-Forward Control Plane"
                : "Nature-Forward Practice Portal"}
            </p>
            <p className="mt-1 text-xs text-stone-400">
              Signed in as{" "}
              <span className="text-amber-200/80">{email}</span>
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
            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="rounded-lg border border-gold/30 bg-gold/10 px-3 py-2 text-sm font-medium text-amber-200/90 transition hover:border-gold hover:bg-gold/20 hover:text-gold"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div
        className={`mx-auto grid max-w-6xl gap-8 px-6 py-8 md:grid-cols-[240px_1fr] ${
          showForcePassword ? "pointer-events-none select-none opacity-40" : ""
        }`}
        aria-hidden={showForcePassword}
      >
        <AdminSidebar isDeveloper={developer} />
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
