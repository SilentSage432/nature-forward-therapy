"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { DesignAccessibilityPanel } from "@/components/admin/studio/DesignAccessibilityPanel";
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
  FONT_FAMILY_OPTIONS,
  HEADING_SCALE_OPTIONS,
  THEME_PALETTE_GROUPS,
  THEME_PALETTE_OPTIONS,
  type FontFamilyOption,
  type ThemePaletteOption,
} from "@/lib/site-design/options";

/**
 * Compact palette picker layout contract (NFT-STUDIO-008-ENG01).
 *
 * Closed trigger stays short; the open panel lists all curated palettes by
 * group with visible swatches. Inventory remains registry-driven (15 IDs).
 * Open-panel columns stay container-driven — never viewport `sm:grid-cols-2`.
 */
export const PALETTE_GALLERY_LAYOUT = {
  containerClassName: "@container min-w-0",
  /** Open panel: single column in the narrow rail; two cols only if wide enough. */
  gridClassName: "grid grid-cols-1 gap-1.5 @[26rem]:grid-cols-2",
  triggerClassName:
    "flex min-h-[44px] w-full min-w-0 cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
  optionClassName:
    "flex min-h-[44px] min-w-0 cursor-pointer items-center gap-2.5 rounded-lg border px-2.5 py-2 transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-gold",
  swatchSizeClassName: "h-5 w-5 shrink-0 rounded-full border border-white/15 shadow-sm",
} as const;

/**
 * Compact typography pairing picker (NFT-STUDIO-008-ENG01).
 * Samples use live next/font CSS vars already attached by Studio layout.
 */
export const FONT_PAIRING_GALLERY_LAYOUT = {
  containerClassName: "@container min-w-0",
  gridClassName: "grid grid-cols-1 gap-1.5",
  triggerClassName:
    "flex min-h-[44px] w-full min-w-0 cursor-pointer flex-col gap-1 rounded-xl border px-3 py-2.5 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
  optionClassName:
    "flex min-h-[44px] min-w-0 cursor-pointer flex-col gap-1 rounded-lg border px-2.5 py-2 transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-gold",
} as const;

type DesignControlPanelProps = {
  design: SiteDesign;
  disabled?: boolean;
  onThemeChange: (presetId: SiteThemePresetId) => void;
  onFontFamilyChange: (fontFamilyId: SiteFontFamilyId) => void;
  onHeadingScaleChange: (headingScaleId: SiteHeadingScaleId) => void;
  onBodyScaleChange: (bodyScaleId: SiteBodyScaleId) => void;
};

function PaletteSwatches({
  swatches,
  label,
  sizeClassName = PALETTE_GALLERY_LAYOUT.swatchSizeClassName,
}: {
  swatches: ThemePaletteOption["swatches"];
  label: string;
  sizeClassName?: string;
}) {
  return (
    <span
      className="flex flex-wrap gap-1"
      aria-hidden="true"
      data-palette-swatches=""
    >
      {swatches.map((color, index) => (
        <span
          key={`${label}-${index}`}
          className={sizeClassName}
          style={{ backgroundColor: color }}
          data-palette-swatch=""
        />
      ))}
    </span>
  );
}

function CompactPickerShell({
  legend,
  description,
  open,
  onOpenChange,
  trigger,
  panelId,
  children,
  disabled,
  dataAttr,
}: {
  legend: string;
  description: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
  panelId: string;
  children: ReactNode;
  disabled?: boolean;
  dataAttr: string;
}) {
  const legendId = useId();
  const descriptionId = useId();

  return (
    <fieldset
      className="min-w-0 space-y-2"
      disabled={disabled}
      {...{ [dataAttr]: "" }}
    >
      <legend id={legendId} className="font-heading text-base font-semibold text-white">
        {legend}
      </legend>
      <p id={descriptionId} className="text-xs text-sage-light">
        {description}
      </p>
      {trigger}
      {open ? (
        <div
          id={panelId}
          role="region"
          aria-labelledby={legendId}
          aria-describedby={descriptionId}
          className="max-h-[min(22rem,50dvh)] space-y-3 overflow-y-auto overscroll-contain rounded-xl border border-sage-dark/35 bg-forest/55 p-2.5"
          data-compact-picker-panel=""
        >
          {children}
          <button
            type="button"
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-lg border border-sage-dark/40 px-3 py-2 text-sm font-semibold text-sage-light transition hover:border-gold/30 hover:text-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            onClick={() => onOpenChange(false)}
          >
            Close
          </button>
        </div>
      ) : null}
    </fieldset>
  );
}

function CompactPalettePicker({
  value,
  disabled,
  onChange,
}: {
  value: SiteThemePresetId;
  disabled?: boolean;
  onChange: (id: SiteThemePresetId) => void;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selected =
    THEME_PALETTE_OPTIONS.find((option) => option.id === value) ??
    THEME_PALETTE_OPTIONS[0]!;

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function selectPalette(id: SiteThemePresetId) {
    onChange(id);
    setOpen(false);
    queueMicrotask(() => triggerRef.current?.focus());
  }

  return (
    <CompactPickerShell
      legend="Colors"
      description="Choose a curated palette. Preview updates immediately — Save Draft when you are ready to keep it."
      open={open}
      onOpenChange={setOpen}
      disabled={disabled}
      dataAttr="data-palette-gallery"
      panelId={panelId}
      trigger={
        <button
          ref={triggerRef}
          type="button"
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          disabled={disabled}
          data-palette-trigger=""
          data-palette-selected-id={selected.id}
          onClick={() => setOpen((current) => !current)}
          className={`${PALETTE_GALLERY_LAYOUT.triggerClassName} ${
            open
              ? "border-gold/50 bg-forest-soft text-gold"
              : "border-sage-dark/30 text-sage-light hover:border-gold/30 hover:text-gold"
          } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
        >
          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-sm font-semibold text-white">
                {selected.label}
              </span>
              {selected.id === "forest-gold" ? (
                <span className="text-[10px] font-medium uppercase tracking-wide text-gold/70">
                  Default
                </span>
              ) : null}
            </span>
            <span className="mt-0.5 block text-[11px] text-sage-light">
              {selected.description}
            </span>
          </span>
          <PaletteSwatches swatches={selected.swatches} label={selected.label} />
          <span className="shrink-0 text-xs font-semibold text-gold/80">
            {open ? "Hide" : "Change"}
          </span>
        </button>
      }
    >
      <div className={`space-y-3 ${PALETTE_GALLERY_LAYOUT.containerClassName}`}>
        {THEME_PALETTE_GROUPS.map((group) => (
          <div key={group.id} className="space-y-1.5" data-palette-group={group.id}>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold/80">
              {group.label}
            </h3>
            <div
              role="radiogroup"
              aria-label={`${group.label} color palettes`}
              className={PALETTE_GALLERY_LAYOUT.gridClassName}
              data-palette-grid=""
            >
              {group.options.map((option) => {
                const isSelected = option.id === value;
                const inputId = `theme-palette-${option.id}`;
                return (
                  <label
                    key={option.id}
                    htmlFor={inputId}
                    data-palette-card={option.id}
                    data-palette-selected={isSelected ? "true" : "false"}
                    className={`${PALETTE_GALLERY_LAYOUT.optionClassName} ${
                      isSelected
                        ? "border-gold/50 bg-forest-soft text-gold ring-1 ring-gold/30"
                        : "border-sage-dark/30 text-sage-light hover:border-gold/30 hover:text-gold"
                    } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
                  >
                    <input
                      id={inputId}
                      type="radio"
                      name="theme-palette"
                      value={option.id}
                      checked={isSelected}
                      disabled={disabled}
                      onChange={() => selectPalette(option.id)}
                      className="h-4 w-4 shrink-0 accent-gold"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-white">
                        {option.label}
                      </span>
                      <PaletteSwatches
                        swatches={option.swatches}
                        label={option.label}
                      />
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </CompactPickerShell>
  );
}

function CompactFontPicker({
  value,
  disabled,
  onChange,
}: {
  value: SiteFontFamilyId;
  disabled?: boolean;
  onChange: (id: SiteFontFamilyId) => void;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selected =
    FONT_FAMILY_OPTIONS.find((option) => option.id === value) ??
    FONT_FAMILY_OPTIONS[0]!;

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function selectFont(id: SiteFontFamilyId) {
    onChange(id);
    setOpen(false);
    queueMicrotask(() => triggerRef.current?.focus());
  }

  function sampleBlock(option: FontFamilyOption, compact = false) {
    return (
      <>
        <span
          className={
            compact
              ? "block text-[0.95rem] font-semibold leading-snug text-white"
              : "block text-sm font-semibold leading-snug text-white"
          }
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
          style={{ fontFamily: `var(${option.bodyCssVar})` }}
          data-font-sample-body=""
        >
          {option.sampleBody}
        </span>
      </>
    );
  }

  return (
    <CompactPickerShell
      legend="Font style"
      description="Pick how headings and body text feel together. Preview updates immediately."
      open={open}
      onOpenChange={setOpen}
      disabled={disabled}
      dataAttr="data-font-gallery"
      panelId={panelId}
      trigger={
        <button
          ref={triggerRef}
          type="button"
          aria-expanded={open}
          aria-controls={open ? panelId : undefined}
          disabled={disabled}
          data-font-trigger=""
          data-font-selected-id={selected.id}
          onClick={() => setOpen((current) => !current)}
          className={`${FONT_PAIRING_GALLERY_LAYOUT.triggerClassName} ${
            open
              ? "border-gold/50 bg-forest-soft text-gold"
              : "border-sage-dark/30 text-sage-light hover:border-gold/30 hover:text-gold"
          } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
        >
          <span className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-sm font-semibold text-white">
                {selected.label}
              </span>
              {selected.id === "classic" ? (
                <span className="text-[10px] font-medium uppercase tracking-wide text-gold/70">
                  Default
                </span>
              ) : null}
            </span>
            <span className="text-xs font-semibold text-gold/80">
              {open ? "Hide" : "Change"}
            </span>
          </span>
          {sampleBlock(selected, true)}
        </button>
      }
    >
      <div className={`space-y-3 ${FONT_PAIRING_GALLERY_LAYOUT.containerClassName}`}>
        {FONT_FAMILY_GROUPS.map((group) => (
          <div key={group.id} className="space-y-1.5" data-font-group={group.id}>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold/80">
              {group.label}
            </h3>
            <div
              role="radiogroup"
              aria-label={`${group.label} font pairings`}
              className={FONT_PAIRING_GALLERY_LAYOUT.gridClassName}
              data-font-grid=""
            >
              {group.options.map((option) => {
                const isSelected = option.id === value;
                const inputId = `font-family-${option.id}`;
                return (
                  <label
                    key={option.id}
                    htmlFor={inputId}
                    data-font-card={option.id}
                    data-font-selected={isSelected ? "true" : "false"}
                    className={`${FONT_PAIRING_GALLERY_LAYOUT.optionClassName} ${
                      isSelected
                        ? "border-gold/50 bg-forest-soft text-gold ring-1 ring-gold/30"
                        : "border-sage-dark/30 text-sage-light hover:border-gold/30 hover:text-gold"
                    } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
                  >
                    <span className="flex min-w-0 items-start gap-2.5">
                      <input
                        id={inputId}
                        type="radio"
                        name="font-family"
                        value={option.id}
                        checked={isSelected}
                        disabled={disabled}
                        onChange={() => selectFont(option.id)}
                        className="mt-1 h-4 w-4 shrink-0 accent-gold"
                      />
                      <span className="min-w-0 flex-1 space-y-1">
                        <span className="text-sm font-semibold text-white">
                          {option.label}
                        </span>
                        {sampleBlock(option)}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </CompactPickerShell>
  );
}

function SegmentedScaleControl<T extends string>({
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
  const selected = options.find((option) => option.id === value);
  const groupRef = useRef<HTMLDivElement>(null);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (disabled) return;
    const index = options.findIndex((option) => option.id === value);
    if (index < 0) return;
    let next = index;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      next = (index + 1) % options.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      next = (index - 1 + options.length) % options.length;
    } else if (event.key === "Home") {
      event.preventDefault();
      next = 0;
    } else if (event.key === "End") {
      event.preventDefault();
      next = options.length - 1;
    } else {
      return;
    }
    onChange(options[next]!.id);
    queueMicrotask(() => {
      groupRef.current
        ?.querySelector<HTMLElement>(`#${name}-${options[next]!.id}`)
        ?.focus();
    });
  }

  return (
    <fieldset className="min-w-0 space-y-2" disabled={disabled} data-scale-control={name}>
      <legend className="font-heading text-base font-semibold text-white">
        {legend}
      </legend>
      <p className="text-xs text-sage-light">{description}</p>
      <div
        ref={groupRef}
        role="radiogroup"
        aria-label={legend}
        className="grid grid-cols-3 gap-1.5"
        onKeyDown={onKeyDown}
        data-scale-segmented=""
      >
        {options.map((option) => {
          const isSelected = option.id === value;
          const inputId = `${name}-${option.id}`;
          return (
            <label
              key={option.id}
              htmlFor={inputId}
              data-scale-option={option.id}
              data-scale-selected={isSelected ? "true" : "false"}
              className={`flex min-h-[44px] cursor-pointer items-center justify-center rounded-lg border px-2 py-2 text-center text-sm font-semibold transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-gold ${
                isSelected
                  ? "border-gold/50 bg-gold/10 text-gold"
                  : "border-sage-dark/30 text-sage-light hover:border-gold/30 hover:text-gold"
              } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
            >
              <input
                id={inputId}
                type="radio"
                name={name}
                value={option.id}
                checked={isSelected}
                disabled={disabled}
                onChange={() => onChange(option.id)}
                className="sr-only"
              />
              {option.label}
            </label>
          );
        })}
      </div>
      {selected ? (
        <p className="text-[11px] leading-snug text-sage-dark" aria-live="polite">
          {selected.description}
        </p>
      ) : null}
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
    <div
      className="min-w-0 space-y-5 rounded-2xl border border-sage-dark/30 bg-forest-soft/70 p-4 sm:p-5"
      data-design-control-rail=""
    >
      <CompactPalettePicker
        value={design.theme.presetId}
        disabled={disabled}
        onChange={onThemeChange}
      />

      <CompactFontPicker
        value={design.typography.fontFamilyId}
        disabled={disabled}
        onChange={onFontFamilyChange}
      />

      <SegmentedScaleControl
        legend="Heading size"
        description="How large the main titles appear."
        name="heading-scale"
        value={design.typography.headingScaleId}
        options={HEADING_SCALE_OPTIONS}
        disabled={disabled}
        onChange={onHeadingScaleChange}
      />

      <SegmentedScaleControl
        legend="Body text size"
        description="Everyday reading size."
        name="body-scale"
        value={design.typography.bodyScaleId}
        options={BODY_SCALE_OPTIONS}
        disabled={disabled}
        onChange={onBodyScaleChange}
      />

      <DesignAccessibilityPanel design={design} compact />
    </div>
  );
}
