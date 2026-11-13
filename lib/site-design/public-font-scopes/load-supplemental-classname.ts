import type { SiteFontFamilyId } from "@/lib/site-design/typography-registry";
import { publicSupplementalClassName } from "@/lib/site-design/site-font-loaders";

/**
 * Resolve supplemental next/font class names for the published pairing.
 *
 * Faces are declared once in `site-font-loaders.ts` (Turbopack-safe). This
 * helper remains the PublicFontScope entry so callers stay pairing-oriented.
 */
export async function loadPublicSupplementalClassName(
  fontFamilyId: SiteFontFamilyId,
): Promise<string> {
  return publicSupplementalClassName(fontFamilyId);
}
