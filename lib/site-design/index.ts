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
  resolveFontStack,
} from "@/lib/site-design/visual-tokens";
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
