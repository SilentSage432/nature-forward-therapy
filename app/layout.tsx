import { headers } from "next/headers";
import type { Metadata } from "next";
import { Cormorant_Garamond, Inter, Montserrat } from "next/font/google";
import { PublicMaintenanceGate } from "@/components/MaintenanceGate";
import { getSiteContent } from "@/lib/content";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
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
        { url: "/icon.png", type: "image/png" },
        { url: "/favicon.png", type: "image/png" },
        { url: "/favicon.ico" },
      ],
      apple: [{ url: "/icon.png" }],
    },
    openGraph: {
      title: content.site.siteTitle,
      description: content.site.siteDescription,
      url: SITE_URL,
      siteName: "Flock of Fox, LLC",
      images: [
        {
          url: "/images/fof-logo.png",
          width: 596,
          height: 957,
          alt: "Flock of Fox, LLC",
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary",
      title: content.site.siteTitle,
      description: content.site.siteDescription,
      images: ["/images/fof-logo.png"],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerStore = await headers();
  const pathname = headerStore.get("x-pathname") ?? "";

  return (
    <html
      lang="en"
      className={`${inter.variable} ${montserrat.variable} ${cormorant.variable} scroll-smooth antialiased`}
    >
      <body className="min-h-screen font-body">
        <PublicMaintenanceGate pathname={pathname}>
          {children}
        </PublicMaintenanceGate>
      </body>
    </html>
  );
}
