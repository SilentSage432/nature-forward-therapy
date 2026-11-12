import { StudioLoadError } from "@/components/admin/studio/StudioLoadError";
import { StudioPreviewFrame } from "@/components/admin/studio/StudioPreviewFrame";
import { StudioShellHeader } from "@/components/admin/studio/StudioShellHeader";
import { StudioStatusCards } from "@/components/admin/studio/StudioStatusCards";
import {
  loadStudioPreviewContent,
  loadStudioWorkspace,
  presentationForLivePreview,
} from "@/lib/site-design/studio-load";

export default async function StudioOverviewPage() {
  const workspaceResult = await loadStudioWorkspace();

  if (!workspaceResult.ok) {
    if (workspaceResult.code === "INVALID_DESIGN") {
      return (
        <div className="space-y-6">
          <StudioShellHeader
            title="Overview"
            description="Review the live presentation and prepare for future visual design tools."
          />
          <section
            role="alert"
            className="rounded-2xl border border-amber-400/40 bg-amber-400/10 p-5"
          >
            <h2 className="font-heading text-lg font-semibold text-amber-200">
              Stored design needs attention
            </h2>
            <p className="mt-2 text-sm text-sage-light">
              {workspaceResult.message}
            </p>
            <p className="mt-3 text-xs text-sage-dark">
              Raw documents were preserved. Nothing was reset or published.
            </p>
          </section>
          <StudioStatusCards workspace={workspaceResult.data} />
        </div>
      );
    }

    return (
      <StudioLoadError
        message={workspaceResult.message}
        code={workspaceResult.code}
      />
    );
  }

  const { content, banner } = await loadStudioPreviewContent();
  const { presentation, caption } = presentationForLivePreview(
    workspaceResult.data,
  );

  return (
    <div className="space-y-6">
      <StudioShellHeader
        title="Overview"
        description="Review the live presentation and prepare for future visual design tools. Editing, media, and publishing controls arrive in later Studio tranches."
      />
      <StudioStatusCards workspace={workspaceResult.data} />
      <StudioPreviewFrame
        content={content}
        banner={banner}
        presentation={presentation}
        caption={caption}
      />
    </div>
  );
}
