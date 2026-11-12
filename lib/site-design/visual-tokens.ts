import type {
  SiteBodyScaleId,
  SiteFontFamilyId,
  SiteHeadingScaleId,
  SiteThemePresetId,
} from "@/lib/site-design/schema";

/**
 * Deterministic curated visual token tables for SiteDesign presentation.
 *
 * CSS in `app/globals.css` is the runtime source of truth under
 * `[data-site-theme]` / `[data-site-font]` / scale attributes.
 * These maps mirror that CSS for regression tests and documentation —
 * keep both in sync when curated palettes or type stacks change.
 *
 * No arbitrary colors or font URLs are accepted; only curated IDs resolve.
 */

export type SitePaletteTokens = {
  surfacePage: string;
  surfacePageMid: string;
  surfacePageSoft: string;
  surfaceSection: string;
  surfaceElevatedStrong: string;
  foreground: string;
  foregroundHeading: string;
  foregroundMuted: string;
  /** Supporting body/subtitle tone (forest-gold parity with former sage-light). */
  foregroundSupporting: string;
  /** Soft cream copy tone (forest-gold parity with former parchment). */
  foregroundSoft: string;
  /** Warm secondary copy tone (forest-gold parity with former sand). */
  foregroundWarm: string;
  accent: string;
  accentStrong: string;
  accentForeground: string;
  accentSecondary: string;
  accentSoft: string;
  accentMuted: string;
  accentGlow: string;
  borderOrganic: string;
  iconSurface: string;
  heroOverlayStart: string;
  heroOverlayMid: string;
  heroOverlayEnd: string;
  cardGlow: string;
  focusRing: string;
};

/** Canonical forest-gold values — visually equivalent to production NFT-STUDIO-003. */
export const FOREST_GOLD_TOKENS: SitePaletteTokens = {
  surfacePage: "#162221",
  surfacePageMid: "#1e2d2b",
  surfacePageSoft: "#2d3a35",
  surfaceSection: "#162221",
  surfaceElevatedStrong: "rgba(12, 10, 9, 0.85)",
  foreground: "#e8eae6",
  foregroundHeading: "#ffffff",
  foregroundMuted: "#a8a29e",
  foregroundSupporting: "#a8c3b5",
  foregroundSoft: "#f4f2ed",
  foregroundWarm: "#c4b8a8",
  accent: "#d4af37",
  accentStrong: "#b8962e",
  accentForeground: "#162221",
  accentSecondary: "#c48b71",
  accentSoft: "#fde68a",
  accentMuted: "rgba(212, 175, 55, 0.2)",
  accentGlow: "rgba(212, 175, 55, 0.35)",
  borderOrganic: "#5a7266",
  iconSurface: "rgba(90, 114, 102, 0.4)",
  heroOverlayStart: "rgba(22, 34, 33, 0.88)",
  heroOverlayMid: "rgba(45, 58, 53, 0.75)",
  heroOverlayEnd: "rgba(22, 34, 33, 0.9)",
  cardGlow: "rgba(212, 175, 55, 0.12)",
  focusRing: "rgba(212, 175, 55, 0.55)",
};

export const DUSK_SAGE_TOKENS: SitePaletteTokens = {
  surfacePage: "#121c1b",
  surfacePageMid: "#182624",
  surfacePageSoft: "#243330",
  surfaceSection: "#121c1b",
  surfaceElevatedStrong: "rgba(10, 16, 15, 0.88)",
  foreground: "#e4ebe7",
  foregroundHeading: "#f5faf7",
  foregroundMuted: "#9db0a7",
  foregroundSupporting: "#9db0a7",
  foregroundSoft: "#eef6f1",
  foregroundWarm: "#c4a484",
  accent: "#9fbfad",
  accentStrong: "#7fa392",
  accentForeground: "#121c1b",
  accentSecondary: "#c4a484",
  accentSoft: "#d5e6dc",
  accentMuted: "rgba(159, 191, 173, 0.22)",
  accentGlow: "rgba(159, 191, 173, 0.32)",
  borderOrganic: "#3d4f48",
  iconSurface: "rgba(61, 79, 72, 0.45)",
  heroOverlayStart: "rgba(18, 28, 27, 0.9)",
  heroOverlayMid: "rgba(36, 51, 48, 0.78)",
  heroOverlayEnd: "rgba(18, 28, 27, 0.92)",
  cardGlow: "rgba(159, 191, 173, 0.12)",
  focusRing: "rgba(159, 191, 173, 0.55)",
};

export const CLAY_SAND_TOKENS: SitePaletteTokens = {
  surfacePage: "#1a201c",
  surfacePageMid: "#232a25",
  surfacePageSoft: "#314038",
  surfaceSection: "#1a201c",
  surfaceElevatedStrong: "rgba(14, 18, 16, 0.88)",
  foreground: "#efe8df",
  foregroundHeading: "#fffaf3",
  foregroundMuted: "#b7aa9a",
  foregroundSupporting: "#b7aa9a",
  foregroundSoft: "#f7efe4",
  foregroundWarm: "#d4c4b0",
  accent: "#d4a574",
  accentStrong: "#b88958",
  accentForeground: "#1a201c",
  accentSecondary: "#c48b71",
  accentSoft: "#f0d7b8",
  accentMuted: "rgba(212, 165, 116, 0.22)",
  accentGlow: "rgba(212, 165, 116, 0.34)",
  borderOrganic: "#4a433b",
  iconSurface: "rgba(74, 67, 59, 0.45)",
  heroOverlayStart: "rgba(26, 32, 28, 0.9)",
  heroOverlayMid: "rgba(49, 64, 56, 0.78)",
  heroOverlayEnd: "rgba(26, 32, 28, 0.92)",
  cardGlow: "rgba(212, 165, 116, 0.12)",
  focusRing: "rgba(212, 165, 116, 0.55)",
};

export const SITE_PALETTE_TOKENS: Record<
  SiteThemePresetId,
  SitePaletteTokens
> = {
  "forest-gold": FOREST_GOLD_TOKENS,
  "dusk-sage": DUSK_SAGE_TOKENS,
  "clay-sand": CLAY_SAND_TOKENS,
};

/**
 * Loaded Next.js font CSS variables only.
 * Classic keeps Montserrat headings; Modern uses Inter for both so presets
 * are distinguishable without new font assets.
 */
export const SITE_FONT_STACKS: Record<
  SiteFontFamilyId,
  { headingVar: "--font-montserrat" | "--font-inter" | "--font-cormorant"; bodyVar: "--font-montserrat" | "--font-inter" | "--font-cormorant"; headingKind: "sans" | "serif"; bodyKind: "sans" }
> = {
  classic: {
    headingVar: "--font-montserrat",
    bodyVar: "--font-inter",
    headingKind: "sans",
    bodyKind: "sans",
  },
  editorial: {
    headingVar: "--font-cormorant",
    bodyVar: "--font-inter",
    headingKind: "serif",
    bodyKind: "sans",
  },
  modern: {
    headingVar: "--font-inter",
    bodyVar: "--font-inter",
    headingKind: "sans",
    bodyKind: "sans",
  },
};

export const SITE_HEADING_SCALE_TOKENS: Record<
  SiteHeadingScaleId,
  { hero: string; section: string; card: string }
> = {
  comfortable: {
    hero: "clamp(1.85rem, 4vw + 1rem, 3.75rem)",
    section: "clamp(1.875rem, 2vw + 1rem, 2.25rem)",
    card: "1.25rem",
  },
  prominent: {
    hero: "clamp(2.05rem, 4.4vw + 1rem, 4.1rem)",
    section: "clamp(2.05rem, 2.3vw + 1rem, 2.55rem)",
    card: "1.35rem",
  },
  compact: {
    hero: "clamp(1.65rem, 3.4vw + 1rem, 3.25rem)",
    section: "clamp(1.65rem, 1.7vw + 1rem, 2rem)",
    card: "1.125rem",
  },
};

export const SITE_BODY_SCALE_TOKENS: Record<
  SiteBodyScaleId,
  { lead: string; copy: string; serif: string }
> = {
  comfortable: {
    lead: "clamp(1.125rem, 0.6vw + 1rem, 1.25rem)",
    copy: "1rem",
    serif: "clamp(1.125rem, 0.8vw + 0.9rem, 1.5rem)",
  },
  relaxed: {
    lead: "clamp(1.2rem, 0.8vw + 1rem, 1.4rem)",
    copy: "1.0625rem",
    serif: "clamp(1.2rem, 1vw + 0.9rem, 1.65rem)",
  },
  compact: {
    lead: "clamp(1rem, 0.4vw + 0.95rem, 1.125rem)",
    copy: "0.9375rem",
    serif: "clamp(1rem, 0.5vw + 0.85rem, 1.3rem)",
  },
};

export function resolvePaletteTokens(
  presetId: SiteThemePresetId,
): SitePaletteTokens {
  return SITE_PALETTE_TOKENS[presetId];
}

export function resolveFontStack(fontFamilyId: SiteFontFamilyId) {
  return SITE_FONT_STACKS[fontFamilyId];
}

export function fontStacksAreDistinct(
  a: SiteFontFamilyId,
  b: SiteFontFamilyId,
): boolean {
  const left = SITE_FONT_STACKS[a];
  const right = SITE_FONT_STACKS[b];
  return (
    left.headingVar !== right.headingVar || left.bodyVar !== right.bodyVar
  );
}
