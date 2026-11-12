import { listSiteDesignVersionsAction } from "@/lib/actions/site-design";
import { StudioLoadError } from "@/components/admin/studio/StudioLoadError";
import { StudioShellHeader } from "@/components/admin/studio/StudioShellHeader";
import { formatStudioTimestamp } from "@/lib/site-design/studio-status";
import { loadStudioWorkspace } from "@/lib/site-design/studio-load";

export default async function StudioHistoryPage() {
  const workspaceResult = await loadStudioWorkspace();

  if (!workspaceResult.ok && workspaceResult.code !== "INVALID_DESIGN") {
    return (
      <StudioLoadError
        title="History"
        message={workspaceResult.message}
        code={workspaceResult.code}
      />
    );
  }

  const versionsResult = await listSiteDesignVersionsAction({ limit: 20 });
  const versions =
    versionsResult.ok && versionsResult.data
      ? versionsResult.data.versions
      : [];

  return (
    <div className="space-y-6">
      <StudioShellHeader
        title="History"
        description="Published design snapshots will appear here so earlier looks can be reviewed later."
      />
      <section className="rounded-2xl border border-sage-dark/30 bg-forest-soft/70 p-6">
        <h2 className="font-heading text-xl font-semibold text-white">
          Published versions
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-sage-light">
          History is created only when a design is published. Restore controls
          are reserved for a later tranche.
        </p>

        {!versionsResult.ok ? (
          <p className="mt-5 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
            {versionsResult.message}
          </p>
        ) : versions.length === 0 ? (
          <div className="mt-5 rounded-xl border border-sage-dark/30 bg-forest/40 px-4 py-5">
            <p className="font-heading text-lg text-white">No publications yet</p>
            <p className="mt-2 text-sm text-sage-light">
              The live website is using the established default design. When a
              custom design is published in a future Studio release, immutable
              snapshots will be listed here.
            </p>
          </div>
        ) : (
          <ul className="mt-5 space-y-3">
            {versions.map((version) => (
              <li
                key={version.id}
                className="rounded-xl border border-sage-dark/30 bg-forest/40 px-4 py-4"
              >
                <p className="font-heading text-base font-semibold text-white">
                  Published revision {version.revision}
                </p>
                <p className="mt-1 text-sm text-sage-light">
                  {formatStudioTimestamp(version.publishedAt) ??
                    version.publishedAt}
                  {version.publishedByEmail
                    ? ` · ${version.publishedByEmail}`
                    : ""}
                </p>
                {version.note ? (
                  <p className="mt-2 text-sm text-sage-light">{version.note}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
