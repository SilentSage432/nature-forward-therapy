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
  FONT_FAMILY_OPTIONS,
  HEADING_SCALE_OPTIONS,
  THEME_PALETTE_GROUPS,
  type ThemePaletteOption,
} from "@/lib/site-design/options";

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
    <span className="flex shrink-0 gap-1" aria-hidden="true">
      {swatches.map((color, index) => (
        <span
          key={`${label}-${index}`}
          className="h-7 w-7 rounded-full border border-white/15 shadow-sm"
          style={{ backgroundColor: color }}
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
    <fieldset className="space-y-4" disabled={disabled}>
      <legend className="font-heading text-lg font-semibold text-white">
        Colors
      </legend>
      <p className="text-sm text-sage-light">
        Choose a curated palette for the public website. Preview updates
        immediately — Save Draft when you are ready to keep it.
      </p>

      <div className="space-y-5">
        {THEME_PALETTE_GROUPS.map((group) => (
          <div key={group.id} className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-gold/80">
              {group.label}
            </h3>
            <div
              role="radiogroup"
              aria-label={`${group.label} color palettes`}
              className="grid gap-2 sm:grid-cols-2"
            >
              {group.options.map((option) => {
                const selected = option.id === value;
                const inputId = `theme-palette-${option.id}`;
                return (
                  <label
                    key={option.id}
                    htmlFor={inputId}
                    className={`flex min-h-[44px] cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-gold ${
                      selected
                        ? "border-gold/50 bg-forest-soft text-gold ring-1 ring-gold/30"
                        : "border-sage-dark/30 text-sage-light hover:border-gold/30 hover:text-gold"
                    } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
                  >
                    <input
                      id={inputId}
                      type="radio"
                      name="theme-palette"
                      value={option.id}
                      checked={selected}
                      disabled={disabled}
                      onChange={() => onChange(option.id)}
                      className="mt-1 h-4 w-4 accent-gold"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className="block text-sm font-semibold text-white">
                          {option.label}
                          {option.id === "forest-gold" ? (
                            <span className="ml-2 text-[10px] font-medium uppercase tracking-wide text-gold/70">
                              Default
                            </span>
                          ) : null}
                        </span>
                        <PaletteSwatches
                          swatches={option.swatches}
                          label={option.label}
                        />
                      </span>
                      <span className="mt-1 block text-xs text-sage-light">
                        {option.description}
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
    <div className="space-y-8 rounded-2xl border border-sage-dark/30 bg-forest-soft/70 p-5 sm:p-6">
      <PaletteGallery
        value={design.theme.presetId}
        disabled={disabled}
        onChange={onThemeChange}
      />

      <OptionGroup
        legend="Font style"
        description="Pick how headings and body text feel together."
        name="font-family"
        value={design.typography.fontFamilyId}
        options={FONT_FAMILY_OPTIONS}
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
