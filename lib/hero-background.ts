/**
 * Canonical forest hero used on the public homepage.
 * CMS may still store the legacy Unsplash URL; treat both as the optimized default.
 */
export const DEFAULT_HERO_BACKGROUND_PATH = "/images/hero/forest-1280.webp";

const LEGACY_UNSPLASH_HERO_ID = "photo-1441974231531-c6227db76b6e";

export function isDefaultHeroBackground(url: string | null | undefined): boolean {
  if (!url || !url.trim()) return true;
  const value = url.trim();
  if (value.includes(LEGACY_UNSPLASH_HERO_ID)) return true;
  if (value.startsWith("/images/hero/forest-")) return true;
  return false;
}
