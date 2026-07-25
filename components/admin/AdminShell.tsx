"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AuthLoadingScreen } from "@/components/admin/AuthLoadingScreen";
import { ForcePasswordModal } from "@/components/admin/ForcePasswordModal";
import { useEditorPreview } from "@/components/admin/EditorPreviewContext";

type AdminShellProps = {
  developer: boolean;
  email: string;
  children: React.ReactNode;
};

export function AdminShell({ developer, email, children }: AdminShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { previewEditor, setPreviewEditor } = useEditorPreview();
  const [signingOut, setSigningOut] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const showForcePassword =
    status === "authenticated" &&
    session?.user?.role === "EDITOR" &&
    session.user.mustChangePassword === true;

  useEffect(() => {
    if (status === "unauthenticated" && !signingOut) {
      router.replace("/login");
    }
  }, [status, router, signingOut]);

  useEffect(() => {
    if (!developer && previewEditor) {
      setPreviewEditor(false);
    }
  }, [developer, previewEditor, setPreviewEditor]);

  // Close mobile drawer on route changes.
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  // Lock body scroll while the mobile drawer is open.
  useEffect(() => {
    if (!mobileNavOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileNavOpen]);

  async function handleSignOut() {
    setSigningOut(true);
    setPreviewEditor(false);
    setMobileNavOpen(false);
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

  const showDeveloperNav = developer && !previewEditor;

  return (
    <div className="min-h-screen overflow-x-hidden bg-forest text-body-text">
      {showForcePassword ? <ForcePasswordModal /> : null}
      {previewEditor ? (
        <div className="border-b border-gold/35 bg-gold/10 px-4 py-2.5 sm:px-6">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <p className="text-sm font-medium text-gold">
              Preview Editor View — Tech Desk chat is available
            </p>
            <button
              type="button"
              onClick={() => setPreviewEditor(false)}
              className="inline-flex min-h-[44px] items-center rounded-lg border border-gold/40 bg-forest/40 px-3 py-1.5 text-xs font-semibold text-gold transition hover:bg-forest/70"
            >
              Exit Preview
            </button>
          </div>
        </div>
      ) : null}

      <AdminHeader
        developer={developer}
        email={email}
        mobileNavOpen={mobileNavOpen}
        onToggleMobileNav={() => setMobileNavOpen((open) => !open)}
        onSignOut={() => void handleSignOut()}
      />

      {/* Mobile slide-over navigation */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${
          mobileNavOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
        aria-hidden={!mobileNavOpen}
      >
        <button
          type="button"
          className={`absolute inset-0 bg-forest/70 transition-opacity duration-300 ${
            mobileNavOpen ? "opacity-100" : "opacity-0"
          }`}
          aria-label="Close navigation menu"
          tabIndex={mobileNavOpen ? 0 : -1}
          onClick={() => setMobileNavOpen(false)}
        />
        <div
          className={`absolute inset-y-0 left-0 flex w-[min(100%,20rem)] max-w-full transform transition-transform duration-300 ease-out ${
            mobileNavOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <AdminSidebar
            id="admin-mobile-nav"
            isDeveloper={showDeveloperNav}
            onNavigateComplete={() => setMobileNavOpen(false)}
            className="admin-scroll h-full w-full overflow-y-auto rounded-none border-y-0 border-l-0 border-r border-sage-dark/40 bg-forest-soft/98 p-4 shadow-2xl"
          />
        </div>
      </div>

      <div
        className={`mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:gap-8 sm:px-6 sm:py-8 lg:grid-cols-[240px_1fr] ${
          showForcePassword ? "pointer-events-none select-none opacity-40" : ""
        }`}
        aria-hidden={showForcePassword}
      >
        <AdminSidebar
          isDeveloper={showDeveloperNav}
          className="hidden lg:block"
        />
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
