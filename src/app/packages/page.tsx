import type React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsApp from "@/components/WhatsApp";
import BackToTop from "@/components/BackToTop";
import ScrollProgress from "@/components/ScrollProgress";
import RevealObserver from "@/components/RevealObserver";
import CompareBar from "@/components/CompareBar";
import PackageExplorer from "@/components/PackageExplorer";
import { getPackages } from "@/lib/db";
import { isPublicPackage } from "@/lib/visibility";
import { getT } from "@/lib/i18n";
import type { TourPackage } from "@/lib/types";
import { formatPrice, lowestPrice, whatsappLink } from "./package-utils";

// Read per request like the other pages (F-02), so admin edits and hidden packages apply at once.
export const dynamic = "force-dynamic";

const t = getT("en");

export const metadata: Metadata = {
  title: t("packagesPage.metaTitle"),
  description: t("packagesPage.metaDescription"),
  alternates: { canonical: "/packages" },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const first = (v: string | string[] | undefined): string | undefined => (Array.isArray(v) ? v[0] : v);

async function loadPublicPackages(): Promise<TourPackage[]> {
  try {
    return (await getPackages()).filter(isPublicPackage);
  } catch (err) {
    console.error("[packages] failed to load packages:", err);
    return [];
  }
}

const styles: Record<string, React.CSSProperties> = {
  // Dark band behind the fixed, initially transparent Header.
  hero: {
    background: "linear-gradient(135deg, #1a3a6b 0%, #0a1628 100%)",
    color: "#fff",
    fontFamily: "'Poppins', sans-serif",
    padding: "136px 24px 56px",
  },
  heroInner: { maxWidth: 1200, margin: "0 auto" },
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
  title: { fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 800, lineHeight: 1.1, margin: "0 0 14px", color: "#fff" },
  sub: { fontSize: 17, lineHeight: 1.7, maxWidth: 620, color: "rgba(255,255,255,0.86)", margin: 0 },
  body: { background: "var(--bg)", fontFamily: "'Poppins', sans-serif", padding: "40px 24px 80px" },
  custom: {
    maxWidth: 1200,
    margin: "64px auto 0",
    padding: "36px 40px",
    borderRadius: 20,
    background: "var(--bg3)",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 24,
  },
  customTitle: { fontSize: 22, fontWeight: 700, color: "var(--primary)", margin: "0 0 6px" },
  customText: { fontSize: 15, lineHeight: 1.7, color: "var(--text2)", margin: 0, maxWidth: 560 },
  customActions: { display: "flex", flexWrap: "wrap", gap: 12 },
  btnPrimary: {
    display: "inline-flex",
    alignItems: "center",
    padding: "12px 26px",
    borderRadius: 12,
    background: "linear-gradient(135deg, #e67e22, #f39c12)",
    color: "var(--on-accent)",
    fontSize: 15,
    fontWeight: 600,
    textDecoration: "none",
    boxShadow: "0 4px 15px rgba(230,126,34,0.3)",
  },
  btnOutline: {
    display: "inline-flex",
    alignItems: "center",
    padding: "10px 24px",
    borderRadius: 12,
    border: "2px solid var(--primary)",
    color: "var(--primary)",
    fontSize: 15,
    fontWeight: 600,
    textDecoration: "none",
  },
};

export default async function PackagesPage({ searchParams }: Props) {
  const [packages, params] = await Promise.all([loadPublicPackages(), searchParams]);
  const from = lowestPrice(packages);

  return (
    <>
      <a href="#main-content" className="skip-link">{t("common.skipToContent")}</a>
      <ScrollProgress />
      <Header />
      <style>{`
        .pkgs-btn-outline:hover { background: var(--primary) !important; color: var(--bg) !important; }
        @media (max-width: 640px) { .pkgs-custom { padding: 28px 22px !important; } }
      `}</style>
      <main id="main-content" tabIndex={-1}>
        <header data-header-tone="dark" style={styles.hero}>
          <div style={styles.heroInner}>
            <nav aria-label={t("packageDetail.breadcrumbAria")}>
              <ol style={styles.breadcrumb}>
                <li><Link href="/" style={styles.breadcrumbLink}>{t("header.nav.home")}</Link></li>
                <li aria-hidden="true">/</li>
                <li aria-current="page">{t("header.nav.packages")}</li>
              </ol>
            </nav>
            <h1 style={styles.title}>{t("packagesPage.heading")}</h1>
            <p style={styles.sub}>
              {from === null
                ? t("packagesPage.subheadingEmpty")
                : t("packagesPage.subheading", { price: formatPrice(from) })}
            </p>
          </div>
        </header>

        <div style={styles.body}>
          <PackageExplorer
            packages={packages}
            initialQuery={first(params.q) ?? ""}
            initialCategory={first(params.category)}
            initialSort={first(params.sort)}
          />

          {packages.length > 0 && (
            <section className="pkgs-custom reveal" style={styles.custom} aria-labelledby="pkgs-custom-title">
              <div>
                <h2 id="pkgs-custom-title" style={styles.customTitle}>{t("packagesPage.customTitle")}</h2>
                <p style={styles.customText}>{t("packagesPage.customText")}</p>
              </div>
              <div style={styles.customActions}>
                <Link href="/plan-trip" style={styles.btnPrimary}>{t("packagesPage.customCta")}</Link>
                <a
                  href={whatsappLink(t("packagesPage.whatsappMessage"))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pkgs-btn-outline"
                  style={styles.btnOutline}
                >
                  {t("packagesPage.whatsappCta")}
                </a>
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
      <CompareBar />
      <WhatsApp />
      <BackToTop />
      <RevealObserver />
    </>
  );
}
