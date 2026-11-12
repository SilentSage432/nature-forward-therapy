import { isEditor } from "@/lib/rbac";

type DesignSession = {
  user?: {
    id?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
} | null;

/**
 * Pure authorization gate for SiteDesign mutations/reads.
 * Kept outside `"use server"` modules so Sync helpers remain importable.
 */
export function resolveDesignActor(
  session: DesignSession,
): { id: string; email: string } | null {
  const role = session?.user?.role;
  if (
    !isEditor(role as "EDITOR" | "DEVELOPER" | undefined | null) ||
    !session?.user?.id ||
    !session.user.email
  ) {
    return null;
  }
  return {
    id: session.user.id,
    email: session.user.email,
  };
}
