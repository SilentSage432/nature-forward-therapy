type RateLimitEntry = {
  count: number;
  windowStartedAt: number;
};

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 10;

const attempts = new Map<string, RateLimitEntry>();

function pruneExpired(now: number) {
  for (const [key, entry] of attempts.entries()) {
    if (now - entry.windowStartedAt > WINDOW_MS) {
      attempts.delete(key);
    }
  }
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  return "unknown";
}

export function checkLoginRateLimit(ip: string): {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
} {
  const now = Date.now();
  pruneExpired(now);

  const key = `login:${ip}`;
  const existing = attempts.get(key);

  if (!existing || now - existing.windowStartedAt > WINDOW_MS) {
    attempts.set(key, { count: 1, windowStartedAt: now });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1, retryAfterSec: 0 };
  }

  if (existing.count >= MAX_ATTEMPTS) {
    const retryAfterSec = Math.ceil(
      (WINDOW_MS - (now - existing.windowStartedAt)) / 1000,
    );
    return { allowed: false, remaining: 0, retryAfterSec };
  }

  existing.count += 1;
  attempts.set(key, existing);
  return {
    allowed: true,
    remaining: Math.max(0, MAX_ATTEMPTS - existing.count),
    retryAfterSec: 0,
  };
}

export function isCredentialsAuthPath(pathname: string): boolean {
  return (
    pathname.includes("/api/auth/callback/credentials") ||
    pathname.includes("/api/auth/signin/credentials") ||
    pathname.endsWith("/callback/credentials") ||
    pathname.endsWith("/signin/credentials")
  );
}
