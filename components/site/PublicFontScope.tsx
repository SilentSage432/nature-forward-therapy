import type { ReactNode } from "react";
import { publicDeliveryFaceIds } from "@/lib/site-design/font-delivery";
import { getPublishedPresentationConfig } from "@/lib/site-design/published";
import { publicSupplementalClassName } from "@/lib/site-design/site-font-loaders";

/**
 * Attaches next/font CSS variables for faces required by the *published*
 * SiteDesign beyond root chrome. Never reads draft state.
 *
 * Supplemental class names come from the single next/font declaration site
 * (`site-font-loaders.ts`) so Turbopack production builds stay coherent.
 */
export async function PublicFontScope({ children }: { children: ReactNode }) {
  const presentation = await getPublishedPresentationConfig();
  const fontFamilyId = presentation.typography.fontFamilyId;
  const faceIds = publicDeliveryFaceIds(fontFamilyId);
  const supplemental = publicSupplementalClassName(fontFamilyId);
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
