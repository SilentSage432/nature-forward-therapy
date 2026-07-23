import { prisma } from "@/lib/prisma";
import { FALLBACK_CONTENT, type ProcessStep, type SiteContent } from "@/lib/types";
import type { Prisma } from "@prisma/client";

function asStringArray(value: Prisma.JsonValue | null | undefined): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(String);
}

function asProcessSteps(value: Prisma.JsonValue | null | undefined): ProcessStep[] {
  if (!Array.isArray(value)) return FALLBACK_CONTENT.practice.processSteps;
  return value.map((step) => {
    const s = step as { title?: unknown; description?: unknown };
    return {
      title: String(s.title ?? ""),
      description: String(s.description ?? ""),
    };
  });
}

export async function getSiteContent(): Promise<SiteContent> {
  try {
    const [profile, specialties, focusTags, insurances, practice, site] =
      await Promise.all([
        prisma.practitionerProfile.findFirst({ orderBy: { createdAt: "asc" } }),
        prisma.specialty.findMany({ orderBy: { sortOrder: "asc" } }),
        prisma.focusTag.findMany({ orderBy: { sortOrder: "asc" } }),
        prisma.insurance.findMany({ orderBy: { sortOrder: "asc" } }),
        prisma.practiceDetail.findFirst({ orderBy: { createdAt: "asc" } }),
        prisma.siteConfig.findFirst({ orderBy: { createdAt: "asc" } }),
      ]);

    if (!profile || !practice || !site) {
      return FALLBACK_CONTENT;
    }

    return {
      profile: {
        id: profile.id,
        name: profile.name,
        credentials: profile.credentials,
        location: profile.location,
        tagline: profile.tagline,
        bio: profile.bio,
        bioHighlight: profile.bioHighlight,
        headshotPath: profile.headshotPath,
        headwayUrl: profile.headwayUrl,
        psychologyTodayUrl: profile.psychologyTodayUrl,
        heroBackgroundUrl: profile.heroBackgroundUrl,
        aboutImageUrl: profile.aboutImageUrl,
        specialtiesImageUrl: profile.specialtiesImageUrl,
        contactImageUrl: profile.contactImageUrl,
        footerCredit: profile.footerCredit,
      },
      specialties: specialties.map((s) => ({
        id: s.id,
        title: s.title,
        icon: s.icon,
        description: s.description,
        sortOrder: s.sortOrder,
      })),
      focusTags: focusTags.map((t) => ({
        id: t.id,
        label: t.label,
        sortOrder: t.sortOrder,
      })),
      practice: {
        id: practice.id,
        expertise: asStringArray(practice.expertise),
        paymentMethods: asStringArray(practice.paymentMethods),
        insurances: insurances.map((i) => i.name),
        therapyTypes: asStringArray(practice.therapyTypes),
        processSteps: asProcessSteps(practice.processSteps),
      },
      site: {
        siteTitle: site.siteTitle,
        siteDescription: site.siteDescription,
      },
    };
  } catch {
    return FALLBACK_CONTENT;
  }
}
