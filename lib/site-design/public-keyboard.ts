/**
 * Public keyboard accessibility contract (NFT-STUDIO-007C-ENG02).
 *
 * Stable main-content target for skip links and focus landing.
 * Focus appearance is owned by CSS under `[data-site-theme]` so curated
 * palettes keep a visible accent ring without changing registry token values.
 */

/** Single public main landmark id — do not duplicate on a page. */
export const PUBLIC_MAIN_CONTENT_ID = "main-content" as const;

/** Skip-link href matching PUBLIC_MAIN_CONTENT_ID. */
export const PUBLIC_SKIP_HREF = `#${PUBLIC_MAIN_CONTENT_ID}` as const;

/** Nicole/operator-facing label for the skip control. */
export const PUBLIC_SKIP_LABEL = "Skip to main content" as const;

/**
 * CSS marker comments / selectors that tests assert remain present.
 * Runtime styles live in `app/globals.css`.
 */
export const PUBLIC_KEYBOARD_CSS_MARKERS = [
  "NFT-STUDIO-007C-ENG02",
  ".skip-to-content",
  `${PUBLIC_SKIP_HREF}`,
  ":focus-visible",
] as const;
