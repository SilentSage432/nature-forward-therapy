/**
 * Accessibility contrast contract for curated SiteDesign palettes.
 *
 * Only pairs that appear as opaque solids on the shared homepage are required.
 * Transparent decorative glows, color-mix borders, glass nav, and image-backed
 * hero overlays are intentionally excluded from deterministic pass/fail.
 */

import {
  evaluateContrastPair,
  summarizeContrastResults,
  type ContrastPairDefinition,
  type ContrastEvaluationSummary,
} from "@/lib/site-design/contrast";
import {
  SITE_THEME_PRESET_IDS,
  resolvePaletteCssTokens,
  type SitePaletteCssTokens,
  type SiteThemePresetId,
} from "@/lib/site-design/palette-registry";

/**
 * Required deterministic contrast relationships for every curated palette.
 * Thresholds follow WCAG intent: 4.5:1 normal text, 3:1 large text / UI.
 */
export const REQUIRED_PALETTE_CONTRAST_PAIRS: readonly ContrastPairDefinition[] =
  [
    {
      id: "body-on-page",
      label: "Primary body text on primary page surface",
      foregroundToken: "foreground",
      backgroundToken: "surfacePage",
      threshold: "normal-text",
    },
    {
      id: "body-on-section",
      label: "Primary body text on section surface",
      foregroundToken: "foreground",
      backgroundToken: "surfaceSection",
      threshold: "normal-text",
    },
    {
      id: "supporting-on-page",
      label: "Supporting text on primary page surface",
      foregroundToken: "foregroundSupporting",
      backgroundToken: "surfacePage",
      threshold: "normal-text",
    },
    {
      id: "supporting-on-section-soft",
      label: "Supporting text on soft section surface",
      foregroundToken: "foregroundSupporting",
      backgroundToken: "surfacePageSoft",
      threshold: "normal-text",
    },
    {
      id: "muted-on-page",
      label: "Muted text on primary page surface",
      foregroundToken: "foregroundMuted",
      backgroundToken: "surfacePage",
      threshold: "normal-text",
    },
    {
      id: "soft-on-page",
      label: "Soft copy on primary page surface",
      foregroundToken: "foregroundSoft",
      backgroundToken: "surfacePage",
      threshold: "normal-text",
    },
    {
      id: "warm-on-page",
      label: "Warm secondary copy on primary page surface",
      foregroundToken: "foregroundWarm",
      backgroundToken: "surfacePage",
      threshold: "normal-text",
    },
    {
      id: "heading-on-page",
      label: "Heading text on primary / hero solid fallback surface",
      foregroundToken: "foregroundHeading",
      backgroundToken: "surfacePage",
      threshold: "large-text",
    },
    {
      id: "heading-on-section-soft",
      label: "Heading text on soft section surface",
      foregroundToken: "foregroundHeading",
      backgroundToken: "surfacePageSoft",
      threshold: "large-text",
    },
    {
      id: "button-label-on-accent",
      label: "Button label on accent background",
      foregroundToken: "accentForeground",
      backgroundToken: "accent",
      threshold: "normal-text",
    },
    {
      id: "button-label-on-accent-strong",
      label: "Button label on accent-strong background",
      foregroundToken: "accentForeground",
      backgroundToken: "accentStrong",
      threshold: "normal-text",
    },
    {
      id: "accent-link-on-page",
      label: "Accent link / brand text on page surface",
      foregroundToken: "accent",
      backgroundToken: "surfacePage",
      threshold: "normal-text",
    },
    {
      id: "accent-link-on-section-soft",
      label: "Accent link on soft section surface",
      foregroundToken: "accent",
      backgroundToken: "surfacePageSoft",
      threshold: "normal-text",
    },
    {
      id: "interactive-hover-on-page",
      label: "Interactive hover text on page surface",
      foregroundToken: "interactiveHover",
      backgroundToken: "surfacePage",
      threshold: "normal-text",
    },
    {
      id: "outline-button-on-page",
      label: "Outline button label on page surface",
      foregroundToken: "foreground",
      backgroundToken: "surfacePage",
      threshold: "normal-text",
    },
  ] as const;

/**
 * Intentionally excluded from deterministic required checks.
 * Documented so future work does not treat decorative pairs as text.
 *
 * Note: established forest-gold / dusk-sage / clay-sand identities use soft
 * card borders and color-mixed organic borders that do not meet 3:1 as opaque
 * solids. Preserving those identities means border 3:1 is deferred to a later
 * accessibility tranche rather than forced here.
 */
export const EXCLUDED_PALETTE_CONTRAST_NOTES = [
  "Hero overlays over photography (transparent gradients + image-backed backgrounds).",
  "Nav glass / elevated rgba surfaces over page content (translucent).",
  "Accent glow, card glow, accent muted fills (decorative).",
  "Organic borders rendered via color-mix transparency (not opaque solids).",
  "Subtle card borders (borderSubtleStrong) and muted separators (borderMuted) — soft decorative edges below 3:1 on the canonical forest-gold identity; deferred.",
  "Focus rings expressed as translucent rgba (require rendered review).",
  "Foreground faint separators used as decorative punctuation, not body copy.",
  "Outline button hover fills expressed as translucent overlays.",
  "Focus-pill decorative borders (color-mix) remain below opaque 3:1 UI solids; text contrast for light-airy pills is covered by light-semantic-contrast.ts after ENG04-ENG01 Option B.",
  "Dark-palette .site-accent-soft-muted translucent wash is intentional (Forest soft gold); light-airy remaps to opaque accent — see light-semantic-contrast.ts (not new Option C tokens).",
] as const;

function tokenValue(
  tokens: SitePaletteCssTokens,
  key: string,
): string {
  if (!(key in tokens)) {
    throw new Error(`Unknown palette token key: ${key}`);
  }
  return tokens[key as keyof SitePaletteCssTokens];
}

export function evaluatePaletteContrast(
  paletteId: SiteThemePresetId,
): ContrastEvaluationSummary {
  const tokens = resolvePaletteCssTokens(paletteId);
  const results = REQUIRED_PALETTE_CONTRAST_PAIRS.map((definition) =>
    evaluateContrastPair(
      definition,
      tokenValue(tokens, definition.foregroundToken),
      tokenValue(tokens, definition.backgroundToken),
    ),
  );
  return summarizeContrastResults(paletteId, results);
}

export function evaluateAllPaletteContrasts(): ContrastEvaluationSummary[] {
  return SITE_THEME_PRESET_IDS.map((id) => evaluatePaletteContrast(id));
}

export function assertAllPalettesMeetContrastContract(): void {
  const summaries = evaluateAllPaletteContrasts();
  const failures = summaries.flatMap((summary) =>
    summary.failures.map(
      (failure) =>
        `${summary.paletteId}: ${failure.id} — ${failure.message}`,
    ),
  );
  if (failures.length > 0) {
    throw new Error(
      `Palette contrast contract failures:\n${failures.join("\n")}`,
    );
  }
}
