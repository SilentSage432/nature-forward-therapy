import { DesignEditor } from "@/components/admin/studio/DesignEditor";
import { StudioLoadError } from "@/components/admin/studio/StudioLoadError";
import { StudioShellHeader } from "@/components/admin/studio/StudioShellHeader";
import { StudioStatusCards } from "@/components/admin/studio/StudioStatusCards";
import { loadStudioWorkspace } from "@/lib/site-design/studio-load";

export default async function StudioDesignPage() {
  const workspaceResult = await loadStudioWorkspace();

  if (!workspaceResult.ok) {
    if (workspaceResult.code === "INVALID_DESIGN") {
      return (
        <div className="space-y-6">
          <StudioShellHeader
            title="Design"
            description="Visual editing is paused until the stored design documents are repaired."
          />
          <StudioStatusCards workspace={workspaceResult.data} />
          <section
            role="alert"
            className="rounded-2xl border border-amber-400/40 bg-amber-400/10 p-6"
          >
            <h2 className="font-heading text-xl font-semibold text-amber-200">
              Draft needs attention
            </h2>
            <p className="mt-2 text-sm text-sage-light">
              {workspaceResult.message}
            </p>
            <p className="mt-4 text-xs text-sage-dark">
              Raw documents were preserved. Nothing was overwritten or
              published. Editing stays locked until the draft validates again.
            </p>
          </section>
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

  return (
    <DesignEditor
      workspace={workspaceResult.data}
      initialDraft={workspaceResult.data.draft}
    />
  );
}
