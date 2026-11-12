import { cloneCanonicalSiteDesign } from "@/lib/site-design/defaults";
import { parseSiteDesign } from "@/lib/site-design/schema";
import type { SiteDesign } from "@/lib/site-design/schema";

/**
 * Safe public presentation configuration derived from published SiteDesign.
 *
 * Reserved dimensions (section order, visibility, media slots, focal point)
 * are carried for future Studio rendering but are NOT applied by HomePresentation
 * in this tranche — visual parity with NFT-STUDIO-003 is required.
 */
export type PublishedPresentationConfig = {
  design: SiteDesign;
  themePresetId: "forest-gold";
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

function canonicalPresentation(
  source: "canonical-default" | "fallback",
  diagnostic?: PublishedPresentationConfig["diagnostic"],
): PublishedPresentationConfig {
  const design = cloneCanonicalSiteDesign();
  return {
    design,
    themePresetId: "forest-gold",
    source,
    publishedRevision: null,
    diagnostic,
  };
}

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
    return canonicalPresentation("canonical-default", {
      reason: "No SiteDesignState row; using canonical default.",
    });
  }

  const parsed = parseSiteDesign(row.publishedJson);
  if (!parsed.ok) {
    return canonicalPresentation("fallback", {
      reason: parsed.reason,
      issues: parsed.issues,
    });
  }

  return {
    design: parsed.design,
    themePresetId: "forest-gold",
    source: "published",
    publishedRevision: row.publishedRevision,
  };
}
