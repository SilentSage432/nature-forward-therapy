import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { join } from "node:path";
import {
  PUBLIC_KEYBOARD_CSS_MARKERS,
  PUBLIC_MAIN_CONTENT_ID,
  PUBLIC_SKIP_HREF,
  PUBLIC_SKIP_LABEL,
} from "@/lib/site-design/public-keyboard";
import { contrastRatioForCssColors } from "@/lib/site-design/contrast";
import {
  SITE_THEME_PRESET_IDS,
  SITE_PALETTE_BY_ID,
} from "@/lib/site-design/palette-registry";

const root = process.cwd();

function read(rel: string): string {
  return readFileSync(join(root, rel), "utf8");
}

describe("public keyboard contract constants", () => {
  it("exposes a stable main-content target and skip href", () => {
    assert.equal(PUBLIC_MAIN_CONTENT_ID, "main-content");
    assert.equal(PUBLIC_SKIP_HREF, "#main-content");
    assert.match(PUBLIC_SKIP_LABEL, /skip to main content/i);
  });
});

describe("public keyboard CSS markers", () => {
  const css = read("app/globals.css");

  it("keeps ENG02 focus and skip-link styles under data-site-theme", () => {
    for (const marker of PUBLIC_KEYBOARD_CSS_MARKERS) {
      assert.match(css, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    }
    assert.match(css, /\[data-site-theme\][\s\S]*\.skip-to-content/);
    assert.match(css, /\[data-site-theme\][\s\S]*:focus-visible/);
    assert.match(css, /\.btn-gold:focus-visible/);
    assert.match(css, /\.btn-outline:focus-visible/);
    assert.match(css, /#main-content/);
    // Must not strip focus without a visible replacement pattern.
    assert.match(css, /outline:\s*2px solid var\(--site-accent\)/);
    assert.match(
      css,
      /\.btn-gold:focus-visible[\s\S]*outline:\s*2px solid var\(--site-accent-foreground\)/,
    );
  });
});

describe("skip link and main landmark wiring", () => {
  it("mounts SkipToContent inside SiteTheme", () => {
    const theme = read("components/site/SiteTheme.tsx");
    assert.match(theme, /SkipToContent/);
    assert.match(theme, /from "@\/components\/site\/SkipToContent"/);
  });

  it("targets a single main-content id on public homepage and catalogs", () => {
    const home = read("components/site/HomePresentation.tsx");
    const articles = read("app/articles/page.tsx");
    const bookshelf = read("app/bookshelf/page.tsx");
    const article = read("app/articles/[slug]/page.tsx");
    const skip = read("components/site/SkipToContent.tsx");

    for (const source of [home, articles, bookshelf, article]) {
      assert.match(source, /PUBLIC_MAIN_CONTENT_ID/);
      assert.match(source, /tabIndex=\{-1\}/);
    }
    assert.match(skip, /PUBLIC_SKIP_HREF/);
    assert.match(skip, /data-public-skip-to-content/);
  });
});

describe("focus indicator palette contrast intent", () => {
  it("keeps accent-vs-page contrast usable for focus rings on every curated palette", () => {
    // Focus outline uses --site-accent on --site-surface-page (links/buttons).
    // Required palette contract already enforces accent-link-on-page ≥ 4.5:1;
    // assert the opaque pair remains ≥ 3:1 non-text UI for all 15 palettes.
    for (const id of SITE_THEME_PRESET_IDS) {
      const tokens = SITE_PALETTE_BY_ID[id].tokens;
      const result = contrastRatioForCssColors(tokens.accent, tokens.surfacePage);
      assert.equal(result.status, "ok", `${id} accent/page must be opaque`);
      assert.ok(
        (result.ratio ?? 0) >= 3,
        `${id} accent on page ${result.ratio?.toFixed(2)}:1 should meet 3:1 for focus UI`,
      );

      const filled = contrastRatioForCssColors(
        tokens.accentForeground,
        tokens.accent,
      );
      assert.equal(filled.status, "ok", `${id} CTA label/accent must be opaque`);
      assert.ok(
        (filled.ratio ?? 0) >= 3,
        `${id} accent-foreground on accent for filled CTA focus outline`,
      );
    }
  });
});
