"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Archive,
  BookOpen,
  Briefcase,
  LayoutDashboard,
  MapPin,
  Megaphone,
  MessageCircle,
  PenLine,
  RefreshCw,
  Search,
  Settings,
  Shield,
  Sparkles,
  User,
} from "lucide-react";
import { SUPPORT_DESK_UPDATED_EVENT } from "@/components/admin/SupportDesk";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
};

type NavSection = {
  title: string;
  icon: LucideIcon;
  items: NavItem[];
};

const editorSections: NavSection[] = [
  {
    title: "Practice",
    icon: MapPin,
    items: [
      { href: "/admin", label: "Overview", icon: LayoutDashboard },
      { href: "/admin/profile", label: "Practice Profile", icon: User },
      { href: "/admin/details", label: "Insurances & Payments", icon: Briefcase },
      { href: "/admin/specialties", label: "Specialties", icon: Sparkles },
      { href: "/admin/practice", label: "The Path & Details", icon: MapPin },
      { href: "/admin/articles", label: "Articles & Essays", icon: PenLine },
      { href: "/admin/bookshelf", label: "Curated Bookshelf", icon: BookOpen },
      {
        href: "/admin/announcements",
        label: "Announcement Banner",
        icon: Megaphone,
      },
    ],
  },
];

const developerSections: NavSection[] = [
  {
    title: "Command Center",
    icon: LayoutDashboard,
    items: [
      { href: "/admin", label: "Overview", icon: LayoutDashboard },
      {
        href: "/admin/support",
        label: "Client Support Desk",
        icon: MessageCircle,
      },
    ],
  },
  {
    title: "Management",
    icon: Shield,
    items: [
      { href: "/admin/activity", label: "Activity Log", icon: Activity },
      { href: "/admin/backup", label: "Site Backups", icon: Archive },
      { href: "/admin/users", label: "Users", icon: Shield },
    ],
  },
  {
    title: "Controls",
    icon: Settings,
    items: [
      { href: "/admin/cache", label: "Cache & Revalidation", icon: RefreshCw },
      { href: "/admin/seo", label: "SEO & Indexing", icon: Search },
      { href: "/admin/settings", label: "System Settings", icon: Settings },
    ],
  },
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
  const badge = item.badge ?? 0;

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
      <Icon
        className={`h-4 w-4 shrink-0 ${active ? "text-gold" : "text-sage-dark"}`}
      />
      <span className="min-w-0 flex-1">{item.label}</span>
      {badge > 0 ? (
        <span
          className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-amber-400/90 px-1.5 py-0.5 text-[10px] font-bold text-forest"
          aria-label={`${badge} open support items`}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
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
  const [openCount, setOpenCount] = useState(0);

  const refreshOpenCount = useCallback(async () => {
    if (!isDeveloper) return;
    try {
      const res = await fetch("/api/admin/support");
      if (!res.ok) return;
      const data = (await res.json()) as { openCount?: number };
      setOpenCount(data.openCount ?? 0);
    } catch {
      // Ignore badge poll errors.
    }
  }, [isDeveloper]);

  useEffect(() => {
    if (!isDeveloper) return;
    void refreshOpenCount();
    const id = window.setInterval(() => {
      void refreshOpenCount();
    }, 8000);

    function onSupportUpdated(event: Event) {
      const detail = (event as CustomEvent<{ openCount?: number }>).detail;
      if (typeof detail?.openCount === "number") {
        setOpenCount(detail.openCount);
        return;
      }
      void refreshOpenCount();
    }

    window.addEventListener(SUPPORT_DESK_UPDATED_EVENT, onSupportUpdated);
    return () => {
      window.clearInterval(id);
      window.removeEventListener(SUPPORT_DESK_UPDATED_EVENT, onSupportUpdated);
    };
  }, [isDeveloper, refreshOpenCount, pathname]);

  function onNavigate(href: string) {
    startTransition(() => {
      router.push(href);
    });
  }

  const sections = isDeveloper
    ? developerSections.map((section) => ({
        ...section,
        items: section.items.map((item) =>
          item.href === "/admin/support"
            ? { ...item, badge: openCount }
            : item,
        ),
      }))
    : editorSections;

  return (
    <aside className="space-y-6 rounded-2xl border border-sage-dark/30 bg-forest-soft/40 p-4">
      {pending ? (
        <p className="px-1 text-xs text-gold/80" aria-live="polite">
          Loading…
        </p>
      ) : null}
      {sections.map((section, index) => {
        const SectionIcon = section.icon;
        return (
          <nav
            key={section.title}
            className={`space-y-1 ${
              index > 0 ? "border-t border-sage-dark/30 pt-4" : ""
            }`}
          >
            <p className="mb-3 flex items-center gap-2 px-1 text-xs font-semibold tracking-wide text-gold uppercase">
              <SectionIcon className="h-3.5 w-3.5" />
              {section.title}
            </p>
            {section.items.map((link) => (
              <NavLink
                key={link.href}
                item={link}
                pathname={pathname}
                pending={pending}
                onNavigate={onNavigate}
              />
            ))}
          </nav>
        );
      })}
    </aside>
  );
}
