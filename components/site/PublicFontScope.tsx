import type { ReactNode } from "react";
import { publicDeliveryFaceIds } from "@/lib/site-design/font-delivery";
import { loadPublicSupplementalClassName } from "@/lib/site-design/public-font-scopes/load-supplemental-classname";
import { getPublishedPresentationConfig } from "@/lib/site-design/published";

/**
 * Attaches next/font CSS variables for faces required by the *published*
 * SiteDesign beyond root chrome. Never reads draft state.
 *
 * Supplemental faces are loaded via dynamic import of a pairing-specific
 * module so Classic (and other chrome-only) public routes do not pull the
 * full curated library into the document preload set.
 */
export async function PublicFontScope({ children }: { children: ReactNode }) {
  const presentation = await getPublishedPresentationConfig();
  const fontFamilyId = presentation.typography.fontFamilyId;
  const faceIds = publicDeliveryFaceIds(fontFamilyId);
  const supplemental = await loadPublicSupplementalClassName(fontFamilyId);
  const className = supplemental || undefined;

  return (
    <div
      className={className}
      data-public-font-scope={fontFamilyId}
      data-public-font-faces={faceIds.join(" ")}
    >
      {children}
    </div>
  );
}
