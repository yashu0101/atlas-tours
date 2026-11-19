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

/** Highlights shown on a card; the rest are summarised as "+N more". */
const MAX_HIGHLIGHTS = 3;

type IconProps = { style?: React.CSSProperties };
const iconProps = {
  width: 16,
  height: 16,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};
const ClockIcon = ({ style }: IconProps) => (
  <svg {...iconProps} style={style}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
);
const PinIcon = ({ style }: IconProps) => (
  <svg {...iconProps} style={style}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
);
const CheckIcon = ({ style }: IconProps) => (
  <svg {...iconProps} strokeWidth={2.5} style={style}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
);

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
    discountBadge: {
      position: "absolute",
      top: 14,
      left: 14,
      background: "#1e874a",
      color: "#fff",
      padding: "5px 12px",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 700,
      zIndex: 2,
      pointerEvents: "none",
      boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
    },
    categoryTag: {
      position: "absolute",
      bottom: 14,
      left: 14,
      background: "rgba(15,37,72,0.78)",
      color: "#fff",
      padding: "5px 12px",
      borderRadius: 999,
      fontSize: 12,
      fontWeight: 600,
      zIndex: 2,
      pointerEvents: "none",
      backdropFilter: "blur(6px)",
    },
    cardBody: {
      padding: "20px 22px 22px",
      flex: 1,
      display: "flex",
      flexDirection: "column",
    },
    cardTitle: {
      fontSize: 19,
      fontWeight: 700,
      lineHeight: 1.3,
      color: "var(--primary)",
      margin: "0 0 12px",
    },
    facts: {
      listStyle: "none",
      padding: 0,
      margin: "0 0 14px",
      display: "grid",
      gap: 6,
      fontSize: 13.5,
      color: "var(--pkg-muted, #5f6b6d)",
    },
    fact: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      minWidth: 0,
    },
    factIcon: {
      flexShrink: 0,
      color: "var(--orange-text)",
    },
    factText: {
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
    highlightsList: {
      listStyle: "none",
      padding: 0,
      margin: "0 0 18px",
      display: "grid",
      gap: 6,
      fontSize: 13.5,
      color: "var(--text)",
    },
    highlightMore: {
      fontSize: 12.5,
      fontWeight: 600,
      color: "var(--pkg-muted, #5f6b6d)",
      paddingLeft: 24,
    },
    cardFooter: {
      marginTop: "auto",
      borderTop: "1px dashed var(--pkg-divider, rgba(26,58,107,0.18))",
      paddingTop: 16,
    },
    priceRow: {
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "space-between",
      gap: 12,
      marginBottom: 16,
    },
    wasRow: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 2,
      flexWrap: "wrap",
    },
    wasPrice: {
      fontSize: 13,
      color: "var(--pkg-muted, #5f6b6d)",
      textDecoration: "line-through",
    },
    savePill: {
      fontSize: 11.5,
      fontWeight: 700,
      color: "var(--pkg-save-text, #17693a)",
      background: "var(--pkg-save-bg, rgba(30,135,74,0.12))",
      padding: "2px 8px",
      borderRadius: 999,
    },
    nowPrice: {
      fontSize: 26,
      fontWeight: 800,
      lineHeight: 1.1,
      color: "var(--primary)",
      letterSpacing: -0.5,
    },
    perPerson: {
      fontSize: 13,
      fontWeight: 500,
      color: "var(--pkg-muted, #5f6b6d)",
      marginLeft: 4,
    },
    srOnly: {
      position: "absolute",
      width: 1,
      height: 1,
      padding: 0,
      margin: -1,
      overflow: "hidden",
      clip: "rect(0,0,0,0)",
      whiteSpace: "nowrap",
      border: 0,
    },
    cardActions: {
      display: "flex",
      gap: 10,
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
  };

  return (
    <section id="packages" style={styles.section}>
      <style>{`
        .pkg-card:hover { transform: translateY(-8px); box-shadow: 0 16px 50px rgba(0,0,0,0.12) !important; }
        .pkg-btn:hover { transform: translateY(-2px); }
        .pkg-filter:hover { border-color: var(--orange) !important; color: var(--orange-text) !important; }
        .pkg-title-link:hover { text-decoration: underline; }
        /* E-02: dark-mode overrides. Light mode uses the inline fallbacks (colours unchanged). */
        [data-theme="dark"] #packages {
          --pkg-muted: var(--text2);
          --pkg-chip-bg: rgba(91,143,217,0.12);
          --pkg-divider: rgba(148,163,184,0.3);
          --pkg-chip-border: rgba(91,143,217,0.35);
          --pkg-save-bg: rgba(39,176,97,0.16);
          --pkg-save-text: var(--success-text);
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
              {pkg.originalPrice && pkg.originalPrice > pkg.price && (
                <div style={styles.discountBadge}>
                  {t("common.percentOff", { percent: discount(pkg.originalPrice, pkg.price) })}
                </div>
              )}
              {pkg.category && <div style={styles.categoryTag}>{categoryLabel(pkg.category, lang)}</div>}
            </div>

            <div style={styles.cardBody}>
              <h3 style={styles.cardTitle}>
                <Link href={packagePath(pkg.id)} className="pkg-title-link" style={styles.cardTitleLink}>{pkg.name}</Link>
              </h3>
              <ul style={styles.facts}>
                <li style={styles.fact}>
                  <ClockIcon style={styles.factIcon} />
                  <span style={styles.factText}>{pkg.duration}</span>
                </li>
                <li style={styles.fact} title={pkg.destination}>
                  <PinIcon style={styles.factIcon} />
                  <span style={styles.factText}>{pkg.destination}</span>
                </li>
              </ul>
              {(pkg.highlights || []).length > 0 && (
                <ul style={styles.highlightsList}>
                  {pkg.highlights.slice(0, MAX_HIGHLIGHTS).map((h, i) => (
                    <li key={i} style={styles.fact} title={h}>
                      <CheckIcon style={styles.factIcon} />
                      <span style={styles.factText}>{h}</span>
                    </li>
                  ))}
                  {pkg.highlights.length > MAX_HIGHLIGHTS && (
                    <li style={styles.highlightMore}>
                      {t("packages.moreHighlights", { count: pkg.highlights.length - MAX_HIGHLIGHTS })}
                    </li>
                  )}
                </ul>
              )}

              <div style={styles.cardFooter}>
                <div style={styles.priceRow}>
                  <div>
                    {pkg.originalPrice && pkg.originalPrice > pkg.price && (
                      <div style={styles.wasRow}>
                        <span style={styles.wasPrice}>
                          <span style={styles.srOnly}>{t("packageDetail.wasPrice")} </span>
                          &#8377;{formatPrice(pkg.originalPrice)}
                        </span>
                        <span style={styles.savePill}>
                          {t("packages.save", { amount: formatPrice(pkg.originalPrice - pkg.price) })}
                        </span>
                      </div>
                    )}
                    <div style={styles.nowPrice}>
                      &#8377;{formatPrice(pkg.price)}
                      <span style={styles.perPerson}>{t("packages.perPerson")}</span>
                    </div>
                  </div>
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
          </div>
        ))}
      </div>

    </section>
  );
};

export default Packages;
