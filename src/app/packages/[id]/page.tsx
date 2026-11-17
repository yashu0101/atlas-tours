import React, { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import SmartImage from "@/components/SmartImage";
import CompareBar from "@/components/CompareBar";
import { CompareToggle, SaveToggle } from "@/components/PackageToggles";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsApp from "@/components/WhatsApp";
import BackToTop from "@/components/BackToTop";
import ScrollProgress from "@/components/ScrollProgress";
import RevealObserver from "@/components/RevealObserver";
import BookingForm from "@/components/BookingForm";
import { getPackages } from "@/lib/db";
import { isPublicPackage } from "@/lib/visibility";
import { SITE_CONFIG } from "@/lib/config";
import { OG_IMAGE, SITE_URL, jsonLdString } from "@/lib/seo";
import type { TourPackage } from "@/lib/types";
import { getT } from "@/lib/i18n";
import {
  categoryLabel,
  discountPercent,
  formatPrice,
  packageEnquiryText,
  packagePath,
  stripDayPrefix,
  whatsappLink,
} from "../package-utils";

// Same as the home page (F-02): read from the DB on every request so admin edits
// (including hiding a package) take effect immediately.
export const dynamic = "force-dynamic";

// Server-rendered in English; the language toggle only exists client-side (G-08).
const t = getT("en");

type Params = { params: Promise<{ id: string }> };

/** The package if it exists and is publicly visible; deduped between generateMetadata and the page. */
const loadPublicPackage = cache(async (id: string): Promise<TourPackage | null> => {
  const packages = await getPackages();
  return packages.find((p) => p.id === id && isPublicPackage(p)) ?? null;
});

/** Absolute URL for an image field (https: URL or site-relative path, see the "image" field type). */
const absoluteImage = (src: string | undefined): string | null => {
  if (!src) return null;
  if (/^https:\/\//i.test(src)) return src;
  if (src.startsWith("/") && !src.startsWith("//")) return `${SITE_URL}${src}`;
  return null;
};

const describe = (pkg: TourPackage) =>
  pkg.description ||
  t("packageDetail.metaDescription", {
    duration: pkg.duration,
    destination: pkg.destination,
    price: formatPrice(pkg.price),
    siteName: SITE_CONFIG.name,
  });

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const pkg = await loadPublicPackage(id);
  if (!pkg) return { title: t("packageDetail.notFoundTitle"), robots: { index: false } };

  const path = packagePath(pkg.id);
  const description = describe(pkg);
  const image = absoluteImage(pkg.image);
  const images = image ? [{ url: image, alt: pkg.name }] : [OG_IMAGE];
  return {
    title: pkg.name,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "en_IN",
      url: path,
      siteName: SITE_CONFIG.name,
      title: pkg.name,
      description,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: pkg.name,
      description,
      images: images.map((i) => i.url),
    },
  };
}

function touristTripJsonLd(pkg: TourPackage) {
  const url = `${SITE_URL}${packagePath(pkg.id)}`;
  const image = absoluteImage(pkg.image);
  return {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: pkg.name,
    description: describe(pkg),
    url,
    ...(image ? { image } : {}),
    touristType: categoryLabel(pkg.category),
    ...(pkg.itinerary?.length
      ? {
          itinerary: {
            "@type": "ItemList",
            numberOfItems: pkg.itinerary.length,
            itemListElement: pkg.itinerary.map((line, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: `Day ${i + 1}: ${stripDayPrefix(line)}`,
            })),
          },
        }
      : {}),
    offers: {
      "@type": "Offer",
      price: pkg.price,
      priceCurrency: "INR",
      url,
      availability: "https://schema.org/InStock",
    },
    provider: { "@type": "TravelAgency", name: SITE_CONFIG.name, url: SITE_URL },
  };
}

const styles: Record<string, React.CSSProperties> = {
  hero: {
    position: "relative",
    minHeight: 460,
    display: "flex",
    alignItems: "flex-end",
    overflow: "hidden",
    fontFamily: "'Poppins', sans-serif",
    background: "var(--primary-dark)",
  },
  heroOverlay: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(180deg, rgba(10,22,40,0.75) 0%, rgba(10,22,40,0.65) 45%, rgba(10,22,40,0.85) 100%)",
    zIndex: 1,
  },
  heroInner: {
    position: "relative",
    zIndex: 2,
    maxWidth: 1200,
    width: "100%",
    margin: "0 auto",
    padding: "140px 24px 48px",
    color: "#fff",
  },
  breadcrumb: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    listStyle: "none",
    padding: 0,
    margin: "0 0 18px",
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
  },
  breadcrumbLink: { color: "#fff", fontWeight: 600 },
  categoryBadge: {
    display: "inline-block",
    background: "rgba(230,126,34,0.2)",
    color: "#fff",
    padding: "6px 18px",
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  title: {
    fontSize: "clamp(30px, 5vw, 48px)",
    fontWeight: 800,
    lineHeight: 1.15,
    marginBottom: 14,
    color: "#fff",
  },
  heroMeta: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "10px 24px",
    fontSize: 15,
    color: "rgba(255,255,255,0.9)",
  },
  metaItem: { display: "inline-flex", alignItems: "center", gap: 6 },
  heroActions: { display: "flex", flexWrap: "wrap", gap: 12, marginTop: 20 },
  heroPrice: {
    display: "inline-flex",
    alignItems: "baseline",
    gap: 10,
    background: "linear-gradient(135deg, #e67e22, #f39c12)",
    color: "var(--on-accent)",
    padding: "8px 18px",
    borderRadius: 12,
    fontSize: 20,
    fontWeight: 800,
    boxShadow: "0 4px 12px rgba(230,126,34,0.4)",
  },
  heroOriginal: { textDecoration: "line-through", fontSize: 13, fontWeight: 500, color: "rgba(10,22,40,0.8)" },
  perPerson: { fontSize: 12, fontWeight: 500, color: "var(--on-accent)" },
  discountBadge: {
    background: "#1e874a",
    color: "#fff",
    padding: "4px 12px",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 700,
  },
  body: {
    padding: "60px 24px 100px",
    background: "var(--bg)",
    fontFamily: "'Poppins', sans-serif",
  },
  layout: {
    maxWidth: 1200,
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.6fr) minmax(0, 1fr)",
    gap: 40,
    alignItems: "start",
  },
  card: {
    background: "var(--card-bg)",
    borderRadius: 20,
    padding: "28px 32px",
    boxShadow: "var(--shadow)",
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: "var(--primary)",
    marginBottom: 14,
  },
  desc: { fontSize: 15, lineHeight: 1.8, color: "var(--text2)" },
  chips: { listStyle: "none", padding: 0, margin: 0, display: "flex", flexWrap: "wrap", gap: 8 },
  chip: {
    background: "var(--pkgd-chip-bg, rgba(26,58,107,0.06))",
    color: "var(--primary)",
    padding: "6px 14px",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
  },
  itineraryList: { listStyle: "none", padding: 0, margin: 0 },
  itineraryDay: {
    padding: "14px 0",
    borderBottom: "1px solid var(--pkgd-divider, #eee)",
    display: "flex",
    alignItems: "baseline",
    gap: 12,
  },
  dayNum: {
    flexShrink: 0,
    display: "inline-block",
    background: "linear-gradient(135deg, #e67e22, #f39c12)",
    color: "var(--on-accent)",
    padding: "3px 12px",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 700,
  },
  dayTitle: { fontSize: 15, fontWeight: 600, color: "var(--primary)", lineHeight: 1.6 },
  inclusionList: { listStyle: "none", padding: 0, margin: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 20px" },
  inclusionItem: { padding: "6px 0", fontSize: 14, color: "var(--text2)", display: "flex", alignItems: "center", gap: 8 },
  aside: { position: "sticky", top: 96 },
  bookingCard: {
    background: "var(--card-bg)",
    borderRadius: 20,
    padding: 28,
    boxShadow: "var(--shadow)",
  },
  bookingTitle: { fontSize: 22, fontWeight: 800, color: "var(--primary)", marginBottom: 4 },
  bookingSub: { fontSize: 14, color: "var(--text2)", marginBottom: 20 },
  orDivider: {
    textAlign: "center",
    fontSize: 13,
    color: "var(--text2)",
    margin: "20px 0 12px",
  },
  waBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    padding: "12px 0",
    borderRadius: 12,
    border: "2px solid var(--green)",
    color: "var(--pkgd-wa-text, #178841)",
    background: "transparent",
    fontSize: 15,
    fontWeight: 600,
    fontFamily: "'Poppins', sans-serif",
    transition: "all 0.3s",
  },
  backLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    padding: "10px 22px",
    border: "2px solid var(--primary)",
    borderRadius: 10,
    color: "var(--primary)",
    fontSize: 14,
    fontWeight: 600,
    transition: "all 0.3s",
  },
};

const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

const PinIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const WhatsAppIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.69.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.05 21.8h-.01a9.8 9.8 0 01-5-1.37l-.36-.21-3.72.98 1-3.63-.24-.37a9.8 9.8 0 01-1.5-5.22c0-5.42 4.41-9.83 9.84-9.83a9.77 9.77 0 016.95 2.88 9.77 9.77 0 012.88 6.96c0 5.42-4.41 9.83-9.84 9.83zm8.37-18.2A11.75 11.75 0 0012.05 0C5.5 0 .17 5.33.17 11.88c0 2.1.55 4.14 1.59 5.94L.07 24l6.33-1.66a11.86 11.86 0 005.65 1.44h.01c6.55 0 11.88-5.33 11.88-11.88 0-3.17-1.24-6.16-3.48-8.4z" />
  </svg>
);

export default async function PackageDetailPage({ params }: Params) {
  const { id } = await params;
  const pkg = await loadPublicPackage(id);
  if (!pkg) notFound();

  const highlights = pkg.highlights ?? [];
  const itinerary = pkg.itinerary ?? [];
  const inclusions = pkg.inclusions ?? [];
  const hasDiscount = typeof pkg.originalPrice === "number" && pkg.originalPrice > pkg.price;

  return (
    <>
      <a href="#main-content" className="skip-link">{t("common.skipToContent")}</a>
      <ScrollProgress />
      <Header />
      <style>{`
        /* E-02-style dark overrides; light mode uses the inline fallbacks. */
        [data-theme="dark"] #package-detail {
          --pkgd-chip-bg: rgba(91,143,217,0.12);
          --pkgd-divider: var(--bg3);
          --pkgd-wa-text: var(--green);
        }
        .pkgd-wa:hover { background: var(--green) !important; color: var(--on-accent) !important; }
        .pkgd-back:hover { background: var(--primary) !important; color: var(--bg) !important; }
        @media (max-width: 968px) {
          .pkgd-layout { grid-template-columns: 1fr !important; }
          .pkgd-aside { position: static !important; }
        }
        @media (max-width: 560px) {
          .pkgd-card { padding: 22px 20px !important; }
          .pkgd-inclusions { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <main id="main-content" tabIndex={-1}>
        <article id="package-detail">
          <header style={styles.hero}>
            <SmartImage
              src={pkg.image || "/images/placeholder.jpg"}
              alt=""
              fill
              priority
              sizes="100vw"
              style={{ objectFit: "cover" }}
            />
            <div style={styles.heroOverlay} aria-hidden="true" />
            <div style={styles.heroInner}>
              <nav aria-label={t("packageDetail.breadcrumbAria")}>
                <ol style={styles.breadcrumb}>
                  <li><Link href="/" style={styles.breadcrumbLink}>{t("header.nav.home")}</Link></li>
                  <li aria-hidden="true">/</li>
                  <li><Link href="/#packages" style={styles.breadcrumbLink}>{t("header.nav.packages")}</Link></li>
                  <li aria-hidden="true">/</li>
                  <li aria-current="page">{pkg.name}</li>
                </ol>
              </nav>
              {pkg.category && <span style={styles.categoryBadge}>{categoryLabel(pkg.category)}</span>}
              <h1 style={styles.title}>{pkg.name}</h1>
              <div style={styles.heroMeta}>
                {pkg.duration && <span style={styles.metaItem}><ClockIcon /> {pkg.duration}</span>}
                {pkg.destination && <span style={styles.metaItem}><PinIcon /> {pkg.destination}</span>}
                <span style={styles.heroPrice}>
                  &#8377;{formatPrice(pkg.price)}
                  {hasDiscount && (
                    <span style={styles.heroOriginal}>
                      <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>{`${t("packageDetail.wasPrice")} `}</span>
                      &#8377;{formatPrice(pkg.originalPrice)}
                    </span>
                  )}
                  <span style={styles.perPerson}>{t("packageDetail.perPerson")}</span>
                </span>
                {hasDiscount && (
                  <span style={styles.discountBadge}>{t("common.percentOff", { percent: discountPercent(pkg.originalPrice!, pkg.price) })}</span>
                )}
              </div>
              {/* N-7: save / compare (client components; state lives in localStorage). */}
              <div style={styles.heroActions}>
                <SaveToggle id={pkg.id} name={pkg.name} variant="hero" />
                <CompareToggle id={pkg.id} name={pkg.name} variant="hero" />
              </div>
            </div>
          </header>

          <div style={styles.body}>
            <div className="pkgd-layout" style={styles.layout}>
              <div>
                {pkg.description && (
                  <section className="pkgd-card" style={styles.card} aria-labelledby="pkgd-overview">
                    <h2 id="pkgd-overview" style={styles.sectionTitle}>{t("packageDetail.overview")}</h2>
                    <p style={styles.desc}>{pkg.description}</p>
                  </section>
                )}

                {highlights.length > 0 && (
                  <section className="pkgd-card" style={styles.card} aria-labelledby="pkgd-highlights">
                    <h2 id="pkgd-highlights" style={styles.sectionTitle}>{t("packageDetail.highlights")}</h2>
                    <ul style={styles.chips}>
                      {highlights.map((h, i) => (
                        <li key={i} style={styles.chip}>{h}</li>
                      ))}
                    </ul>
                  </section>
                )}

                {itinerary.length > 0 && (
                  <section className="pkgd-card" style={styles.card} aria-labelledby="pkgd-itinerary">
                    <h2 id="pkgd-itinerary" style={styles.sectionTitle}>{t("common.itinerary")}</h2>
                    <ol style={styles.itineraryList}>
                      {itinerary.map((line, i) => (
                        <li
                          key={i}
                          style={{ ...styles.itineraryDay, ...(i === itinerary.length - 1 ? { borderBottom: "none" } : {}) }}
                        >
                          <span style={styles.dayNum}>{t("common.day", { n: i + 1 })}</span>
                          <span style={styles.dayTitle}>{stripDayPrefix(line)}</span>
                        </li>
                      ))}
                    </ol>
                  </section>
                )}

                {inclusions.length > 0 && (
                  <section className="pkgd-card" style={styles.card} aria-labelledby="pkgd-inclusions">
                    <h2 id="pkgd-inclusions" style={styles.sectionTitle}>{t("common.inclusions")}</h2>
                    <ul className="pkgd-inclusions" style={styles.inclusionList}>
                      {inclusions.map((item, i) => (
                        <li key={i} style={styles.inclusionItem}>
                          <span style={{ color: "#27ae60" }} aria-hidden="true">&#10003;</span> {item}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                <Link href="/#packages" className="pkgd-back" style={styles.backLink}>
                  &larr; {t("packageDetail.allPackages")}
                </Link>
              </div>

              <aside className="pkgd-aside" style={styles.aside} aria-labelledby="pkgd-book">
                <div className="pkgd-card" style={styles.bookingCard}>
                  <h2 id="pkgd-book" style={styles.bookingTitle}>{t("packageDetail.bookTitle")}</h2>
                  <p style={styles.bookingSub}>{t("packageDetail.bookSubtitle")}</p>
                  <BookingForm packageId={pkg.id} packageName={pkg.name} price={pkg.price} />
                  <p style={styles.orDivider}>{t("packageDetail.orAsk")}</p>
                  <a
                    className="pkgd-wa"
                    href={whatsappLink(packageEnquiryText(pkg.name))}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.waBtn}
                  >
                    <WhatsAppIcon /> {t("packageDetail.enquireWhatsApp")}
                  </a>
                </div>
              </aside>
            </div>
          </div>
        </article>
      </main>
      <Footer />
      <CompareBar />
      <WhatsApp />
      <BackToTop />
      <RevealObserver />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(touristTripJsonLd(pkg)) }} />
    </>
  );
}
