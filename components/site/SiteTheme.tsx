import type { ReactNode } from "react";
import { SkipToContent } from "@/components/site/SkipToContent";
import type {
  SiteBodyScaleId,
  SiteFontFamilyId,
  SiteHeadingScaleId,
  SiteThemePresetId,
} from "@/lib/site-design/schema";
import { isKnownThemePreset } from "@/lib/site-design/presentation";

/**
 * Public presentation theme boundary.
 *
 * Semantic CSS variables resolve under `[data-site-theme]`. Admin, login,
 * and developer chrome sit outside this wrapper and keep `:root` defaults,
 * so a future published/custom public theme cannot restyle the portal.
 */
export const SITE_THEME_PRESET = "forest-gold" as const;

export type SiteThemePreset = typeof SITE_THEME_PRESET;

type SiteThemeProps = {
  children: ReactNode;
  /** Curated color palette. Unsupported values fall back to forest-gold. */
  preset?: SiteThemePreset | SiteThemePresetId;
  fontFamilyId?: SiteFontFamilyId;
  headingScaleId?: SiteHeadingScaleId;
  bodyScaleId?: SiteBodyScaleId;
};

function resolvePreset(
  preset: SiteThemePreset | SiteThemePresetId | undefined,
): SiteThemePresetId {
  if (preset && isKnownThemePreset(preset)) return preset;
  return SITE_THEME_PRESET;
}

export function SiteTheme({
  children,
  preset = SITE_THEME_PRESET,
  fontFamilyId = "classic",
  headingScaleId = "comfortable",
  bodyScaleId = "comfortable",
}: SiteThemeProps) {
  return (
    <div
      data-site-theme={resolvePreset(preset)}
      data-site-font={fontFamilyId}
      data-site-heading={headingScaleId}
      data-site-body={bodyScaleId}
    >
      <SkipToContent />
      {children}
    </div>
  );
}
