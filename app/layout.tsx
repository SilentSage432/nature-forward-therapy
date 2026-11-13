import type { Metadata } from "next";
import { DeveloperMaintenanceBanner } from "@/components/DeveloperMaintenanceBanner";
import { getSiteContent } from "@/lib/content";
import { ROOT_CHROME_FONT_VARIABLE_CLASSNAME } from "@/lib/site-design/site-font-chrome";
import "./globals.css";

/** ISR window for public HTML (must be a static literal for Next.js). */
export const revalidate = 60;

/*
 * NFT-STUDIO-007B-PERF02 font delivery (root):
 * Attach only admin/public chrome faces here (Inter, Montserrat, Cormorant).
 * Published pairing supplements are applied in PublicFontScope; the full
 * curated library is attached in the Studio layout (incl. preview-frame).
 * Root avoids headers()/pathname branching so public ISR is preserved.
 */

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
      className={`${ROOT_CHROME_FONT_VARIABLE_CLASSNAME} scroll-smooth antialiased`}
      data-font-delivery="chrome"
    >
      <body className="min-h-screen font-body">
        <DeveloperMaintenanceBanner />
        {children}
      </body>
    </html>
  );
}
