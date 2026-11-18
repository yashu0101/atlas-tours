"use client";

import React, { useState } from "react";
import SmartImage from "@/components/SmartImage";
import { CompareToggle, SaveToggle } from "@/components/PackageToggles";
import Link from "next/link";
import type { TourPackage } from "@/lib/types";
import { useApp } from "@/lib/context";
import { useT } from "@/lib/i18n/use-t";
import {
  categoryLabel,
  filterByCategory,
  formatPrice,
  packageCategories,
  packageBookingPath,
  packagePath,
  type CategoryFilter,
} from "@/app/packages/package-utils";

/** Packages are loaded on the server (F-02) and passed in already filtered for public visibility. */
const Packages: React.FC<{ initialPackages: TourPackage[] }> = ({ initialPackages }) => {
  const packages = initialPackages;
  const { lang } = useApp();
  const t = useT();
  // G-06: category filter. Chips only render when the visible packages span 2+ categories.
  const categories = packageCategories(packages);
  const [category, setCategory] = useState<CategoryFilter>("all");
  const visiblePackages = filterByCategory(packages, category);

  const discount = (orig: number, curr: number) =>
    Math.round(((orig - curr) / orig) * 100);

  const styles: Record<string, React.CSSProperties> = {
    section: {
      padding: "100px 24px",
      fontFamily: "'Poppins', sans-serif",
      background: "var(--bg)",
    },
    header: {
      textAlign: "center",
      marginBottom: 50,
    },
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
    heading: {
      fontSize: "clamp(28px, 4vw, 40px)",
      fontWeight: 800,
      color: "var(--primary)",
      marginBottom: 12,
    },
    subheading: {
      fontSize: 16,
      color: "var(--text2)",
      maxWidth: 550,
      margin: "0 auto",
    },
    filterBar: {
      maxWidth: 1200,
      margin: "0 auto 36px",
      display: "flex",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: 10,
    },
    filterChip: {
      padding: "8px 20px",
      borderRadius: 20,
      border: "2px solid var(--pkg-chip-border, rgba(26,58,107,0.15))",
      background: "transparent",
      color: "var(--primary)",
      fontSize: 14,
      fontWeight: 600,
      cursor: "pointer",
      fontFamily: "'Poppins', sans-serif",
      transition: "all 0.3s",
    },
    filterChipActive: {
      border: "2px solid transparent",
      background: "linear-gradient(135deg, #e67e22, #f39c12)",
      color: "var(--on-accent)",
      boxShadow: "0 4px 15px rgba(230,126,34,0.3)",
    },
    emptyState: {
      maxWidth: 1200,
      margin: "0 auto",
      textAlign: "center",
      padding: "40px 24px",
      color: "var(--text2)",
      fontSize: 15,
    },
    detailsLink: {
      alignSelf: "flex-start",
      marginBottom: 14,
      color: "var(--orange-text)",
      fontSize: 13,
      fontWeight: 600,
    },
    // N-7: details link + Compare toggle on one row; keeps the link's 14px gap above the buttons.
    detailsRow: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 14,
    },
    grid: {
      maxWidth: 1200,
      margin: "0 auto",
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(340, 1fr))",
      gap: 30,
    },
    card: {
      borderRadius: 18,
      overflow: "hidden",
      background: "var(--card-bg)",
      boxShadow: "var(--shadow)",
      transition: "transform 0.3s, box-shadow 0.3s",
      display: "flex",
      flexDirection: "column",
    },
    cardImgWrap: {
      position: "relative",
      height: 220,
      overflow: "hidden",
    },
    cardImgLink: {
      position: "absolute",
      inset: 0,
      display: "block",
    },
    cardTitleLink: {
      color: "inherit",
      textDecoration: "none",
    },
    btnLink: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      textDecoration: "none",
      boxSizing: "border-box",
    },
    priceBadge: {
      position: "absolute",
      top: 16,
      right: 16,
      background: "linear-gradient(135deg, #e67e22, #f39c12)",
      color: "var(--on-accent)",
      padding: "8px 16px",
      borderRadius: 12,
      fontSize: 14,
      fontWeight: 700,
      zIndex: 2,
      boxShadow: "0 4px 12px rgba(230,126,34,0.4)",
      pointerEvents: "none",
    },
    discountBadge: {
      position: "absolute",
      top: 16,
      left: 16,
      background: "#1e874a",
      color: "#fff",
      padding: "4px 12px",
      borderRadius: 8,
      fontSize: 12,
      fontWeight: 700,
      zIndex: 2,
      pointerEvents: "none",
    },
    cardBody: {
      padding: "20px 24px",
      flex: 1,
      display: "flex",
      flexDirection: "column",
    },
    cardMeta: {
      display: "flex",
      gap: 16,
      marginBottom: 12,
      fontSize: 13,
      color: "var(--pkg-muted, #6e6e6e)",
    },
    metaItem: {
      display: "flex",
      alignItems: "center",
      gap: 4,
    },
    cardTitle: {
      fontSize: 20,
      fontWeight: 700,
      color: "var(--primary)",
      marginBottom: 10,
    },
    highlightsList: {
      listStyle: "none",
      padding: 0,
      margin: "0 0 20px",
      display: "flex",
      flexWrap: "wrap",
      gap: 6,
    },
    highlightItem: {
      background: "var(--pkg-chip-bg, rgba(26,58,107,0.06))",
      color: "var(--primary)",
      padding: "4px 12px",
      borderRadius: 6,
      fontSize: 12,
      fontWeight: 500,
    },
    cardActions: {
      display: "flex",
      gap: 10,
      marginTop: "auto",
    },
    btnView: {
      flex: 1,
      padding: "10px 0",
      border: "2px solid var(--primary)",
      borderRadius: 10,
      background: "transparent",
      color: "var(--primary)",
      fontSize: 14,
      fontWeight: 600,
      cursor: "pointer",
      fontFamily: "'Poppins', sans-serif",
      transition: "all 0.3s",
    },
    btnBook: {
      flex: 1,
      padding: "10px 0",
      border: "none",
      borderRadius: 10,
      background: "linear-gradient(135deg, #e67e22, #f39c12)",
      color: "var(--on-accent)",
      fontSize: 14,
      fontWeight: 600,
      cursor: "pointer",
      fontFamily: "'Poppins', sans-serif",
      boxShadow: "0 4px 15px rgba(230,126,34,0.3)",
      transition: "all 0.3s",
    },
    originalPrice: {
      textDecoration: "line-through",
      color: "rgba(10,22,40,0.8)",
      fontSize: 11,
      marginTop: 2,
    },
  };

  return (
    <section id="packages" style={styles.section}>
      <style>{`
        .pkg-card:hover { transform: translateY(-8px); box-shadow: 0 16px 50px rgba(0,0,0,0.12) !important; }
        .pkg-btn:hover { transform: translateY(-2px); }
        .pkg-filter:hover { border-color: var(--orange) !important; color: var(--orange-text) !important; }
        .pkg-details-link:hover, .pkg-title-link:hover { text-decoration: underline; }
        /* E-02: dark-mode overrides. Light mode uses the inline fallbacks (colours unchanged). */
        [data-theme="dark"] #packages {
          --pkg-muted: var(--text2);
          --pkg-chip-bg: rgba(91,143,217,0.12);
          --pkg-divider: var(--bg3);
          --pkg-chip-border: rgba(91,143,217,0.35);
        }
        @media (max-width: 768px) {
          .pkg-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div className="reveal" style={styles.header}>
        <span style={styles.badge}>{t("packages.badge")}</span>
        <h2 className="gradient-text" style={{ ...styles.heading, WebkitTextFillColor: undefined }}>{t("packages.heading")}</h2>
        <p style={styles.subheading}>
          {t("packages.subheading")}
        </p>
      </div>

      {categories.length > 1 && (
        <div role="group" aria-label={t("packages.filterAria")} style={styles.filterBar}>
          {(["all", ...categories] as CategoryFilter[]).map((c) => {
            const active = category === c;
            return (
              <button
                key={c}
                type="button"
                className={active ? undefined : "pkg-filter"}
                aria-pressed={active}
                style={{ ...styles.filterChip, ...(active ? styles.filterChipActive : {}) }}
                onClick={() => setCategory(c)}
              >
                {c === "all" ? t("common.all") : categoryLabel(c, lang)}
              </button>
            );
          })}
        </div>
      )}

      {packages.length > 0 && visiblePackages.length === 0 && (
        <p role="status" style={styles.emptyState}>
          {t("packages.empty")}{" "}
          <button
            type="button"
            onClick={() => setCategory("all")}
            style={{ ...styles.detailsLink, background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "inherit", fontSize: 15 }}
          >
            {t("packages.showAll")}
          </button>
        </p>
      )}

      <div className="pkg-grid" style={{ ...styles.grid, gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))" }}>
        {visiblePackages.map((pkg) => (
          // Stagger comes from the package's position in the full list, so a card's className never
          // changes when the filter changes (React would otherwise drop the observer-added `active`).
          <div key={pkg.id} className={`pkg-card card-hover reveal stagger-${(packages.indexOf(pkg) % 3) + 1}`} style={styles.card}>
            <div className="img-zoom" style={styles.cardImgWrap}>
              {/* Whole image opens the detail page; mouse-only duplicate of the title link, so hidden from AT/Tab. */}
              <Link href={packagePath(pkg.id)} tabIndex={-1} aria-hidden="true" style={styles.cardImgLink}>
                  <SmartImage
                  src={pkg.image || "/images/placeholder.jpg"}
                  alt={pkg.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 380px"
                  style={{ objectFit: "cover" }}
                />
              </Link>
              <SaveToggle id={pkg.id} name={pkg.name} />
              <div style={styles.priceBadge}>
                <div>&#8377;{formatPrice(pkg.price)}</div>
                {pkg.originalPrice && (
                  <div style={styles.originalPrice}>
                    &#8377;{formatPrice(pkg.originalPrice)}
                  </div>
                )}
              </div>
              {pkg.originalPrice && (
                <div style={styles.discountBadge}>
                  {t("common.percentOff", { percent: discount(pkg.originalPrice, pkg.price) })}
                </div>
              )}
            </div>

            <div style={styles.cardBody}>
              <div style={styles.cardMeta}>
                <span style={styles.metaItem}>{pkg.duration}</span>
                <span style={styles.metaItem}>{pkg.destination}</span>
              </div>
              <h3 style={styles.cardTitle}>
                <Link href={packagePath(pkg.id)} className="pkg-title-link" style={styles.cardTitleLink}>{pkg.name}</Link>
              </h3>
              <ul style={styles.highlightsList}>
                {(pkg.highlights || []).slice(0, 4).map((h, i) => (
                  <li key={i} style={styles.highlightItem}>{h}</li>
                ))}
              </ul>
              <div style={styles.detailsRow}>
                <Link
                  href={packagePath(pkg.id)}
                  className="pkg-details-link"
                  style={{ ...styles.detailsLink, marginBottom: 0 }}
                  aria-label={t("packages.detailsLinkAria", { name: pkg.name })}
                >
                  {t("packages.detailsLink")}
                </Link>
                <CompareToggle id={pkg.id} name={pkg.name} />
              </div>
              <div style={styles.cardActions}>
                <Link
                  href={packagePath(pkg.id)}
                  className="pkg-btn"
                  style={{ ...styles.btnView, ...styles.btnLink }}
                  aria-label={t("packages.viewDetailsAria", { name: pkg.name })}
                >
                  {t("packages.viewDetails")}
                </Link>
                <Link
                  href={packageBookingPath(pkg.id)}
                  className="pkg-btn"
                  style={{ ...styles.btnBook, ...styles.btnLink }}
                  aria-label={t("packages.bookNowAria", { name: pkg.name })}
                >
                  {t("packages.bookNow")}
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

    </section>
  );
};

export default Packages;
