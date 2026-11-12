/**
 * Deterministic WCAG contrast evaluation for curated SiteDesign palettes.
 *
 * Parses approved hex / rgba representations used by the palette registry,
 * computes relative luminance and contrast ratios, and returns structured
 * pass/fail results. Decorative transparency and image-backed surfaces are
 * never fabricated into opaque passes.
 */

export type ContrastThresholdKind = "normal-text" | "large-text" | "ui-non-text";

export const CONTRAST_THRESHOLDS: Record<ContrastThresholdKind, number> = {
  "normal-text": 4.5,
  "large-text": 3,
  "ui-non-text": 3,
};

export type ParsedOpaqueColor = {
  kind: "opaque";
  r: number;
  g: number;
  b: number;
  /** Normalized #rrggbb */
  hex: string;
  original: string;
};

export type ParsedTransparentColor = {
  kind: "transparent";
  r: number;
  g: number;
  b: number;
  alpha: number;
  original: string;
};

export type ParsedColor = ParsedOpaqueColor | ParsedTransparentColor;

export type ContrastPairDefinition = {
  id: string;
  label: string;
  foregroundToken: string;
  backgroundToken: string;
  threshold: ContrastThresholdKind;
};

export type ContrastPairResult = {
  id: string;
  label: string;
  foregroundToken: string;
  backgroundToken: string;
  foreground: string;
  background: string;
  threshold: ContrastThresholdKind;
  minimum: number;
  ratio: number | null;
  passed: boolean;
  status: "pass" | "fail" | "requires-rendered-review";
  message: string;
};

export type ContrastEvaluationSummary = {
  paletteId: string;
  passed: boolean;
  results: ContrastPairResult[];
  failures: ContrastPairResult[];
  reviewRequired: ContrastPairResult[];
};

function clampByte(n: number): number {
  return Math.min(255, Math.max(0, Math.round(n)));
}

function toHexByte(n: number): string {
  return clampByte(n).toString(16).padStart(2, "0");
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${toHexByte(r)}${toHexByte(g)}${toHexByte(b)}`;
}

function expandShortHex(hex: string): string {
  if (hex.length !== 3) return hex;
  return hex
    .split("")
    .map((ch) => ch + ch)
    .join("");
}

/**
 * Parse curated registry colors: #rgb, #rrggbb, rgb(), rgba().
 * Rejects unsupported formats rather than guessing.
 */
export function parseCssColor(input: string): ParsedColor | null {
  const value = input.trim().toLowerCase();

  if (value.startsWith("#")) {
    const raw = expandShortHex(value.slice(1));
    if (!/^[0-9a-f]{6}$/.test(raw)) return null;
    const n = Number.parseInt(raw, 16);
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    return {
      kind: "opaque",
      r,
      g,
      b,
      hex: rgbToHex(r, g, b),
      original: input.trim(),
    };
  }

  const rgbMatch = value.match(
    /^rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)(?:\s*,\s*([0-9.]+))?\s*\)$/,
  );
  if (!rgbMatch) return null;

  const r = Number(rgbMatch[1]);
  const g = Number(rgbMatch[2]);
  const b = Number(rgbMatch[3]);
  const alpha = rgbMatch[4] == null ? 1 : Number(rgbMatch[4]);
  if (![r, g, b, alpha].every((n) => Number.isFinite(n))) return null;
  if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) return null;
  if (alpha < 0 || alpha > 1) return null;

  if (alpha >= 1) {
    return {
      kind: "opaque",
      r,
      g,
      b,
      hex: rgbToHex(r, g, b),
      original: input.trim(),
    };
  }

  return {
    kind: "transparent",
    r,
    g,
    b,
    alpha,
    original: input.trim(),
  };
}

/** sRGB channel 0–255 → linear light per WCAG 2.x. */
export function srgbChannelToLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** Relative luminance for an opaque sRGB color. */
export function relativeLuminance(color: ParsedOpaqueColor): number {
  const R = srgbChannelToLinear(color.r);
  const G = srgbChannelToLinear(color.g);
  const B = srgbChannelToLinear(color.b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/** WCAG contrast ratio between two opaque colors. */
export function contrastRatio(
  foreground: ParsedOpaqueColor,
  background: ParsedOpaqueColor,
): number {
  const L1 = relativeLuminance(foreground);
  const L2 = relativeLuminance(background);
  const lighter = Math.max(L1, L2);
  const darker = Math.min(L1, L2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function contrastRatioForCssColors(
  foregroundCss: string,
  backgroundCss: string,
): {
  ratio: number | null;
  status: "ok" | "requires-rendered-review" | "invalid";
  message: string;
  foreground: ParsedColor | null;
  background: ParsedColor | null;
} {
  const foreground = parseCssColor(foregroundCss);
  const background = parseCssColor(backgroundCss);

  if (!foreground || !background) {
    return {
      ratio: null,
      status: "invalid",
      message: `Unable to parse color(s): foreground=${foregroundCss}, background=${backgroundCss}`,
      foreground,
      background,
    };
  }

  if (foreground.kind === "transparent" || background.kind === "transparent") {
    return {
      ratio: null,
      status: "requires-rendered-review",
      message:
        "Transparent or translucent color cannot be evaluated as an opaque solid; rendered or human review required.",
      foreground,
      background,
    };
  }

  return {
    ratio: contrastRatio(foreground, background),
    status: "ok",
    message: "Opaque pair evaluated.",
    foreground,
    background,
  };
}

export function evaluateContrastPair(
  definition: ContrastPairDefinition,
  foregroundCss: string,
  backgroundCss: string,
): ContrastPairResult {
  const minimum = CONTRAST_THRESHOLDS[definition.threshold];
  const evaluated = contrastRatioForCssColors(foregroundCss, backgroundCss);

  if (evaluated.status === "invalid") {
    return {
      id: definition.id,
      label: definition.label,
      foregroundToken: definition.foregroundToken,
      backgroundToken: definition.backgroundToken,
      foreground: foregroundCss,
      background: backgroundCss,
      threshold: definition.threshold,
      minimum,
      ratio: null,
      passed: false,
      status: "fail",
      message: evaluated.message,
    };
  }

  if (evaluated.status === "requires-rendered-review") {
    return {
      id: definition.id,
      label: definition.label,
      foregroundToken: definition.foregroundToken,
      backgroundToken: definition.backgroundToken,
      foreground: foregroundCss,
      background: backgroundCss,
      threshold: definition.threshold,
      minimum,
      ratio: null,
      passed: false,
      status: "requires-rendered-review",
      message: evaluated.message,
    };
  }

  const ratio = evaluated.ratio ?? 0;
  const passed = ratio + 1e-9 >= minimum;
  return {
    id: definition.id,
    label: definition.label,
    foregroundToken: definition.foregroundToken,
    backgroundToken: definition.backgroundToken,
    foreground: foregroundCss,
    background: backgroundCss,
    threshold: definition.threshold,
    minimum,
    ratio,
    passed,
    status: passed ? "pass" : "fail",
    message: passed
      ? `Contrast ${ratio.toFixed(2)}:1 meets ${minimum}:1 (${definition.threshold}).`
      : `Contrast ${ratio.toFixed(2)}:1 fails ${minimum}:1 (${definition.threshold}) for ${definition.label}.`,
  };
}

export function summarizeContrastResults(
  paletteId: string,
  results: ContrastPairResult[],
): ContrastEvaluationSummary {
  const failures = results.filter((r) => r.status === "fail");
  const reviewRequired = results.filter(
    (r) => r.status === "requires-rendered-review",
  );
  return {
    paletteId,
    passed: failures.length === 0 && reviewRequired.length === 0,
    results,
    failures,
    reviewRequired,
  };
}
