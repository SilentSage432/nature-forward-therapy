import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { cloneCanonicalSiteDesign } from "@/lib/site-design/defaults";
import {
  REQUIRED_PALETTE_CONTRAST_PAIRS,
  evaluateAllPaletteContrasts,
  evaluatePaletteContrast,
} from "@/lib/site-design/palette-contrast-contract";
import {
  CSS_TOKEN_VAR_NAMES,
  SITE_PALETTE_DEFINITIONS,
  SITE_PALETTE_GROUPS,
  SITE_THEME_PRESET_IDS,
  resolvePaletteCssTokens,
  type SitePaletteCssTokens,
} from "@/lib/site-design/palette-registry";
import { parseSiteDesign, SITE_DESIGN_SCHEMA_VERSION } from "@/lib/site-design/schema";
import { THEME_PALETTE_OPTIONS } from "@/lib/site-design/options";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

function extractThemeBlock(css: string, themeId: string): string | null {
  const escaped = themeId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Prefer the dedicated theme selector block; forest-gold is joined with :root.
  const joined = css.match(
    new RegExp(
      `:root,\\s*\\[data-site-theme="${escaped}"\\]\\s*\\{([\\s\\S]*?)\\n\\}`,
    ),
  );
  if (joined) return joined[1] ?? null;
  const solo = css.match(
    new RegExp(`\\[data-site-theme="${escaped}"\\]\\s*\\{([\\s\\S]*?)\\n\\}`),
  );
  return solo?.[1] ?? null;
}

function parseCssCustomProperties(block: string): Record<string, string> {
  const props: Record<string, string> = {};
  for (const match of block.matchAll(/(--site-[a-z0-9-]+)\s*:\s*([^;]+);/g)) {
    props[match[1]!] = match[2]!.trim();
  }
  return props;
}

describe("palette registry completeness", () => {
  it("exposes 12–20 curated palettes with forest-gold first", () => {
    assert.ok(SITE_THEME_PRESET_IDS.length >= 12);
    assert.ok(SITE_THEME_PRESET_IDS.length <= 20);
    assert.equal(SITE_THEME_PRESET_IDS[0], "forest-gold");
    assert.equal(SITE_PALETTE_DEFINITIONS[0]?.id, "forest-gold");
    assert.deepEqual(
      SITE_THEME_PRESET_IDS,
      SITE_PALETTE_DEFINITIONS.map((p) => p.id),
    );
  });

  it("keeps stable existing V1 palette IDs", () => {
    for (const id of ["forest-gold", "dusk-sage", "clay-sand"] as const) {
      assert.ok(SITE_THEME_PRESET_IDS.includes(id));
    }
  });

  it("requires every palette to define the full semantic token set", () => {
    const keys = Object.keys(CSS_TOKEN_VAR_NAMES) as (keyof SitePaletteCssTokens)[];
    for (const id of SITE_THEME_PRESET_IDS) {
      const tokens = resolvePaletteCssTokens(id);
      for (const key of keys) {
        assert.equal(typeof tokens[key], "string");
        assert.ok(tokens[key].length > 0, `${id}.${key} empty`);
      }
    }
  });

  it("keeps Studio options synchronized with the registry", () => {
    assert.deepEqual(
      THEME_PALETTE_OPTIONS.map((o) => o.id),
      [...SITE_THEME_PRESET_IDS],
    );
    for (const group of SITE_PALETTE_GROUPS) {
      assert.ok(
        THEME_PALETTE_OPTIONS.some((o) => o.group === group) ||
          group === "botanical" ||
          group === "earthy" ||
          group === "light-airy" ||
          group === "deep-calm",
      );
    }
  });

  it("preserves schemaVersion 1 for every curated palette", () => {
    for (const id of SITE_THEME_PRESET_IDS) {
      const design = cloneCanonicalSiteDesign();
      design.theme.presetId = id;
      const parsed = parseSiteDesign(design);
      assert.equal(parsed.ok, true);
      if (parsed.ok) {
        assert.equal(parsed.design.schemaVersion, SITE_DESIGN_SCHEMA_VERSION);
        assert.equal(parsed.design.theme.presetId, id);
      }
    }
  });
});

describe("CSS / registry parity", () => {
  it("mirrors every registry token into globals.css theme scopes", () => {
    const css = readFileSync(path.join(repoRoot, "app/globals.css"), "utf8");
    for (const id of SITE_THEME_PRESET_IDS) {
      const block = extractThemeBlock(css, id);
      assert.ok(block, `missing CSS block for ${id}`);
      const props = parseCssCustomProperties(block!);
      const tokens = resolvePaletteCssTokens(id);
      for (const [tokenKey, cssVar] of Object.entries(CSS_TOKEN_VAR_NAMES)) {
        assert.equal(
          props[cssVar],
          tokens[tokenKey as keyof SitePaletteCssTokens],
          `${id} ${cssVar} drifted`,
        );
      }
    }
  });
});

describe("palette contrast contract", () => {
  it("defines required pairs with explicit thresholds", () => {
    assert.ok(REQUIRED_PALETTE_CONTRAST_PAIRS.length >= 10);
    for (const pair of REQUIRED_PALETTE_CONTRAST_PAIRS) {
      assert.ok(
        pair.threshold === "normal-text" ||
          pair.threshold === "large-text" ||
          pair.threshold === "ui-non-text",
      );
    }
  });

  it("passes deterministic contrast checks for every curated palette", () => {
    const summaries = evaluateAllPaletteContrasts();
    assert.equal(summaries.length, SITE_THEME_PRESET_IDS.length);
    for (const summary of summaries) {
      assert.equal(
        summary.failures.length,
        0,
        summary.failures.map((f) => `${summary.paletteId}:${f.id}`).join(", "),
      );
      assert.equal(summary.reviewRequired.length, 0);
      assert.equal(summary.passed, true);
    }
  });

  it("keeps forest-gold contrast identity intact", () => {
    const summary = evaluatePaletteContrast("forest-gold");
    const body = summary.results.find((r) => r.id === "body-on-page");
    const button = summary.results.find((r) => r.id === "button-label-on-accent");
    assert.ok(body?.passed);
    assert.ok(button?.passed);
    assert.equal(body?.foreground, "#e8eae6");
    assert.equal(body?.background, "#162221");
    assert.equal(button?.foreground, "#162221");
    assert.equal(button?.background, "#d4af37");
  });
});

describe("existing V1 design compatibility", () => {
  it("still validates pre-expansion stored designs", () => {
    for (const presetId of ["forest-gold", "dusk-sage", "clay-sand"] as const) {
      const result = parseSiteDesign({
        ...cloneCanonicalSiteDesign(),
        theme: { presetId },
      });
      assert.equal(result.ok, true);
    }
  });

  it("rejects unknown palette ids without rewriting schema version", () => {
    const result = parseSiteDesign({
      ...cloneCanonicalSiteDesign(),
      theme: { presetId: "neon-cyber" },
    });
    assert.equal(result.ok, false);
    assert.equal(SITE_DESIGN_SCHEMA_VERSION, 1);
  });
});
