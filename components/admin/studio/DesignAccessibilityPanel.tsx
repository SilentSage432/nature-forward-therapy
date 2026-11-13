"use client";

import { useId, useMemo } from "react";
import type { SiteDesign } from "@/lib/site-design/schema";
import {
  evaluateDesignAccessibility,
  formatContrastRatio,
  formatContrastThreshold,
  type DesignAccessibilityEvaluation,
  type DesignAccessibilityPairFinding,
} from "@/lib/site-design/accessibility-evaluation";

type DesignAccessibilityPanelProps = {
  design: SiteDesign;
};

function overallToneClass(
  status: DesignAccessibilityEvaluation["overallStatus"],
): string {
  switch (status) {
    case "deterministic-issues":
      return "border-amber-400/40 bg-amber-400/10";
    case "review-recommended":
      return "border-sky-400/40 bg-sky-400/10";
    case "deterministic-passed":
    default:
      return "border-emerald-400/35 bg-emerald-400/10";
  }
}

function overallTextClass(
  status: DesignAccessibilityEvaluation["overallStatus"],
): string {
  switch (status) {
    case "deterministic-issues":
      return "text-amber-100";
    case "review-recommended":
      return "text-sky-100";
    case "deterministic-passed":
    default:
      return "text-emerald-100";
  }
}

function PairRow({ pair }: { pair: DesignAccessibilityPairFinding }) {
  return (
    <li
      className="min-w-0 rounded-lg border border-sage-dark/25 bg-forest/40 px-3 py-2.5"
      data-a11y-pair={pair.id}
      data-a11y-classification={pair.classification}
    >
      <p className="text-sm font-semibold text-white">{pair.label}</p>
      <dl className="mt-1.5 grid gap-1 text-xs text-sage-light">
        <div className="flex min-w-0 flex-wrap gap-x-2 gap-y-0.5">
          <dt className="text-sage-dark">Status</dt>
          <dd className="text-sage-light">{pair.statusLabel}</dd>
        </div>
        <div className="flex min-w-0 flex-wrap gap-x-2 gap-y-0.5">
          <dt className="text-sage-dark">Contrast</dt>
          <dd className="tabular-nums text-sage-light">
            {formatContrastRatio(pair.ratio)}
          </dd>
        </div>
        <div className="flex min-w-0 flex-wrap gap-x-2 gap-y-0.5">
          <dt className="text-sage-dark">Studio minimum</dt>
          <dd className="text-sage-light">
            {formatContrastThreshold(pair.minimum, pair.threshold)}
          </dd>
        </div>
      </dl>
    </li>
  );
}

function PairSection({
  title,
  pairs,
  emptyLabel,
}: {
  title: string;
  pairs: DesignAccessibilityPairFinding[];
  emptyLabel?: string;
}) {
  if (pairs.length === 0 && !emptyLabel) return null;
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-gold/80">
        {title}
      </h4>
      {pairs.length === 0 ? (
        <p className="text-xs text-sage-light">{emptyLabel}</p>
      ) : (
        <ul className="grid grid-cols-1 gap-2">{pairs.map((pair) => (
          <PairRow key={pair.id} pair={pair} />
        ))}</ul>
      )}
    </div>
  );
}

export function DesignAccessibilityPanel({
  design,
}: DesignAccessibilityPanelProps) {
  const headingId = useId();
  const summaryId = useId();

  // Memoize against the current draft object. DesignEditor keeps `draft`
  // referentially stable across unrelated UI state (pending, notices), so
  // palette/typography changes still recompute while Save/pending toggles do not.
  const evaluation = useMemo(
    () => evaluateDesignAccessibility(design),
    [design],
  );

  const detailsCount =
    evaluation.failing.length +
    evaluation.nearThreshold.length +
    evaluation.pairRenderedReview.length;

  return (
    <section
      className="@container min-w-0 space-y-4 rounded-xl border border-sage-dark/30 bg-forest/35 p-4"
      aria-labelledby={headingId}
      data-studio-accessibility-panel=""
      data-a11y-overall={evaluation.overallStatus}
      data-a11y-theme={evaluation.themePresetId}
    >
      <div className="space-y-1">
        <h2
          id={headingId}
          className="font-heading text-lg font-semibold text-white"
        >
          Accessibility
        </h2>
        <p className="text-sm text-sage-light">
          Solid-color checks for{" "}
          <span className="font-medium text-white">{evaluation.themeLabel}</span>
          . Updates as you change the design — no Save Draft needed. This is not
          a full accessibility certificate.
        </p>
      </div>

      <div
        id={summaryId}
        role="status"
        className={`rounded-xl border px-3 py-3 text-sm ${overallToneClass(evaluation.overallStatus)} ${overallTextClass(evaluation.overallStatus)}`}
        data-a11y-summary=""
      >
        <p className="font-semibold">{evaluation.summaryLabel}</p>
        <p className="mt-1 text-xs leading-relaxed opacity-95">
          {evaluation.summaryDetail}
        </p>
        <p className="mt-2 text-xs opacity-90">
          {evaluation.passingCount} of {evaluation.requiredPairCount} solid
          color checks meet Studio minimums
          {evaluation.nearThresholdCount > 0
            ? ` (${evaluation.nearThresholdCount} close to the line)`
            : ""}
          {evaluation.failingCount > 0
            ? ` · ${evaluation.failingCount} need attention`
            : ""}
          .
        </p>
      </div>

      <div className="space-y-2 rounded-lg border border-sage-dark/25 px-3 py-3">
        <h3 className="text-sm font-semibold text-white">Typography context</h3>
        <dl className="grid gap-1.5 text-xs text-sage-light">
          <div className="flex min-w-0 flex-wrap gap-x-2">
            <dt className="text-sage-dark">Pairing</dt>
            <dd>
              {evaluation.typography.fontFamilyLabel} (
              {evaluation.typography.headingFaceLabel} /{" "}
              {evaluation.typography.bodyFaceLabel})
            </dd>
          </div>
          <div className="flex min-w-0 flex-wrap gap-x-2">
            <dt className="text-sage-dark">Heading size</dt>
            <dd>{evaluation.typography.headingScaleLabel}</dd>
          </div>
          <div className="flex min-w-0 flex-wrap gap-x-2">
            <dt className="text-sage-dark">Body size</dt>
            <dd>{evaluation.typography.bodyScaleLabel}</dd>
          </div>
        </dl>
        <p className="text-xs leading-relaxed text-sage-light">
          {evaluation.typography.curatedNote}
        </p>
        <p className="text-xs leading-relaxed text-sage-light">
          {evaluation.typography.renderedEvaluationNote}
        </p>
      </div>

      <details className="group min-w-0 rounded-lg border border-sage-dark/30 bg-forest/30 open:bg-forest/45">
        <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 text-sm font-semibold text-white outline-none marker:content-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold [&::-webkit-details-marker]:hidden">
          <span>
            Color check details
            {detailsCount > 0 ? ` (${detailsCount} to review)` : ""}
          </span>
          <span
            className="text-xs font-medium text-gold/80 group-open:hidden"
            aria-hidden="true"
          >
            Show
          </span>
          <span
            className="hidden text-xs font-medium text-gold/80 group-open:inline"
            aria-hidden="true"
          >
            Hide
          </span>
        </summary>
        <div className="space-y-4 border-t border-sage-dark/25 px-3 py-3">
          <PairSection
            title="Needs attention"
            pairs={evaluation.failing}
          />
          <PairSection
            title="Close to the minimum"
            pairs={evaluation.nearThreshold}
          />
          <PairSection
            title="Needs a visual check"
            pairs={evaluation.pairRenderedReview}
          />
          <PairSection
            title="Looking good"
            pairs={evaluation.passing}
            emptyLabel={
              evaluation.passing.length === 0 &&
              evaluation.nearThreshold.length === 0
                ? "No solid-color passes for this palette yet."
                : undefined
            }
          />
        </div>
      </details>

      <details className="group min-w-0 rounded-lg border border-sage-dark/30 bg-forest/30 open:bg-forest/45">
        <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 text-sm font-semibold text-white outline-none marker:content-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold [&::-webkit-details-marker]:hidden">
          <span>Still needs visual or manual review</span>
          <span
            className="text-xs font-medium text-gold/80 group-open:hidden"
            aria-hidden="true"
          >
            Show
          </span>
          <span
            className="hidden text-xs font-medium text-gold/80 group-open:inline"
            aria-hidden="true"
          >
            Hide
          </span>
        </summary>
        <ul className="space-y-2 border-t border-sage-dark/25 px-3 py-3">
          {evaluation.reviewReminders.map((reminder) => (
            <li
              key={reminder.id}
              className="min-w-0 rounded-lg border border-sage-dark/25 bg-forest/40 px-3 py-2.5"
              data-a11y-reminder={reminder.id}
              data-a11y-reminder-kind={reminder.kind}
            >
              <p className="text-sm font-semibold text-white">{reminder.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-sage-light">
                {reminder.detail}
              </p>
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}
