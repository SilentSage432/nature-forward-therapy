"use client";

import { useSyncExternalStore } from "react";
import { AlertTriangle } from "lucide-react";
import { MAINTENANCE_PREVIEW_COOKIE } from "@/lib/public-cache-shared";

function hasPreviewCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split(";")
    .some((part) => part.trim().startsWith(`${MAINTENANCE_PREVIEW_COOKIE}=`));
}

function subscribe() {
  return () => {};
}

/**
 * Client-only overlay for DEVELOPER public preview during maintenance.
 * Proxy sets a short-lived non-HttpOnly cookie after JWT role checks;
 * spoofing the cookie only shows a banner (not an auth bypass).
 */
export function DeveloperMaintenanceBanner() {
  const visible = useSyncExternalStore(
    subscribe,
    hasPreviewCookie,
    () => false,
  );

  if (!visible) return null;

  return (
    <div
      className="flex items-center justify-center gap-2 border-b border-amber-400/45 bg-amber-400/15 px-4 py-2.5 text-center text-xs font-semibold text-amber-100"
      role="status"
    >
      <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      Emergency Maintenance Mode is currently ACTIVE on the public site.
    </div>
  );
}
