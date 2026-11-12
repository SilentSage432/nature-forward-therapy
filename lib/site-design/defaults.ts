import type { SiteDesign } from "@/lib/site-design/schema";
import { SITE_DESIGN_SCHEMA_VERSION } from "@/lib/site-design/schema";

/**
 * Canonical default SiteDesign — mirrors production presentation after
 * NFT-STUDIO-003 (forest-gold, classic type, centered hero, fixed sections).
 *
 * Deterministic and independent of database content.
 */
export const CANONICAL_SITE_DESIGN: SiteDesign = {
  schemaVersion: SITE_DESIGN_SCHEMA_VERSION,
  theme: {
    presetId: "forest-gold",
  },
  typography: {
    fontFamilyId: "classic",
    headingScaleId: "comfortable",
    bodyScaleId: "comfortable",
  },
  hero: {
    layoutId: "centered-portrait",
    focalPoint: { x: 0.5, y: 0.5 },
  },
  sections: {
    order: ["hero", "about", "specialties", "contact"],
    visibility: {
      hero: true,
      about: true,
      specialties: true,
      contact: true,
    },
    layouts: {
      about: "stacked",
      specialties: "cards-with-aside",
      contact: "path-and-image",
    },
  },
  media: {
    slots: {
      "hero.background": null,
      "hero.headshot": null,
      "about.image": null,
      "specialties.image": null,
      "contact.image": null,
    },
  },
};

/** Deep-clone the canonical default for safe mutation by callers. */
export function cloneCanonicalSiteDesign(): SiteDesign {
  return structuredClone(CANONICAL_SITE_DESIGN);
}
