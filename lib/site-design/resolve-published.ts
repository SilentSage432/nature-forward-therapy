import { parseSiteDesign } from "@/lib/site-design/schema";
import type {
  SiteBodyScaleId,
  SiteDesign,
  SiteFontFamilyId,
  SiteHeadingScaleId,
  SiteThemePresetId,
} from "@/lib/site-design/schema";
import {
  canonicalPresentationConfig,
  presentationFromDesign,
} from "@/lib/site-design/presentation";

/**
 * Safe public presentation configuration derived from published SiteDesign.
 *
 * Reserved dimensions (section order, visibility, media slots, focal point)
 * are carried for future Studio rendering but are NOT applied by HomePresentation
 * for layout yet — section markup stays fixed. Theme + typography tokens ARE
 * applied through SiteTheme.
 */
export type PublishedPresentationConfig = {
  design: SiteDesign;
  themePresetId: SiteThemePresetId;
  typography: {
    fontFamilyId: SiteFontFamilyId;
    headingScaleId: SiteHeadingScaleId;
    bodyScaleId: SiteBodyScaleId;
  };
  /**
   * How the design was resolved for this request.
   * `fallback` means storage was missing/invalid — not a successful recovery write.
   */
  source: "published" | "canonical-default" | "fallback";
  publishedRevision: number | null;
  diagnostic?: {
    reason: string;
    issues?: string[];
  };
};

/**
 * Pure published-row → presentation resolver (no DB writes).
 * Used by the cached reader and by unit tests.
 */
export function resolvePublishedPresentationFromRow(
  row:
    | {
        publishedJson: unknown;
        publishedRevision: number;
      }
    | null
    | undefined,
): PublishedPresentationConfig {
  if (!row) {
    return canonicalPresentationConfig("canonical-default", {
      reason: "No SiteDesignState row; using canonical default.",
    });
  }

  const parsed = parseSiteDesign(row.publishedJson);
  if (!parsed.ok) {
    return canonicalPresentationConfig("fallback", {
      reason: parsed.reason,
      issues: parsed.issues,
    });
  }

  return presentationFromDesign(
    parsed.design,
    "published",
    row.publishedRevision,
  );
}
