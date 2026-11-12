import {
  deriveStudioWorkspaceStatus,
  formatStudioTimestamp,
} from "@/lib/site-design/studio-status";
import type {
  SiteDesignWorkspace,
  SiteDesignWorkspaceInvalid,
} from "@/lib/site-design/types";

type StudioStatusCardsProps = {
  workspace: SiteDesignWorkspace | SiteDesignWorkspaceInvalid;
};

export function StudioStatusCards({ workspace }: StudioStatusCardsProps) {
  const status = deriveStudioWorkspaceStatus(workspace);
  const publishedAt = formatStudioTimestamp(status.publishedAt);
  const draftUpdatedAt = formatStudioTimestamp(status.draftUpdatedAt);

  const liveBadge =
    status.liveMode === "published-design"
      ? "Published design"
      : status.liveMode === "invalid-published"
        ? "Safe fallback"
        : "Canonical default";

  const draftBadge =
    status.draftRelation === "unpublished-changes"
      ? "Unpublished draft"
      : status.draftRelation === "invalid-draft"
        ? "Needs attention"
        : "In sync";

  return (
    <section
      aria-label="Design status"
      className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
    >
      <article className="rounded-2xl border border-sage-dark/30 bg-forest-soft/70 p-5">
        <p className="text-xs font-semibold tracking-wide text-gold uppercase">
          Design identity
        </p>
        <p className="mt-2 font-heading text-xl font-semibold text-white">
          {status.themeLabel}
        </p>
        <p className="mt-2 text-sm text-sage-light">
          Current presentation theme for the public site.
        </p>
      </article>

      <article className="rounded-2xl border border-sage-dark/30 bg-forest-soft/70 p-5">
        <p className="text-xs font-semibold tracking-wide text-gold uppercase">
          Live website
        </p>
        <p className="mt-2 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
          {liveBadge}
        </p>
        <p className="mt-3 text-sm text-sage-light">{status.liveSummary}</p>
        <p className="mt-3 text-xs text-sage-dark">
          Published revision {status.publishedRevision}
          {publishedAt ? ` · ${publishedAt}` : ""}
          {status.publishedByEmail ? ` · ${status.publishedByEmail}` : ""}
        </p>
      </article>

      <article className="rounded-2xl border border-sage-dark/30 bg-forest-soft/70 p-5">
        <p className="text-xs font-semibold tracking-wide text-gold uppercase">
          Private draft
        </p>
        <p className="mt-2 inline-flex rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 text-xs font-semibold text-gold">
          {draftBadge}
        </p>
        <p className="mt-3 text-sm text-sage-light">{status.draftSummary}</p>
        <p className="mt-3 text-xs text-sage-dark">
          Draft revision {status.draftRevision}
          {draftUpdatedAt ? ` · ${draftUpdatedAt}` : ""}
          {status.draftUpdatedByEmail ? ` · ${status.draftUpdatedByEmail}` : ""}
        </p>
      </article>

      <article className="rounded-2xl border border-sage-dark/30 bg-forest-soft/70 p-5">
        <p className="text-xs font-semibold tracking-wide text-gold uppercase">
          Publication
        </p>
        <p className="mt-2 font-heading text-xl font-semibold text-white">
          {status.hasBeenPublished ? "Custom design live" : "Default in use"}
        </p>
        <p className="mt-2 text-sm text-sage-light">
          {status.hasBeenPublished
            ? "A published snapshot is available for future history tools."
            : "No custom design has been published. Publishing controls arrive in a later Studio tranche."}
        </p>
      </article>
    </section>
  );
}
