"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import type { AnnouncementBannerData } from "@/lib/articles";

const links = [
  { href: "/#about", label: "About" },
  { href: "/#specialties", label: "Specialties" },
  { href: "/articles", label: "Essays" },
  { href: "/bookshelf", label: "Bookshelf" },
  { href: "/#contact", label: "Contact" },
] as const;

type NavbarProps = {
  banner?: AnnouncementBannerData | null;
};

export function Navbar({ banner = null }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const onBannerVisibility = (visible: boolean) => {
    setBannerVisible(visible);
  };
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    function onPointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target as Node;
      if (headerRef.current && !headerRef.current.contains(target)) {
        setMenuOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <>
      <AnnouncementBanner
        banner={banner}
        onVisibilityChange={onBannerVisibility}
      />
      <header
        ref={headerRef}
        className={`fixed right-0 left-0 z-50 nav-glass transition-[top,box-shadow] ${
          bannerVisible ? "top-11" : "top-0"
        } ${scrolled || menuOpen ? "shadow-lg" : ""}`}
      >
        <nav className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3 md:px-6 md:py-4">
          <Link
            href="/"
            onClick={closeMenu}
            className="site-fg-supporting flex min-w-0 items-center gap-2 text-sm font-medium transition-colors hover:text-[var(--site-accent)]"
          >
            <Image
              src="/images/fof-logo-mark.png"
              alt=""
              aria-hidden="true"
              width={64}
              height={64}
              quality={80}
              sizes="32px"
              className="site-border-accent h-8 w-8 shrink-0 rounded-full border object-cover"
              priority
            />
            <span className="site-accent font-heading truncate text-sm font-semibold tracking-wide opacity-90">
              Flock of Fox, LLC
            </span>
          </Link>

          <div className="hidden max-w-full flex-wrap items-center justify-end gap-x-6 gap-y-2 md:flex md:gap-x-8">
            {links.map((link, index) => (
              <span key={link.href} className="contents">
                {index > 0 ? (
                  <span
                    className="text-[color-mix(in_srgb,var(--site-border-organic)_60%,transparent)]"
                    aria-hidden="true"
                  >
                    |
                  </span>
                ) : null}
                <Link
                  href={link.href}
                  className="site-fg-supporting font-medium transition-colors hover:text-[var(--site-accent)]"
                >
                  {link.label}
                </Link>
              </span>
            ))}
            <span
              className="text-[color-mix(in_srgb,var(--site-border-organic)_60%,transparent)]"
              aria-hidden="true"
            >
              |
            </span>
            <Link
              href="/login"
              className="text-xs font-medium tracking-wide text-[color-mix(in_srgb,var(--site-border-organic)_70%,transparent)] transition-colors hover:text-[var(--site-accent)]"
            >
              Portal Login
            </Link>
          </div>

          <button
            type="button"
            className="site-accent site-accent-muted-fill inline-flex h-11 w-11 items-center justify-center rounded-lg border border-transparent transition hover:border-[color-mix(in_srgb,var(--site-accent)_50%,transparent)] md:hidden"
            style={{
              borderColor:
                "color-mix(in srgb, var(--site-accent) 25%, transparent)",
              backgroundColor: "transparent",
            }}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>

        <div
          id="mobile-nav-menu"
          className={`overflow-hidden border-b transition-[max-height,opacity] duration-300 ease-out md:hidden ${
            menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
          style={{
            borderBottomColor: "var(--site-border-mobile-nav)",
            backgroundColor: "var(--site-surface-mobile-nav)",
          }}
        >
          <div className="mx-auto flex max-w-5xl flex-col gap-2 px-5 py-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                className="site-fg-soft rounded-xl px-4 py-3.5 text-lg font-medium transition hover:bg-[var(--site-accent-muted)] hover:text-[var(--site-accent)]"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/login"
              className="site-accent site-accent-muted-fill site-border-accent rounded-xl border px-4 py-3.5 text-lg font-semibold transition hover:bg-[color-mix(in_srgb,var(--site-accent)_20%,transparent)]"
            >
              Portal Login
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
