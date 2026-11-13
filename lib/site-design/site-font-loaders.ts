/**
 * Curated next/font loaders (NFT-STUDIO-007B-PERF02 / REL01).
 *
 * Single declaration site for every curated face. Public supplements and Studio
 * both consume these instances — never re-declare the same Google font elsewhere
 * (Turbopack production builds require exactly one next/font query per face).
 *
 * Do not import this module from the root layout (root uses site-font-chrome only).
 * Non-chrome faces use preload:false so shared CSS does not force curated
 * downloads onto public documents.
 */

import {
  DM_Sans,
  Fraunces,
  Libre_Baskerville,
  Lora,
  Manrope,
  Nunito_Sans,
  Playfair_Display,
  Source_Sans_3,
} from "next/font/google";
import type {
  SiteFontFaceId,
  SiteFontFamilyId,
} from "@/lib/site-design/typography-registry";
import { uniqueFaceIds } from "@/lib/site-design/font-delivery";
import {
  cormorant,
  inter,
  montserrat,
} from "@/lib/site-design/site-font-chrome";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-playfair",
  display: "swap",
  preload: false,
});

const lora = Lora({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-lora",
  display: "swap",
  preload: false,
});

const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-libre-baskerville",
  display: "swap",
  preload: false,
});

const sourceSans3 = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-source-sans-3",
  display: "swap",
  preload: false,
});

const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-nunito-sans",
  display: "swap",
  preload: false,
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-manrope",
  display: "swap",
  preload: false,
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
  preload: false,
});

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-fraunces",
  display: "swap",
  preload: false,
});

export const SITE_FONT_VARIABLE_BY_FACE = {
  inter: inter.variable,
  montserrat: montserrat.variable,
  "cormorant-garamond": cormorant.variable,
  "playfair-display": playfair.variable,
  lora: lora.variable,
  "libre-baskerville": libreBaskerville.variable,
  "source-sans-3": sourceSans3.variable,
  "nunito-sans": nunitoSans.variable,
  manrope: manrope.variable,
  "dm-sans": dmSans.variable,
  fraunces: fraunces.variable,
} as const satisfies Record<SiteFontFaceId, string>;

export function fontVariableClassName(
  faceIds: readonly SiteFontFaceId[],
): string {
  return uniqueFaceIds(faceIds)
    .map((id) => SITE_FONT_VARIABLE_BY_FACE[id])
    .join(" ");
}

/**
 * Static supplemental class strings beyond root chrome.
 * Empty = chrome-only (Classic / Editorial / Modern).
 */
export const PUBLIC_SUPPLEMENTAL_CLASS_BY_PAIRING = {
  classic: "",
  editorial: "",
  modern: "",
  literary: `${playfair.variable} ${sourceSans3.variable}`,
  "warm-serif": `${lora.variable} ${sourceSans3.variable}`,
  scholarly: `${libreBaskerville.variable} ${sourceSans3.variable}`,
  distinctive: `${fraunces.variable} ${sourceSans3.variable}`,
  "soft-sans": nunitoSans.variable,
  contemporary: `${manrope.variable} ${dmSans.variable}`,
} as const satisfies Record<SiteFontFamilyId, string>;

export function publicSupplementalClassName(
  fontFamilyId: SiteFontFamilyId,
): string {
  return PUBLIC_SUPPLEMENTAL_CLASS_BY_PAIRING[fontFamilyId];
}
