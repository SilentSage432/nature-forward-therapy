import { Lora, Source_Sans_3 } from "next/font/google";

const lora = Lora({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-lora",
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

export const CLASSNAME = `${lora.variable} ${sourceSans3.variable}`;
