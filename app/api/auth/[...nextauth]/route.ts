import { NextRequest, NextResponse } from "next/server";
import { handlers } from "@/lib/auth";
import {
  checkLoginRateLimit,
  getClientIp,
  isCredentialsAuthPath,
} from "@/lib/rate-limit";

export const { GET } = handlers;

export async function POST(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (isCredentialsAuthPath(pathname)) {
    const ip = getClientIp(request);
    const limit = checkLoginRateLimit(ip);

    if (!limit.allowed) {
      return NextResponse.json(
        {
          error: "Too many login attempts. Please try again later.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(limit.retryAfterSec),
            "X-RateLimit-Limit": "10",
            "X-RateLimit-Remaining": "0",
          },
        },
      );
    }
  }

  return handlers.POST(request);
}
