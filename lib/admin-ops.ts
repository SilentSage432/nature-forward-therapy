import { prisma } from "@/lib/prisma";

export type ActivityItem = {
  id: string;
  entity: string;
  summary: string;
  at: string;
  href?: string;
};

export type ExternalLinkCheck = {
  id: string;
  label: string;
  url: string;
  ok: boolean;
  statusCode: number | null;
  latencyMs: number | null;
  error?: string;
};

export type SiteBackupPayload = {
  exportedAt: string;
  version: 1;
  data: {
    users: Array<{
      id: string;
      email: string;
      name: string | null;
      role: string;
      mustChangePassword: boolean;
      createdAt: string;
      updatedAt: string;
    }>;
    practitionerProfiles: unknown[];
    specialties: unknown[];
    focusTags: unknown[];
    insurances: unknown[];
    practiceDetails: unknown[];
    siteConfigs: unknown[];
    blogPosts: unknown[];
    announcementBanners: unknown[];
    bookshelfItems: unknown[];
    supportMessages: unknown[];
  };
};

function toIso(value: Date): string {
  return value.toISOString();
}

export async function getRecentActivity(limit = 12): Promise<ActivityItem[]> {
  const take = Math.max(limit, 8);

  const [
    profiles,
    specialties,
    focusTags,
    insurances,
    practiceDetails,
    siteConfigs,
    posts,
    banners,
    books,
    users,
    support,
  ] = await Promise.all([
    prisma.practitionerProfile.findMany({
      orderBy: { updatedAt: "desc" },
      take,
      select: { id: true, name: true, updatedAt: true },
    }),
    prisma.specialty.findMany({
      orderBy: { updatedAt: "desc" },
      take,
      select: { id: true, title: true, updatedAt: true },
    }),
    prisma.focusTag.findMany({
      orderBy: { updatedAt: "desc" },
      take,
      select: { id: true, label: true, updatedAt: true },
    }),
    prisma.insurance.findMany({
      orderBy: { updatedAt: "desc" },
      take,
      select: { id: true, name: true, updatedAt: true },
    }),
    prisma.practiceDetail.findMany({
      orderBy: { updatedAt: "desc" },
      take,
      select: { id: true, updatedAt: true },
    }),
    prisma.siteConfig.findMany({
      orderBy: { updatedAt: "desc" },
      take,
      select: { id: true, siteTitle: true, updatedAt: true },
    }),
    prisma.blogPost.findMany({
      orderBy: { updatedAt: "desc" },
      take,
      select: { id: true, title: true, updatedAt: true },
    }),
    prisma.announcementBanner.findMany({
      orderBy: { updatedAt: "desc" },
      take,
      select: { id: true, text: true, updatedAt: true },
    }),
    prisma.bookshelfItem.findMany({
      orderBy: { updatedAt: "desc" },
      take,
      select: { id: true, title: true, updatedAt: true },
    }),
    prisma.user.findMany({
      orderBy: { updatedAt: "desc" },
      take,
      select: { id: true, email: true, role: true, updatedAt: true },
    }),
    prisma.supportMessage.findMany({
      orderBy: { createdAt: "desc" },
      take,
      select: {
        id: true,
        senderEmail: true,
        senderRole: true,
        createdAt: true,
        status: true,
      },
    }),
  ]);

  const items: ActivityItem[] = [
    ...profiles.map((row) => ({
      id: `profile-${row.id}-${row.updatedAt.toISOString()}`,
      entity: "Practice Profile",
      summary: `Updated profile for ${row.name}`,
      at: toIso(row.updatedAt),
      href: "/admin/profile",
    })),
    ...specialties.map((row) => ({
      id: `specialty-${row.id}-${row.updatedAt.toISOString()}`,
      entity: "Specialty",
      summary: `Updated specialty “${row.title}”`,
      at: toIso(row.updatedAt),
      href: "/admin/specialties",
    })),
    ...focusTags.map((row) => ({
      id: `focus-${row.id}-${row.updatedAt.toISOString()}`,
      entity: "Focus Tag",
      summary: `Updated focus tag “${row.label}”`,
      at: toIso(row.updatedAt),
      href: "/admin/specialties",
    })),
    ...insurances.map((row) => ({
      id: `insurance-${row.id}-${row.updatedAt.toISOString()}`,
      entity: "Insurance",
      summary: `Updated insurance “${row.name}”`,
      at: toIso(row.updatedAt),
      href: "/admin/details",
    })),
    ...practiceDetails.map((row) => ({
      id: `practice-${row.id}-${row.updatedAt.toISOString()}`,
      entity: "Practice Details",
      summary: "Updated practice path & details",
      at: toIso(row.updatedAt),
      href: "/admin/practice",
    })),
    ...siteConfigs.map((row) => ({
      id: `site-${row.id}-${row.updatedAt.toISOString()}`,
      entity: "Site Config",
      summary: `Updated site config “${row.siteTitle}”`,
      at: toIso(row.updatedAt),
      href: "/admin/settings",
    })),
    ...posts.map((row) => ({
      id: `post-${row.id}-${row.updatedAt.toISOString()}`,
      entity: "Article",
      summary: `Updated essay “${row.title}”`,
      at: toIso(row.updatedAt),
      href: `/admin/articles/${row.id}`,
    })),
    ...banners.map((row) => ({
      id: `banner-${row.id}-${row.updatedAt.toISOString()}`,
      entity: "Announcement",
      summary: `Updated banner: ${row.text.slice(0, 60)}${row.text.length > 60 ? "…" : ""}`,
      at: toIso(row.updatedAt),
      href: "/admin/announcements",
    })),
    ...books.map((row) => ({
      id: `book-${row.id}-${row.updatedAt.toISOString()}`,
      entity: "Bookshelf",
      summary: `Updated bookshelf item “${row.title}”`,
      at: toIso(row.updatedAt),
      href: `/admin/bookshelf/${row.id}`,
    })),
    ...users.map((row) => ({
      id: `user-${row.id}-${row.updatedAt.toISOString()}`,
      entity: "User",
      summary: `Updated ${row.role.toLowerCase()} account ${row.email}`,
      at: toIso(row.updatedAt),
      href: "/admin/users",
    })),
    ...support.map((row) => ({
      id: `support-${row.id}-${row.createdAt.toISOString()}`,
      entity: "Support",
      summary: `${row.senderRole} message from ${row.senderEmail} (${row.status})`,
      at: toIso(row.createdAt),
      href: "/admin/support",
    })),
  ];

  return items
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, limit);
}

export async function buildSiteBackup(): Promise<SiteBackupPayload> {
  const [
    users,
    practitionerProfiles,
    specialties,
    focusTags,
    insurances,
    practiceDetails,
    siteConfigs,
    blogPosts,
    announcementBanners,
    bookshelfItems,
    supportMessages,
  ] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        mustChangePassword: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.practitionerProfile.findMany(),
    prisma.specialty.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.focusTag.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.insurance.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.practiceDetail.findMany(),
    prisma.siteConfig.findMany(),
    prisma.blogPost.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.announcementBanner.findMany(),
    prisma.bookshelfItem.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.supportMessage.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    version: 1,
    data: {
      users: users.map((u) => ({
        ...u,
        createdAt: toIso(u.createdAt),
        updatedAt: toIso(u.updatedAt),
      })),
      practitionerProfiles,
      specialties,
      focusTags,
      insurances,
      practiceDetails,
      siteConfigs,
      blogPosts,
      announcementBanners,
      bookshelfItems,
      supportMessages,
    },
  };
}

async function probeUrl(
  id: string,
  label: string,
  url: string,
): Promise<ExternalLinkCheck> {
  const started = performance.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "NatureForward-AdminLinkCheck/1.0" },
    });
    clearTimeout(timeout);
    return {
      id,
      label,
      url,
      ok: res.ok || (res.status >= 300 && res.status < 500),
      statusCode: res.status,
      latencyMs: Math.round(performance.now() - started),
    };
  } catch (error) {
    return {
      id,
      label,
      url,
      ok: false,
      statusCode: null,
      latencyMs: Math.round(performance.now() - started),
      error: error instanceof Error ? error.message : "Request failed",
    };
  }
}

export async function checkExternalLinks(): Promise<ExternalLinkCheck[]> {
  const profile = await prisma.practitionerProfile.findFirst({
    orderBy: { createdAt: "asc" },
    select: { headwayUrl: true },
  });

  const headwayUrl =
    profile?.headwayUrl ||
    "https://headway.co";
  const webmailUrl = "https://privateemail.com";

  return Promise.all([
    probeUrl("headway", "Headway booking", headwayUrl),
    probeUrl("webmail", "Practice webmail", webmailUrl),
  ]);
}
