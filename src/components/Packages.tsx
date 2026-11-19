"use client";

import React, { useState } from "react";
import Link from "next/link";
import PackageCard, { PACKAGE_CARD_CSS } from "@/components/PackageCard";
import type { TourPackage } from "@/lib/types";
import { useApp } from "@/lib/context";
import { useT } from "@/lib/i18n/use-t";
import {
  categoryLabel,
  filterByCategory,
  packageCategories,
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
    showAllBtn: {
      color: "var(--orange-text)",
      fontSize: 15,
      fontWeight: 600,
      background: "none",
      border: "none",
      padding: 0,
      cursor: "pointer",
      fontFamily: "inherit",
    },
    grid: {
      maxWidth: 1200,
      margin: "0 auto",
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
      gap: 30,
    },
    allWrap: { textAlign: "center", marginTop: 44 },
    allLink: {
      display: "inline-flex",
      alignItems: "center",
      padding: "12px 28px",
      border: "2px solid var(--primary)",
      borderRadius: 12,
      color: "var(--primary)",
      fontSize: 15,
      fontWeight: 600,
      textDecoration: "none",
      transition: "all 0.3s",
    },
  };

  return (
    <section id="packages" style={styles.section}>
      <style>{`
        ${PACKAGE_CARD_CSS}
        .pkg-filter:hover { border-color: var(--orange) !important; color: var(--orange-text) !important; }
        .pkg-all:hover { background: var(--primary) !important; color: var(--bg) !important; }
        /* E-02: dark-mode overrides. Light mode uses the inline fallbacks (colours unchanged). */
        [data-theme="dark"] #packages {
          --pkg-chip-border: rgba(91,143,217,0.35);
        }
        @media (max-width: 768px) {
          .pkg-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div className="reveal" style={styles.header}>
        <span style={styles.badge}>{t("packages.badge")}</span>
        <h2 className="gradient-text heading-line" style={{ ...styles.heading, WebkitTextFillColor: undefined }}>{t("packages.heading")}</h2>
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
          <button type="button" onClick={() => setCategory("all")} style={styles.showAllBtn}>
            {t("packages.showAll")}
          </button>
        </p>
      )}

      <div className="pkg-grid" style={styles.grid}>
        {visiblePackages.map((pkg) => (
          // Stagger comes from the package's position in the full list, so a card's className never
          // changes when the filter changes (React would otherwise drop the observer-added `active`).
          <PackageCard key={pkg.id} pkg={pkg} index={packages.indexOf(pkg)} />
        ))}
      </div>

      {packages.length > 0 && (
        <div style={styles.allWrap}>
          <Link href="/packages" className="pkg-all" style={styles.allLink}>
            {t("packages.viewAll")}
          </Link>
        </div>
      )}
    </section>
  );
};

export default Packages;
