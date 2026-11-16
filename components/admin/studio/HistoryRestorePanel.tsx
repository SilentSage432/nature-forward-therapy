"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import { RestoreDesignDialog } from "@/components/admin/studio/RestoreDesignDialog";
import { restoreSiteDesignVersionAction } from "@/lib/actions/site-design";
import {
  buildRestoreActionInput,
  buildRestoreConfirmSnapshot,
  isCurrentlyLiveVersion,
  mapRestoreActionResult,
  type RestoreNotice,
} from "@/lib/site-design/restore-ui";
import { formatStudioTimestamp } from "@/lib/site-design/studio-status";
import type { SiteDesignVersionSummary } from "@/lib/site-design/types";

type HistoryRestorePanelProps = {
  versions: SiteDesignVersionSummary[];
  draftRevision: number;
  publishedRevision: number;
  versionsError: string | null;
};

type PanelNotice =
  | { tone: "success"; message: string }
  | { tone: "conflict"; message: string; actualDraftRevision?: number }
  | { tone: "error"; message: string; issues?: string[] }
  | null;

function noticeFromRestore(notice: RestoreNotice): PanelNotice {
  if (notice.tone === "success") {
    return { tone: "success", message: notice.message };
  }
  if (notice.tone === "conflict") {
    return {
      tone: "conflict",
      message: notice.message,
      actualDraftRevision: notice.actualDraftRevision,
    };
  }
  return {
    tone: "error",
    message: notice.message,
    issues: notice.issues,
  };
}

export function HistoryRestorePanel({
  versions,
  draftRevision: initialDraftRevision,
  publishedRevision: initialPublishedRevision,
  versionsError,
}: HistoryRestorePanelProps) {
  const router = useRouter();
  const [draftRevision, setDraftRevision] = useState(initialDraftRevision);
  const [publishedRevision, setPublishedRevision] = useState(
    initialPublishedRevision,
  );
  const [notice, setNotice] = useState<PanelNotice>(null);
  const [pending, startTransition] = useTransition();
  const [confirmVersion, setConfirmVersion] =
    useState<SiteDesignVersionSummary | null>(null);
  const restoreInFlightRef = useRef(false);
  const restoreTriggerRef = useRef<HTMLElement | null>(null);

  const confirmSnapshot = useMemo(() => {
    if (!confirmVersion) return null;
    return buildRestoreConfirmSnapshot({
      version: confirmVersion,
      draftRevision,
      publishedRevision,
      publishedAtLabel: formatStudioTimestamp(confirmVersion.publishedAt),
    });
  }, [confirmVersion, draftRevision, publishedRevision]);

  function requestRestore(version: SiteDesignVersionSummary) {
    if (pending || restoreInFlightRef.current) return;
    restoreTriggerRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setNotice(null);
    setConfirmVersion(version);
  }

  function cancelRestore() {
    setConfirmVersion(null);
    queueMicrotask(() => restoreTriggerRef.current?.focus());
  }

  function confirmRestore() {
    if (!confirmVersion || restoreInFlightRef.current) return;
    restoreInFlightRef.current = true;
    const versionId = confirmVersion.id;
    const expectedDraftRevision = draftRevision;

    startTransition(async () => {
      try {
        const result = await restoreSiteDesignVersionAction(
          buildRestoreActionInput({
            versionId,
            expectedDraftRevision,
          }),
        );

        const mapped = mapRestoreActionResult(result);
        setNotice(noticeFromRestore(mapped));

        if (result.ok) {
          setDraftRevision(result.data.draftRevision);
          setPublishedRevision(result.data.publishedRevision);
          setConfirmVersion(null);
          router.refresh();
        }
      } catch {
        setNotice({
          tone: "error",
          message:
            "Restore could not be confirmed (network or server error). The draft and live website may or may not have changed — reload History before trying again. No automatic retry was performed.",
        });
      } finally {
        restoreInFlightRef.current = false;
      }
    });
  }

  return (
    <section className="rounded-2xl border border-sage-dark/30 bg-forest-soft/70 p-6">
      <h2 className="font-heading text-xl font-semibold text-white">
        Published versions
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-sage-light">
        History is created when a design is published. Restore to Draft copies a
        snapshot into your private draft only — the live website stays unchanged
        until you Publish from Design.
      </p>
      <p className="mt-2 text-xs text-sage-dark">
        Current draft revision {draftRevision}
        {publishedRevision > 0
          ? ` · live published revision ${publishedRevision}`
          : " · live site on canonical default"}
        .
      </p>

      {notice ? (
        <div
          role="status"
          aria-live="polite"
          className={`mt-5 rounded-xl border px-4 py-3 text-sm ${
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
          {notice.tone === "success" ? (
            <p className="mt-3">
              <Link
                href="/admin/studio/design"
                className="inline-flex min-h-[44px] items-center rounded-lg border border-emerald-300/40 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-300/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              >
                Open Design to review restored draft
              </Link>
            </p>
          ) : null}
          {notice.tone === "conflict" ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  router.refresh();
                  window.location.reload();
                }}
                className="inline-flex min-h-[44px] items-center rounded-lg border border-amber-300/40 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-300/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              >
                Reload History
              </button>
              {typeof notice.actualDraftRevision === "number" ? (
                <p className="inline-flex min-h-[44px] items-center text-xs text-amber-100/80">
                  Server draft revision: {notice.actualDraftRevision}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {versionsError ? (
        <p className="mt-5 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          {versionsError}
        </p>
      ) : versions.length === 0 ? (
        <div className="mt-5 rounded-xl border border-sage-dark/30 bg-forest/40 px-4 py-5">
          <p className="font-heading text-lg text-white">No publications yet</p>
          <p className="mt-2 text-sm text-sage-light">
            The live website is using the established default design. When you
            publish from Design, immutable snapshots will be listed here for
            restore.
          </p>
          <p className="mt-3">
            <Link
              href="/admin/studio/design"
              className="text-sm font-semibold text-gold underline-offset-2 hover:underline"
            >
              Open Design
            </Link>
          </p>
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {versions.map((version) => {
            const live = isCurrentlyLiveVersion(version, publishedRevision);
            return (
              <li
                key={version.id}
                className="rounded-xl border border-sage-dark/30 bg-forest/40 px-4 py-4"
                data-studio-history-version={version.id}
                data-studio-history-revision={version.revision}
                data-studio-history-live={live ? "true" : "false"}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-heading text-base font-semibold text-white">
                      Published revision {version.revision}
                    </p>
                    {live ? (
                      <p className="mt-1 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                        Currently live
                      </p>
                    ) : null}
                    <p className="mt-1 text-sm text-sage-light">
                      {formatStudioTimestamp(version.publishedAt) ??
                        version.publishedAt}
                      {version.publishedByEmail
                        ? ` · ${version.publishedByEmail}`
                        : ""}
                    </p>
                    {version.themeLabel ? (
                      <p className="mt-1 text-xs text-sage-dark">
                        Palette: {version.themeLabel}
                      </p>
                    ) : null}
                    {version.typographyLabel ? (
                      <p className="text-xs text-sage-dark">
                        Typography: {version.typographyLabel}
                      </p>
                    ) : null}
                    {version.note ? (
                      <p className="mt-2 text-sm text-sage-light">{version.note}</p>
                    ) : null}
                    {typeof version.sourceRevision === "number" ? (
                      <p className="mt-1 text-xs text-sage-dark">
                        Restored from revision {version.sourceRevision} before
                        this publish
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => requestRestore(version)}
                    disabled={pending}
                    data-studio-restore-request={version.id}
                    className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-lg border border-gold/50 bg-gold/10 px-4 py-2 text-sm font-semibold text-gold transition hover:bg-gold/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:opacity-60"
                  >
                    Restore to Draft…
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <RestoreDesignDialog
        open={confirmVersion != null}
        snapshot={confirmSnapshot}
        pending={pending}
        onCancel={cancelRestore}
        onConfirm={confirmRestore}
      />
    </section>
  );
}
