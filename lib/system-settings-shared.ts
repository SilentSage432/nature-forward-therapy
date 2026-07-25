export const DEFAULT_MAINTENANCE_MESSAGE =
  "We are currently performing routine maintenance. Please check back shortly.";

export const SETTING_KEYS = {
  MAINTENANCE_MODE: "MAINTENANCE_MODE",
  DEV_ANNOUNCEMENT: "DEV_ANNOUNCEMENT",
  SESSION_EPOCH: "SESSION_EPOCH",
} as const;

export type MaintenanceState = {
  enabled: boolean;
  message: string;
};

/** Routes that stay reachable while maintenance is on (CMS / auth / APIs). */
export function isMaintenanceExemptPath(pathname: string): boolean {
  if (!pathname) return false;
  return (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/maintenance")
  );
}

/** Public marketing / content surfaces that should show the holding card. */
export function isPublicContentPath(pathname: string): boolean {
  if (!pathname || pathname === "/") return true;
  if (isMaintenanceExemptPath(pathname)) return false;
  return (
    pathname === "/articles" ||
    pathname.startsWith("/articles/") ||
    pathname === "/bookshelf" ||
    pathname.startsWith("/bookshelf/")
  );
}
