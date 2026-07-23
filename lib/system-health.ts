import { prisma } from "@/lib/prisma";

export type SystemHealth = {
  database: {
    status: "Operational" | "Degraded" | "Unavailable";
    connectionMode: string;
    responseTimeMs: number | null;
    provider: string;
  };
  server: {
    environment: string;
    runtime: string;
    nodeEnv: string;
    routeCount: number;
    publicRoutes: number;
    adminRoutes: number;
    apiRoutes: number;
  };
  content: {
    specialties: number;
    focusTags: number;
    insurances: number;
    practiceDetails: number;
    profiles: number;
  };
  security: {
    totalUsers: number;
    developers: number;
    editors: number;
    authStatus: "Active" | "Misconfigured";
  };
};

const PUBLIC_ROUTES = ["/", "/login"];
const ADMIN_ROUTES = [
  "/admin",
  "/admin/profile",
  "/admin/details",
  "/admin/specialties",
  "/admin/practice",
  "/admin/users",
  "/admin/settings",
];
const API_ROUTES = [
  "/api/auth/[...nextauth]",
  "/api/cms/profile",
  "/api/cms/specialties",
  "/api/cms/practice",
  "/api/cms/users",
  "/api/cms/settings",
  "/api/admin/health",
  "/api/admin/revalidate",
];

function connectionModeFromUrl(url: string | undefined): string {
  if (!url) return "Unconfigured";
  if (url.includes("pgbouncer=true") || url.includes(":6543")) {
    return "Supabase pooler (transaction)";
  }
  if (url.includes("supabase") || url.includes("postgresql")) {
    return "PostgreSQL direct/session";
  }
  return "Configured";
}

export async function getSystemHealth(): Promise<SystemHealth> {
  let dbStatus: SystemHealth["database"]["status"] = "Unavailable";
  let responseTimeMs: number | null = null;

  const started = performance.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    responseTimeMs = Math.round(performance.now() - started);
    dbStatus = responseTimeMs > 1500 ? "Degraded" : "Operational";
  } catch {
    responseTimeMs = Math.round(performance.now() - started);
    dbStatus = "Unavailable";
  }

  const [
    specialties,
    focusTags,
    insurances,
    practiceDetails,
    profiles,
    totalUsers,
    developers,
    editors,
  ] = await Promise.all([
    prisma.specialty.count().catch(() => 0),
    prisma.focusTag.count().catch(() => 0),
    prisma.insurance.count().catch(() => 0),
    prisma.practiceDetail.count().catch(() => 0),
    prisma.practitionerProfile.count().catch(() => 0),
    prisma.user.count().catch(() => 0),
    prisma.user.count({ where: { role: "DEVELOPER" } }).catch(() => 0),
    prisma.user.count({ where: { role: "EDITOR" } }).catch(() => 0),
  ]);

  const authStatus = process.env.AUTH_SECRET ? "Active" : "Misconfigured";

  return {
    database: {
      status: dbStatus,
      connectionMode: connectionModeFromUrl(process.env.DATABASE_URL),
      responseTimeMs,
      provider: "Supabase Postgres",
    },
    server: {
      environment: process.env.VERCEL ? "Vercel" : "Local / custom host",
      runtime: "Next.js App Router",
      nodeEnv: process.env.NODE_ENV ?? "development",
      routeCount: PUBLIC_ROUTES.length + ADMIN_ROUTES.length + API_ROUTES.length,
      publicRoutes: PUBLIC_ROUTES.length,
      adminRoutes: ADMIN_ROUTES.length,
      apiRoutes: API_ROUTES.length,
    },
    content: {
      specialties,
      focusTags,
      insurances,
      practiceDetails,
      profiles,
    },
    security: {
      totalUsers,
      developers,
      editors,
      authStatus,
    },
  };
}
