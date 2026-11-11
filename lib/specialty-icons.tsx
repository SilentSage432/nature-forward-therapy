import { createElement } from "react";
import { Leaf, Mountain, Sprout, type LucideIcon } from "lucide-react";

/**
 * Specialty.icon remains a CMS string (historically emoji).
 * Presentation maps known values to Lucide; unknown values stay as authored text.
 * No database migration — stored emoji keys are preserved.
 */
export const SPECIALTY_ICON_OPTIONS = [
  {
    emoji: "🌿",
    label: "Leaf",
    description: "Growth / calm",
    Icon: Leaf,
  },
  {
    emoji: "🪨",
    label: "Mountain",
    description: "Grounding / transitions",
    Icon: Mountain,
  },
  {
    emoji: "🌱",
    label: "Sprout",
    description: "Clinical growth",
    Icon: Sprout,
  },
] as const;

const SPECIALTY_ICON_BY_EMOJI: Record<string, LucideIcon> = Object.fromEntries(
  SPECIALTY_ICON_OPTIONS.map((option) => [option.emoji, option.Icon]),
);

export function resolveSpecialtyIcon(stored: string): LucideIcon | null {
  return SPECIALTY_ICON_BY_EMOJI[stored.trim()] ?? null;
}

type SpecialtyGlyphProps = {
  icon: string;
  className?: string;
};

/** Decorative specialty glyph — never announced to assistive tech. */
export function SpecialtyGlyph({ icon, className = "h-6 w-6" }: SpecialtyGlyphProps) {
  const Icon = resolveSpecialtyIcon(icon);
  if (Icon) {
    return createElement(Icon, {
      className,
      "aria-hidden": true,
      strokeWidth: 1.75,
    });
  }
  return (
    <span className="text-[1.15em] leading-none" aria-hidden="true">
      {icon}
    </span>
  );
}
