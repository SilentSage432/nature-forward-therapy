import { cloneCanonicalSiteDesign } from "@/lib/site-design/defaults";
import type { SiteDesign } from "@/lib/site-design/schema";
import {
  SITE_THEME_PRESET_IDS,
  type SiteThemePresetId,
} from "@/lib/site-design/schema";
import type { PublishedPresentationConfig } from "@/lib/site-design/resolve-published";

/**
 * Build a presentation config from any validated SiteDesign.
 * Used by public published resolution and authenticated draft preview.
 */
export function presentationFromDesign(
  design: SiteDesign,
  source: PublishedPresentationConfig["source"],
  publishedRevision: number | null,
  diagnostic?: PublishedPresentationConfig["diagnostic"],
): PublishedPresentationConfig {
  return {
    design,
    themePresetId: design.theme.presetId,
    typography: {
      fontFamilyId: design.typography.fontFamilyId,
      headingScaleId: design.typography.headingScaleId,
      bodyScaleId: design.typography.bodyScaleId,
    },
    source,
    publishedRevision,
    diagnostic,
  };
}

export function canonicalPresentationConfig(
  source: "canonical-default" | "fallback",
  diagnostic?: PublishedPresentationConfig["diagnostic"],
): PublishedPresentationConfig {
  return presentationFromDesign(
    cloneCanonicalSiteDesign(),
    source,
    null,
    diagnostic,
  );
}

export function isKnownThemePreset(
  value: string,
): value is SiteThemePresetId {
  return (SITE_THEME_PRESET_IDS as readonly string[]).includes(value);
}
