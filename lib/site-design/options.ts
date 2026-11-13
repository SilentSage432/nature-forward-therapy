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
import {
  SITE_FONT_FACE_BY_ID,
  SITE_TYPOGRAPHY_GROUP_LABELS,
  SITE_TYPOGRAPHY_GROUPS,
  SITE_TYPOGRAPHY_PAIRINGS,
  type SiteTypographyGroupId,
} from "@/lib/site-design/typography-registry";

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

export type FontFamilyOption = CuratedOption<SiteFontFamilyId> & {
  group: SiteTypographyGroupId;
  headingCssVar: string;
  bodyCssVar: string;
  sampleHeading: string;
  sampleBody: string;
  headingLetterSpacingEm?: number;
};

/** Nicole-facing typography pairings derived from the typography registry. */
export const FONT_FAMILY_OPTIONS: FontFamilyOption[] =
  SITE_TYPOGRAPHY_PAIRINGS.map((pairing) => {
    const def = pairing as (typeof SITE_TYPOGRAPHY_PAIRINGS)[number] & {
      headingLetterSpacingEm?: number;
    };
    const heading = SITE_FONT_FACE_BY_ID[def.headingFaceId];
    const body = SITE_FONT_FACE_BY_ID[def.bodyFaceId];
    return {
      id: def.id,
      label: def.label,
      description: def.description,
      group: def.group,
      headingCssVar: heading.cssVar,
      bodyCssVar: body.cssVar,
      sampleHeading: def.sampleHeading,
      sampleBody: def.sampleBody,
      headingLetterSpacingEm: def.headingLetterSpacingEm,
    };
  });

export type FontFamilyGroup = {
  id: SiteTypographyGroupId;
  label: string;
  options: FontFamilyOption[];
};

/** Gallery groups for the Studio Typography panel. */
export const FONT_FAMILY_GROUPS: FontFamilyGroup[] = SITE_TYPOGRAPHY_GROUPS.map(
  (groupId) => ({
    id: groupId,
    label: SITE_TYPOGRAPHY_GROUP_LABELS[groupId],
    options: FONT_FAMILY_OPTIONS.filter((option) => option.group === groupId),
  }),
).filter((group) => group.options.length > 0);

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
