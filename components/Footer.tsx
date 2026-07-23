import Image from "next/image";
import Link from "next/link";
import type { SiteContent } from "@/lib/types";

type FooterProps = {
  profile: SiteContent["profile"];
  isAuthenticated?: boolean;
};

export function Footer({ profile, isAuthenticated = false }: FooterProps) {
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
        <span className="font-heading text-sm font-semibold text-gold/90">
          Flock of Fox, LLC
        </span>
      </div>
      <p className="text-sm text-sage-light/80">
        {profile.name}, {profile.credentials} | {profile.location}
      </p>
      <p className="mt-2 text-xs text-sage-dark/70">{profile.footerCredit}</p>
      <p className="mt-4">
        <Link
          href={isAuthenticated ? "/admin" : "/login"}
          className="text-xs text-sage-dark/60 transition-colors hover:text-gold/80"
        >
          {isAuthenticated ? "Dashboard" : "Portal Login"}
        </Link>
      </p>
    </footer>
  );
}
