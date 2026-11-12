/**
 * Isolation guard for SiteDesign PostgreSQL integration tests.
 *
 * Refuses production Supabase and any unverified host. Does not print secrets.
 * NODE_ENV=test alone is never treated as proof of a disposable database.
 */

export type IsolatedDatabaseIdentity = {
  host: string;
  port: string;
  database: string;
  user: string;
};

const BLOCKED_HOST_FRAGMENTS = [
  "supabase.com",
  "supabase.co",
  "pooler.supabase",
  "amazonaws.com",
  "neon.tech",
  "railway.app",
  "render.com",
];

function normalizePostgresUrl(raw: string): URL {
  const trimmed = raw.trim().replace(/^["']|["']$/g, "");
  return new URL(trimmed.replace(/^postgres(ql)?:/i, "http:"));
}

export function fingerprintDatabaseUrl(raw: string): IsolatedDatabaseIdentity {
  const url = normalizePostgresUrl(raw);
  return {
    host: url.hostname,
    port: url.port || "5432",
    database: url.pathname.replace(/^\//, "") || "(unknown)",
    user: decodeURIComponent(url.username || "(none)"),
  };
}

export function assertIsolatedSiteDesignTestDatabase(
  rawUrl: string | undefined | null,
): IsolatedDatabaseIdentity {
  if (!rawUrl || !rawUrl.trim()) {
    throw new Error(
      "SITE_DESIGN_TEST_DATABASE_URL is required for SiteDesign DB integration tests.",
    );
  }

  let identity: IsolatedDatabaseIdentity;
  try {
    identity = fingerprintDatabaseUrl(rawUrl);
  } catch {
    throw new Error(
      "SITE_DESIGN_TEST_DATABASE_URL is not a valid PostgreSQL URL.",
    );
  }

  const host = identity.host.toLowerCase();
  const isLoopback =
    host === "127.0.0.1" || host === "localhost" || host === "::1";

  if (!isLoopback) {
    throw new Error(
      `Refusing SiteDesign DB tests: host "${identity.host}" is not an independently verified loopback database.`,
    );
  }

  for (const fragment of BLOCKED_HOST_FRAGMENTS) {
    if (host.includes(fragment)) {
      throw new Error(
        `Refusing SiteDesign DB tests: host looks like a hosted/production provider (${fragment}).`,
      );
    }
  }

  // Known production Supabase project ref from this workspace — never allow.
  if (
    identity.database.toLowerCase().includes("dbqprchzgfhthpxngemy") ||
    identity.user.toLowerCase().includes("dbqprchzgfhthpxngemy")
  ) {
    throw new Error(
      "Refusing SiteDesign DB tests: connection identity matches production Supabase project ref.",
    );
  }

  if (!identity.database || identity.database === "(unknown)") {
    throw new Error(
      "Refusing SiteDesign DB tests: database name is missing from the URL.",
    );
  }

  // Disposable naming convention for this tranche (defense in depth).
  if (!/^nft_studio_004a_/i.test(identity.database)) {
    throw new Error(
      `Refusing SiteDesign DB tests: database "${identity.database}" is not a verified nft_studio_004a_* disposable database.`,
    );
  }

  return identity;
}
