"use client";

import type { SiteDesign } from "@/lib/site-design/schema";
import type {
  SiteBodyScaleId,
  SiteFontFamilyId,
  SiteHeadingScaleId,
  SiteThemePresetId,
} from "@/lib/site-design/schema";
import {
  BODY_SCALE_OPTIONS,
  FONT_FAMILY_GROUPS,
  HEADING_SCALE_OPTIONS,
  THEME_PALETTE_GROUPS,
  type FontFamilyOption,
  type ThemePaletteOption,
} from "@/lib/site-design/options";

/**
 * Palette gallery layout contract (NFT-STUDIO-007A-UX01).
 *
 * Cards use a stacked composition so swatches never share a horizontal track
 * with the title. Column count is container-driven (not viewport-driven): the
 * Studio control panel is often ~280–360px beside the preview at xl, where
 * viewport `sm:grid-cols-2` previously forced two undersized columns.
 */
export const PALETTE_GALLERY_LAYOUT = {
  /** Container query: two columns only when the gallery itself is wide enough. */
  gridClassName: "grid grid-cols-1 gap-2 @[26rem]:grid-cols-2",
  /** Outer panel establishes the query container. */
  containerClassName: "@container min-w-0",
  cardClassName:
    "flex min-h-[44px] min-w-0 cursor-pointer flex-col gap-2 rounded-xl border px-3 py-3 transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-gold",
  swatchSizeClassName: "h-6 w-6 shrink-0 rounded-full border border-white/15 shadow-sm",
} as const;

/**
 * Typography pairing gallery (NFT-STUDIO-007B).
 * One-column by default in the narrow Studio panel; samples use live next/font CSS vars.
 */
export const FONT_PAIRING_GALLERY_LAYOUT = {
  containerClassName: "@container min-w-0",
  gridClassName: "grid grid-cols-1 gap-2",
  cardClassName:
    "flex min-h-[44px] min-w-0 cursor-pointer flex-col gap-2 rounded-xl border px-3 py-3 transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-gold",
} as const;

type DesignControlPanelProps = {
  design: SiteDesign;
  disabled?: boolean;
  onThemeChange: (presetId: SiteThemePresetId) => void;
  onFontFamilyChange: (fontFamilyId: SiteFontFamilyId) => void;
  onHeadingScaleChange: (headingScaleId: SiteHeadingScaleId) => void;
  onBodyScaleChange: (bodyScaleId: SiteBodyScaleId) => void;
};

function OptionGroup<T extends string>({
  legend,
  description,
  name,
  value,
  options,
  disabled,
  onChange,
}: {
  legend: string;
  description: string;
  name: string;
  value: T;
  options: { id: T; label: string; description: string }[];
  disabled?: boolean;
  onChange: (id: T) => void;
}) {
  return (
    <fieldset className="space-y-3" disabled={disabled}>
      <legend className="font-heading text-lg font-semibold text-white">
        {legend}
      </legend>
      <p className="text-sm text-sage-light">{description}</p>
      <div role="radiogroup" aria-label={legend} className="grid gap-2">
        {options.map((option) => {
          const selected = option.id === value;
          const inputId = `${name}-${option.id}`;
          return (
            <label
              key={option.id}
              htmlFor={inputId}
              className={`flex min-h-[44px] cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-gold ${
                selected
                  ? "border-gold/50 bg-forest-soft text-gold"
                  : "border-sage-dark/30 text-sage-light hover:border-gold/30 hover:text-gold"
              } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
            >
              <input
                id={inputId}
                type="radio"
                name={name}
                value={option.id}
                checked={selected}
                disabled={disabled}
                onChange={() => onChange(option.id)}
                className="mt-1 h-4 w-4 accent-gold"
              />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-white">
                  {option.label}
                </span>
                <span className="mt-0.5 block text-xs text-sage-light">
                  {option.description}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function PaletteSwatches({
  swatches,
  label,
}: {
  swatches: ThemePaletteOption["swatches"];
  label: string;
}) {
  return (
    <span
      className="flex flex-wrap gap-1.5"
      aria-hidden="true"
      data-palette-swatches=""
    >
      {swatches.map((color, index) => (
        <span
          key={`${label}-${index}`}
          className={PALETTE_GALLERY_LAYOUT.swatchSizeClassName}
          style={{ backgroundColor: color }}
          data-palette-swatch=""
        />
      ))}
    </span>
  );
}

function PaletteGallery({
  value,
  disabled,
  onChange,
}: {
  value: SiteThemePresetId;
  disabled?: boolean;
  onChange: (id: SiteThemePresetId) => void;
}) {
  return (
    <fieldset
      className={`space-y-4 ${PALETTE_GALLERY_LAYOUT.containerClassName}`}
      disabled={disabled}
      data-palette-gallery=""
    >
      <legend className="font-heading text-lg font-semibold text-white">
        Colors
      </legend>
      <p className="text-sm text-sage-light">
        Choose a curated palette for the public website. Preview updates
        immediately — Save Draft when you are ready to keep it.
      </p>

      <div className="space-y-5">
        {THEME_PALETTE_GROUPS.map((group) => (
          <div key={group.id} className="space-y-2" data-palette-group={group.id}>
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-gold/80">
              {group.label}
            </h3>
            <div
              role="radiogroup"
              aria-label={`${group.label} color palettes`}
              className={PALETTE_GALLERY_LAYOUT.gridClassName}
              data-palette-grid=""
            >
              {group.options.map((option) => {
                const selected = option.id === value;
                const inputId = `theme-palette-${option.id}`;
                return (
                  <label
                    key={option.id}
                    htmlFor={inputId}
                    data-palette-card={option.id}
                    data-palette-selected={selected ? "true" : "false"}
                    className={`${PALETTE_GALLERY_LAYOUT.cardClassName} ${
                      selected
                        ? "border-gold/50 bg-forest-soft text-gold ring-1 ring-gold/30"
                        : "border-sage-dark/30 text-sage-light hover:border-gold/30 hover:text-gold"
                    } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
                  >
                    <span className="flex min-w-0 items-start gap-3">
                      <input
                        id={inputId}
                        type="radio"
                        name="theme-palette"
                        value={option.id}
                        checked={selected}
                        disabled={disabled}
                        onChange={() => onChange(option.id)}
                        className="mt-1 h-4 w-4 shrink-0 accent-gold"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                          <span className="text-sm font-semibold text-white">
                            {option.label}
                          </span>
                          {option.id === "forest-gold" ? (
                            <span className="text-[10px] font-medium uppercase tracking-wide text-gold/70">
                              Default
                            </span>
                          ) : null}
                        </span>
                      </span>
                    </span>

                    <PaletteSwatches
                      swatches={option.swatches}
                      label={option.label}
                    />

                    <span className="block text-xs leading-relaxed text-sage-light">
                      {option.description}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </fieldset>
  );
}

function FontPairingGallery({
  value,
  disabled,
  onChange,
}: {
  value: SiteFontFamilyId;
  disabled?: boolean;
  onChange: (id: SiteFontFamilyId) => void;
}) {
  return (
    <fieldset
      className={`space-y-4 ${FONT_PAIRING_GALLERY_LAYOUT.containerClassName}`}
      disabled={disabled}
      data-font-gallery=""
    >
      <legend className="font-heading text-lg font-semibold text-white">
        Font style
      </legend>
      <p className="text-sm text-sage-light">
        Pick how headings and body text feel together. Preview updates
        immediately — Save Draft when you are ready to keep it.
      </p>

      <div className="space-y-5">
        {FONT_FAMILY_GROUPS.map((group) => (
          <div key={group.id} className="space-y-2" data-font-group={group.id}>
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-gold/80">
              {group.label}
            </h3>
            <div
              role="radiogroup"
              aria-label={`${group.label} font pairings`}
              className={FONT_PAIRING_GALLERY_LAYOUT.gridClassName}
              data-font-grid=""
            >
              {group.options.map((option: FontFamilyOption) => {
                const selected = option.id === value;
                const inputId = `font-family-${option.id}`;
                return (
                  <label
                    key={option.id}
                    htmlFor={inputId}
                    data-font-card={option.id}
                    data-font-selected={selected ? "true" : "false"}
                    className={`${FONT_PAIRING_GALLERY_LAYOUT.cardClassName} ${
                      selected
                        ? "border-gold/50 bg-forest-soft text-gold ring-1 ring-gold/30"
                        : "border-sage-dark/30 text-sage-light hover:border-gold/30 hover:text-gold"
                    } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
                  >
                    <span className="flex min-w-0 items-start gap-3">
                      <input
                        id={inputId}
                        type="radio"
                        name="font-family"
                        value={option.id}
                        checked={selected}
                        disabled={disabled}
                        onChange={() => onChange(option.id)}
                        className="mt-1 h-4 w-4 shrink-0 accent-gold"
                      />
                      <span className="min-w-0 flex-1 space-y-1.5">
                        <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                          <span className="text-sm font-semibold text-white">
                            {option.label}
                          </span>
                          {option.id === "classic" ? (
                            <span className="text-[10px] font-medium uppercase tracking-wide text-gold/70">
                              Default
                            </span>
                          ) : null}
                        </span>
                        <span
                          className="block text-[0.95rem] font-semibold leading-snug text-white"
                          style={{
                            fontFamily: `var(${option.headingCssVar})`,
                            letterSpacing:
                              option.headingLetterSpacingEm != null
                                ? `${option.headingLetterSpacingEm}em`
                                : undefined,
                          }}
                          data-font-sample-heading=""
                        >
                          {option.sampleHeading}
                        </span>
                        <span
                          className="block text-xs leading-relaxed text-sage-light"
                          style={{
                            fontFamily: `var(${option.bodyCssVar})`,
                          }}
                          data-font-sample-body=""
                        >
                          {option.sampleBody}
                        </span>
                        <span className="block text-[11px] leading-snug text-sage-light/90">
                          {option.description}
                        </span>
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </fieldset>
  );
}

export function DesignControlPanel({
  design,
  disabled = false,
  onThemeChange,
  onFontFamilyChange,
  onHeadingScaleChange,
  onBodyScaleChange,
}: DesignControlPanelProps) {
  return (
    <div className="min-w-0 space-y-8 rounded-2xl border border-sage-dark/30 bg-forest-soft/70 p-5 sm:p-6">
      <PaletteGallery
        value={design.theme.presetId}
        disabled={disabled}
        onChange={onThemeChange}
      />

      <FontPairingGallery
        value={design.typography.fontFamilyId}
        disabled={disabled}
        onChange={onFontFamilyChange}
      />

      <OptionGroup
        legend="Heading size"
        description="Adjust how large the main titles appear."
        name="heading-scale"
        value={design.typography.headingScaleId}
        options={HEADING_SCALE_OPTIONS}
        disabled={disabled}
        onChange={onHeadingScaleChange}
      />

      <OptionGroup
        legend="Body text size"
        description="Adjust the everyday reading size."
        name="body-scale"
        value={design.typography.bodyScaleId}
        options={BODY_SCALE_OPTIONS}
        disabled={disabled}
        onChange={onBodyScaleChange}
      />
    </div>
  );
}
