/**
 * Root-layout chrome fonts (NFT-STUDIO-007B-PERF02 / REL01).
 *
 * All next/font/google faces for the app are declared exactly once in this
 * module tree (`site-font-loaders.ts` reuses these chrome instances). Duplicate
 * Google font constructors break Turbopack production builds on Vercel
 * ("next/font/google queries have exactly one entry").
 *
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
