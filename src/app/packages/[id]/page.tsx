import React, { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import SmartImage from "@/components/SmartImage";
import CompareBar from "@/components/CompareBar";
import PackageCard, { PACKAGE_CARD_CSS } from "@/components/PackageCard";
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
import { isPublicPackage, istDateKey } from "@/lib/visibility";
import { SITE_CONFIG } from "@/lib/config";
import { OG_IMAGE, SITE_URL, jsonLdString } from "@/lib/seo";
import type { TourPackage } from "@/lib/types";
import { getT } from "@/lib/i18n";
import {
  BOOKING_ANCHOR,
  categoryLabel,
  discountPercent,
  formatPrice,
  packageEnquiryText,
  packagePath,
  parseItineraryDay,
  relatedPackages,
  tripRoute,
  whatsappLink,
} from "../package-utils";

// Same as the home page (F-02): read from the DB on every request so admin edits
// (including hiding a package) take effect immediately.
export const dynamic = "force-dynamic";

// Server-rendered in English; the language toggle only exists client-side (G-08).
const t = getT("en");

type Params = { params: Promise<{ id: string }> };

/** All publicly visible packages; deduped between generateMetadata and the page. */
const loadPublicPackages = cache(async (): Promise<TourPackage[]> => (await getPackages()).filter(isPublicPackage));

/** The package if it exists and is publicly visible. */
const loadPublicPackage = async (id: string): Promise<TourPackage | null> =>
  (await loadPublicPackages()).find((p) => p.id === id) ?? null;

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
              name: `Day ${i + 1}: ${parseItineraryDay(line).title}`,
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

const srOnly: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0,0,0,0)",
  whiteSpace: "nowrap",
  border: 0,
};

const styles: Record<string, React.CSSProperties> = {
  hero: {
    position: "relative",
    minHeight: 540,
    display: "flex",
    alignItems: "flex-end",
    overflow: "hidden",
    fontFamily: "'Poppins', sans-serif",
    background: "var(--primary-dark)",
  },
  heroOverlay: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(180deg, rgba(10,22,40,0.7) 0%, rgba(10,22,40,0.35) 40%, rgba(10,22,40,0.92) 100%)",
    zIndex: 1,
  },
  heroInner: {
    position: "relative",
    zIndex: 2,
    maxWidth: 1200,
    width: "100%",
    margin: "0 auto",
    padding: "140px 24px 108px",
    color: "#fff",
  },
  breadcrumb: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    listStyle: "none",
    padding: 0,
    margin: "0 0 22px",
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
  },
  breadcrumbLink: { color: "#fff", fontWeight: 600 },
  categoryTag: {
    display: "inline-block",
    background: "rgba(255,255,255,0.14)",
    border: "1px solid rgba(255,255,255,0.3)",
    color: "#fff",
    padding: "5px 14px",
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 14,
    backdropFilter: "blur(6px)",
  },
  title: {
    fontSize: "clamp(32px, 5.4vw, 58px)",
    fontWeight: 800,
    lineHeight: 1.08,
    letterSpacing: -1,
    margin: "0 0 22px",
    maxWidth: 820,
    color: "#fff",
  },
  heroActions: { display: "flex", flexWrap: "wrap", gap: 12 },

  // Facts strip: overlaps the bottom of the hero.
  factsWrap: { position: "relative", zIndex: 3, padding: "0 24px", marginTop: -64, fontFamily: "'Poppins', sans-serif" },
  facts: {
    maxWidth: 1200,
    margin: "0 auto",
    background: "var(--card-bg)",
    borderRadius: 20,
    boxShadow: "var(--shadow2)",
    display: "grid",
    gridTemplateColumns: "1fr 1.6fr 1fr 1.2fr",
  },
  fact: { padding: "22px 26px", minWidth: 0, borderLeft: "1px solid var(--pkgd-divider, #e8edf3)" },
  factFirst: { borderLeft: "none" },
  factLabel: { display: "block", fontSize: 12.5, fontWeight: 500, color: "var(--text2)", marginBottom: 4 },
  factValue: { display: "block", fontSize: 16, fontWeight: 700, color: "var(--primary)", lineHeight: 1.35 },
  factPrice: { fontSize: 22, fontWeight: 800, color: "var(--primary)", letterSpacing: -0.5 },
  factPer: { fontSize: 13, fontWeight: 500, color: "var(--text2)", marginLeft: 4 },
  jump: {
    display: "none",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 18px 18px",
    padding: "13px 0",
    borderRadius: 12,
    background: "linear-gradient(135deg, #e67e22, #f39c12)",
    color: "var(--on-accent)",
    fontSize: 15,
    fontWeight: 700,
    textDecoration: "none",
    boxShadow: "0 4px 15px rgba(230,126,34,0.3)",
  },

  body: { padding: "56px 24px 96px", background: "var(--bg)", fontFamily: "'Poppins', sans-serif" },
  layout: {
    maxWidth: 1200,
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.65fr) minmax(0, 1fr)",
    gap: 56,
    alignItems: "start",
  },
  section: { paddingBottom: 40, marginBottom: 40, borderBottom: "1px solid var(--pkgd-divider, #e8edf3)" },
  sectionHead: { display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 20 },
  sectionTitle: { fontSize: 24, fontWeight: 700, color: "var(--primary)", margin: 0 },
  sectionMeta: { fontSize: 14, fontWeight: 500, color: "var(--text2)" },
  lead: { fontSize: 17, lineHeight: 1.85, color: "var(--text)", maxWidth: 680, margin: 0 },

  highlightList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  highlight: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "14px 16px",
    borderRadius: 14,
    background: "var(--pkgd-tint, rgba(230,126,34,0.07))",
    fontSize: 15,
    fontWeight: 500,
    color: "var(--text)",
  },
  highlightMark: {
    flexShrink: 0,
    width: 10,
    height: 10,
    transform: "rotate(45deg)",
    borderRadius: 2,
    background: "linear-gradient(135deg, #e67e22, #f39c12)",
  },

  timeline: { listStyle: "none", padding: 0, margin: 0 },
  dayLabel: { display: "block", fontSize: 13, fontWeight: 700, color: "var(--orange-text)", marginBottom: 2 },
  dayTitle: { display: "block", fontSize: 16.5, fontWeight: 600, color: "var(--primary)", lineHeight: 1.5, margin: 0 },
  dayPoints: { listStyle: "none", padding: 0, margin: "8px 0 0", display: "grid", gap: 4 },
  dayPoint: { position: "relative", paddingLeft: 16, fontSize: 14.5, lineHeight: 1.6, color: "var(--text)" },
  dayStay: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    padding: "4px 12px",
    borderRadius: 999,
    background: "var(--bg3)",
    color: "var(--primary)",
    fontSize: 13,
    fontWeight: 600,
  },

  route: { listStyle: "none", padding: 0, margin: 0, display: "flex", flexWrap: "wrap", alignItems: "stretch", rowGap: 14 },
  routeStop: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    minWidth: 96,
    padding: "10px 16px",
    borderRadius: 14,
    background: "var(--pkgd-tint, rgba(230,126,34,0.07))",
  },
  routeEdge: { background: "var(--bg3)" },
  routePlace: { fontSize: 15, fontWeight: 700, color: "var(--primary)", lineHeight: 1.3 },
  routeNights: { fontSize: 12.5, fontWeight: 600, color: "var(--orange-text)" },
  routeEdgeLabel: { fontSize: 12.5, fontWeight: 600, color: "var(--text2)" },

  incGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 },
  incHeading: { fontSize: 17, fontWeight: 700, color: "var(--primary)", margin: "0 0 16px" },
  incList: { listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 14 },

  inclusionList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "14px 24px",
  },
  inclusion: { display: "flex", alignItems: "flex-start", gap: 12, fontSize: 15, lineHeight: 1.5, color: "var(--text)" },
  crossDot: {
    flexShrink: 0,
    width: 26,
    height: 26,
    borderRadius: "50%",
    background: "var(--pkgd-cross-bg, rgba(192,57,43,0.1))",
    color: "var(--error-text)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  checkDot: {
    flexShrink: 0,
    width: 26,
    height: 26,
    borderRadius: "50%",
    background: "var(--pkgd-check-bg, rgba(30,135,74,0.12))",
    color: "var(--success-text)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  custom: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    padding: "24px 28px",
    borderRadius: 18,
    background: "var(--bg3)",
  },
  customTitle: { fontSize: 17, fontWeight: 700, color: "var(--primary)", margin: "0 0 4px" },
  customText: { fontSize: 14.5, color: "var(--text2)", margin: 0, lineHeight: 1.6 },
  customLink: {
    display: "inline-flex",
    padding: "10px 22px",
    borderRadius: 10,
    border: "2px solid var(--primary)",
    color: "var(--primary)",
    fontSize: 14,
    fontWeight: 600,
    textDecoration: "none",
    whiteSpace: "nowrap",
    transition: "all 0.3s",
  },

  // scrollMarginTop keeps the fixed header off the form when "Book Now" jumps to #book.
  aside: { position: "sticky", top: 96, scrollMarginTop: 96 },
  bookingCard: {
    background: "var(--card-bg)",
    borderRadius: 20,
    boxShadow: "var(--shadow2)",
    overflow: "hidden",
  },
  priceHead: {
    padding: "22px 28px",
    background: "linear-gradient(135deg, #1a3a6b 0%, #0a1628 100%)",
    color: "#fff",
  },
  priceRow: { display: "flex", alignItems: "baseline", flexWrap: "wrap", gap: "4px 10px" },
  priceNow: { fontSize: 32, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.1 },
  pricePer: { fontSize: 14, color: "rgba(255,255,255,0.8)" },
  priceNote: { fontSize: 13, color: "rgba(255,255,255,0.8)", margin: "6px 0 0" },
  priceMin: {
    display: "inline-block",
    marginTop: 10,
    padding: "4px 12px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.14)",
    border: "1px solid rgba(255,255,255,0.3)",
    fontSize: 12.5,
    fontWeight: 600,
  },
  factNote: { display: "block", fontSize: 12.5, fontWeight: 500, color: "var(--text2)", marginTop: 2 },
  priceWasRow: { display: "flex", alignItems: "center", flexWrap: "wrap", gap: 10, marginTop: 8 },
  priceWas: { fontSize: 14, color: "rgba(255,255,255,0.75)", textDecoration: "line-through" },
  saveBadge: {
    background: "#1e874a",
    color: "#fff",
    padding: "3px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
  },
  bookingBody: { padding: 28 },
  bookingTitle: { fontSize: 20, fontWeight: 800, color: "var(--primary)", marginBottom: 4 },
  bookingSub: { fontSize: 14, color: "var(--text2)", marginBottom: 20 },
  orDivider: { textAlign: "center", fontSize: 13, color: "var(--text2)", margin: "20px 0 12px" },
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

  more: { background: "var(--bg2)", padding: "72px 24px 96px", fontFamily: "'Poppins', sans-serif" },
  moreInner: { maxWidth: 1200, margin: "0 auto" },
  moreHead: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 28,
  },
  moreTitle: { fontSize: "clamp(24px, 3vw, 32px)", fontWeight: 800, color: "var(--primary)", margin: 0 },
  moreLink: { color: "var(--orange-text)", fontSize: 15, fontWeight: 600 },
  moreGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 28 },
};

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

const CrossIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

const MoonIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />
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
  const others = relatedPackages(await loadPublicPackages(), pkg);

  const highlights = pkg.highlights ?? [];
  const itinerary = pkg.itinerary ?? [];
  const inclusions = pkg.inclusions ?? [];
  const exclusions = pkg.exclusions ?? [];
  const days = itinerary.map(parseItineraryDay);
  const route = tripRoute(itinerary, pkg.startsFrom);
  const routeNights = route.reduce((n, s) => n + s.nights, 0);
  const hasDiscount = typeof pkg.originalPrice === "number" && pkg.originalPrice > pkg.price;

  return (
    <>
      <a href="#main-content" className="skip-link">{t("common.skipToContent")}</a>
      <ScrollProgress />
      <Header />
      <style>{`
        ${PACKAGE_CARD_CSS}
        /* E-02-style dark overrides; light mode uses the inline fallbacks. */
        [data-theme="dark"] #package-detail {
          --pkgd-divider: rgba(148,163,184,0.2);
          --pkgd-tint: rgba(233,140,58,0.1);
          --pkgd-check-bg: rgba(39,176,97,0.16);
          --pkgd-wa-text: var(--green);
          --pkgd-stop-bg: var(--card-bg);
          --pkgd-cross-bg: rgba(231,76,60,0.16);
        }
        .pkgd-wa:hover { background: var(--green) !important; color: var(--on-accent) !important; }
        .pkgd-day-point::before {
          content: ""; position: absolute; left: 2px; top: 0.65em; width: 6px; height: 6px; border-radius: 50%;
          background: var(--orange);
        }
        /* Route strip (N-18): an arrow between stops. */
        .pkgd-route-stop { display: flex; }
        .pkgd-route-stop + .pkgd-route-stop::before {
          content: "→"; display: flex; align-items: center; padding: 0 10px; color: var(--orange-text); font-weight: 700;
        }
        .pkgd-custom-link:hover { background: var(--primary) !important; color: var(--bg) !important; }

        /* Itinerary as a route: one stop per day, joined by a line; arrival and departure filled. */
        .pkgd-day { position: relative; padding: 0 0 30px 64px; min-height: 44px; }
        .pkgd-day:last-child { padding-bottom: 0; }
        .pkgd-day::before {
          content: ""; position: absolute; left: 21px; top: 44px; bottom: 0; width: 2px;
          background: repeating-linear-gradient(180deg, var(--orange) 0 6px, transparent 6px 12px);
          opacity: 0.55;
        }
        .pkgd-day:last-child::before { display: none; }
        .pkgd-stop {
          position: absolute; left: 0; top: 0; width: 44px; height: 44px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          background: var(--pkgd-stop-bg, #fff); border: 2px solid var(--orange);
          color: var(--orange-text); font-size: 16px; font-weight: 800;
        }
        .pkgd-day:first-child .pkgd-stop, .pkgd-day:last-child .pkgd-stop {
          background: linear-gradient(135deg, #e67e22, #f39c12); border-color: transparent; color: var(--on-accent);
        }

        @media (max-width: 968px) {
          .pkgd-layout { grid-template-columns: 1fr !important; gap: 8px !important; }
          .pkgd-aside { position: static !important; }
          .pkgd-facts { grid-template-columns: 1fr 1fr !important; }
          .pkgd-fact:nth-child(3) { border-left: none !important; }
          .pkgd-fact:nth-child(n+3) { border-top: 1px solid var(--pkgd-divider, #e8edf3); }
          .pkgd-jump { display: flex !important; grid-column: 1 / -1; }
        }
        @media (max-width: 560px) {
          .pkgd-hero-inner { padding-bottom: 92px !important; }
          .pkgd-fact { padding: 16px 18px !important; }
          .pkgd-two-col, .pkgd-inc-grid { grid-template-columns: 1fr !important; }
          .pkgd-booking-body { padding: 22px 20px !important; }
          .pkgd-price-head { padding: 20px !important; }
        }
      `}</style>
      <main id="main-content" tabIndex={-1}>
        <article id="package-detail">
          <header data-header-tone="dark" style={styles.hero}>
            <SmartImage
              src={pkg.image || "/images/placeholder.jpg"}
              alt=""
              fill
              priority
              sizes="100vw"
              data-parallax="0.3"
              style={{ objectFit: "cover" }}
            />
            <div style={styles.heroOverlay} aria-hidden="true" />
            <div className="pkgd-hero-inner parallax-fade" data-parallax="0.15" style={styles.heroInner}>
              <nav aria-label={t("packageDetail.breadcrumbAria")}>
                <ol style={styles.breadcrumb}>
                  <li><Link href="/" style={styles.breadcrumbLink}>{t("header.nav.home")}</Link></li>
                  <li aria-hidden="true">/</li>
                  <li><Link href="/packages" style={styles.breadcrumbLink}>{t("header.nav.packages")}</Link></li>
                  <li aria-hidden="true">/</li>
                  <li aria-current="page">{pkg.name}</li>
                </ol>
              </nav>
              {pkg.category && <span style={styles.categoryTag}>{categoryLabel(pkg.category)}</span>}
              <h1 style={styles.title}>{pkg.name}</h1>
              {/* N-7: save / compare (client components; state lives in localStorage). */}
              <div style={styles.heroActions}>
                <SaveToggle id={pkg.id} name={pkg.name} variant="hero" />
                <CompareToggle id={pkg.id} name={pkg.name} variant="hero" />
              </div>
            </div>
          </header>

          <div style={styles.factsWrap}>
            <dl className="pkgd-facts" style={styles.facts} aria-label={t("packageDetail.factsAria")}>
              <div className="pkgd-fact" style={{ ...styles.fact, ...styles.factFirst }}>
                <dt style={styles.factLabel}>{t("packageDetail.factDuration")}</dt>
                <dd style={styles.factValue}>{pkg.duration || "—"}</dd>
              </div>
              <div className="pkgd-fact" style={styles.fact}>
                <dt style={styles.factLabel}>{t("packageDetail.factPlaces")}</dt>
                <dd style={styles.factValue}>{pkg.destination || "—"}</dd>
              </div>
              {pkg.startsFrom ? (
                <div className="pkgd-fact" style={styles.fact}>
                  <dt style={styles.factLabel}>{t("packageDetail.factStartsFrom")}</dt>
                  <dd style={styles.factValue}>{pkg.startsFrom}</dd>
                </div>
              ) : (
                <div className="pkgd-fact" style={styles.fact}>
                  <dt style={styles.factLabel}>{t("packageDetail.factStyle")}</dt>
                  <dd style={styles.factValue}>{categoryLabel(pkg.category) || "—"}</dd>
                </div>
              )}
              <div className="pkgd-fact" style={styles.fact}>
                <dt style={styles.factLabel}>{t("packageDetail.factPrice")}</dt>
                <dd style={styles.factValue}>
                  <span style={styles.factPrice}>&#8377;{formatPrice(pkg.price)}</span>
                  <span style={styles.factPer}>{t("packageDetail.perPerson")}</span>
                  {pkg.priceNote && <span style={styles.factNote}>{pkg.priceNote}</span>}
                </dd>
              </div>
              <a href={`#${BOOKING_ANCHOR}`} className="pkgd-jump" style={styles.jump}>
                {t("packageDetail.jumpToBook")}
              </a>
            </dl>
          </div>

          <div style={styles.body}>
            <div className="pkgd-layout" style={styles.layout}>
              <div>
                {pkg.description && (
                  <section className="reveal" style={styles.section} aria-labelledby="pkgd-overview">
                    <div style={styles.sectionHead}>
                      <h2 id="pkgd-overview" style={styles.sectionTitle}>{t("packageDetail.overview")}</h2>
                    </div>
                    <p style={styles.lead}>{pkg.description}</p>
                  </section>
                )}

                {route.length > 0 && (
                  <section className="reveal" style={styles.section} aria-labelledby="pkgd-route">
                    <div style={styles.sectionHead}>
                      <h2 id="pkgd-route" style={styles.sectionTitle}>{t("packageDetail.routeTitle")}</h2>
                      <span style={styles.sectionMeta}>{t("packageDetail.routeMeta", { nights: routeNights })}</span>
                    </div>
                    <ol style={styles.route}>
                      {route.map((stop, i) => (
                        <li key={i} className="pkgd-route-stop">
                          <span style={stop.kind === "stay" ? styles.routeStop : { ...styles.routeStop, ...styles.routeEdge }}>
                            <span style={styles.routePlace}>{stop.place}</span>
                            {stop.kind === "stay" ? (
                              <span style={styles.routeNights}>
                                {stop.nights === 1 ? t("packageDetail.routeNightOne") : t("packageDetail.routeNights", { count: stop.nights })}
                              </span>
                            ) : (
                              <span style={styles.routeEdgeLabel}>
                                {stop.kind === "start" ? t("packageDetail.routeStart") : t("packageDetail.routeEnd")}
                              </span>
                            )}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </section>
                )}

                {highlights.length > 0 && (
                  <section className="reveal" style={styles.section} aria-labelledby="pkgd-highlights">
                    <div style={styles.sectionHead}>
                      <h2 id="pkgd-highlights" style={styles.sectionTitle}>{t("packageDetail.highlights")}</h2>
                    </div>
                    <ul className="pkgd-two-col" style={styles.highlightList}>
                      {highlights.map((h, i) => (
                        <li key={i} style={styles.highlight}>
                          <span style={styles.highlightMark} aria-hidden="true" />
                          {h}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {itinerary.length > 0 && (
                  <section className="reveal" style={styles.section} aria-labelledby="pkgd-itinerary">
                    <div style={styles.sectionHead}>
                      <h2 id="pkgd-itinerary" style={styles.sectionTitle}>{t("common.itinerary")}</h2>
                      <span style={styles.sectionMeta}>{t("packageDetail.itineraryDays", { count: itinerary.length })}</span>
                    </div>
                    <ol style={styles.timeline}>
                      {days.map((day, i) => (
                        <li key={i} className={`pkgd-day reveal-left stagger-${Math.min(i + 1, 5)}`}>
                          <span className="pkgd-stop" aria-hidden="true">{i + 1}</span>
                          <span style={styles.dayLabel}>{t("common.day", { n: i + 1 })}</span>
                          <h3 style={styles.dayTitle}>{day.title}</h3>
                          {day.points.length > 0 && (
                            <ul style={styles.dayPoints}>
                              {day.points.map((p, j) => (
                                <li key={j} className="pkgd-day-point" style={styles.dayPoint}>{p}</li>
                              ))}
                            </ul>
                          )}
                          {day.overnight && (
                            <span style={styles.dayStay}>
                              <MoonIcon /> {t("packageDetail.overnight", { place: day.overnight })}
                            </span>
                          )}
                        </li>
                      ))}
                    </ol>
                  </section>
                )}

                {inclusions.length > 0 && exclusions.length === 0 && (
                  <section className="reveal" style={styles.section} aria-labelledby="pkgd-inclusions">
                    <div style={styles.sectionHead}>
                      <h2 id="pkgd-inclusions" style={styles.sectionTitle}>{t("packageDetail.included")}</h2>
                    </div>
                    <ul className="pkgd-two-col" style={styles.inclusionList}>
                      {inclusions.map((item, i) => (
                        <li key={i} style={styles.inclusion}>
                          <span style={styles.checkDot}><CheckIcon /></span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {exclusions.length > 0 && (
                  <section className="reveal pkgd-inc-grid" style={{ ...styles.section, ...styles.incGrid }}>
                    {inclusions.length > 0 && (
                      <div>
                        <h2 style={{ ...styles.sectionTitle, marginBottom: 20 }}>{t("packageDetail.included")}</h2>
                        <ul style={styles.incList}>
                          {inclusions.map((item, i) => (
                            <li key={i} style={styles.inclusion}>
                              <span style={styles.checkDot}><CheckIcon /></span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div>
                      <h2 style={{ ...styles.sectionTitle, marginBottom: 20 }}>{t("packageDetail.notIncluded")}</h2>
                      <ul style={styles.incList}>
                        {exclusions.map((item, i) => (
                          <li key={i} style={styles.inclusion}>
                            <span style={styles.crossDot}><CrossIcon /></span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </section>
                )}

                <aside style={styles.custom} aria-labelledby="pkgd-custom">
                  <div>
                    <h2 id="pkgd-custom" style={styles.customTitle}>{t("packageDetail.customTitle")}</h2>
                    <p style={styles.customText}>{t("packageDetail.customText")}</p>
                  </div>
                  <Link href="/plan-trip" className="pkgd-custom-link" style={styles.customLink}>
                    {t("packageDetail.customCta")}
                  </Link>
                </aside>
              </div>

              <aside id={BOOKING_ANCHOR} className="pkgd-aside" style={styles.aside} aria-labelledby="pkgd-book">
                <div style={styles.bookingCard}>
                  <div className="pkgd-price-head" style={styles.priceHead}>
                    <div style={styles.priceRow}>
                      <span style={styles.priceNow}>&#8377;{formatPrice(pkg.price)}</span>
                      <span style={styles.pricePer}>{t("packageDetail.perPerson")}</span>
                    </div>
                    {pkg.priceNote && <p style={styles.priceNote}>{pkg.priceNote}</p>}
                    {pkg.minTravelers && pkg.minTravelers > 1 ? (
                      <span style={styles.priceMin}>{t("packageDetail.minTravelers", { count: pkg.minTravelers })}</span>
                    ) : null}
                    {hasDiscount && (
                      <div style={styles.priceWasRow}>
                        <span style={styles.priceWas}>
                          <span style={srOnly}>{`${t("packageDetail.wasPrice")} `}</span>
                          &#8377;{formatPrice(pkg.originalPrice)}
                        </span>
                        <span style={styles.saveBadge}>
                          {t("packageDetail.youSave", { amount: formatPrice(pkg.originalPrice! - pkg.price) })}
                          {" "}({t("common.percentOff", { percent: discountPercent(pkg.originalPrice!, pkg.price) })})
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="pkgd-booking-body" style={styles.bookingBody}>
                    <h2 id="pkgd-book" style={styles.bookingTitle}>{t("packageDetail.bookTitle")}</h2>
                    <p style={styles.bookingSub}>{t("packageDetail.bookSubtitle")}</p>
                    <BookingForm packageId={pkg.id} packageName={pkg.name} price={pkg.price} minDate={istDateKey(new Date())} minTravelers={pkg.minTravelers} />
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
                </div>
              </aside>
            </div>
          </div>
        </article>

        {others.length > 0 && (
          <section style={styles.more} aria-labelledby="pkgd-more">
            <div style={styles.moreInner}>
              <div style={styles.moreHead}>
                <h2 id="pkgd-more" style={styles.moreTitle}>{t("packageDetail.moreTitle")}</h2>
                <Link href="/packages" style={styles.moreLink}>{t("packageDetail.moreLink")}</Link>
              </div>
              <div style={styles.moreGrid}>
                {others.map((p, i) => (
                  <PackageCard key={p.id} pkg={p} index={i} />
                ))}
              </div>
            </div>
          </section>
        )}
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
