import Image from "next/image";
import Link from "next/link";
import type { SiteContent } from "@/lib/types";

type FooterProps = {
  profile: SiteContent["profile"];
};

export function Footer({ profile }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t px-6 py-8 text-center">
      <div className="mb-3 flex items-center justify-center gap-2">
        <Image
          src="/images/fof-logo-mark.png"
          alt=""
          width={64}
          height={64}
          quality={80}
          sizes="32px"
          className="site-border-accent h-8 w-8 rounded-full border object-cover"
          aria-hidden="true"
        />
        <span className="site-accent-soft-muted font-heading text-sm font-semibold">
          Flock of Fox, LLC
        </span>
      </div>
      <p className="site-fg-muted text-sm">
        {profile.name}, {profile.credentials} | {profile.location}
      </p>
      {profile.fax?.trim() ? (
        <p className="site-fg-muted mt-2 text-sm">Fax: {profile.fax.trim()}</p>
      ) : null}
      <p className="site-fg-muted mt-3 text-xs">
        © {year} Flock of Fox, LLC. All rights reserved.
      </p>
      <p className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs">
        <Link
          href="/articles"
          className="site-accent-soft-muted transition-colors hover:text-[var(--site-interactive-hover)]"
        >
          Essays
        </Link>
        <span className="site-fg-faint" aria-hidden="true">
          ·
        </span>
        <Link
          href="/bookshelf"
          className="site-accent-soft-muted transition-colors hover:text-[var(--site-interactive-hover)]"
        >
          Bookshelf
        </Link>
        <span className="site-fg-faint" aria-hidden="true">
          ·
        </span>
        <Link
          href="/login"
          className="site-accent-soft-muted transition-colors hover:text-[var(--site-interactive-hover)]"
        >
          Portal Login
        </Link>
      </p>
    </footer>
  );
}
