"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BookOpen,
  Briefcase,
  LayoutDashboard,
  MapPin,
  Megaphone,
  PenLine,
  Settings,
  Shield,
  Sparkles,
  User,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const contentLinks: NavItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/profile", label: "Practice Profile", icon: User },
  { href: "/admin/details", label: "Insurances & Payments", icon: Briefcase },
  { href: "/admin/specialties", label: "Specialties", icon: Sparkles },
  { href: "/admin/practice", label: "The Path & Details", icon: MapPin },
  { href: "/admin/articles", label: "Articles & Essays", icon: PenLine },
  { href: "/admin/bookshelf", label: "Curated Bookshelf", icon: BookOpen },
  { href: "/admin/announcements", label: "Announcement Banner", icon: Megaphone },
];

const developerLinks: NavItem[] = [
  { href: "/admin/users", label: "Users", icon: Shield },
  { href: "/admin/settings", label: "Site Settings", icon: Settings },
];

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  item,
  pathname,
  pending,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  pending: boolean;
  onNavigate: (href: string) => void;
}) {
  const active = isActivePath(pathname, item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={(event) => {
        if (
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          event.button !== 0
        ) {
          return;
        }
        event.preventDefault();
        onNavigate(item.href);
      }}
      className={`flex items-center gap-3 rounded-lg border-l-2 px-3 py-2.5 text-sm transition-colors ${
        active
          ? "border-gold bg-forest-soft text-gold"
          : "border-transparent text-sage-light hover:bg-forest-soft/80 hover:text-gold"
      } ${pending && !active ? "opacity-70" : ""}`}
    >
      <Icon className={`h-4 w-4 ${active ? "text-gold" : "text-sage-dark"}`} />
      <span>{item.label}</span>
    </Link>
  );
}

type AdminSidebarProps = {
  isDeveloper: boolean;
};

export function AdminSidebar({ isDeveloper }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onNavigate(href: string) {
    startTransition(() => {
      router.push(href);
    });
  }

  return (
    <aside className="space-y-6 rounded-2xl border border-sage-dark/30 bg-forest-soft/40 p-4">
      {pending ? (
        <p className="px-1 text-xs text-gold/80" aria-live="polite">
          Loading…
        </p>
      ) : null}
      <nav className="space-y-1">
        <p className="mb-3 flex items-center gap-2 px-1 text-xs font-semibold tracking-wide text-gold uppercase">
          {isDeveloper ? (
            <>
              <Activity className="h-3.5 w-3.5" />
              System
            </>
          ) : (
            <>
              <MapPin className="h-3.5 w-3.5" />
              Practice
            </>
          )}
        </p>
        {contentLinks.map((link) => (
          <NavLink
            key={link.href}
            item={link}
            pathname={pathname}
            pending={pending}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      {isDeveloper ? (
        <nav className="space-y-1 border-t border-sage-dark/30 pt-4">
          <p className="mb-3 flex items-center gap-2 px-1 text-xs font-semibold tracking-wide text-gold uppercase">
            <Shield className="h-3.5 w-3.5" />
            Developer
          </p>
          {developerLinks.map((link) => (
            <NavLink
              key={link.href}
              item={link}
              pathname={pathname}
              pending={pending}
              onNavigate={onNavigate}
            />
          ))}
        </nav>
      ) : null}
    </aside>
  );
}
