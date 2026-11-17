import React from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsApp from "@/components/WhatsApp";
import BackToTop from "@/components/BackToTop";
import ScrollProgress from "@/components/ScrollProgress";
import RevealObserver from "@/components/RevealObserver";
import { getT } from "@/lib/i18n";

// Server-rendered in English; the language toggle only exists client-side (G-08).
const t = getT("en");

const styles: Record<string, React.CSSProperties> = {
  hero: {
    background: "linear-gradient(135deg, #1a3a6b 0%, #0f2548 100%)",
    color: "#fff",
    fontFamily: "'Poppins', sans-serif",
  },
  heroInner: { maxWidth: 760, margin: "0 auto", padding: "140px 24px 48px" },
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
  title: { fontSize: "clamp(28px, 4.5vw, 42px)", fontWeight: 800, lineHeight: 1.2, marginBottom: 12, color: "#fff" },
  subtitle: { fontSize: 16, lineHeight: 1.7, color: "rgba(255,255,255,0.85)", maxWidth: 620 },
  body: { padding: "48px 24px 100px", background: "var(--bg)", fontFamily: "'Poppins', sans-serif" },
  card: {
    maxWidth: 760,
    margin: "0 auto",
    background: "var(--card-bg)",
    borderRadius: 20,
    padding: "32px 36px",
    boxShadow: "var(--shadow)",
  },
};

/**
 * Shared chrome for the public form pages (N-4 /track, N-5 /reviews/new, N-6 /plan-trip):
 * the same Header/Footer/WhatsApp/BackToTop/ScrollProgress/RevealObserver as the package
 * detail page, a navy title band with a breadcrumb, and one card for the form.
 */
export default function FormPageShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <a href="#main-content" className="skip-link">{t("common.skipToContent")}</a>
      <ScrollProgress />
      <Header />
      <style>{`
        @media (max-width: 560px) {
          .form-page-card { padding: 24px 20px !important; }
        }
      `}</style>
      <main id="main-content" tabIndex={-1}>
        <header style={styles.hero}>
          <div style={styles.heroInner}>
            <nav aria-label={t("packageDetail.breadcrumbAria")}>
              <ol style={styles.breadcrumb}>
                <li><Link href="/" style={styles.breadcrumbLink}>{t("header.nav.home")}</Link></li>
                <li aria-hidden="true">/</li>
                <li aria-current="page">{title}</li>
              </ol>
            </nav>
            <h1 style={styles.title}>{title}</h1>
            <p style={styles.subtitle}>{subtitle}</p>
          </div>
        </header>
        <div style={styles.body}>
          <div className="form-page-card" style={styles.card}>{children}</div>
        </div>
      </main>
      <Footer />
      <WhatsApp />
      <BackToTop />
      <RevealObserver />
    </>
  );
}
