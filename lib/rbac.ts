import type { Role } from "@prisma/client";

export type AppRole = Role;

export const EDITOR_CONTENT_PATHS = [
  "/admin",
  "/admin/profile",
  "/admin/specialties",
  "/admin/practice",
  "/admin/details",
  "/admin/articles",
  "/admin/bookshelf",
  "/admin/announcements",
] as const;

export const DEVELOPER_ONLY_PATHS = [
  "/admin/users",
  "/admin/settings",
  "/admin/support",
  "/admin/activity",
  "/admin/backup",
  "/admin/seo",
  "/admin/cache",
] as const;

export function isDeveloper(role: AppRole | undefined | null): boolean {
  return role === "DEVELOPER";
}

export function isEditor(role: AppRole | undefined | null): boolean {
  return role === "EDITOR" || role === "DEVELOPER";
}

export function canAccessAdminPath(
  role: AppRole | undefined | null,
  pathname: string,
): boolean {
  if (!role) return false;
  if (isDeveloper(role)) return true;
  if (!isEditor(role)) return false;

  if (DEVELOPER_ONLY_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return false;
  }

  return (
    pathname === "/admin" ||
    EDITOR_CONTENT_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  );
}

/** Fields editors may update on practitioner profile. */
export const EDITOR_PROFILE_FIELDS = [
  "name",
  "credentials",
  "location",
  "tagline",
  "bio",
  "bioHighlight",
  "headshotPath",
  "headwayUrl",
  "psychologyTodayUrl",
  "heroBackgroundUrl",
  "aboutImageUrl",
  "specialtiesImageUrl",
  "contactImageUrl",
] as const;

/** Fields only developers may update. */
export const DEVELOPER_PROFILE_FIELDS = ["footerCredit"] as const;
