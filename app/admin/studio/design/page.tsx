import { StudioLoadError } from "@/components/admin/studio/StudioLoadError";
import { StudioShellHeader } from "@/components/admin/studio/StudioShellHeader";
import { StudioStatusCards } from "@/components/admin/studio/StudioStatusCards";
import { loadStudioWorkspace } from "@/lib/site-design/studio-load";
import {
  deriveStudioWorkspaceStatus,
  themeDisplayName,
} from "@/lib/site-design/studio-status";

export default async function StudioDesignPage() {
  const workspaceResult = await loadStudioWorkspace();

  if (!workspaceResult.ok) {
    if (workspaceResult.code === "INVALID_DESIGN") {
      return (
        <div className="space-y-6">
          <StudioShellHeader
            title="Design"
            description="Future visual editing tools will live here."
          />
          <StudioStatusCards workspace={workspaceResult.data} />
        </div>
      );
    }
    return (
      <StudioLoadError
        title="Design"
        message={workspaceResult.message}
        code={workspaceResult.code}
      />
    );
  }

  const status = deriveStudioWorkspaceStatus(workspaceResult.data);
  const theme = themeDisplayName(
    workspaceResult.data.draft.theme.presetId,
  );

  return (
    <div className="space-y-6">
      <StudioShellHeader
        title="Design"
        description="This is the future home for visual presentation controls. Editing is intentionally read-only in this tranche."
      />
      <StudioStatusCards workspace={workspaceResult.data} />
      <section className="rounded-2xl border border-sage-dark/30 bg-forest-soft/70 p-6">
        <h2 className="font-heading text-xl font-semibold text-white">
          Presentation controls
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-sage-light">
          Theme, typography, hero layout, and section arrangement will be edited
          here later. Today&apos;s workspace shows the active design identity
          without changing the live website.
        </p>
        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-sage-dark/30 bg-forest/40 p-4">
            <dt className="text-xs font-semibold tracking-wide text-gold uppercase">
              Theme
            </dt>
            <dd className="mt-2 text-white">{theme}</dd>
          </div>
          <div className="rounded-xl border border-sage-dark/30 bg-forest/40 p-4">
            <dt className="text-xs font-semibold tracking-wide text-gold uppercase">
              Typography
            </dt>
            <dd className="mt-2 text-white">Classic</dd>
          </div>
          <div className="rounded-xl border border-sage-dark/30 bg-forest/40 p-4">
            <dt className="text-xs font-semibold tracking-wide text-gold uppercase">
              Hero layout
            </dt>
            <dd className="mt-2 text-white">Centered portrait</dd>
          </div>
          <div className="rounded-xl border border-sage-dark/30 bg-forest/40 p-4">
            <dt className="text-xs font-semibold tracking-wide text-gold uppercase">
              Live mode
            </dt>
            <dd className="mt-2 text-white">
              {status.liveMode === "published-design"
                ? "Published design"
                : status.liveMode === "canonical-default"
                  ? "Canonical default"
                  : "Safe fallback"}
            </dd>
          </div>
        </dl>
        <p className="mt-5 text-sm text-sage-dark">
          Visual editing, alternate themes, and draft-save controls are reserved
          for later Website Studio tranches.
        </p>
      </section>
    </div>
  );
}
