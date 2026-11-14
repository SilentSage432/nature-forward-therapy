/**
 * Public routes under rendered a11y coverage (NFT-STUDIO-007C-ENG03).
 * Article detail is optional — only when a published link is discoverable.
 */

export const PUBLIC_A11Y_ROUTES = [
  { path: "/", name: "homepage" },
  { path: "/articles", name: "articles-index" },
  { path: "/bookshelf", name: "bookshelf" },
] as const;

export type PublicA11yRoute = (typeof PUBLIC_A11Y_ROUTES)[number];

export const VIEWPORTS = {
  mobile: { width: 390, height: 844, label: "mobile-390" },
  tablet: { width: 768, height: 1024, label: "tablet-768" },
  desktop: { width: 1280, height: 800, label: "desktop-1280" },
  /** WCAG 1.4.10-style narrow CSS viewport approximation — NOT browser zoom. */
  reflowApprox400: { width: 320, height: 256, label: "reflow-approx-400pct-320" },
} as const;
