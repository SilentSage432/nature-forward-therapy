import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isDeveloper } from "@/lib/rbac";

type ProbeResult = {
  id: string;
  label: string;
  url: string;
  ok: boolean;
  status: number | null;
  statusCode: number | null;
  latency: number | null;
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
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const res = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: { "User-Agent": "NatureForward-Diagnostics/1.0" },
      });
      const latency = Math.round(performance.now() - started);
      return {
        id,
        label,
        url,
        ok: res.status >= 200 && res.status < 400,
        status: res.status,
        statusCode: res.status,
        latency,
        latencyMs: latency,
      };
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    const latency = Math.round(performance.now() - started);
    const message =
      error instanceof Error
        ? error.name === "AbortError"
          ? "Timed out after 5s"
          : error.message
        : "Request failed";
    return {
      id,
      label,
      url,
      ok: false,
      status: null,
      statusCode: null,
      latency,
      latencyMs: latency,
      error: message,
    };
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!isDeveloper(session?.user?.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let headwayUrl = "https://headway.co";
    let psychologyTodayUrl = "https://www.psychologytoday.com";
    try {
      const profile = await prisma.practitionerProfile.findFirst({
        orderBy: { createdAt: "asc" },
        select: { headwayUrl: true, psychologyTodayUrl: true },
      });
      if (profile?.headwayUrl) headwayUrl = profile.headwayUrl;
      if (profile?.psychologyTodayUrl) {
        psychologyTodayUrl = profile.psychologyTodayUrl;
      }
    } catch (error) {
      console.error("[diagnostics] profile lookup", error);
    }

    const checks = await Promise.all([
      probe("headway", "Headway booking", headwayUrl),
      probe("psychology-today", "Psychology Today", psychologyTodayUrl),
      probe("webmail", "Practice webmail", "https://privateemail.com"),
    ]);

    return NextResponse.json({
      checkedAt: new Date().toISOString(),
      checks,
    });
  } catch (error) {
    console.error("[diagnostics]", error);
    return NextResponse.json(
      {
        error: "Diagnostics failed.",
        checkedAt: new Date().toISOString(),
        checks: [],
      },
      { status: 500 },
    );
  }
}
