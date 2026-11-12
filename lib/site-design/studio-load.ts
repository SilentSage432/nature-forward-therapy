import { cache } from "react";
import { getActiveAnnouncement } from "@/lib/articles";
import { getSiteDesignWorkspaceAction } from "@/lib/actions/site-design";
import { getSiteContent } from "@/lib/content";
import type { SiteDesign } from "@/lib/site-design/schema";
import type { PublishedPresentationConfig } from "@/lib/site-design/resolve-published";
import { presentationFromDesign } from "@/lib/site-design/presentation";
import type { WorkspaceReadResult } from "@/lib/site-design/types";

/**
 * Cached Studio loader for a single request.
 * Uses the authorized server action — never a parallel SiteDesign reader.
 */
export const loadStudioWorkspace = cache(
  async (): Promise<WorkspaceReadResult> => {
    return getSiteDesignWorkspaceAction();
  },
);

export const loadStudioPreviewContent = cache(async () => {
  const [content, banner] = await Promise.all([
    getSiteContent(),
    getActiveAnnouncement(),
  ]);
  return { content, banner };
});

/**
 * Overview preview uses the live-facing published (or canonical) design only.
 * The Design editor uses a private draft presentation separately.
 */
export function presentationForLivePreview(input: {
  published: SiteDesign;
  publishedRevision: number;
}): { presentation: PublishedPresentationConfig; caption: string } {
  const hasBeenPublished = input.publishedRevision > 0;

  if (hasBeenPublished) {
    return {
      presentation: presentationFromDesign(
        input.published,
        "published",
        input.publishedRevision,
      ),
      caption:
        "Showing the published presentation currently used by the live website. This is not a draft preview.",
    };
  }

  return {
    presentation: presentationFromDesign(
      input.published,
      "canonical-default",
      null,
    ),
    caption:
      "Showing the established Forest & Gold default. No custom design has been published yet.",
  };
}

/** Private draft presentation for authenticated Studio editing. */
export function presentationForDraftPreview(
  draft: SiteDesign,
): PublishedPresentationConfig {
  return presentationFromDesign(draft, "canonical-default", null);
}
