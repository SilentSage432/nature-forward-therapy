/** Default ISR window for public marketing pages (seconds). */
export const PUBLIC_REVALIDATE_SECONDS = 60;

/** Short TTL for the maintenance control-plane flag read by proxy. */
export const MAINTENANCE_REVALIDATE_SECONDS = 30;

export const CACHE_TAGS = {
  siteContent: "site-content",
  announcements: "announcements",
  articles: "articles",
  bookshelf: "bookshelf",
  maintenance: "maintenance-mode",
} as const;

export type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS];

/** Cookie set only for DEVELOPER sessions while maintenance is active (banner hint). */
export const MAINTENANCE_PREVIEW_COOKIE = "nft-maint-preview";

export function articleTag(slug: string): string {
  return `article:${slug}`;
}
