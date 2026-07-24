export const BANNER_THEMES = ["amber", "sage", "clay", "forest"] as const;
export const BANNER_ALIGNMENTS = ["center", "left"] as const;
export const BANNER_FONT_STYLES = ["sans", "serif"] as const;

export type BannerTheme = (typeof BANNER_THEMES)[number];
export type BannerAlignment = (typeof BANNER_ALIGNMENTS)[number];
export type BannerFontStyle = (typeof BANNER_FONT_STYLES)[number];

export const BANNER_THEME_OPTIONS: Array<{
  id: BannerTheme;
  label: string;
  emoji: string;
  description: string;
  swatchClass: string;
}> = [
  {
    id: "amber",
    label: "Warm Amber & Gold",
    emoji: "🌟",
    description: "Amber gradient, deep forest text",
    swatchClass: "bg-gradient-to-r from-amber-200 via-gold to-amber-300",
  },
  {
    id: "sage",
    label: "Sage Foliage",
    emoji: "🌿",
    description: "Soft sage green, dark forest text",
    swatchClass: "bg-gradient-to-r from-sage-light via-sage to-sage-dark",
  },
  {
    id: "clay",
    label: "Warm Clay",
    emoji: "🏺",
    description: "Terracotta clay, cream parchment text",
    swatchClass: "bg-gradient-to-r from-clay via-[#b8795f] to-clay",
  },
  {
    id: "forest",
    label: "Deep Forest & Gold",
    emoji: "🌲",
    description: "Rich forest background, gold text",
    swatchClass: "bg-gradient-to-r from-forest via-forest-soft to-forest",
  },
];

export function bannerShellClass(theme: string): string {
  switch (theme) {
    case "sage":
      return "border-sage-dark/30 bg-gradient-to-r from-sage-light via-[#9bb5a5] to-sage text-forest";
    case "clay":
      return "border-clay/40 bg-gradient-to-r from-clay via-[#b8795f] to-[#a86d55] text-parchment";
    case "forest":
      return "border-gold/30 bg-gradient-to-r from-forest via-forest-soft to-[#1a2a28] text-gold";
    case "amber":
    default:
      return "border-amber-900/20 bg-gradient-to-r from-amber-200 via-gold to-amber-300 text-forest";
  }
}

export function bannerLinkClass(theme: string): string {
  switch (theme) {
    case "clay":
      return "font-semibold underline underline-offset-2 transition hover:text-white";
    case "forest":
      return "font-semibold underline underline-offset-2 transition hover:text-amber-200";
    case "sage":
      return "font-semibold underline underline-offset-2 transition hover:text-forest-soft";
    case "amber":
    default:
      return "font-semibold underline underline-offset-2 transition hover:text-forest-soft";
  }
}

export function bannerDismissClass(theme: string): string {
  switch (theme) {
    case "clay":
      return "text-parchment/70 hover:bg-white/10 hover:text-parchment";
    case "forest":
      return "text-gold/70 hover:bg-gold/10 hover:text-gold";
    default:
      return "text-forest/70 hover:bg-forest/10 hover:text-forest";
  }
}

export function bannerTextClass(fontStyle: string): string {
  return fontStyle === "serif"
    ? "font-serif italic"
    : "font-medium";
}

export function normalizeBannerTheme(value: string | null | undefined): BannerTheme {
  return (BANNER_THEMES as readonly string[]).includes(value ?? "")
    ? (value as BannerTheme)
    : "amber";
}

export function normalizeBannerAlignment(
  value: string | null | undefined,
): BannerAlignment {
  return (BANNER_ALIGNMENTS as readonly string[]).includes(value ?? "")
    ? (value as BannerAlignment)
    : "center";
}

export function normalizeBannerFontStyle(
  value: string | null | undefined,
): BannerFontStyle {
  return (BANNER_FONT_STYLES as readonly string[]).includes(value ?? "")
    ? (value as BannerFontStyle)
    : "sans";
}
