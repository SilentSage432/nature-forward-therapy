import { z } from "zod";

/**
 * SiteDesign V1 — presentation configuration only.
 *
 * Business content (profile, specialties, articles, bookshelf, announcements,
 * booking URLs) remains owned by existing CMS models. Media binaries remain
 * outside this contract until Media Library lands.
 */

export const SITE_DESIGN_SCHEMA_VERSION = 1 as const;

export const SITE_THEME_PRESET_IDS = ["forest-gold"] as const;
export const SITE_TYPOGRAPHY_PRESET_IDS = ["classic"] as const;
export const SITE_HERO_LAYOUT_IDS = ["centered-portrait"] as const;
export const SITE_SECTION_IDS = [
  "hero",
  "about",
  "specialties",
  "contact",
] as const;
export const SITE_ABOUT_LAYOUT_IDS = ["stacked"] as const;
export const SITE_SPECIALTIES_LAYOUT_IDS = ["cards-with-aside"] as const;
export const SITE_CONTACT_LAYOUT_IDS = ["path-and-image"] as const;
export const SITE_MEDIA_SLOT_IDS = [
  "hero.background",
  "hero.headshot",
  "about.image",
  "specialties.image",
  "contact.image",
] as const;

export type SiteThemePresetId = (typeof SITE_THEME_PRESET_IDS)[number];
export type SiteTypographyPresetId =
  (typeof SITE_TYPOGRAPHY_PRESET_IDS)[number];
export type SiteHeroLayoutId = (typeof SITE_HERO_LAYOUT_IDS)[number];
export type SiteSectionId = (typeof SITE_SECTION_IDS)[number];
export type SiteMediaSlotId = (typeof SITE_MEDIA_SLOT_IDS)[number];

/**
 * Reserved for a future Media Library asset reference.
 * Rendering ignores non-null values until Media Library is implemented.
 */
export const mediaRefSchema = z
  .object({
    assetId: z.string().min(1).max(64),
    alt: z.string().max(240).optional(),
  })
  .strict();

export type SiteMediaRef = z.infer<typeof mediaRefSchema>;

const focalPointSchema = z
  .object({
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
  })
  .strict();

const sectionVisibilitySchema = z
  .object({
    hero: z.literal(true),
    about: z.literal(true),
    specialties: z.literal(true),
    contact: z.literal(true),
  })
  .strict();

const sectionLayoutsSchema = z
  .object({
    about: z.enum(SITE_ABOUT_LAYOUT_IDS),
    specialties: z.enum(SITE_SPECIALTIES_LAYOUT_IDS),
    contact: z.enum(SITE_CONTACT_LAYOUT_IDS),
  })
  .strict();

const mediaSlotsSchema = z
  .object({
    "hero.background": mediaRefSchema.nullable(),
    "hero.headshot": mediaRefSchema.nullable(),
    "about.image": mediaRefSchema.nullable(),
    "specialties.image": mediaRefSchema.nullable(),
    "contact.image": mediaRefSchema.nullable(),
  })
  .strict();

function hasExactSectionOrder(
  order: readonly SiteSectionId[],
): order is [
  "hero",
  "about",
  "specialties",
  "contact",
] {
  if (order.length !== SITE_SECTION_IDS.length) return false;
  const seen = new Set<string>();
  for (const id of order) {
    if (!SITE_SECTION_IDS.includes(id)) return false;
    if (seen.has(id)) return false;
    seen.add(id);
  }
  return seen.size === SITE_SECTION_IDS.length;
}

/**
 * Strict SiteDesign document. Unknown keys fail validation on write.
 * Public readers strip/fallback via parse helpers — they never mutate storage.
 */
export const siteDesignSchema = z
  .object({
    schemaVersion: z.literal(SITE_DESIGN_SCHEMA_VERSION),
    theme: z
      .object({
        presetId: z.enum(SITE_THEME_PRESET_IDS),
      })
      .strict(),
    typography: z
      .object({
        presetId: z.enum(SITE_TYPOGRAPHY_PRESET_IDS),
      })
      .strict(),
    hero: z
      .object({
        layoutId: z.enum(SITE_HERO_LAYOUT_IDS),
        /** Reserved — not applied by public rendering in this tranche. */
        focalPoint: focalPointSchema,
      })
      .strict(),
    sections: z
      .object({
        /**
         * Persisted for future Studio section controls.
         * Public homepage order remains fixed in HomePresentation until
         * rendering support ships.
         */
        order: z
          .array(z.enum(SITE_SECTION_IDS))
          .length(SITE_SECTION_IDS.length)
          .refine(hasExactSectionOrder, {
            message:
              "sections.order must include each required section exactly once",
          }),
        /**
         * All required sections must remain visible in V1.
         * Soft-hide of optional modules is deferred.
         */
        visibility: sectionVisibilitySchema,
        layouts: sectionLayoutsSchema,
      })
      .strict(),
    media: z
      .object({
        /** Reserved Media Library slot map — ignored by renderers today. */
        slots: mediaSlotsSchema,
      })
      .strict(),
  })
  .strict();

export type SiteDesign = z.infer<typeof siteDesignSchema>;

export type SiteDesignParseSuccess = {
  ok: true;
  design: SiteDesign;
};

export type SiteDesignParseFailure = {
  ok: false;
  reason: string;
  issues?: string[];
};

export type SiteDesignParseResult =
  | SiteDesignParseSuccess
  | SiteDesignParseFailure;

/** Validate an unknown value as SiteDesign without mutating storage. */
export function parseSiteDesign(value: unknown): SiteDesignParseResult {
  const parsed = siteDesignSchema.safeParse(value);
  if (parsed.success) {
    return { ok: true, design: parsed.data };
  }

  const issues = parsed.error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join(".") : "(root)";
    return `${path}: ${issue.message}`;
  });

  return {
    ok: false,
    reason: "SiteDesign failed schema validation.",
    issues,
  };
}

/** Parse a JSON string without writing. Invalid JSON is a soft failure. */
export function parseSiteDesignJson(
  raw: string | null | undefined,
): SiteDesignParseResult {
  if (raw == null || raw.trim() === "") {
    return { ok: false, reason: "SiteDesign JSON is empty." };
  }

  let value: unknown;
  try {
    value = JSON.parse(raw) as unknown;
  } catch {
    return { ok: false, reason: "SiteDesign JSON is malformed." };
  }

  return parseSiteDesign(value);
}
