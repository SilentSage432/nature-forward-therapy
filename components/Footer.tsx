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
          src="/images/fof-logo.png"
          alt="Flock of Fox, LLC"
          width={32}
          height={32}
          className="h-8 w-8 rounded-full border border-gold/30 object-cover"
        />
        <span className="font-heading text-sm font-semibold text-amber-200/70">
          Flock of Fox, LLC
        </span>
      </div>
      <p className="text-sm text-stone-400">
        {profile.name}, {profile.credentials} | {profile.location}
      </p>
      <p className="mt-3 text-xs text-stone-400">
        © {year} Flock of Fox, LLC. All rights reserved.
      </p>
      <p className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs">
        <Link
          href="/articles"
          className="text-amber-200/70 transition-colors hover:text-gold"
        >
          Essays
        </Link>
        <span className="text-stone-600" aria-hidden="true">
          ·
        </span>
        <Link
          href="/login"
          className="text-amber-200/70 transition-colors hover:text-gold"
        >
          Portal Login
        </Link>
      </p>
    </footer>
  );
}
