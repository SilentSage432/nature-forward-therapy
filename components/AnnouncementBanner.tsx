"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { AnnouncementBannerData } from "@/lib/articles";

const DISMISS_KEY = "fof-announcement-dismissed";

type AnnouncementBannerProps = {
  banner: AnnouncementBannerData | null;
  onVisibilityChange?: (visible: boolean) => void;
};

export function AnnouncementBanner({
  banner,
  onVisibilityChange,
}: AnnouncementBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const onVisibilityChangeRef = useRef(onVisibilityChange);
  onVisibilityChangeRef.current = onVisibilityChange;

  useEffect(() => {
    if (!banner?.isActive) {
      setDismissed(true);
      setHydrated(true);
      onVisibilityChangeRef.current?.(false);
      return;
    }

    try {
      const stored = sessionStorage.getItem(DISMISS_KEY);
      const isDismissed = stored === banner.id;
      setDismissed(isDismissed);
      onVisibilityChangeRef.current?.(!isDismissed);
    } catch {
      setDismissed(false);
      onVisibilityChangeRef.current?.(true);
    }
    setHydrated(true);
  }, [banner]);

  if (!banner?.isActive || !hydrated || dismissed) {
    return null;
  }

  function dismiss() {
    if (!banner) return;
    try {
      sessionStorage.setItem(DISMISS_KEY, banner.id);
    } catch {
      // ignore storage failures
    }
    setDismissed(true);
    onVisibilityChangeRef.current?.(false);
  }

  return (
    <div
      role="region"
      aria-label="Site announcement"
      className="fixed top-0 right-0 left-0 z-[60] border-b border-amber-900/20 bg-gradient-to-r from-amber-200 via-gold to-amber-300 text-forest"
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        <p className="min-w-0 flex-1 text-center text-sm font-medium sm:text-left">
          <span>{banner.text}</span>
          {banner.link ? (
            <>
              {" "}
              <Link
                href={banner.link}
                className="font-semibold underline underline-offset-2 transition hover:text-forest-soft"
              >
                {banner.linkText?.trim() || "Learn more"}
              </Link>
            </>
          ) : null}
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-forest/70 transition hover:bg-forest/10 hover:text-forest"
          aria-label="Dismiss announcement"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
