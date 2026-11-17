import { SITE_CONFIG } from "./config";

// TODO: confirm the production domain with the client before launch.
// Set NEXT_PUBLIC_SITE_URL in the deployment environment to override.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://atlastours.in").replace(/\/+$/, "");

export const SITE_TITLE = `${SITE_CONFIG.name} | Spiritual Journeys Across India`;

export const SITE_DESCRIPTION =
  "Explore India's incredible destinations — Varanasi, Rajasthan, Odisha & more. Affordable tour packages with Hotel Ganga Imperial partnership.";

// Varanasi ghats image, already used by the default Varanasi package.
export const OG_IMAGE = {
  url: "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=1200&h=630&fit=crop&q=75",
  width: 1200,
  height: 630,
  alt: `${SITE_CONFIG.name} — Varanasi ghats`,
};

export const LOGO_PATH = "/images/atlas-logo.jpeg";

export function travelAgencyJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    name: SITE_CONFIG.name,
    slogan: SITE_CONFIG.tagline,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    logo: `${SITE_URL}${LOGO_PATH}`,
    image: OG_IMAGE.url,
    telephone: SITE_CONFIG.phone,
    email: SITE_CONFIG.email,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Varanasi",
      addressRegion: "Uttar Pradesh",
      addressCountry: "IN",
    },
    areaServed: [
      { "@type": "Country", name: "India" },
      { "@type": "City", name: "Varanasi" },
      { "@type": "State", name: "Rajasthan" },
      { "@type": "State", name: "Odisha" },
    ],
  };
}

/** Serialize JSON-LD safely for inline <script> (prevents `</script>` breakout). */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
