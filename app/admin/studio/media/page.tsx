import { StudioLoadError } from "@/components/admin/studio/StudioLoadError";
import { StudioShellHeader } from "@/components/admin/studio/StudioShellHeader";
import { loadStudioWorkspace } from "@/lib/site-design/studio-load";

export default async function StudioMediaPage() {
  const workspaceResult = await loadStudioWorkspace();

  if (!workspaceResult.ok && workspaceResult.code !== "INVALID_DESIGN") {
    return (
      <StudioLoadError
        title="Media"
        message={workspaceResult.message}
        code={workspaceResult.code}
      />
    );
  }

  return (
    <div className="space-y-6">
      <StudioShellHeader
        title="Media"
        description="The Media Library will live here so presentation images can be managed with the same care as practice content."
      />
      <section className="rounded-2xl border border-sage-dark/30 bg-forest-soft/70 p-6">
        <h2 className="font-heading text-xl font-semibold text-white">
          Media Library
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-sage-light">
          Uploads, optimized variants, and image selection for hero and section
          media are planned for a later tranche. Existing practice images
          continue to come from the Practice Profile and related CMS fields.
        </p>
        <ul className="mt-6 space-y-3 text-sm text-sage-light">
          <li className="rounded-xl border border-sage-dark/30 bg-forest/40 px-4 py-3">
            Hero background and portrait
          </li>
          <li className="rounded-xl border border-sage-dark/30 bg-forest/40 px-4 py-3">
            About, specialties, and contact imagery
          </li>
          <li className="rounded-xl border border-sage-dark/30 bg-forest/40 px-4 py-3">
            Future Studio media slots from SiteDesign
          </li>
        </ul>
        <p className="mt-5 text-sm text-sage-dark">
          No upload or deletion controls are available in this shell.
        </p>
      </section>
    </div>
  );
}
