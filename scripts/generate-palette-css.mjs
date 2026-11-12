/**
 * Deterministic SiteDesign palette CSS emitter (NFT-STUDIO-007A).
 *
 * Replaces ONLY the marked semantic theme-token region in app/globals.css.
 * Refuses to write if markers are missing, duplicated, or out of order.
 * Output depends solely on palette-registry.ts — no Date/env/random.
 */
import { readFileSync, writeFileSync } from "node:fs";

const { SITE_PALETTE_DEFINITIONS, CSS_TOKEN_VAR_NAMES } = await import(
  "../lib/site-design/palette-registry.ts"
);

const START_MARKER = "/*\n * Semantic theme tokens.";
const END_MARKER =
  "/* Typography families — scoped under public SiteTheme only. */";

function block(id, selector) {
  const tokens = SITE_PALETTE_DEFINITIONS.find((p) => p.id === id).tokens;
  const lines = Object.entries(CSS_TOKEN_VAR_NAMES).map(([key, cssVar]) => {
    return `  ${cssVar}: ${tokens[key]};`;
  });
  return `${selector} {\n${lines.join("\n")}\n}`;
}

function countOccurrences(haystack, needle) {
  let count = 0;
  let index = 0;
  while (true) {
    const found = haystack.indexOf(needle, index);
    if (found < 0) break;
    count += 1;
    index = found + needle.length;
  }
  return count;
}

const parts = [];
parts.push(`${START_MARKER}
 * :root = stable system/admin defaults (current forest-gold identity).
 * [data-site-theme] = explicit public presentation boundary for curated
 * Studio presets. Forest-gold values match production visual parity.
 * Token tables live in lib/site-design/palette-registry.ts — keep in sync.
 */
:root,
${block("forest-gold", '[data-site-theme="forest-gold"]')}`);

for (const palette of SITE_PALETTE_DEFINITIONS) {
  if (palette.id === "forest-gold") continue;
  parts.push(`/* Curated palette — ${palette.label} (Studio-selectable). */`);
  parts.push(block(palette.id, `[data-site-theme="${palette.id}"]`));
}

const generated = parts.join("\n\n") + "\n";
const cssPath = new URL("../app/globals.css", import.meta.url);
const css = readFileSync(cssPath, "utf8");

if (countOccurrences(css, START_MARKER) !== 1) {
  throw new Error(
    "Refusing to write: Semantic theme tokens start marker missing or duplicated.",
  );
}
if (countOccurrences(css, END_MARKER) !== 1) {
  throw new Error(
    "Refusing to write: Typography families end marker missing or duplicated.",
  );
}

const start = css.indexOf(START_MARKER);
const end = css.indexOf(END_MARKER);
if (start < 0 || end < 0 || end <= start) {
  throw new Error("CSS markers not found or out of order.");
}

const before = css.slice(0, start);
const after = css.slice(end);
if (!after.startsWith(END_MARKER)) {
  throw new Error("End marker slice invariant failed.");
}

const next = before + generated + "\n" + after;
writeFileSync(cssPath, next);
console.log(
  `Wrote ${SITE_PALETTE_DEFINITIONS.length} palette CSS blocks (${next.length} bytes)`,
);
