import { z } from "zod";
import {
  SITE_THEME_PRESET_IDS as REGISTRY_THEME_PRESET_IDS,
  type SiteThemePresetId,
} from "@/lib/site-design/palette-registry";

/**
 * SiteDesign V1 — presentation configuration only.
 *
 * Business content (profile, specialties, articles, bookshelf, announcements,
 * booking URLs) remains owned by existing CMS models. Media binaries remain
 * outside this contract until Media Library lands.
 *
 * NFT-STUDIO-007A expands curated theme enums from the palette registry only.
 * No arbitrary CSS, font URLs, or freeform color values are accepted.
 * schemaVersion remains 1 — curated enum members do not require a bump.
 */

export const SITE_DESIGN_SCHEMA_VERSION = 1 as const;

/** Curated color palettes applied via [data-site-theme]. Owned by palette-registry. */
export const SITE_THEME_PRESET_IDS = REGISTRY_THEME_PRESET_IDS;

/**
 * @deprecated Prefer fontFamilyId / headingScaleId / bodyScaleId.
 * Kept for reading legacy drafts that only stored typography.presetId.
 */
export const SITE_TYPOGRAPHY_PRESET_IDS = ["classic"] as const;

export const SITE_FONT_FAMILY_IDS = [
  "classic",
  "editorial",
  "modern",
] as const;

export const SITE_HEADING_SCALE_IDS = [
  "comfortable",
  "prominent",
  "compact",
] as const;

export const SITE_BODY_SCALE_IDS = [
  "comfortable",
  "relaxed",
  "compact",
] as const;

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

export type { SiteThemePresetId };
export type SiteTypographyPresetId =
  (typeof SITE_TYPOGRAPHY_PRESET_IDS)[number];
export type SiteFontFamilyId = (typeof SITE_FONT_FAMILY_IDS)[number];
export type SiteHeadingScaleId = (typeof SITE_HEADING_SCALE_IDS)[number];
export type SiteBodyScaleId = (typeof SITE_BODY_SCALE_IDS)[number];
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

const typographySchema = z
  .object({
    fontFamilyId: z.enum(SITE_FONT_FAMILY_IDS),
    headingScaleId: z.enum(SITE_HEADING_SCALE_IDS),
    bodyScaleId: z.enum(SITE_BODY_SCALE_IDS),
  })
  .strict();

function hasExactSectionOrder(
  order: readonly SiteSectionId[],
): order is ["hero", "about", "specialties", "contact"] {
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
 * Normalize legacy V1 drafts that only stored `typography.presetId: "classic"`.
 * Does not invent themes or scales beyond the classic/comfortable mapping.
 */
export function normalizeSiteDesignInput(value: unknown): unknown {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const doc = { ...(value as Record<string, unknown>) };
  const typography = doc.typography;

  if (
    typography &&
    typeof typography === "object" &&
    !Array.isArray(typography)
  ) {
    const t = typography as Record<string, unknown>;
    const hasNewShape =
      typeof t.fontFamilyId === "string" &&
      typeof t.headingScaleId === "string" &&
      typeof t.bodyScaleId === "string";

    if (!hasNewShape && t.presetId === "classic") {
      doc.typography = {
        fontFamilyId: "classic",
        headingScaleId: "comfortable",
        bodyScaleId: "comfortable",
      };
    }
  }

  return doc;
}

const siteDesignObjectSchema = z
  .object({
    schemaVersion: z.literal(SITE_DESIGN_SCHEMA_VERSION),
    theme: z
      .object({
        presetId: z.enum(SITE_THEME_PRESET_IDS),
      })
      .strict(),
    typography: typographySchema,
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

/**
 * Strict SiteDesign document. Unknown keys fail validation on write.
 * Public readers strip/fallback via parse helpers — they never mutate storage.
 * Legacy typography.presetId documents are normalized before validation.
 */
export const siteDesignSchema = z.preprocess(
  normalizeSiteDesignInput,
  siteDesignObjectSchema,
);

export type SiteDesign = z.infer<typeof siteDesignObjectSchema>;

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
