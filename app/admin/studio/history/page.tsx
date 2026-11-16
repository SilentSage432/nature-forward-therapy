import { listSiteDesignVersionsAction } from "@/lib/actions/site-design";
import { HistoryRestorePanel } from "@/components/admin/studio/HistoryRestorePanel";
import { StudioLoadError } from "@/components/admin/studio/StudioLoadError";
import { StudioShellHeader } from "@/components/admin/studio/StudioShellHeader";
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

  const draftRevision = workspaceResult.data.draftRevision;
  const publishedRevision = workspaceResult.data.publishedRevision;

  return (
    <div className="space-y-6">
      <StudioShellHeader
        title="History"
        description="Review published design snapshots and restore one into your private draft when you want to revisit an earlier look."
      />
      <HistoryRestorePanel
        versions={versions}
        draftRevision={draftRevision}
        publishedRevision={publishedRevision}
        versionsError={versionsResult.ok ? null : versionsResult.message}
      />
    </div>
  );
}
