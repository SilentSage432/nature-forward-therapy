"use client";

import { useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DesignControlPanel } from "@/components/admin/studio/DesignControlPanel";
import {
  DesignPreviewPane,
  type DesignPreviewMode,
} from "@/components/admin/studio/DesignPreviewPane";
import { PublishDesignDialog } from "@/components/admin/studio/PublishDesignDialog";
import { StudioShellHeader } from "@/components/admin/studio/StudioShellHeader";
import { UnsavedDesignNavigationGuard } from "@/components/admin/studio/UnsavedDesignNavigationGuard";
import {
  publishSiteDesignAction,
  saveSiteDesignDraftAction,
} from "@/lib/actions/site-design";
import {
  fontFamilyDisplayLabel,
  themeDisplayLabel,
} from "@/lib/site-design/options";
import {
  buildPublishActionInput,
  buildPublishConfirmSnapshot,
  getPublishEligibility,
  mapPublishActionResult,
  publishEligibilityHint,
  type PublishNotice,
} from "@/lib/site-design/publish-ui";
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

type EditorNotice =
  | { tone: "success"; message: string }
  | { tone: "warning"; message: string }
  | { tone: "error"; message: string; issues?: string[] }
  | {
      tone: "conflict";
      message: string;
      actualRevision?: number;
      actualPublishedRevision?: number;
    }
  | null;

function noticeFromPublish(notice: PublishNotice): EditorNotice {
  if (notice.tone === "success") {
    return { tone: "success", message: notice.message };
  }
  if (notice.tone === "warning") {
    return { tone: "warning", message: notice.message };
  }
  if (notice.tone === "conflict") {
    return {
      tone: "conflict",
      message: notice.message,
      actualRevision: notice.actualDraftRevision,
      actualPublishedRevision: notice.actualPublishedRevision,
    };
  }
  return {
    tone: "error",
    message: notice.message,
    issues: notice.issues,
  };
}

export function DesignEditor({ workspace, initialDraft }: DesignEditorProps) {
  const router = useRouter();
  const [baseline, setBaseline] = useState<SiteDesign>(initialDraft);
  const [draft, setDraft] = useState<SiteDesign>(initialDraft);
  const [published, setPublished] = useState<SiteDesign>(workspace.published);
  const [draftRevision, setDraftRevision] = useState(workspace.draftRevision);
  const [publishedRevision, setPublishedRevision] = useState(
    workspace.publishedRevision,
  );
  const [publishedAt, setPublishedAt] = useState(workspace.publishedAt);
  const [previewMode, setPreviewMode] = useState<DesignPreviewMode>("desktop");
  const [notice, setNotice] = useState<EditorNotice>(null);
  const [reloadConfirmOpen, setReloadConfirmOpen] = useState(false);
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const publishInFlightRef = useRef(false);
  const reloadTitleId = useId();
  const reloadDescriptionId = useId();
  const reloadStayRef = useRef<HTMLButtonElement>(null);
  const reloadTriggerRef = useRef<HTMLElement | null>(null);
  const publishTriggerRef = useRef<HTMLElement | null>(null);

  const dirty = useMemo(() => !designsEqual(draft, baseline), [draft, baseline]);

  const publishEligibility = useMemo(
    () =>
      getPublishEligibility({
        dirty,
        pending,
        draft,
        published,
      }),
    [dirty, pending, draft, published],
  );

  const publishHint = publishEligibilityHint(publishEligibility);

  const publishSnapshot = useMemo(() => {
    if (!publishConfirmOpen) return null;
    return buildPublishConfirmSnapshot({
      draft,
      published,
      draftRevision,
      publishedRevision,
    });
  }, [publishConfirmOpen, draft, published, draftRevision, publishedRevision]);

  const draftMatchesPublished = designsEqual(draft, published);
  const savedDraftThemeLabel = themeDisplayLabel(baseline.theme.presetId);
  const liveThemeLabel = themeDisplayLabel(published.theme.presetId);
  const draftFontLabel = fontFamilyDisplayLabel(draft.typography.fontFamilyId);

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
          actualPublishedRevision: result.actualPublishedRevision,
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

  function requestPublish() {
    if (!publishEligibility.canRequestPublish || publishInFlightRef.current) {
      return;
    }
    publishTriggerRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setNotice(null);
    setPublishConfirmOpen(true);
  }

  function cancelPublish() {
    setPublishConfirmOpen(false);
    queueMicrotask(() => publishTriggerRef.current?.focus());
  }

  function confirmPublish() {
    if (publishInFlightRef.current || dirty) {
      return;
    }
    publishInFlightRef.current = true;
    startTransition(async () => {
      try {
        const result = await publishSiteDesignAction(
          buildPublishActionInput({
            expectedDraftRevision: draftRevision,
            expectedPublishedRevision: publishedRevision,
          }),
        );

        const mapped = mapPublishActionResult(result);
        setNotice(noticeFromPublish(mapped));

        if (result.ok) {
          setPublished(result.data.published);
          setPublishedRevision(result.data.publishedRevision);
          setDraftRevision(result.data.draftRevision);
          setPublishedAt(new Date().toISOString());
          setPublishConfirmOpen(false);
          router.refresh();
        }
      } catch {
        setNotice({
          tone: "error",
          message:
            "Publish could not be confirmed (network or server error). The public website may or may not have changed — reload before trying again. No automatic retry was performed.",
        });
      } finally {
        publishInFlightRef.current = false;
      }
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
      <div className="space-y-4" data-design-workspace="">
        <StudioShellHeader
          title="Design"
          description="Adjust curated colors and typography, preview privately, save a draft, then publish when you are ready for the public site."
        />

        <div
          className="sticky top-0 z-20 flex flex-col gap-3 rounded-2xl border border-sage-dark/30 bg-forest/95 px-4 py-3 shadow-lg shadow-black/20 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between"
          data-design-session-strip=""
        >
          <div className="min-w-0 text-sm">
            <div className="flex flex-wrap gap-2" data-design-status-compact="">
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
                  dirty
                    ? "border-amber-300/40 bg-amber-400/10 text-amber-100"
                    : "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                }`}
              >
                {dirty ? "Unsaved changes" : "Draft saved"}
              </span>
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
                  draftMatchesPublished
                    ? "border-sage-dark/40 bg-forest-soft text-sage-light"
                    : "border-gold/35 bg-gold/10 text-gold"
                }`}
              >
                {draftMatchesPublished
                  ? "Matches live"
                  : "Differs from live"}
              </span>
              <span className="inline-flex items-center rounded-full border border-sage-dark/35 bg-forest-soft/80 px-2.5 py-1 text-xs text-sage-light">
                Draft r{draftRevision}
                {publishedRevision > 0
                  ? ` · Live r${publishedRevision}`
                  : " · Live default"}
              </span>
            </div>
            {dirty ? (
              <p className="mt-2 font-semibold text-amber-200" aria-live="polite">
                You have unsaved design changes.
              </p>
            ) : draftMatchesPublished ? (
              <p className="mt-2 text-sage-light" aria-live="polite">
                Saved draft matches what is live ({savedDraftThemeLabel} ·{" "}
                {draftFontLabel}).
              </p>
            ) : (
              <p className="mt-2 text-sage-light" aria-live="polite">
                Saved draft ready to publish. Live remains {liveThemeLabel}
                {publishedAt ? ` · last published ${new Date(publishedAt).toLocaleString()}` : ""}.
              </p>
            )}
            <p className="mt-1 text-xs text-sage-dark">
              Saving updates the private draft only. Publishing requires an
              explicit confirmation and changes the public website. Rich status
              lives on Studio Overview.
            </p>
            {publishHint ? (
              <p className="mt-1 text-xs text-sage-light" aria-live="polite">
                {publishHint}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={pending || !dirty}
              className="btn-gold inline-flex min-h-[44px] items-center rounded-lg px-5 py-2.5 font-heading text-sm font-semibold text-forest disabled:opacity-60"
            >
              {pending && dirty ? "Saving…" : "Save Draft"}
            </button>
            <button
              type="button"
              onClick={requestPublish}
              disabled={!publishEligibility.canRequestPublish}
              data-studio-publish-request=""
              className="inline-flex min-h-[44px] items-center rounded-lg border border-gold/50 bg-gold/10 px-5 py-2.5 font-heading text-sm font-semibold text-gold transition hover:bg-gold/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:opacity-60"
            >
              Publish…
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
                : notice.tone === "warning"
                  ? "border-sky-400/40 bg-sky-400/10 text-sky-100"
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
                    {typeof notice.actualPublishedRevision === "number"
                      ? ` · published: ${notice.actualPublishedRevision}`
                      : ""}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        <div
          className="flex min-w-0 flex-col gap-4 xl:grid xl:grid-cols-[minmax(260px,340px)_minmax(0,1fr)] xl:items-start xl:gap-5"
          data-design-workspace-panes=""
        >
          <div
            className="order-2 min-w-0 xl:order-1 xl:max-h-[calc(100dvh-11rem)] xl:overflow-y-auto xl:overscroll-contain"
            data-design-control-scroll=""
          >
            <DesignControlPanel
              design={draft}
              disabled={pending}
              onThemeChange={onThemeChange}
              onFontFamilyChange={onFontFamilyChange}
              onHeadingScaleChange={onHeadingScaleChange}
              onBodyScaleChange={onBodyScaleChange}
            />
          </div>
          <div
            className="order-1 min-w-0 xl:order-2 xl:sticky xl:top-[5.5rem] xl:self-start"
            data-design-preview-persist=""
          >
            <DesignPreviewPane
              design={draft}
              mode={previewMode}
              onModeChange={setPreviewMode}
            />
          </div>
        </div>
      </div>

      <PublishDesignDialog
        open={publishConfirmOpen}
        snapshot={publishSnapshot}
        pending={pending}
        onCancel={cancelPublish}
        onConfirm={confirmPublish}
      />

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
