/**
 * Font delivery policy (NFT-STUDIO-007B-PERF02).
 *
 * Separates the typography *contract* (registry / SiteTheme / CSS stacks)
 * from font *delivery* (which next/font CSS variables are attached — and
 * therefore preloaded — for a given document).
 *
 * PUBLIC / ADMIN (non-Studio):
 *   Faces required by the published pairing, plus admin/public chrome faces
 *   (Inter, Montserrat, Cormorant) so :root utilities and `.editorial-serif`
 *   remain correct without loading the full curated library.
 *
 * STUDIO (including preview-frame iframe documents):
 *   All curated faces, so draft switching and live samples work without
 *   per-switch network fetches.
 */

import {
  SITE_FONT_FACES,
  SITE_FONT_FACE_BY_ID,
  SITE_TYPOGRAPHY_BY_ID,
  isSiteFontFamilyId,
  type SiteFontFaceId,
  type SiteFontFamilyId,
} from "@/lib/site-design/typography-registry";

/**
 * Always delivered outside Studio so admin/login `:root` stacks and the
 * public `.editorial-serif` utility (var(--font-serif) → Cormorant by default)
 * remain available. Matches the pre-007B baseline preload set for Classic.
 */
export const ADMIN_CHROME_FACE_IDS = [
  "inter",
  "montserrat",
  "cormorant-garamond",
] as const satisfies readonly SiteFontFaceId[];

/** Every curated face asset (Studio full library). */
export const ALL_CURATED_FACE_IDS = SITE_FONT_FACES.map(
  (face) => face.id,
) as SiteFontFaceId[];

/**
 * Pairings whose `[data-site-font]` CSS block reassigns `--font-serif`.
 * Others inherit `:root` Cormorant for `.editorial-serif`.
 */
export const PAIRINGS_WITH_SERIF_OVERRIDE = [
  "editorial",
  "literary",
  "warm-serif",
  "scholarly",
  "distinctive",
] as const satisfies readonly SiteFontFamilyId[];

export function pairingFaceIds(
  fontFamilyId: SiteFontFamilyId,
): SiteFontFaceId[] {
  const pairing = SITE_TYPOGRAPHY_BY_ID[fontFamilyId];
  return [pairing.headingFaceId, pairing.bodyFaceId];
}

export function uniqueFaceIds(
  faceIds: readonly SiteFontFaceId[],
): SiteFontFaceId[] {
  const seen = new Set<SiteFontFaceId>();
  const out: SiteFontFaceId[] = [];
  for (const id of faceIds) {
    if (!SITE_FONT_FACE_BY_ID[id]) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

/**
 * Faces that must be delivered for a published (or previewed) public design.
 * Always includes admin chrome faces for :root / editorial-serif stability.
 */
export function publicDeliveryFaceIds(
  fontFamilyId: SiteFontFamilyId,
): SiteFontFaceId[] {
  return uniqueFaceIds([
    ...ADMIN_CHROME_FACE_IDS,
    ...pairingFaceIds(fontFamilyId),
  ]);
}

export function studioDeliveryFaceIds(): SiteFontFaceId[] {
  return [...ALL_CURATED_FACE_IDS];
}

/**
 * Studio surfaces — including the authenticated preview iframe document —
 * need the full curated library. Nested layouts cannot undo root preloads;
 * Studio therefore attaches the full library in `app/admin/studio/layout.tsx`
 * while public marketing routes use `PublicFontScope` for supplements only.
 */
export function isStudioFontSurface(pathname: string): boolean {
  return pathname === "/admin/studio" || pathname.startsWith("/admin/studio/");
}

export function resolveDeliveryFaceIds(input: {
  pathname: string;
  publishedFontFamilyId: string;
}): {
  surface: "studio" | "public";
  fontFamilyId: SiteFontFamilyId;
  faceIds: SiteFontFaceId[];
} {
  const fontFamilyId = isSiteFontFamilyId(input.publishedFontFamilyId)
    ? input.publishedFontFamilyId
    : "classic";

  if (isStudioFontSurface(input.pathname)) {
    return {
      surface: "studio",
      fontFamilyId,
      faceIds: studioDeliveryFaceIds(),
    };
  }

  return {
    surface: "public",
    fontFamilyId,
    faceIds: publicDeliveryFaceIds(fontFamilyId),
  };
}

export function pairingRequiresGlobalCormorantUtility(
  fontFamilyId: SiteFontFamilyId,
): boolean {
  return !(PAIRINGS_WITH_SERIF_OVERRIDE as readonly string[]).includes(
    fontFamilyId,
  );
}
