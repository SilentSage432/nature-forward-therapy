"use client";

import { useEffect, useId, useRef } from "react";
import {
  accessibilityConfirmSummary,
  type PublishConfirmSnapshot,
} from "@/lib/site-design/publish-ui";

type PublishDesignDialogProps = {
  open: boolean;
  snapshot: PublishConfirmSnapshot | null;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function PublishDesignDialog({
  open,
  snapshot,
  pending,
  onCancel,
  onConfirm,
}: PublishDesignDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
  }, [open]);

  if (!open || !snapshot) return null;

  const a11y = snapshot.accessibility;
  const failingPairs = a11y.failing;

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
        data-studio-publish-dialog=""
      >
        <h2
          id={titleId}
          className="font-heading text-xl font-semibold text-white"
        >
          Publish this design to the live website?
        </h2>
        <p id={descriptionId} className="mt-2 text-sm text-sage-light">
          Publishing replaces what visitors see on the public site. This does
          not save unsaved edits — only the already-saved draft is published.
        </p>

        <dl className="mt-4 space-y-3 rounded-xl border border-sage-dark/30 bg-forest-soft/60 p-4 text-sm">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-gold">
              Currently live
            </dt>
            <dd className="mt-1 text-sage-light">
              <span className="font-semibold text-white">
                {snapshot.liveThemeLabel}
              </span>
              <span className="block text-xs text-sage-dark">
                {snapshot.liveTypographyLabel}
              </span>
              <span className="mt-1 block text-xs text-sage-dark">
                {snapshot.liveRevisionLabel}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-gold">
              Will become live
            </dt>
            <dd className="mt-1 text-sage-light">
              <span className="font-semibold text-white">
                {snapshot.candidateThemeLabel}
              </span>
              <span className="block text-xs text-sage-dark">
                {snapshot.candidateTypographyLabel}
              </span>
              <span className="mt-1 block text-xs text-sage-dark">
                Saved draft revision {snapshot.draftRevision}
              </span>
            </dd>
          </div>
        </dl>

        <div
          className={`mt-4 rounded-xl border px-3 py-3 text-sm ${
            a11y.failingCount > 0
              ? "border-amber-400/40 bg-amber-400/10 text-amber-100"
              : "border-sky-400/35 bg-sky-400/10 text-sky-100"
          }`}
          data-publish-a11y-summary=""
          data-a11y-overall={a11y.overallStatus}
        >
          <p className="font-semibold">Accessibility readiness (informational)</p>
          <p className="mt-1 text-xs leading-relaxed opacity-95">
            {accessibilityConfirmSummary(a11y)}
          </p>
          {failingPairs.length > 0 ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
              {failingPairs.slice(0, 6).map((pair) => (
                <li key={pair.id}>
                  {pair.label}: {pair.statusLabel}
                  {pair.ratio != null
                    ? ` (${pair.ratio.toFixed(2)}:1)`
                    : ""}
                </li>
              ))}
            </ul>
          ) : null}
          <p className="mt-2 text-xs opacity-90">
            Rendered browser checks and manual review are separate from these
            solid-color Studio checks.
          </p>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-sage-dark/40 px-4 py-2 text-sm font-semibold text-sage-light transition hover:border-gold/40 hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            data-studio-publish-confirm=""
            className="btn-gold inline-flex min-h-[44px] items-center justify-center rounded-lg px-4 py-2 font-heading text-sm font-semibold text-forest disabled:opacity-60"
          >
            {pending ? "Publishing…" : "Publish to live website"}
          </button>
        </div>
      </div>
    </div>
  );
}
