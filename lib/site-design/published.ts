import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  CACHE_TAGS,
  PUBLIC_REVALIDATE_SECONDS,
} from "@/lib/public-cache-shared";
import {
  resolvePublishedPresentationFromRow,
  type PublishedPresentationConfig,
} from "@/lib/site-design/resolve-published";
import { SITE_DESIGN_STATE_KEY } from "@/lib/site-design/types";

export type { PublishedPresentationConfig } from "@/lib/site-design/resolve-published";
export { resolvePublishedPresentationFromRow } from "@/lib/site-design/resolve-published";

async function loadPublishedPresentation(): Promise<PublishedPresentationConfig> {
  try {
    const row = await prisma.siteDesignState.findUnique({
      where: { key: SITE_DESIGN_STATE_KEY },
      select: {
        publishedJson: true,
        publishedRevision: true,
      },
    });

    const resolved = resolvePublishedPresentationFromRow(row);
    if (resolved.source === "fallback") {
      console.error("[site-design-published-invalid]", {
        reason: resolved.diagnostic?.reason,
        issues: resolved.diagnostic?.issues,
        publishedRevision: row?.publishedRevision ?? null,
      });
    }
    return resolved;
  } catch (error) {
    // Tables may not exist until additive migration is applied.
    console.error("[site-design-published-read]", error);
    const fallback = resolvePublishedPresentationFromRow(null);
    return {
      ...fallback,
      source: "fallback",
      diagnostic: {
        reason:
          "Published design read failed (schema may be pending migration). Using canonical default.",
      },
    };
  }
}

const getCachedPublishedPresentation = unstable_cache(
  loadPublishedPresentation,
  ["site-design-published"],
  {
    revalidate: PUBLIC_REVALIDATE_SECONDS,
    tags: [CACHE_TAGS.siteDesign],
  },
);

/**
 * Server-side published design reader for public presentation.
 *
 * - Published state only (never draft)
 * - Validates before use; falls back to canonical default
 * - Does not mutate storage on invalid/missing state
 * - ISR-compatible via unstable_cache + CACHE_TAGS.siteDesign
 */
export const getPublishedPresentationConfig = cache(
  async (): Promise<PublishedPresentationConfig> => {
    return getCachedPublishedPresentation();
  },
);
