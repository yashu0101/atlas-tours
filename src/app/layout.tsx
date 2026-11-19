import type { Metadata } from "next";
import { Poppins, Marcellus } from "next/font/google";
import { AppProvider } from "@/lib/context";
import { SITE_CONFIG } from "@/lib/config";
import { SITE_URL, SITE_TITLE, SITE_DESCRIPTION, OG_IMAGE, travelAgencyJsonLd, jsonLdString } from "@/lib/seo";
import "./globals.css";

// Self-hosted by next/font (F-07). Weights cover every fontWeight used in src/ plus 900.
// The generated @font-face family is exposed as --font-poppins; globals.css maps body to it.
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-poppins",
});

// Hotel Ganga Imperial's display font, used only by its wordmark (HotelPartnerLogo.tsx).
const marcellus = Marcellus({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-marcellus",
});

// Runs before first paint so dark-theme users don't see a light flash (D-05).
// Key/values must match src/lib/context.tsx ("atlas-theme": "light" | "dark").
const themeScript = `try{var t=localStorage.getItem("atlas-theme");if(t==="dark"||t==="light")document.documentElement.dataset.theme=t}catch(e){}`;

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
    // data-scroll-behavior tells Next.js that globals.css sets `scroll-behavior: smooth` on <html>,
    // so it can switch smooth scrolling off during route transitions (e.g. opening /packages/[id])
    // while hash links on the home page keep scrolling smoothly.
    <html lang="en" className={`${poppins.variable} ${marcellus.variable}`} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
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
