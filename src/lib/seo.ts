import { SITE_CONFIG } from "./config";
import type { FAQ } from "./types";

// TODO: confirm the production domain with the client before launch.
// Set NEXT_PUBLIC_SITE_URL in the deployment environment to override.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://atlastours.in").replace(/\/+$/, "");

export const SITE_TITLE = `${SITE_CONFIG.name} | Spiritual Journeys Across India`;

export const SITE_DESCRIPTION =
  "Explore India's incredible destinations — Varanasi, Rajasthan, Odisha & more. Affordable tour packages with Hotel Ganga Imperial partnership.";

// Varanasi ghats image, already used by the default Varanasi package.
export const OG_IMAGE = {
  url: "https://images.unsplash.com/photo-1561359313-0639aad49ca6?w=1200&h=630&fit=crop&q=75",
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
      streetAddress: "Hotel Ganga Imperial, Tilamapur, Rustampur",
      addressLocality: "Varanasi",
      addressRegion: "Uttar Pradesh",
      postalCode: "221112",
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

/** FAQPage structured data from the (already public-filtered) FAQs shown on the page (F-02/F-04). */
export function faqPageJsonLd(faqs: readonly Pick<FAQ, "question" | "answer">[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}

/** Serialize JSON-LD safely for inline <script> (prevents `</script>` breakout). */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** Absolute URL for a site-relative path ("/images/x.jpg"); absolute URLs pass through. */
export function absoluteUrl(pathOrUrl: string): string {
  return pathOrUrl.startsWith("/") ? `${SITE_URL}${pathOrUrl}` : pathOrUrl;
}

/** BlogPosting structured data for a public blog detail page (G-07). */
export function blogPostingJsonLd(
  post: Pick<import("./types").BlogPost, "id" | "title" | "excerpt" | "image" | "author" | "category" | "createdAt">,
) {
  const url = `${SITE_URL}/blog/${encodeURIComponent(post.id)}`;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt || undefined,
    image: post.image ? [absoluteUrl(post.image)] : undefined,
    datePublished: post.createdAt || undefined,
    articleSection: post.category || undefined,
    author: { "@type": "Organization", name: post.author || SITE_CONFIG.name },
    publisher: {
      "@type": "Organization",
      name: SITE_CONFIG.name,
      logo: { "@type": "ImageObject", url: `${SITE_URL}${LOGO_PATH}` },
    },
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };
}
