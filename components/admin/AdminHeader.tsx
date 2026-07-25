"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";

type AdminHeaderProps = {
  developer: boolean;
  email: string;
  mobileNavOpen: boolean;
  onToggleMobileNav: () => void;
  onSignOut: () => void;
};

export function AdminHeader({
  developer,
  email,
  mobileNavOpen,
  onToggleMobileNav,
  onSignOut,
}: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-sage-dark/40 bg-forest-soft/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onToggleMobileNav}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-sage-dark/40 text-sage-light transition hover:border-gold hover:text-gold lg:hidden"
            aria-label={mobileNavOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileNavOpen}
            aria-controls="admin-mobile-nav"
          >
            {mobileNavOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
          <div className="min-w-0">
            <p className="truncate font-heading text-base font-semibold text-gold sm:text-lg">
              {developer
                ? "Nature-Forward Control Plane"
                : "Nature-Forward Practice Portal"}
            </p>
            <p className="mt-0.5 truncate text-xs text-stone-400">
              Signed in as{" "}
              <span className="text-amber-200/80">{email}</span>
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            href={developer ? "/" : "https://flockoffox.org"}
            {...(developer
              ? {}
              : { target: "_blank", rel: "noopener noreferrer" })}
            className="inline-flex min-h-[44px] items-center rounded-lg border border-sage-dark/40 px-3 py-2 text-sm text-sage-light hover:border-gold hover:text-gold"
          >
            <span className="sm:hidden">{developer ? "Site" : "Live ↗"}</span>
            <span className="hidden sm:inline">
              {developer ? "View site" : "Live site ↗"}
            </span>
          </Link>
          <button
            type="button"
            onClick={onSignOut}
            className="inline-flex min-h-[44px] items-center rounded-lg border border-gold/30 bg-gold/10 px-3 py-2 text-sm font-medium text-amber-200/90 transition hover:border-gold hover:bg-gold/20 hover:text-gold"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}
