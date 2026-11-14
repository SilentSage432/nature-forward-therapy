/**
 * Deterministic models of light-airy semantic utility remaps
 * (NFT-STUDIO-007C-ENG04-ENG01 Option B).
 *
 * These pairs mirror the *rendered* CSS after light-scoped overrides:
 * - `.site-accent-soft-muted` → opaque `--site-accent` on page
 * - `.focus-pill` → opaque `--site-accent` on accent-tinted fill over elevated card
 *
 * Not new palette tokens (Option C deferred). Dark palettes keep the
 * pre-existing translucent soft-muted + secondary pill utilities.
 */

import {
  CONTRAST_THRESHOLDS,
  contrastRatio,
  parseCssColor,
  type ParsedOpaqueColor,
} from "@/lib/site-design/contrast";
import {
  SITE_PALETTE_DEFINITIONS,
  resolvePaletteCssTokens,
  type SiteThemePresetId,
} from "@/lib/site-design/palette-registry";

export const LIGHT_AIRY_PALETTE_IDS = SITE_PALETTE_DEFINITIONS.filter(
  (palette) => palette.group === "light-airy",
).map((palette) => palette.id) as readonly SiteThemePresetId[];

/** Matches CSS `color-mix(... 14%, transparent)` fill over an opaque base. */
export const FOCUS_PILL_FILL_ALPHA = 0.14;

export type ComposedSemanticContrastResult = {
  paletteId: SiteThemePresetId;
  softMuted: {
    foreground: string;
    background: string;
    ratio: number;
    passed: boolean;
  };
  focusPill: {
    foreground: string;
    background: string;
    ratio: number;
    passed: boolean;
  };
  passed: boolean;
};

function requireOpaque(css: string, label: string): ParsedOpaqueColor {
  const parsed = parseCssColor(css);
  if (!parsed || parsed.kind !== "opaque") {
    throw new Error(`Expected opaque color for ${label}, got: ${css}`);
  }
  return parsed;
}

/**
 * Alpha-composite a foreground color over an opaque background
 * (same model axe uses for translucent fills).
 */
export function compositeOpaqueOver(
  foregroundCss: string,
  alpha: number,
  backgroundCss: string,
): string {
  if (!(alpha >= 0 && alpha <= 1)) {
    throw new Error(`Alpha out of range: ${alpha}`);
  }
  const fg = requireOpaque(foregroundCss, "composite foreground");
  const bg = requireOpaque(backgroundCss, "composite background");
  const r = Math.round(fg.r * alpha + bg.r * (1 - alpha));
  const g = Math.round(fg.g * alpha + bg.g * (1 - alpha));
  const b = Math.round(fg.b * alpha + bg.b * (1 - alpha));
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Elevated frosted card under focus pills (`surfaceElevatedStrong` over page).
 */
export function resolveElevatedCardSurface(
  paletteId: SiteThemePresetId,
): string {
  const tokens = resolvePaletteCssTokens(paletteId);
  const elevated = parseCssColor(tokens.surfaceElevatedStrong);
  if (!elevated) {
    throw new Error(`Unparseable elevated surface for ${paletteId}`);
  }
  if (elevated.kind === "opaque") {
    return elevated.hex;
  }
  return compositeOpaqueOver(
    `rgb(${elevated.r}, ${elevated.g}, ${elevated.b})`,
    elevated.alpha,
    tokens.surfacePage,
  );
}

/**
 * Evaluate remapped light-airy utility relationships after Option B.
 */
export function evaluateLightSemanticContrast(
  paletteId: SiteThemePresetId,
): ComposedSemanticContrastResult {
  if (!LIGHT_AIRY_PALETTE_IDS.includes(paletteId)) {
    throw new Error(
      `evaluateLightSemanticContrast is only for light-airy palettes (got ${paletteId})`,
    );
  }

  const tokens = resolvePaletteCssTokens(paletteId);
  const softFg = requireOpaque(tokens.accent, `${paletteId} soft-muted fg`);
  const softBg = requireOpaque(tokens.surfacePage, `${paletteId} soft-muted bg`);
  const softRatio = contrastRatio(softFg, softBg);

  const card = resolveElevatedCardSurface(paletteId);
  const pillBgHex = compositeOpaqueOver(
    tokens.accent,
    FOCUS_PILL_FILL_ALPHA,
    card,
  );
  const pillFg = softFg;
  const pillBg = requireOpaque(pillBgHex, `${paletteId} pill bg`);
  const pillRatio = contrastRatio(pillFg, pillBg);

  const softMuted = {
    foreground: softFg.hex,
    background: softBg.hex,
    ratio: softRatio,
    passed: softRatio + 1e-9 >= CONTRAST_THRESHOLDS["normal-text"],
  };
  const focusPill = {
    foreground: pillFg.hex,
    background: pillBg.hex,
    ratio: pillRatio,
    passed: pillRatio + 1e-9 >= CONTRAST_THRESHOLDS["normal-text"],
  };

  return {
    paletteId,
    softMuted,
    focusPill,
    passed: softMuted.passed && focusPill.passed,
  };
}

export function evaluateAllLightSemanticContrasts(): ComposedSemanticContrastResult[] {
  return LIGHT_AIRY_PALETTE_IDS.map((id) => evaluateLightSemanticContrast(id));
}

export function assertAllLightSemanticContrastsPass(): void {
  const failures = evaluateAllLightSemanticContrasts().flatMap((summary) => {
    const messages: string[] = [];
    if (!summary.softMuted.passed) {
      messages.push(
        `${summary.paletteId}: soft-muted ${summary.softMuted.ratio.toFixed(2)}:1 (${summary.softMuted.foreground} on ${summary.softMuted.background})`,
      );
    }
    if (!summary.focusPill.passed) {
      messages.push(
        `${summary.paletteId}: focus-pill ${summary.focusPill.ratio.toFixed(2)}:1 (${summary.focusPill.foreground} on ${summary.focusPill.background})`,
      );
    }
    return messages;
  });
  if (failures.length > 0) {
    throw new Error(
      `Light semantic contrast failures:\n${failures.join("\n")}`,
    );
  }
}
