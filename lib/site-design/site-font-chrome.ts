/**
 * Root-layout chrome fonts only (NFT-STUDIO-007B-PERF02).
 *
 * Kept in a dedicated module so public routes that import the root layout
 * do not pull supplemental curated faces into the root preload set.
 * Chrome faces keep default preload:true (Inter / Montserrat / Cormorant).
 */

import { Cormorant_Garamond, Inter, Montserrat } from "next/font/google";

export const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-montserrat",
  display: "swap",
});

export const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

export const ROOT_CHROME_FONT_VARIABLE_CLASSNAME = [
  inter.variable,
  montserrat.variable,
  cormorant.variable,
].join(" ");
