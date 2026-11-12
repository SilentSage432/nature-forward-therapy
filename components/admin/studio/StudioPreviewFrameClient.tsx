"use client";

import { useEffect, useState } from "react";
import { HomePresentation } from "@/components/site/HomePresentation";
import type { AnnouncementBannerData } from "@/lib/articles";
import { cloneCanonicalSiteDesign } from "@/lib/site-design/defaults";
import {
  createStudioPreviewReadyMessage,
  parseStudioPreviewMessage,
} from "@/lib/site-design/preview-protocol";
import { presentationFromDesign } from "@/lib/site-design/presentation";
import type { SiteDesign } from "@/lib/site-design/schema";
import type { SiteContent } from "@/lib/types";

type StudioPreviewFrameClientProps = {
  content: SiteContent;
  banner: AnnouncementBannerData | null;
};

export function StudioPreviewFrameClient({
  content,
  banner,
}: StudioPreviewFrameClientProps) {
  const [design, setDesign] = useState<SiteDesign>(() =>
    cloneCanonicalSiteDesign(),
  );

  useEffect(() => {
    const expectedOrigin = window.location.origin;

    function onMessage(event: MessageEvent) {
      const parsed = parseStudioPreviewMessage(event.data, {
        expectedOrigin,
        actualOrigin: event.origin,
        eventSource: event.source,
        expectedSource: window.parent,
      });
      if (!parsed.ok) return;
      if (parsed.message.type !== "STUDIO_PREVIEW_SET_DESIGN") return;

      // Only apply after full SiteDesign V1 validation (inside parse).
      setDesign(parsed.message.design);
    }

    window.addEventListener("message", onMessage);
    window.parent.postMessage(
      createStudioPreviewReadyMessage(),
      expectedOrigin,
    );

    return () => window.removeEventListener("message", onMessage);
  }, []);

  const presentation = presentationFromDesign(design, "canonical-default", null);

  return (
    <div
      inert
      aria-hidden="true"
      className="pointer-events-none select-none"
      data-studio-preview-inert="true"
      data-studio-preview-theme={design.theme.presetId}
      data-studio-preview-font={design.typography.fontFamilyId}
    >
      <HomePresentation
        content={content}
        banner={banner}
        presentation={presentation}
      />
    </div>
  );
}
