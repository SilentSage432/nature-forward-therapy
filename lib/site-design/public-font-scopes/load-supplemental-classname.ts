import type { SiteFontFamilyId } from "@/lib/site-design/typography-registry";

/**
 * Dynamically load only the supplemental next/font module for the published
 * pairing. Classic / Editorial / Modern need no supplements (root chrome).
 */
export async function loadPublicSupplementalClassName(
  fontFamilyId: SiteFontFamilyId,
): Promise<string> {
  switch (fontFamilyId) {
    case "literary":
      return (await import("./literary")).CLASSNAME;
    case "warm-serif":
      return (await import("./warm-serif")).CLASSNAME;
    case "scholarly":
      return (await import("./scholarly")).CLASSNAME;
    case "distinctive":
      return (await import("./distinctive")).CLASSNAME;
    case "soft-sans":
      return (await import("./soft-sans")).CLASSNAME;
    case "contemporary":
      return (await import("./contemporary")).CLASSNAME;
    case "classic":
    case "editorial":
    case "modern":
      return "";
    default: {
      const _exhaustive: never = fontFamilyId;
      return _exhaustive;
    }
  }
}
