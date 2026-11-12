import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CONTRAST_THRESHOLDS,
  contrastRatio,
  contrastRatioForCssColors,
  evaluateContrastPair,
  parseCssColor,
  relativeLuminance,
  srgbChannelToLinear,
} from "@/lib/site-design/contrast";

describe("contrast color parsing", () => {
  it("parses hex and rgba approved representations", () => {
    const hex = parseCssColor("#162221");
    assert.equal(hex?.kind, "opaque");
    if (hex?.kind === "opaque") {
      assert.equal(hex.hex, "#162221");
      assert.equal(hex.r, 22);
    }

    const short = parseCssColor("#fff");
    assert.equal(short?.kind, "opaque");
    if (short?.kind === "opaque") assert.equal(short.hex, "#ffffff");

    const opaqueRgba = parseCssColor("rgba(22, 34, 33, 1)");
    assert.equal(opaqueRgba?.kind, "opaque");

    const translucent = parseCssColor("rgba(212, 175, 55, 0.55)");
    assert.equal(translucent?.kind, "transparent");
    if (translucent?.kind === "transparent") {
      assert.equal(translucent.alpha, 0.55);
    }
  });

  it("rejects unsupported color formats", () => {
    assert.equal(parseCssColor("hsl(120, 50%, 40%)"), null);
    assert.equal(parseCssColor("currentColor"), null);
    assert.equal(parseCssColor("#gg0000"), null);
  });
});

describe("contrast luminance and ratio math", () => {
  it("uses correct sRGB-to-linear conversion boundaries", () => {
    assert.ok(Math.abs(srgbChannelToLinear(0) - 0) < 1e-12);
    assert.ok(Math.abs(srgbChannelToLinear(255) - 1) < 1e-12);
    // Channel 10 is below the 0.04045 linear threshold in 0–1 space.
    assert.ok(srgbChannelToLinear(10) < srgbChannelToLinear(11));
  });

  it("matches known WCAG black/white contrast", () => {
    const black = parseCssColor("#000000");
    const white = parseCssColor("#ffffff");
    assert.ok(black && black.kind === "opaque");
    assert.ok(white && white.kind === "opaque");
    if (black?.kind !== "opaque" || white?.kind !== "opaque") return;
    assert.equal(relativeLuminance(black), 0);
    assert.equal(relativeLuminance(white), 1);
    assert.ok(Math.abs(contrastRatio(black, white) - 21) < 1e-10);
  });

  it("evaluates forest-gold body text above normal-text threshold", () => {
    const result = contrastRatioForCssColors("#e8eae6", "#162221");
    assert.equal(result.status, "ok");
    assert.ok((result.ratio ?? 0) >= CONTRAST_THRESHOLDS["normal-text"]);
  });

  it("does not fabricate a pass for translucent pairs", () => {
    const result = contrastRatioForCssColors(
      "#ffffff",
      "rgba(22, 34, 33, 0.88)",
    );
    assert.equal(result.status, "requires-rendered-review");
    assert.equal(result.ratio, null);
  });

  it("applies distinct thresholds by pair kind", () => {
    const normal = evaluateContrastPair(
      {
        id: "n",
        label: "normal",
        foregroundToken: "fg",
        backgroundToken: "bg",
        threshold: "normal-text",
      },
      "#777777",
      "#ffffff",
    );
    const large = evaluateContrastPair(
      {
        id: "l",
        label: "large",
        foregroundToken: "fg",
        backgroundToken: "bg",
        threshold: "large-text",
      },
      "#777777",
      "#ffffff",
    );
    assert.equal(normal.minimum, 4.5);
    assert.equal(large.minimum, 3);
    assert.ok(normal.ratio != null && large.ratio != null);
    assert.equal(normal.ratio, large.ratio);
    assert.notEqual(normal.passed, large.passed);
  });
});
