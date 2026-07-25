import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isDeveloper } from "@/lib/rbac";

type ProbeResult = {
  id: string;
  label: string;
  url: string;
  ok: boolean;
  statusCode: number | null;
  latencyMs: number | null;
  error?: string;
};

async function probe(
  id: string,
  label: string,
  url: string,
): Promise<ProbeResult> {
  const started = performance.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": "NatureForward-Diagnostics/1.0" },
    });
    clearTimeout(timeout);
    return {
      id,
      label,
      url,
      ok: res.status >= 200 && res.status < 400,
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

export async function GET() {
  const session = await auth();
  if (!isDeveloper(session?.user?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const profile = await prisma.practitionerProfile.findFirst({
    orderBy: { createdAt: "asc" },
    select: { headwayUrl: true, psychologyTodayUrl: true },
  });

  const checks = await Promise.all([
    probe(
      "headway",
      "Headway booking",
      profile?.headwayUrl || "https://headway.co",
    ),
    probe(
      "psychology-today",
      "Psychology Today",
      profile?.psychologyTodayUrl || "https://www.psychologytoday.com",
    ),
    probe("webmail", "Practice webmail", "https://privateemail.com"),
  ]);

  return NextResponse.json({
    checkedAt: new Date().toISOString(),
    checks,
  });
}
