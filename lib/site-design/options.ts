import type {
  SiteBodyScaleId,
  SiteFontFamilyId,
  SiteHeadingScaleId,
  SiteThemePresetId,
} from "@/lib/site-design/schema";

export type CuratedOption<T extends string> = {
  id: T;
  label: string;
  description: string;
};

/** Nicole-facing color palette choices (no CSS jargon). */
export const THEME_PALETTE_OPTIONS: CuratedOption<SiteThemePresetId>[] = [
  {
    id: "forest-gold",
    label: "Forest & Gold",
    description: "The current deep forest look with warm gold accents.",
  },
  {
    id: "dusk-sage",
    label: "Dusk & Sage",
    description: "Cooler evening greens with soft sage highlights.",
  },
  {
    id: "clay-sand",
    label: "Clay & Sand",
    description: "Warmer earth tones with clay accents on deep green.",
  },
];

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
