import type { Metadata } from "next";
import { AppProvider } from "@/lib/context";
import { SITE_CONFIG } from "@/lib/config";
import { SITE_URL, SITE_TITLE, SITE_DESCRIPTION, OG_IMAGE, travelAgencyJsonLd, jsonLdString } from "@/lib/seo";
import "./globals.css";

// Favicon / apple-touch-icon come from src/app/icon.jpeg and apple-icon.jpeg (file convention).
export const metadata: Metadata = {
  // Domain must be confirmed with the client; override via NEXT_PUBLIC_SITE_URL (see src/lib/seo.ts).
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_CONFIG.name}`,
  },
  description: SITE_DESCRIPTION,
  keywords: "tour, travel, varanasi, rajasthan, odisha, pilgrimage, spiritual, india, atlas tours",
  applicationName: SITE_CONFIG.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "/",
    siteName: SITE_CONFIG.name,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE.url],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
      </head>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdString(travelAgencyJsonLd()) }}
        />
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
