"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Clock3,
  ImageIcon,
  LayoutDashboard,
  Palette,
  type LucideIcon,
} from "lucide-react";

const items: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/admin/studio", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/studio/design", label: "Design", icon: Palette },
  { href: "/admin/studio/media", label: "Media", icon: ImageIcon },
  { href: "/admin/studio/history", label: "History", icon: Clock3 },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin/studio") return pathname === "/admin/studio";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function StudioSubnav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Website Studio sections"
      className="flex gap-2 overflow-x-auto pb-1"
    >
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${
              active
                ? "border-gold/50 bg-forest-soft text-gold"
                : "border-sage-dark/30 text-sage-light hover:border-gold/30 hover:text-gold"
            }`}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
