import type { ReactNode } from "react";

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
  /** Reserved for future curated presets; must remain forest-gold today. */
  preset?: SiteThemePreset;
};

export function SiteTheme({
  children,
  preset = SITE_THEME_PRESET,
}: SiteThemeProps) {
  return <div data-site-theme={preset}>{children}</div>;
}
