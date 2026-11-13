export {
  CANONICAL_SITE_DESIGN,
  cloneCanonicalSiteDesign,
} from "@/lib/site-design/defaults";
export {
  SITE_DESIGN_SCHEMA_VERSION,
  SITE_THEME_PRESET_IDS,
  SITE_FONT_FAMILY_IDS,
  SITE_HEADING_SCALE_IDS,
  SITE_BODY_SCALE_IDS,
  parseSiteDesign,
  parseSiteDesignJson,
  siteDesignSchema,
  type SiteDesign,
  type SiteDesignParseResult,
  type SiteThemePresetId,
  type SiteFontFamilyId,
  type SiteHeadingScaleId,
  type SiteBodyScaleId,
} from "@/lib/site-design/schema";
export { presentationFromDesign } from "@/lib/site-design/presentation";
export {
  FOREST_GOLD_TOKENS,
  SITE_PALETTE_TOKENS,
  SITE_FONT_STACKS,
  resolvePaletteTokens,
  resolveFullPaletteTokens,
  resolveFontStack,
} from "@/lib/site-design/visual-tokens";
export {
  SITE_PALETTE_DEFINITIONS,
  SITE_PALETTE_GROUPS,
  SITE_PALETTE_GROUP_LABELS,
  resolvePaletteCssTokens,
  isSiteThemePresetId,
  type SitePaletteCssTokens,
  type SitePaletteDefinition,
} from "@/lib/site-design/palette-registry";
export {
  SITE_TYPOGRAPHY_PAIRINGS,
  SITE_TYPOGRAPHY_GROUPS,
  SITE_TYPOGRAPHY_GROUP_LABELS,
  SITE_FONT_FACES,
  LEGACY_FONT_FAMILY_IDS,
  resolveTypographyStack,
  formatTypographyCssBlock,
  isSiteFontFamilyId,
  type SiteTypographyPairingDefinition,
  type SiteFontFaceDefinition,
} from "@/lib/site-design/typography-registry";
export {
  ADMIN_CHROME_FACE_IDS,
  ALL_CURATED_FACE_IDS,
  PAIRINGS_WITH_SERIF_OVERRIDE,
  pairingFaceIds,
  publicDeliveryFaceIds,
  studioDeliveryFaceIds,
  isStudioFontSurface,
  resolveDeliveryFaceIds,
  pairingRequiresGlobalCormorantUtility,
} from "@/lib/site-design/font-delivery";
export {
  contrastRatio,
  contrastRatioForCssColors,
  evaluateContrastPair,
  parseCssColor,
  relativeLuminance,
  CONTRAST_THRESHOLDS,
} from "@/lib/site-design/contrast";
export {
  REQUIRED_PALETTE_CONTRAST_PAIRS,
  EXCLUDED_PALETTE_CONTRAST_NOTES,
  evaluatePaletteContrast,
  evaluateAllPaletteContrasts,
  assertAllPalettesMeetContrastContract,
} from "@/lib/site-design/palette-contrast-contract";
export {
  getPublishedPresentationConfig,
} from "@/lib/site-design/published";
export {
  resolvePublishedPresentationFromRow,
  type PublishedPresentationConfig,
} from "@/lib/site-design/resolve-published";
export {
  SITE_DESIGN_HISTORY_LIMIT,
  SITE_DESIGN_STATE_KEY,
  type DesignOperationResult,
  type PublishDesignResult,
  type SiteDesignWorkspace,
  type WorkspaceReadResult,
} from "@/lib/site-design/types";
