import type { ReactNode } from "react";
import type { SiteThemePresetId } from "@/lib/site-design/schema";

/**
 * Public presentation theme boundary.
 *
 * Semantic CSS variables resolve under `[data-site-theme]`. Admin, login,
 * and developer chrome sit outside this wrapper and keep `:root` defaults,
 * so a future published/custom public theme cannot restyle the portal.
 *
 * Only the current forest-gold identity is supported in this tranche.
 */
export const SITE_THEME_PRESET = "forest-gold" as const;

export type SiteThemePreset = typeof SITE_THEME_PRESET;

type SiteThemeProps = {
  children: ReactNode;
  /**
   * Curated theme preset from published SiteDesign.
   * Unsupported values fall back to forest-gold (no speculative themes).
   */
  preset?: SiteThemePreset | SiteThemePresetId;
};

function resolvePreset(
  preset: SiteThemePreset | SiteThemePresetId | undefined,
): SiteThemePreset {
  return preset === "forest-gold" ? "forest-gold" : SITE_THEME_PRESET;
}

export function SiteTheme({
  children,
  preset = SITE_THEME_PRESET,
}: SiteThemeProps) {
  return <div data-site-theme={resolvePreset(preset)}>{children}</div>;
}
