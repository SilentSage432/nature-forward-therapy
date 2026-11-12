import type { Metadata } from "next";
import { Cormorant_Garamond, Inter, Montserrat } from "next/font/google";
import { DeveloperMaintenanceBanner } from "@/components/DeveloperMaintenanceBanner";
import { getSiteContent } from "@/lib/content";
import "./globals.css";

/** ISR window for public HTML (must be a static literal for Next.js). */
export const revalidate = 60;

const inter = Inter({
  subsets: ["latin"],
  // 700 required for Modern preset headings (font-bold) without synthesis.
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-montserrat",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const SITE_URL = process.env.NEXTAUTH_URL ?? "https://flockoffox.org";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getSiteContent();
  return {
    title: content.site.siteTitle,
    description: content.site.siteDescription,
    metadataBase: new URL(SITE_URL),
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/favicon.png", type: "image/png", sizes: "32x32" },
        { url: "/icon.png", type: "image/png", sizes: "192x192" },
      ],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    },
    openGraph: {
      title: content.site.siteTitle,
      description: content.site.siteDescription,
      url: SITE_URL,
      siteName: "Flock of Fox, LLC",
      images: [
        {
          url: "/images/brand/fof-logo-og.jpg",
          width: 512,
          height: 822,
          alt: "Flock of Fox, LLC",
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary",
      title: content.site.siteTitle,
      description: content.site.siteDescription,
      images: ["/images/brand/fof-logo-og.jpg"],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${montserrat.variable} ${cormorant.variable} scroll-smooth antialiased`}
    >
      <body className="min-h-screen font-body">
        <DeveloperMaintenanceBanner />
        {children}
      </body>
    </html>
  );
}
