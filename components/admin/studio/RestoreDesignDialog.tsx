"use client";

import { useEffect, useId, useRef } from "react";
import type { RestoreConfirmSnapshot } from "@/lib/site-design/restore-ui";

type RestoreDesignDialogProps = {
  open: boolean;
  snapshot: RestoreConfirmSnapshot | null;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function RestoreDesignDialog({
  open,
  snapshot,
  pending,
  onCancel,
  onConfirm,
}: RestoreDesignDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
  }, [open]);

  if (!open || !snapshot) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-sage-dark/40 bg-forest p-5 shadow-xl"
        data-studio-restore-dialog=""
      >
        <h2
          id={titleId}
          className="font-heading text-xl font-semibold text-white"
        >
          Restore this version to draft?
        </h2>
        <p id={descriptionId} className="mt-2 text-sm text-sage-light">
          This replaces your current private draft with the selected published
          snapshot. The live website will not change. Publishing later remains
          a separate, explicit step.
        </p>

        <dl className="mt-4 space-y-3 rounded-xl border border-sage-dark/30 bg-forest-soft/60 p-4 text-sm">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-gold">
              Selected published version
            </dt>
            <dd className="mt-1 text-sage-light">
              <span className="font-semibold text-white">
                Published revision {snapshot.sourceRevision}
              </span>
              {snapshot.isCurrentlyLive ? (
                <span className="mt-1 block text-xs font-semibold text-emerald-300">
                  Currently live on the public website
                </span>
              ) : null}
              {snapshot.publishedAtLabel ? (
                <span className="mt-1 block text-xs text-sage-dark">
                  {snapshot.publishedAtLabel}
                </span>
              ) : null}
              {snapshot.publishedByEmail ? (
                <span className="block text-xs text-sage-dark">
                  {snapshot.publishedByEmail}
                </span>
              ) : null}
              {snapshot.themeLabel ? (
                <span className="mt-1 block text-xs text-sage-dark">
                  Palette: {snapshot.themeLabel}
                </span>
              ) : null}
              {snapshot.typographyLabel ? (
                <span className="block text-xs text-sage-dark">
                  Typography: {snapshot.typographyLabel}
                </span>
              ) : null}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-gold">
              What happens next
            </dt>
            <dd className="mt-1 space-y-1 text-xs text-sage-light">
              <p>
                Current draft revision {snapshot.currentDraftRevision} will be
                replaced. Unsaved Design edits that were never saved are not
                part of this History restore — only the saved draft on the
                server is replaced.
              </p>
              <p>
                Live published revision stays at{" "}
                {snapshot.currentPublishedRevision > 0
                  ? snapshot.currentPublishedRevision
                  : "canonical default"}
                . Visitors will not see this restore until you Publish from
                Design.
              </p>
            </dd>
          </div>
        </dl>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-gold/50 bg-gold/10 px-4 py-2 text-sm font-semibold text-gold transition hover:bg-gold/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            data-studio-restore-confirm=""
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-sage-dark/40 px-4 py-2 text-sm font-semibold text-sage-light transition hover:border-amber-300/40 hover:text-amber-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:opacity-60"
          >
            {pending ? "Restoring…" : "Restore to Draft"}
          </button>
        </div>
      </div>
    </div>
  );
}
