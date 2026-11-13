/**
 * Full curated next/font loaders for Studio (NFT-STUDIO-007B-PERF02).
 *
 * Do not import this module from the root layout or PublicFontScope.
 * Root chrome: `site-font-chrome.ts`
 * Public supplements: `public-font-scopes/*` (dynamic per published pairing)
 *
 * `preload: false` is required: Next merges next/font CSS into a shared root
 * chunk, so preload:true on Studio faces would force curated downloads onto
 * every public/login document. Studio still downloads faces when samples or
 * preview CSS actually use them.
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
import type { SiteFontFaceId } from "@/lib/site-design/typography-registry";
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
