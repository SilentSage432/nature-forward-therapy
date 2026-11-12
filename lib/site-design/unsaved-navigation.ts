/**
 * Pure helpers for Design editor unsaved-change navigation decisions.
 * UI confirmation lives in UnsavedDesignNavigationGuard.
 */

export function normalizePathname(pathname: string): string {
  if (!pathname) return "/";
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

/**
 * True when following href would leave the Design editor route.
 * Same-route hash/query changes and empty/invalid hrefs are not guarded.
 */
export function isLeavingDesignEditor(
  href: string,
  currentPathname = "/admin/studio/design",
  currentOrigin?: string,
): boolean {
  const origin =
    currentOrigin ??
    (typeof window !== "undefined" ? window.location.origin : "http://localhost");

  let url: URL;
  try {
    url = new URL(href, origin);
  } catch {
    return false;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return false;
  }

  if (url.origin !== origin) {
    return true;
  }

  const target = normalizePathname(url.pathname);
  const current = normalizePathname(currentPathname);
  return target !== current;
}

export type DiscardConfirmChoice = "stay" | "discard";
