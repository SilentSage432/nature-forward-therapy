import { headers } from "next/headers";
import type { Metadata } from "next";
import { Cormorant_Garamond, Inter, Montserrat } from "next/font/google";
import { PublicMaintenanceGate } from "@/components/PublicMaintenanceGate";
import { getSiteContent } from "@/lib/content";
import "./globals.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

function resolvePathname(headerStore: Headers): string {
  const candidates = [
    headerStore.get("x-pathname"),
    headerStore.get("x-invoke-path"),
    headerStore.get("x-matched-path"),
    headerStore.get("next-url"),
  ];
  for (const raw of candidates) {
    if (!raw) continue;
    try {
      if (raw.startsWith("http://") || raw.startsWith("https://")) {
        return new URL(raw).pathname || "/";
      }
      return raw.split("?")[0] || "/";
    } catch {
      return raw.split("?")[0] || "/";
    }
  }
  return "";
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerStore = await headers();
  const pathname = resolvePathname(headerStore);

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
