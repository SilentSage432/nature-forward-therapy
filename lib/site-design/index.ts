export {
  CANONICAL_SITE_DESIGN,
  cloneCanonicalSiteDesign,
} from "@/lib/site-design/defaults";
export {
  SITE_DESIGN_SCHEMA_VERSION,
  SITE_THEME_PRESET_IDS,
  parseSiteDesign,
  parseSiteDesignJson,
  siteDesignSchema,
  type SiteDesign,
  type SiteDesignParseResult,
} from "@/lib/site-design/schema";
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
