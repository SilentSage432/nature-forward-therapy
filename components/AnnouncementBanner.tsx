"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  bannerDismissClass,
  bannerLinkClass,
  bannerShellClass,
  bannerTextClass,
  normalizeBannerAlignment,
  normalizeBannerFontStyle,
  normalizeBannerTheme,
} from "@/lib/announcement-banner";
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

    // Permanent banners (default) cannot be dismissed.
    if (!banner.isDismissible) {
      setDismissed(false);
      setHydrated(true);
      onVisibilityChangeRef.current?.(true);
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

  const theme = normalizeBannerTheme(banner.theme);
  const alignment = normalizeBannerAlignment(banner.alignment);
  const fontStyle = normalizeBannerFontStyle(banner.fontStyle);
  const isSplit = alignment === "left";

  function dismiss() {
    if (!banner?.isDismissible) return;
    try {
      sessionStorage.setItem(DISMISS_KEY, banner.id);
    } catch {
      // ignore storage failures
    }
    setDismissed(true);
    onVisibilityChangeRef.current?.(false);
  }

  const linkEl = banner.link ? (
    <Link
      href={banner.link}
      className={bannerLinkClass(theme)}
    >
      {banner.linkText?.trim() || "Learn more"}
    </Link>
  ) : null;

  return (
    <div
      role="region"
      aria-label="Site announcement"
      className={`fixed top-0 right-0 left-0 z-[60] border-b ${bannerShellClass(theme)}`}
    >
      <div
        className={`mx-auto flex max-w-5xl items-center gap-3 px-4 py-2.5 sm:px-6 ${
          isSplit ? "justify-between" : "justify-center"
        }`}
      >
        <p
          className={`min-w-0 text-sm ${bannerTextClass(fontStyle)} ${
            isSplit ? "flex-1 text-left" : "text-center"
          }`}
        >
          <span>{banner.text}</span>
          {!isSplit && linkEl ? (
            <>
              {" "}
              {linkEl}
            </>
          ) : null}
        </p>

        {isSplit && linkEl ? (
          <div className="shrink-0">{linkEl}</div>
        ) : null}

        {banner.isDismissible ? (
          <button
            type="button"
            onClick={dismiss}
            className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition ${bannerDismissClass(theme)}`}
            aria-label="Dismiss announcement"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
