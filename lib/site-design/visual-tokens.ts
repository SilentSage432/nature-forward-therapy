import type {
  SiteBodyScaleId,
  SiteFontFamilyId,
  SiteHeadingScaleId,
} from "@/lib/site-design/schema";
import {
  FOREST_GOLD_CSS_TOKENS,
  SITE_PALETTE_BY_ID,
  SITE_THEME_PRESET_IDS,
  resolvePaletteCssTokens,
  type SitePaletteCssTokens,
  type SiteThemePresetId,
} from "@/lib/site-design/palette-registry";
import {
  SITE_FONT_FAMILY_IDS,
  resolveTypographyStack,
  type SiteFontCssVar,
  type SiteFontKind,
} from "@/lib/site-design/typography-registry";

/**
 * Deterministic curated visual token tables for SiteDesign presentation.
 *
 * Authoritative palette values live in `palette-registry.ts`.
 * CSS in `app/globals.css` is the runtime source under `[data-site-theme]`.
 * These maps mirror that CSS for regression tests and documentation —
 * keep both in sync when curated palettes or type stacks change.
 *
 * No arbitrary colors or font URLs are accepted; only curated IDs resolve.
 */

/** Compatibility subset used by existing visual fidelity tests. */
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

function toCompatTokens(tokens: SitePaletteCssTokens): SitePaletteTokens {
  return {
    surfacePage: tokens.surfacePage,
    surfacePageMid: tokens.surfacePageMid,
    surfacePageSoft: tokens.surfacePageSoft,
    surfaceSection: tokens.surfaceSection,
    surfaceElevatedStrong: tokens.surfaceElevatedStrong,
    foreground: tokens.foreground,
    foregroundHeading: tokens.foregroundHeading,
    foregroundMuted: tokens.foregroundMuted,
    foregroundSupporting: tokens.foregroundSupporting,
    foregroundSoft: tokens.foregroundSoft,
    foregroundWarm: tokens.foregroundWarm,
    accent: tokens.accent,
    accentStrong: tokens.accentStrong,
    accentForeground: tokens.accentForeground,
    accentSecondary: tokens.accentSecondary,
    accentSoft: tokens.accentSoft,
    accentMuted: tokens.accentMuted,
    accentGlow: tokens.accentGlow,
    borderOrganic: tokens.borderOrganic,
    iconSurface: tokens.iconSurface,
    heroOverlayStart: tokens.heroOverlayStart,
    heroOverlayMid: tokens.heroOverlayMid,
    heroOverlayEnd: tokens.heroOverlayEnd,
    cardGlow: tokens.cardGlow,
    focusRing: tokens.focusRing,
  };
}

/** Canonical forest-gold values — visually equivalent to production NFT-STUDIO-003. */
export const FOREST_GOLD_TOKENS: SitePaletteTokens = toCompatTokens(
  FOREST_GOLD_CSS_TOKENS,
);

export const SITE_PALETTE_TOKENS: Record<SiteThemePresetId, SitePaletteTokens> =
  Object.fromEntries(
    SITE_THEME_PRESET_IDS.map((id) => [
      id,
      toCompatTokens(SITE_PALETTE_BY_ID[id].tokens),
    ]),
  ) as Record<SiteThemePresetId, SitePaletteTokens>;

/**
 * Loaded Next.js font CSS variables only — derived from typography-registry.
 * Classic keeps Montserrat headings; Modern uses Inter for both so historical
 * presets remain distinguishable. Additional curated pairings share body faces
 * where possible to bound download cost.
 */
export const SITE_FONT_STACKS: Record<
  SiteFontFamilyId,
  {
    headingVar: SiteFontCssVar;
    bodyVar: SiteFontCssVar;
    headingKind: SiteFontKind;
    bodyKind: SiteFontKind;
  }
> = Object.fromEntries(
  SITE_FONT_FAMILY_IDS.map((id) => {
    const stack = resolveTypographyStack(id);
    return [
      id,
      {
        headingVar: stack.headingVar,
        bodyVar: stack.bodyVar,
        headingKind: stack.headingKind,
        bodyKind: stack.bodyKind,
      },
    ];
  }),
) as Record<
  SiteFontFamilyId,
  {
    headingVar: SiteFontCssVar;
    bodyVar: SiteFontCssVar;
    headingKind: SiteFontKind;
    bodyKind: SiteFontKind;
  }
>;

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

export function resolveFullPaletteTokens(
  presetId: SiteThemePresetId,
): SitePaletteCssTokens {
  return resolvePaletteCssTokens(presetId);
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
