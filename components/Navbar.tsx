"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const links = [
  { href: "#about", label: "About" },
  { href: "#specialties", label: "Specialties" },
  { href: "#contact", label: "Contact" },
] as const;

type NavbarProps = {
  isAuthenticated?: boolean;
};

export function Navbar({ isAuthenticated = false }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 nav-glass transition-shadow ${
        scrolled ? "shadow-lg" : ""
      }`}
    >
      <nav className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-3 md:gap-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-medium text-sage-light transition-colors hover:text-gold"
        >
          <Image
            src="/images/fof-logo.png"
            alt="Flock of Fox, LLC"
            width={32}
            height={32}
            className="h-8 w-8 rounded-full border border-gold/30 object-cover"
            priority
          />
          <span className="font-heading text-sm font-semibold tracking-wide text-gold/90">
            Flock of Fox, LLC
          </span>
        </Link>

        <div className="flex flex-wrap items-center justify-center gap-5 md:gap-8">
          {links.map((link, index) => (
            <span key={link.href} className="contents">
              {index > 0 ? (
                <span
                  className="hidden text-sage-dark/60 sm:inline"
                  aria-hidden="true"
                >
                  |
                </span>
              ) : null}
              <a
                href={link.href}
                className="font-medium text-sage-light transition-colors hover:text-gold"
              >
                {link.label}
              </a>
            </span>
          ))}
          <span className="hidden text-sage-dark/60 sm:inline" aria-hidden="true">
            |
          </span>
          <Link
            href={isAuthenticated ? "/admin" : "/login"}
            className="text-xs font-medium tracking-wide text-sage-dark/70 transition-colors hover:text-gold/90"
          >
            {isAuthenticated ? "Dashboard" : "Portal Login"}
          </Link>
        </div>
      </nav>
    </header>
  );
}
