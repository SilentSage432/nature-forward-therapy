"use client";

import { useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DesignControlPanel } from "@/components/admin/studio/DesignControlPanel";
import {
  DesignPreviewPane,
  type DesignPreviewMode,
} from "@/components/admin/studio/DesignPreviewPane";
import { StudioShellHeader } from "@/components/admin/studio/StudioShellHeader";
import { StudioStatusCards } from "@/components/admin/studio/StudioStatusCards";
import { UnsavedDesignNavigationGuard } from "@/components/admin/studio/UnsavedDesignNavigationGuard";
import { saveSiteDesignDraftAction } from "@/lib/actions/site-design";
import { designsEqual } from "@/lib/site-design/studio-status";
import type { SiteDesign } from "@/lib/site-design/schema";
import type {
  SiteBodyScaleId,
  SiteFontFamilyId,
  SiteHeadingScaleId,
  SiteThemePresetId,
} from "@/lib/site-design/schema";
import type { SiteDesignWorkspace } from "@/lib/site-design/types";

type DesignEditorProps = {
  workspace: SiteDesignWorkspace;
  initialDraft: SiteDesign;
};

type SaveNotice =
  | { tone: "success"; message: string }
  | { tone: "error"; message: string; issues?: string[] }
  | { tone: "conflict"; message: string; actualRevision?: number }
  | null;

export function DesignEditor({ workspace, initialDraft }: DesignEditorProps) {
  const router = useRouter();
  const [baseline, setBaseline] = useState<SiteDesign>(initialDraft);
  const [draft, setDraft] = useState<SiteDesign>(initialDraft);
  const [draftRevision, setDraftRevision] = useState(workspace.draftRevision);
  const [publishedRevision, setPublishedRevision] = useState(
    workspace.publishedRevision,
  );
  const [previewMode, setPreviewMode] = useState<DesignPreviewMode>("desktop");
  const [notice, setNotice] = useState<SaveNotice>(null);
  const [reloadConfirmOpen, setReloadConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const reloadTitleId = useId();
  const reloadDescriptionId = useId();
  const reloadStayRef = useRef<HTMLButtonElement>(null);
  const reloadTriggerRef = useRef<HTMLElement | null>(null);

  const dirty = useMemo(() => !designsEqual(draft, baseline), [draft, baseline]);

  const statusWorkspace: SiteDesignWorkspace = {
    ...workspace,
    draft,
    draftRevision,
    publishedRevision,
    draftValid: true,
    publishedValid: true,
  };

  useEffect(() => {
    if (!dirty) return;
    function onBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  function updateDraft(next: SiteDesign) {
    setDraft(next);
    setNotice(null);
  }

  function onThemeChange(presetId: SiteThemePresetId) {
    updateDraft({
      ...draft,
      theme: { presetId },
    });
  }

  function onFontFamilyChange(fontFamilyId: SiteFontFamilyId) {
    updateDraft({
      ...draft,
      typography: { ...draft.typography, fontFamilyId },
    });
  }

  function onHeadingScaleChange(headingScaleId: SiteHeadingScaleId) {
    updateDraft({
      ...draft,
      typography: { ...draft.typography, headingScaleId },
    });
  }

  function onBodyScaleChange(bodyScaleId: SiteBodyScaleId) {
    updateDraft({
      ...draft,
      typography: { ...draft.typography, bodyScaleId },
    });
  }

  function handleSave() {
    startTransition(async () => {
      const result = await saveSiteDesignDraftAction({
        expectedDraftRevision: draftRevision,
        design: draft,
      });

      if (result.ok) {
        setBaseline(result.data.draft);
        setDraft(result.data.draft);
        setDraftRevision(result.data.draftRevision);
        setPublishedRevision(result.data.publishedRevision);
        setNotice({
          tone: "success",
          message: "Draft saved. The live website was not changed.",
        });
        router.refresh();
        return;
      }

      if (result.code === "CONFLICT") {
        setNotice({
          tone: "conflict",
          message:
            result.message ||
            "Someone else saved a newer draft. Your unsaved choices are still here — reload to review the saved draft, or keep editing carefully.",
          actualRevision: result.actualDraftRevision,
        });
        return;
      }

      setNotice({
        tone: "error",
        message: result.message || "Could not save the draft.",
        issues: "issues" in result ? result.issues : undefined,
      });
    });
  }

  function requestReloadSavedDraft() {
    if (!dirty) {
      router.refresh();
      window.location.reload();
      return;
    }
    reloadTriggerRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setReloadConfirmOpen(true);
  }

  function confirmReloadSavedDraft() {
    setReloadConfirmOpen(false);
    router.refresh();
    window.location.reload();
  }

  useEffect(() => {
    if (!reloadConfirmOpen) return;
    reloadStayRef.current?.focus();
  }, [reloadConfirmOpen]);

  return (
    <UnsavedDesignNavigationGuard dirty={dirty}>
      <div className="space-y-6">
        <StudioShellHeader
          title="Design"
          description="Adjust curated colors and typography, preview privately, then save a draft when ready."
        />

        <StudioStatusCards workspace={statusWorkspace} />

        <div className="flex flex-col gap-3 rounded-2xl border border-sage-dark/30 bg-forest/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm">
            {dirty ? (
              <p className="font-semibold text-amber-200" aria-live="polite">
                You have unsaved design changes.
              </p>
            ) : (
              <p className="text-sage-light" aria-live="polite">
                Draft matches the last saved version (revision {draftRevision}).
              </p>
            )}
            <p className="mt-1 text-xs text-sage-dark">
              Saving updates the private draft only. Publishing is not available
              in this tranche.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={pending || !dirty}
              className="btn-gold inline-flex min-h-[44px] items-center rounded-lg px-5 py-2.5 font-heading text-sm font-semibold text-forest disabled:opacity-60"
            >
              {pending ? "Saving…" : "Save Draft"}
            </button>
          </div>
        </div>

        {notice ? (
          <div
            role="status"
            aria-live="polite"
            className={`rounded-2xl border px-4 py-3 text-sm ${
              notice.tone === "success"
                ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100"
                : notice.tone === "conflict"
                  ? "border-amber-400/40 bg-amber-400/10 text-amber-100"
                  : "border-red-400/40 bg-red-400/10 text-red-100"
            }`}
          >
            <p>{notice.message}</p>
            {notice.tone === "error" && notice.issues?.length ? (
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {notice.issues.slice(0, 8).map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            ) : null}
            {notice.tone === "conflict" ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={requestReloadSavedDraft}
                  className="inline-flex min-h-[44px] items-center rounded-lg border border-amber-300/40 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-300/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                >
                  Reload saved draft
                </button>
                {typeof notice.actualRevision === "number" ? (
                  <p className="inline-flex min-h-[44px] items-center text-xs text-amber-100/80">
                    Server draft revision: {notice.actualRevision}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]">
          <DesignControlPanel
            design={draft}
            disabled={pending}
            onThemeChange={onThemeChange}
            onFontFamilyChange={onFontFamilyChange}
            onHeadingScaleChange={onHeadingScaleChange}
            onBodyScaleChange={onBodyScaleChange}
          />
          <DesignPreviewPane
            design={draft}
            mode={previewMode}
            onModeChange={setPreviewMode}
          />
        </div>
      </div>

      {reloadConfirmOpen ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4"
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={reloadTitleId}
            aria-describedby={reloadDescriptionId}
            className="w-full max-w-md rounded-2xl border border-sage-dark/40 bg-forest p-5 shadow-xl"
          >
            <h2
              id={reloadTitleId}
              className="font-heading text-xl font-semibold text-white"
            >
              Reload the saved draft?
            </h2>
            <p id={reloadDescriptionId} className="mt-2 text-sm text-sage-light">
              Unsaved choices in this panel will be discarded. The live website
              is not affected.
            </p>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                ref={reloadStayRef}
                type="button"
                onClick={() => {
                  setReloadConfirmOpen(false);
                  queueMicrotask(() => reloadTriggerRef.current?.focus());
                }}
                className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-gold/50 bg-gold/10 px-4 py-2 text-sm font-semibold text-gold transition hover:bg-gold/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              >
                Stay and continue editing
              </button>
              <button
                type="button"
                onClick={confirmReloadSavedDraft}
                className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-sage-dark/40 px-4 py-2 text-sm font-semibold text-sage-light transition hover:border-red-300/40 hover:text-red-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              >
                Discard changes and reload
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </UnsavedDesignNavigationGuard>
  );
}
