"use client";

import { useEffect, useRef, useState } from "react";
import type { SiteDesign } from "@/lib/site-design/schema";
import {
  createStudioPreviewSetDesignMessage,
  parseStudioPreviewMessage,
} from "@/lib/site-design/preview-protocol";

export type DesignPreviewMode = "desktop" | "mobile";

type DesignPreviewPaneProps = {
  design: SiteDesign;
  mode: DesignPreviewMode;
  onModeChange: (mode: DesignPreviewMode) => void;
};

export function DesignPreviewPane({
  design,
  mode,
  onModeChange,
}: DesignPreviewPaneProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const latestDesignRef = useRef(design);
  const [frameReady, setFrameReady] = useState(false);

  useEffect(() => {
    latestDesignRef.current = design;
  }, [design]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      const frameWindow = iframeRef.current?.contentWindow ?? null;
      const parsed = parseStudioPreviewMessage(event.data, {
        expectedOrigin: window.location.origin,
        actualOrigin: event.origin,
        eventSource: event.source,
        expectedSource: frameWindow,
      });
      if (!parsed.ok) return;
      if (parsed.message.type === "STUDIO_PREVIEW_READY") {
        setFrameReady(true);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    if (!frameReady) return;
    const frameWindow = iframeRef.current?.contentWindow;
    if (!frameWindow) return;
    frameWindow.postMessage(
      createStudioPreviewSetDesignMessage(latestDesignRef.current),
      window.location.origin,
    );
  }, [design, frameReady]);

  return (
    <section
      aria-label="Private draft preview"
      className="overflow-hidden rounded-2xl border border-sage-dark/30 bg-forest-soft/40"
    >
      <div className="flex flex-col gap-3 border-b border-sage-dark/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-heading text-lg font-semibold text-white">
            Draft preview
          </h2>
          <p className="text-sm text-sage-light">
            Private preview of unsaved and saved draft choices. Not the live
            website.
          </p>
        </div>
        <div
          role="group"
          aria-label="Preview size"
          className="flex flex-wrap gap-2"
        >
          {(
            [
              ["desktop", "Desktop"],
              ["mobile", "Mobile"],
            ] as const
          ).map(([id, label]) => {
            const active = mode === id;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={active}
                aria-label={`${label} preview`}
                onClick={() => onModeChange(id)}
                className={`inline-flex min-h-[44px] items-center rounded-lg border px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${
                  active
                    ? "border-gold/50 bg-gold/10 text-gold"
                    : "border-sage-dark/40 text-sage-light hover:border-gold/30 hover:text-gold"
                }`}
              >
                {label}
              </button>
            );
          })}
          <p className="inline-flex min-h-[44px] items-center text-xs font-semibold tracking-wide text-gold/90 uppercase">
            Read-only
          </p>
        </div>
      </div>

      <div className="bg-black/20 p-3 sm:p-4">
        <div
          className={`mx-auto overflow-hidden rounded-xl border border-sage-dark/40 bg-forest shadow-inner ${
            mode === "mobile" ? "max-w-[390px]" : "max-w-5xl"
          }`}
        >
          <div className="max-h-[70vh] overflow-auto">
            <iframe
              ref={iframeRef}
              title="Private website draft preview"
              src="/admin/studio/preview-frame"
              className="block w-full border-0 bg-forest"
              style={{
                width: "100%",
                height: mode === "mobile" ? 720 : 820,
                pointerEvents: "none",
              }}
              tabIndex={-1}
              loading="eager"
              onLoad={() => {
                // Require a fresh READY after every frame load to avoid stale races.
                setFrameReady(false);
              }}
            />
          </div>
        </div>
        <p className="mt-3 text-xs text-sage-dark">
          {mode === "mobile"
            ? "Mobile mode uses a 390px-wide preview frame so responsive layout can reflow."
            : "Desktop mode uses the full preview width available in Studio."}{" "}
          Preview content cannot be clicked or focused.
        </p>
      </div>
    </section>
  );
}
