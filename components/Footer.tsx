import Image from "next/image";
import Link from "next/link";
import type { SiteContent } from "@/lib/types";

type FooterProps = {
  profile: SiteContent["profile"];
};

export function Footer({ profile }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-sage-dark/40 bg-forest px-6 py-8 text-center">
      <div className="mb-3 flex items-center justify-center gap-2">
        <Image
          src="/images/fof-logo-mark.png"
          alt="Flock of Fox, LLC"
          width={64}
          height={64}
          quality={80}
          sizes="32px"
          className="h-8 w-8 rounded-full border border-gold/30 object-cover"
        />
        <span className="font-heading text-sm font-semibold text-site-accent-soft/70">
          Flock of Fox, LLC
        </span>
      </div>
      <p className="text-sm text-site-foreground-muted">
        {profile.name}, {profile.credentials} | {profile.location}
      </p>
      {profile.fax?.trim() ? (
        <p className="mt-2 text-sm text-site-foreground-muted">
          Fax: {profile.fax.trim()}
        </p>
      ) : null}
      <p className="mt-3 text-xs text-site-foreground-muted">
        © {year} Flock of Fox, LLC. All rights reserved.
      </p>
      <p className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs">
        <Link
          href="/articles"
          className="text-site-accent-soft/70 transition-colors hover:text-site-interactive-hover"
        >
          Essays
        </Link>
        <span className="text-site-foreground-faint" aria-hidden="true">
          ·
        </span>
        <Link
          href="/bookshelf"
          className="text-site-accent-soft/70 transition-colors hover:text-site-interactive-hover"
        >
          Bookshelf
        </Link>
        <span className="text-site-foreground-faint" aria-hidden="true">
          ·
        </span>
        <Link
          href="/login"
          className="text-site-accent-soft/70 transition-colors hover:text-site-interactive-hover"
        >
          Portal Login
        </Link>
      </p>
    </footer>
  );
}
