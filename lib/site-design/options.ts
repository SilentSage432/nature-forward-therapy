import type {
  SiteBodyScaleId,
  SiteFontFamilyId,
  SiteHeadingScaleId,
  SiteThemePresetId,
} from "@/lib/site-design/schema";
import {
  SITE_PALETTE_DEFINITIONS,
  SITE_PALETTE_GROUP_LABELS,
  SITE_PALETTE_GROUPS,
  type SitePaletteGroupId,
} from "@/lib/site-design/palette-registry";

export type CuratedOption<T extends string> = {
  id: T;
  label: string;
  description: string;
};

export type ThemePaletteOption = CuratedOption<SiteThemePresetId> & {
  group: SitePaletteGroupId;
  mode: "dark" | "light";
  swatches: readonly [string, string, string];
};

/** Nicole-facing color palette choices derived from the palette registry. */
export const THEME_PALETTE_OPTIONS: ThemePaletteOption[] =
  SITE_PALETTE_DEFINITIONS.map((palette) => ({
    id: palette.id,
    label: palette.label,
    description: palette.description,
    group: palette.group,
    mode: palette.mode,
    swatches: palette.swatches,
  }));

export type ThemePaletteGroup = {
  id: SitePaletteGroupId;
  label: string;
  options: ThemePaletteOption[];
};

/** Gallery groups for the Studio Colors panel. */
export const THEME_PALETTE_GROUPS: ThemePaletteGroup[] = SITE_PALETTE_GROUPS.map(
  (groupId) => ({
    id: groupId,
    label: SITE_PALETTE_GROUP_LABELS[groupId],
    options: THEME_PALETTE_OPTIONS.filter((option) => option.group === groupId),
  }),
).filter((group) => group.options.length > 0);

export const FONT_FAMILY_OPTIONS: CuratedOption<SiteFontFamilyId>[] = [
  {
    id: "classic",
    label: "Classic",
    description: "Clear headings with a calm, readable body.",
  },
  {
    id: "editorial",
    label: "Editorial",
    description: "Softer serif headings for a more literary feel.",
  },
  {
    id: "modern",
    label: "Modern",
    description: "Clean sans-serif throughout for a contemporary look.",
  },
];

export const HEADING_SCALE_OPTIONS: CuratedOption<SiteHeadingScaleId>[] = [
  {
    id: "comfortable",
    label: "Comfortable",
    description: "Balanced heading sizes used on the live site today.",
  },
  {
    id: "prominent",
    label: "Prominent",
    description: "Slightly larger headings for stronger presence.",
  },
  {
    id: "compact",
    label: "Compact",
    description: "Slightly smaller headings for a quieter page.",
  },
];

export const BODY_SCALE_OPTIONS: CuratedOption<SiteBodyScaleId>[] = [
  {
    id: "comfortable",
    label: "Comfortable",
    description: "Standard reading size used on the live site today.",
  },
  {
    id: "relaxed",
    label: "Relaxed",
    description: "A bit larger for easier long-form reading.",
  },
  {
    id: "compact",
    label: "Compact",
    description: "Slightly tighter body text.",
  },
];

export function themeDisplayLabel(id: SiteThemePresetId | string): string {
  return (
    THEME_PALETTE_OPTIONS.find((option) => option.id === id)?.label ??
    "Forest & Gold"
  );
}

export function fontFamilyDisplayLabel(id: SiteFontFamilyId | string): string {
  return (
    FONT_FAMILY_OPTIONS.find((option) => option.id === id)?.label ?? "Classic"
  );
}
