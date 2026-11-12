import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { PALETTE_GALLERY_LAYOUT } from "@/components/admin/studio/DesignControlPanel";
import {
  THEME_PALETTE_GROUPS,
  THEME_PALETTE_OPTIONS,
} from "@/lib/site-design/options";
import {
  evaluateAllPaletteContrasts,
} from "@/lib/site-design/palette-contrast-contract";
import {
  SITE_THEME_PRESET_IDS,
} from "@/lib/site-design/palette-registry";
import { parseSiteDesign } from "@/lib/site-design/schema";
import { cloneCanonicalSiteDesign } from "@/lib/site-design/defaults";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

describe("palette gallery layout contract (007A-UX01)", () => {
  it("keeps the curated inventory at 15 stable IDs", () => {
    assert.equal(SITE_THEME_PRESET_IDS.length, 15);
    assert.equal(THEME_PALETTE_OPTIONS.length, 15);
    assert.deepEqual(
      THEME_PALETTE_OPTIONS.map((o) => o.id),
      [...SITE_THEME_PRESET_IDS],
    );
    assert.deepEqual(
      [...SITE_THEME_PRESET_IDS].slice(0, 3),
      ["forest-gold", "dusk-sage", "clay-sand"],
    );
  });

  it("uses container-query columns instead of viewport sm:grid-cols-2", () => {
    assert.match(PALETTE_GALLERY_LAYOUT.containerClassName, /@container/);
    assert.match(PALETTE_GALLERY_LAYOUT.gridClassName, /grid-cols-1/);
    assert.match(PALETTE_GALLERY_LAYOUT.gridClassName, /@\[26rem\]:grid-cols-2/);
    assert.doesNotMatch(PALETTE_GALLERY_LAYOUT.gridClassName, /\bsm:grid-cols-2\b/);
  });

  it("keeps stacked card composition without title/swatch horizontal competition", () => {
    const source = readFileSync(
      path.join(repoRoot, "components/admin/studio/DesignControlPanel.tsx"),
      "utf8",
    );
    assert.match(source, /data-palette-card=/);
    assert.match(source, /data-palette-swatches=/);
    assert.match(source, /flex-col gap-2/);
    // Swatches must not sit in a justify-between header row with the title.
    assert.doesNotMatch(
      source,
      /justify-between[\s\S]{0,120}PaletteSwatches/,
    );
    assert.match(source, /type="radio"/);
    assert.match(source, /role="radiogroup"/);
  });

  it("preserves accessible radio selection for every palette", () => {
    for (const option of THEME_PALETTE_OPTIONS) {
      const design = cloneCanonicalSiteDesign();
      design.theme.presetId = option.id;
      const parsed = parseSiteDesign(design);
      assert.equal(parsed.ok, true);
    }
    assert.ok(THEME_PALETTE_GROUPS.every((g) => g.options.length > 0));
  });

  it("leaves the deterministic contrast contract passing", () => {
    const summaries = evaluateAllPaletteContrasts();
    assert.equal(summaries.length, 15);
    for (const summary of summaries) {
      assert.equal(summary.failures.length, 0);
      assert.equal(summary.passed, true);
    }
  });
});
