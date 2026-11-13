/**
 * Authoritative curated SiteDesign typography pairing registry (NFT-STUDIO-007B).
 *
 * Source of truth for:
 * - Stable fontFamilyId values (Zod enum / SiteFontFamilyId)
 * - Nicole-facing labels, descriptions, and Studio groups
 * - Heading/body CSS variable assignments mirrored in `app/globals.css`
 * - Font asset metadata for next/font loading and license documentation
 *
 * Runtime CSS remains static under `[data-site-font]` (Next/Tailwind-safe).
 * Drift between this registry and CSS/layout loading is detected by tests.
 *
 * Existing IDs `classic` | `editorial` | `modern` are stable and must retain
 * their historical heading/body stacks. schemaVersion stays 1.
 */

export const SITE_TYPOGRAPHY_GROUPS = [
  "established",
  "serif-led",
  "sans-led",
] as const;

export type SiteTypographyGroupId = (typeof SITE_TYPOGRAPHY_GROUPS)[number];

export const SITE_TYPOGRAPHY_GROUP_LABELS: Record<SiteTypographyGroupId, string> =
  {
    established: "Established",
    "serif-led": "Serif-led",
    "sans-led": "Sans-led",
  };

/** CSS custom properties written by next/font on <html>. */
export type SiteFontCssVar =
  | "--font-inter"
  | "--font-montserrat"
  | "--font-cormorant"
  | "--font-playfair"
  | "--font-lora"
  | "--font-libre-baskerville"
  | "--font-source-sans-3"
  | "--font-nunito-sans"
  | "--font-manrope"
  | "--font-dm-sans"
  | "--font-fraunces";

export type SiteFontKind = "sans" | "serif";

export type SiteFontFaceDefinition = {
  /** Machine id used in layout loading maps. */
  id: string;
  familyName: string;
  cssVar: SiteFontCssVar;
  /** next/font/google export name (documentation / tests). */
  nextFontExport: string;
  license: "OFL-1.1";
  source: "Google Fonts via next/font";
  /** Weights requested from next/font (latin subset only). */
  weights: readonly string[];
  styles?: readonly ("normal" | "italic")[];
  fallback: string;
  kind: SiteFontKind;
};

/**
 * Distinct typeface assets loaded for curated pairings.
 * Shared across pairings to keep the download set bounded.
 */
export const SITE_FONT_FACES = [
  {
    id: "inter",
    familyName: "Inter",
    cssVar: "--font-inter",
    nextFontExport: "Inter",
    license: "OFL-1.1",
    source: "Google Fonts via next/font",
    weights: ["400", "500", "600", "700"],
    fallback: "ui-sans-serif, system-ui, sans-serif",
    kind: "sans",
  },
  {
    id: "montserrat",
    familyName: "Montserrat",
    cssVar: "--font-montserrat",
    nextFontExport: "Montserrat",
    license: "OFL-1.1",
    source: "Google Fonts via next/font",
    weights: ["600", "700"],
    fallback: "ui-sans-serif, system-ui, sans-serif",
    kind: "sans",
  },
  {
    id: "cormorant-garamond",
    familyName: "Cormorant Garamond",
    cssVar: "--font-cormorant",
    nextFontExport: "Cormorant_Garamond",
    license: "OFL-1.1",
    source: "Google Fonts via next/font",
    weights: ["400", "500", "600"],
    styles: ["normal", "italic"],
    fallback: 'ui-serif, Georgia, "Times New Roman", serif',
    kind: "serif",
  },
  {
    id: "playfair-display",
    familyName: "Playfair Display",
    cssVar: "--font-playfair",
    nextFontExport: "Playfair_Display",
    license: "OFL-1.1",
    source: "Google Fonts via next/font",
    weights: ["600", "700"],
    fallback: 'ui-serif, Georgia, "Times New Roman", serif',
    kind: "serif",
  },
  {
    id: "lora",
    familyName: "Lora",
    cssVar: "--font-lora",
    nextFontExport: "Lora",
    license: "OFL-1.1",
    source: "Google Fonts via next/font",
    weights: ["600", "700"],
    fallback: 'ui-serif, Georgia, "Times New Roman", serif',
    kind: "serif",
  },
  {
    id: "libre-baskerville",
    familyName: "Libre Baskerville",
    cssVar: "--font-libre-baskerville",
    nextFontExport: "Libre_Baskerville",
    license: "OFL-1.1",
    source: "Google Fonts via next/font",
    weights: ["400", "700"],
    fallback: 'ui-serif, Georgia, "Times New Roman", serif',
    kind: "serif",
  },
  {
    id: "source-sans-3",
    familyName: "Source Sans 3",
    cssVar: "--font-source-sans-3",
    nextFontExport: "Source_Sans_3",
    license: "OFL-1.1",
    source: "Google Fonts via next/font",
    weights: ["400", "500", "600", "700"],
    fallback: "ui-sans-serif, system-ui, sans-serif",
    kind: "sans",
  },
  {
    id: "nunito-sans",
    familyName: "Nunito Sans",
    cssVar: "--font-nunito-sans",
    nextFontExport: "Nunito_Sans",
    license: "OFL-1.1",
    source: "Google Fonts via next/font",
    weights: ["400", "500", "600", "700"],
    fallback: "ui-sans-serif, system-ui, sans-serif",
    kind: "sans",
  },
  {
    id: "manrope",
    familyName: "Manrope",
    cssVar: "--font-manrope",
    nextFontExport: "Manrope",
    license: "OFL-1.1",
    source: "Google Fonts via next/font",
    weights: ["600", "700"],
    fallback: "ui-sans-serif, system-ui, sans-serif",
    kind: "sans",
  },
  {
    id: "dm-sans",
    familyName: "DM Sans",
    cssVar: "--font-dm-sans",
    nextFontExport: "DM_Sans",
    license: "OFL-1.1",
    source: "Google Fonts via next/font",
    weights: ["400", "500", "600", "700"],
    fallback: "ui-sans-serif, system-ui, sans-serif",
    kind: "sans",
  },
  {
    id: "fraunces",
    familyName: "Fraunces",
    cssVar: "--font-fraunces",
    nextFontExport: "Fraunces",
    license: "OFL-1.1",
    source: "Google Fonts via next/font",
    weights: ["600", "700"],
    fallback: 'ui-serif, Georgia, "Times New Roman", serif',
    kind: "serif",
  },
] as const satisfies readonly SiteFontFaceDefinition[];

export type SiteFontFaceId = (typeof SITE_FONT_FACES)[number]["id"];

export const SITE_FONT_FACE_BY_ID: Record<
  SiteFontFaceId,
  (typeof SITE_FONT_FACES)[number]
> = Object.fromEntries(SITE_FONT_FACES.map((face) => [face.id, face])) as Record<
  SiteFontFaceId,
  (typeof SITE_FONT_FACES)[number]
>;

export type SiteTypographyPairingDefinition = {
  id: string;
  label: string;
  description: string;
  group: SiteTypographyGroupId;
  headingFaceId: SiteFontFaceId;
  bodyFaceId: SiteFontFaceId;
  /** Optional letter-spacing tweak for headings (unitless em). */
  headingLetterSpacingEm?: number;
  sampleHeading: string;
  sampleBody: string;
};

/**
 * Ordered curated pairings. Classic / Editorial / Modern remain first
 * with unchanged stacks for V1 compatibility.
 */
export const SITE_TYPOGRAPHY_PAIRINGS = [
  {
    id: "classic",
    label: "Classic",
    description: "Clear Montserrat headings with a calm Inter body.",
    group: "established",
    headingFaceId: "montserrat",
    bodyFaceId: "inter",
    sampleHeading: "A steady place to begin",
    sampleBody: "Clear headings with a calm, readable body.",
  },
  {
    id: "editorial",
    label: "Editorial",
    description: "Soft Cormorant headings for a more literary feel.",
    group: "established",
    headingFaceId: "cormorant-garamond",
    bodyFaceId: "inter",
    sampleHeading: "Quiet words, carefully chosen",
    sampleBody: "Softer serif headings for a more literary feel.",
  },
  {
    id: "modern",
    label: "Modern",
    description: "Clean Inter throughout for a contemporary look.",
    group: "established",
    headingFaceId: "inter",
    bodyFaceId: "inter",
    headingLetterSpacingEm: -0.02,
    sampleHeading: "Simple, focused presence",
    sampleBody: "Clean sans-serif throughout for a contemporary look.",
  },
  {
    id: "literary",
    label: "Literary",
    description: "Playfair display headings with Source Sans reading text.",
    group: "serif-led",
    headingFaceId: "playfair-display",
    bodyFaceId: "source-sans-3",
    sampleHeading: "An elegant, expressive welcome",
    sampleBody: "Refined display headings with open, modern body type.",
  },
  {
    id: "warm-serif",
    label: "Warm Serif",
    description: "Lora headings with Source Sans for approachable warmth.",
    group: "serif-led",
    headingFaceId: "lora",
    bodyFaceId: "source-sans-3",
    sampleHeading: "Warmth you can lean into",
    sampleBody: "Friendly serif titles paired with easy long-form reading.",
  },
  {
    id: "scholarly",
    label: "Scholarly",
    description: "Libre Baskerville headings with Source Sans body.",
    group: "serif-led",
    headingFaceId: "libre-baskerville",
    bodyFaceId: "source-sans-3",
    sampleHeading: "Thoughtful, grounded clarity",
    sampleBody: "Bookish headings with a calm sans-serif body.",
  },
  {
    id: "distinctive",
    label: "Distinctive",
    description: "Fraunces soft-serif headings with Source Sans body.",
    group: "serif-led",
    headingFaceId: "fraunces",
    bodyFaceId: "source-sans-3",
    sampleHeading: "Soft character, clear voice",
    sampleBody: "A distinctive serif personality without losing readability.",
  },
  {
    id: "soft-sans",
    label: "Soft Sans",
    description: "Nunito Sans throughout for a welcoming rounded feel.",
    group: "sans-led",
    headingFaceId: "nunito-sans",
    bodyFaceId: "nunito-sans",
    sampleHeading: "A gentle, open greeting",
    sampleBody: "Rounded sans type that feels approachable and calm.",
  },
  {
    id: "contemporary",
    label: "Contemporary",
    description: "Manrope headings with DM Sans body for geometric polish.",
    group: "sans-led",
    headingFaceId: "manrope",
    bodyFaceId: "dm-sans",
    headingLetterSpacingEm: -0.015,
    sampleHeading: "Polished and present",
    sampleBody: "Geometric headings with a crisp, modern body.",
  },
] as const satisfies readonly SiteTypographyPairingDefinition[];

export const SITE_FONT_FAMILY_IDS = SITE_TYPOGRAPHY_PAIRINGS.map(
  (pairing) => pairing.id,
) as unknown as [
  (typeof SITE_TYPOGRAPHY_PAIRINGS)[number]["id"],
  ...(typeof SITE_TYPOGRAPHY_PAIRINGS)[number]["id"][],
];

export type SiteFontFamilyId =
  (typeof SITE_TYPOGRAPHY_PAIRINGS)[number]["id"];

export const SITE_TYPOGRAPHY_BY_ID: Record<
  SiteFontFamilyId,
  (typeof SITE_TYPOGRAPHY_PAIRINGS)[number]
> = Object.fromEntries(
  SITE_TYPOGRAPHY_PAIRINGS.map((pairing) => [pairing.id, pairing]),
) as Record<SiteFontFamilyId, (typeof SITE_TYPOGRAPHY_PAIRINGS)[number]>;

export function getTypographyPairing(
  id: SiteFontFamilyId,
): (typeof SITE_TYPOGRAPHY_PAIRINGS)[number] {
  return SITE_TYPOGRAPHY_BY_ID[id];
}

export function isSiteFontFamilyId(value: string): value is SiteFontFamilyId {
  return Object.prototype.hasOwnProperty.call(SITE_TYPOGRAPHY_BY_ID, value);
}

export function resolveTypographyStack(id: SiteFontFamilyId): {
  headingVar: SiteFontCssVar;
  bodyVar: SiteFontCssVar;
  headingKind: SiteFontKind;
  bodyKind: SiteFontKind;
  headingFallback: string;
  bodyFallback: string;
  headingLetterSpacingEm?: number;
} {
  const pairing = SITE_TYPOGRAPHY_BY_ID[id] as SiteTypographyPairingDefinition;
  const heading = SITE_FONT_FACE_BY_ID[pairing.headingFaceId];
  const body = SITE_FONT_FACE_BY_ID[pairing.bodyFaceId];
  return {
    headingVar: heading.cssVar,
    bodyVar: body.cssVar,
    headingKind: heading.kind,
    bodyKind: body.kind,
    headingFallback: heading.fallback,
    bodyFallback: body.fallback,
    headingLetterSpacingEm: pairing.headingLetterSpacingEm,
  };
}

/** Emit the static CSS block expected under `[data-site-font="<id>"]`. */
export function formatTypographyCssBlock(id: SiteFontFamilyId): string {
  const stack = resolveTypographyStack(id);
  const lines = [
    `  --font-heading: var(${stack.headingVar}), ${stack.headingFallback};`,
    `  --font-body: var(${stack.bodyVar}), ${stack.bodyFallback};`,
  ];
  if (stack.headingKind === "serif") {
    lines.push(
      `  --font-serif: var(${stack.headingVar}), ${stack.headingFallback};`,
    );
  }
  return `[data-site-font="${id}"] {\n${lines.join("\n")}\n}`;
}

/** Stable existing pairing IDs that must never change stacks. */
export const LEGACY_FONT_FAMILY_IDS = [
  "classic",
  "editorial",
  "modern",
] as const satisfies readonly SiteFontFamilyId[];
