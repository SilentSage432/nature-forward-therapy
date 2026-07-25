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

/** Browser-like headers so Cloudflare / WAF probes are not blank-bot 403s. */
const PROBE_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
} as const;

function looksLikeAntiBotGate(headers: Headers): boolean {
  const server = headers.get("server")?.toLowerCase() ?? "";
  return Boolean(
    headers.get("cf-ray") ||
      headers.get("cf-mitigated") ||
      server.includes("cloudflare"),
  );
}

/** Reachable for ops dashboards — includes CF challenge 403s (not real outages). */
function isReachableProbe(status: number, headers: Headers): boolean {
  if (status === 200 || status === 301 || status === 302) return true;
  if (status === 403 && looksLikeAntiBotGate(headers)) return true;
  return false;
}

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
        headers: PROBE_HEADERS,
      });
      const latency = Math.round(performance.now() - started);
      const ok = isReachableProbe(res.status, res.headers);
      return {
        id,
        label,
        url,
        ok,
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
