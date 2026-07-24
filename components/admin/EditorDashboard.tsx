import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  Briefcase,
  ExternalLink,
  Leaf,
  Mail,
  MapPin,
  Megaphone,
  PenLine,
  Sparkles,
} from "lucide-react";
import type { SiteContent } from "@/lib/types";
import { SupportCard } from "@/components/admin/SupportCard";

type EditorDashboardProps = {
  firstName: string;
  content: SiteContent;
};

const cards = [
  {
    href: "/admin/profile",
    icon: Leaf,
    emoji: "🌿",
    title: "Practice Profile & Bio",
    description: "Credentials, Headway & Psychology Today links",
  },
  {
    href: "/admin/details",
    icon: Briefcase,
    emoji: "💼",
    title: "Insurances & Payment",
    description: "Checklist of accepted plans and payment methods",
  },
  {
    href: "/admin/specialties",
    icon: Sparkles,
    emoji: "✨",
    title: "Specialties & Focus Areas",
    description: "Primary cards and focus chips on your public site",
  },
  {
    href: "/admin/practice",
    icon: MapPin,
    emoji: "📍",
    title: "Practice Details & The Path",
    description: "Location, onboarding steps, and therapy modalities",
  },
  {
    href: "/admin/articles",
    icon: PenLine,
    emoji: "✍️",
    title: "Articles & Essays",
    description: "Draft and publish reflections for the Publication Hub",
  },
  {
    href: "/admin/bookshelf",
    icon: BookOpen,
    emoji: "📚",
    title: "Curated Bookshelf",
    description: "Books, podcasts, and tools you recommend to clients",
  },
  {
    href: "/admin/announcements",
    icon: Megaphone,
    emoji: "📣",
    title: "Announcement Banner",
    description: "Optional site-wide notice above the main navigation",
  },
] as const;

export function EditorDashboard({ firstName, content }: EditorDashboardProps) {
  const insurancePreview = content.practice.insurances.slice(0, 4);
  const specialtyPreview = content.specialties.slice(0, 3);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 rounded-2xl border border-sage-dark/30 bg-forest-soft/80 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-300" aria-hidden="true" />
            Practice portal live
          </div>
          <div className="flex items-center gap-3">
            <Image
              src="/images/fof-logo.png"
              alt="Flock of Fox emblem"
              width={40}
              height={40}
              className="h-10 w-10 rounded-full border border-gold/35 object-cover"
            />
            <h1 className="font-heading text-3xl font-bold text-white">
              Welcome back, {firstName}! 🦊
            </h1>
          </div>
          <p className="mt-2 max-w-xl text-sage-light">
            Update your practice content anytime. Changes appear on your public
            Nature-Forward Therapy site.
          </p>
        </div>
        <a
          href="https://flockoffox.org"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-gold inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 font-heading text-sm font-semibold text-forest"
        >
          View Live Site
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      <div className="rounded-2xl border border-gold/30 bg-forest-soft/80 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/15 text-gold">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-semibold text-gold">
                Practice Inbox &amp; Mail
              </h2>
              <p className="mt-1 text-sm text-sage-light">
                Access your official practice email (nicolegarcia@flockoffox.org).
              </p>
            </div>
          </div>
          <a
            href="https://webmail.privatemail.com"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 font-heading text-sm font-semibold text-forest"
          >
            Open Webmail
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      <SupportCard />

      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              href={card.href}
              className="card-hover rounded-2xl border border-sage-dark/30 bg-forest-soft/80 p-6 transition hover:border-gold/40"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sage-dark/40 text-xl">
                  <span aria-hidden="true">{card.emoji}</span>
                </div>
                <Icon className="h-5 w-5 text-gold" aria-hidden="true" />
              </div>
              <h2 className="font-heading text-lg font-semibold text-gold">
                {card.title}
              </h2>
              <p className="mt-2 text-sm text-sage-light">{card.description}</p>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-sage-dark/30 bg-forest/60 p-5">
          <h3 className="mb-3 font-heading text-sm font-semibold text-gold">
            Focus areas at a glance
          </h3>
          <div className="flex flex-wrap gap-2">
            {content.focusTags.map((tag) => (
              <span
                key={tag.id}
                className="rounded-full border border-gold/35 bg-gold/20 px-3 py-1 text-xs font-semibold text-gold"
              >
                {tag.label}
              </span>
            ))}
          </div>
          <ul className="mt-4 space-y-1 text-sm text-sage-light">
            {specialtyPreview.map((specialty) => (
              <li key={specialty.id}>
                {specialty.icon} {specialty.title}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-sage-dark/30 bg-forest/60 p-5">
          <h3 className="mb-3 font-heading text-sm font-semibold text-gold">
            Accepted insurance (sample)
          </h3>
          <ul className="space-y-2 text-sm text-sage-light">
            {insurancePreview.map((name) => (
              <li key={name} className="flex items-start gap-2">
                <span className="text-gold" aria-hidden="true">
                  ✓
                </span>
                <span>{name}</span>
              </li>
            ))}
          </ul>
          <Link
            href="/admin/details"
            className="mt-4 inline-block text-sm text-gold hover:underline"
          >
            Manage full checklist →
          </Link>
        </div>
      </div>
    </div>
  );
}
