import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  CONTRAST_THRESHOLDS,
  contrastRatioForCssColors,
} from "@/lib/site-design/contrast";
import {
  FOCUS_PILL_FILL_ALPHA,
  LIGHT_AIRY_PALETTE_IDS,
  assertAllLightSemanticContrastsPass,
  compositeOpaqueOver,
  evaluateAllLightSemanticContrasts,
  evaluateLightSemanticContrast,
  resolveElevatedCardSurface,
} from "@/lib/site-design/light-semantic-contrast";
import { resolvePaletteCssTokens } from "@/lib/site-design/palette-registry";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

describe("light-airy semantic utility contrast (ENG04-ENG01)", () => {
  it("covers exactly the four curated light-airy palettes", () => {
    assert.deepEqual(
      [...LIGHT_AIRY_PALETTE_IDS].sort(),
      [
        "botanical-cream",
        "coastal-mist",
        "lavender-meadow",
        "misty-morning",
      ].sort(),
    );
  });

  it("models remapped soft-muted and focus-pill relationships at ≥4.5:1", () => {
    for (const paletteId of LIGHT_AIRY_PALETTE_IDS) {
      const result = evaluateLightSemanticContrast(paletteId);
      assert.equal(result.paletteId, paletteId);
      assert.ok(
        result.softMuted.ratio >= CONTRAST_THRESHOLDS["normal-text"],
        `${paletteId} soft-muted ${result.softMuted.ratio}`,
      );
      assert.ok(
        result.focusPill.ratio >= CONTRAST_THRESHOLDS["normal-text"],
        `${paletteId} focus-pill ${result.focusPill.ratio}`,
      );
      assert.equal(result.passed, true);

      const tokens = resolvePaletteCssTokens(paletteId);
      assert.equal(result.softMuted.foreground, tokens.accent.toLowerCase());
      assert.equal(
        result.softMuted.background,
        tokens.surfacePage.toLowerCase(),
      );

      const card = resolveElevatedCardSurface(paletteId);
      const expectedPillBg = compositeOpaqueOver(
        tokens.accent,
        FOCUS_PILL_FILL_ALPHA,
        card,
      );
      assert.equal(result.focusPill.background, expectedPillBg);
      assert.equal(result.focusPill.foreground, tokens.accent.toLowerCase());
    }

    assertAllLightSemanticContrastsPass();
    assert.equal(evaluateAllLightSemanticContrasts().length, 4);
  });

  it("keeps light-scoped CSS remaps without new contrast tokens", () => {
    const css = readFileSync(path.join(repoRoot, "app/globals.css"), "utf8");

    // Default (dark-preserving) soft-muted wash remains.
    assert.match(
      css,
      /\.site-accent-soft-muted\s*\{\s*color:\s*color-mix\(in srgb,\s*var\(--site-accent-soft\)\s*70%,\s*transparent\);/,
    );

    // Light remaps use opaque accent — not universal near-black.
    for (const id of LIGHT_AIRY_PALETTE_IDS) {
      assert.match(css, new RegExp(`data-site-theme="${id}"`));
    }
    assert.match(
      css,
      /:is\(\s*\[data-site-theme="coastal-mist"\][\s\S]*?\[data-site-theme="misty-morning"\]\s*\)\s*\.site-accent-soft-muted\s*\{\s*color:\s*var\(--site-accent\);/,
    );
    assert.match(
      css,
      /:is\(\s*\[data-site-theme="coastal-mist"\][\s\S]*?\[data-site-theme="misty-morning"\]\s*\)\s*\.focus-pill\s*\{[\s\S]*?color:\s*var\(--site-accent\);/,
    );

    // Option C not taken — no speculative soft-muted / pill token vars.
    assert.doesNotMatch(css, /--site-accent-soft-muted-readable/);
    assert.doesNotMatch(css, /--site-focus-pill-foreground/);
  });

  it("does not treat legacy transparent soft-muted as a solid pass on light pages", () => {
    // Documents why the remap exists: Coastal soft at 70% over page fails AA.
    const tokens = resolvePaletteCssTokens("coastal-mist");
    const washed = compositeOpaqueOver(
      tokens.accentSoft,
      0.7,
      tokens.surfacePage,
    );
    const washedRatio = contrastRatioForCssColors(washed, tokens.surfacePage);
    assert.equal(washedRatio.status, "ok");
    assert.ok((washedRatio.ratio ?? 0) < CONTRAST_THRESHOLDS["normal-text"]);
  });
});
