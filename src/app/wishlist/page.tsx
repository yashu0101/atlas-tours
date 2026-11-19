import type React from "react";
import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsApp from "@/components/WhatsApp";
import BackToTop from "@/components/BackToTop";
import ScrollProgress from "@/components/ScrollProgress";
import RevealObserver from "@/components/RevealObserver";
import CompareBar from "@/components/CompareBar";
import WishlistList from "@/components/WishlistList";
import { getPackages } from "@/lib/db";
import { isPublicPackage } from "@/lib/visibility";
import { getT } from "@/lib/i18n";
import type { TourPackage } from "@/lib/types";

// The saved ids live in the visitor's localStorage; the server sends every public package
// and the client picks the saved ones (N-7). Read per request like the other pages (F-02).
export const dynamic = "force-dynamic";

const t = getT("en");

export const metadata: Metadata = {
  title: t("wishlist.metaTitle"),
  description: t("wishlist.metaDescription"),
  robots: { index: false, follow: true },
  alternates: { canonical: "/wishlist" },
};

const styles: Record<string, React.CSSProperties> = {
  // Dark band behind the fixed, initially transparent Header (same as /blog/[id]).
  heroBand: { height: 120, background: "linear-gradient(135deg, #1a3a6b 0%, #0a1628 100%)" },
  page: { background: "var(--bg)", fontFamily: "'Poppins', sans-serif", padding: "48px 24px 100px" },
  header: { textAlign: "center", marginBottom: 40 },
  badge: {
    display: "inline-block",
    background: "rgba(230,126,34,0.1)",
    color: "var(--orange-text)",
    padding: "6px 18px",
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  heading: { fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 800, color: "var(--primary)", marginBottom: 12 },
  subheading: { fontSize: 16, color: "var(--text2)", maxWidth: 550, margin: "0 auto" },
};

async function loadPublicPackages(): Promise<TourPackage[]> {
  try {
    return (await getPackages()).filter(isPublicPackage);
  } catch (err) {
    console.error("[wishlist] failed to load packages:", err);
    return [];
  }
}

export default async function WishlistPage() {
  const packages = await loadPublicPackages();
  return (
    <>
      <a href="#main-content" className="skip-link">{t("common.skipToContent")}</a>
      <ScrollProgress />
      <Header />
      <div data-header-tone="dark" style={styles.heroBand} aria-hidden="true" />
      <main id="main-content" tabIndex={-1} style={styles.page}>
        <div style={styles.header}>
          <span style={styles.badge}>{t("wishlist.badge")}</span>
          <h1 style={styles.heading}>{t("wishlist.heading")}</h1>
          <p style={styles.subheading}>{t("wishlist.subheading")}</p>
        </div>
        <WishlistList packages={packages} />
      </main>
      <Footer />
      <CompareBar showSavedLink={false} />
      <WhatsApp />
      <BackToTop />
      <RevealObserver />
    </>
  );
}
