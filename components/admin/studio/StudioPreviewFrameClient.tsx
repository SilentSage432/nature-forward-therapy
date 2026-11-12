"use client";

import { useEffect, useState } from "react";
import { HomePresentation } from "@/components/site/HomePresentation";
import type { AnnouncementBannerData } from "@/lib/articles";
import { cloneCanonicalSiteDesign } from "@/lib/site-design/defaults";
import { createStudioPreviewDocumentId } from "@/lib/site-design/preview-handshake";
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
  const [documentId] = useState(createStudioPreviewDocumentId);

  useEffect(() => {
    const expectedOrigin = window.location.origin;

    function postReady() {
      window.parent.postMessage(
        createStudioPreviewReadyMessage(documentId),
        expectedOrigin,
      );
    }

    function onMessage(event: MessageEvent) {
      const parsed = parseStudioPreviewMessage(event.data, {
        expectedOrigin,
        actualOrigin: event.origin,
        eventSource: event.source,
        expectedSource: window.parent,
      });
      if (!parsed.ok) return;
      if (parsed.message.type === "STUDIO_PREVIEW_REQUEST_READY") {
        postReady();
        return;
      }
      if (parsed.message.type !== "STUDIO_PREVIEW_SET_DESIGN") return;

      // Only apply after full SiteDesign V1 validation (inside parse).
      setDesign(parsed.message.design);
    }

    window.addEventListener("message", onMessage);
    // Mount READY covers READY-before-load. Load + bounded retries recover
    // when the parent clears readiness on a late iframe onLoad (including
    // the case where document.readyState is already "complete").
    postReady();
    window.addEventListener("load", postReady);
    const retryTimers = [0, 25, 100].map((ms) =>
      window.setTimeout(postReady, ms),
    );

    return () => {
      window.removeEventListener("message", onMessage);
      window.removeEventListener("load", postReady);
      for (const timer of retryTimers) {
        window.clearTimeout(timer);
      }
    };
  }, [documentId]);

  const presentation = presentationFromDesign(design, "canonical-default", null);

  return (
    <div
      inert
      aria-hidden="true"
      className="pointer-events-none select-none"
      data-studio-preview-inert="true"
      data-studio-preview-theme={design.theme.presetId}
      data-studio-preview-font={design.typography.fontFamilyId}
      data-studio-preview-document={documentId}
    >
      <HomePresentation
        content={content}
        banner={banner}
        presentation={presentation}
      />
    </div>
  );
}
