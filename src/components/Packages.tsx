"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import type { TourPackage } from "@/lib/types";
import { useApp } from "@/lib/context";
import { useT } from "@/lib/i18n/use-t";
import {
  categoryLabel,
  filterByCategory,
  formatPrice,
  packageCategories,
  packageEnquiryText,
  packagePath,
  stripDayPrefix,
  whatsappLink,
  type CategoryFilter,
} from "@/app/packages/package-utils";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Packages are loaded on the server (F-02) and passed in already filtered for public visibility. */
const Packages: React.FC<{ initialPackages: TourPackage[] }> = ({ initialPackages }) => {
  const packages = initialPackages;
  const { lang } = useApp();
  const t = useT();
  // G-06: category filter. Chips only render when the visible packages span 2+ categories.
  const categories = packageCategories(packages);
  const [category, setCategory] = useState<CategoryFilter>("all");
  const visiblePackages = filterByCategory(packages, category);
  const [selectedPkg, setSelectedPkg] = useState<TourPackage | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const isModalOpen = selectedPkg !== null;

  // Dialog behaviour: focus close button on open, Esc closes, Tab is trapped, focus returns to the trigger on close.
  useEffect(() => {
    if (!isModalOpen) return;
    closeBtnRef.current?.focus({ preventScroll: true });
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedPkg(null);
        return;
      }
      const root = modalRef.current;
      if (e.key !== "Tab" || !root) return;
      const nodes = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (nodes.length === 0) {
        e.preventDefault();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !root.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !root.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      triggerRef.current?.focus({ preventScroll: true });
      triggerRef.current = null;
    };
  }, [isModalOpen]);

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
    modalOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      background: "rgba(0,0,0,0.6)",
      zIndex: 2000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    },
    modal: {
      background: "var(--card-bg)",
      borderRadius: 20,
      maxWidth: 700,
      width: "100%",
      maxHeight: "85vh",
      overflow: "auto",
      padding: 0,
      position: "relative",
    },
    modalHeader: {
      position: "relative",
      height: 260,
      overflow: "hidden",
    },
    modalClose: {
      position: "absolute",
      top: 16,
      right: 16,
      width: 40,
      height: 40,
      borderRadius: "50%",
      background: "rgba(0,0,0,0.5)",
      border: "none",
      color: "#fff",
      fontSize: 20,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 3,
    },
    modalBody: {
      padding: "28px 32px",
    },
    modalTitle: {
      fontSize: 26,
      fontWeight: 800,
      color: "var(--primary)",
      marginBottom: 8,
    },
    modalMeta: {
      display: "flex",
      gap: 20,
      marginBottom: 20,
      fontSize: 14,
      color: "var(--pkg-muted, #6e6e6e)",
    },
    modalDesc: {
      fontSize: 15,
      lineHeight: 1.8,
      color: "var(--text2)",
      marginBottom: 24,
    },
    itineraryDay: {
      padding: "16px 0",
      borderBottom: "1px solid var(--pkg-divider, #eee)",
    },
    dayNum: {
      display: "inline-block",
      background: "linear-gradient(135deg, #e67e22, #f39c12)",
      color: "var(--on-accent)",
      padding: "3px 12px",
      borderRadius: 6,
      fontSize: 12,
      fontWeight: 700,
      marginRight: 10,
    },
    dayTitle: {
      fontSize: 15,
      fontWeight: 600,
      color: "var(--primary)",
    },
    dayDesc: {
      fontSize: 14,
      color: "var(--text2)",
      marginTop: 6,
      lineHeight: 1.6,
    },
    inclusionList: {
      listStyle: "none",
      padding: 0,
      margin: 0,
    },
    inclusionItem: {
      padding: "6px 0",
      fontSize: 14,
      color: "var(--text2)",
      display: "flex",
      alignItems: "center",
      gap: 8,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 700,
      color: "var(--primary)",
      marginBottom: 12,
      marginTop: 24,
    },
  };

  return (
    <section id="packages" style={styles.section}>
      <style>{`
        .pkg-card:hover { transform: translateY(-8px); box-shadow: 0 16px 50px rgba(0,0,0,0.12) !important; }
        .pkg-btn:hover { transform: translateY(-2px); }
        .pkg-filter:hover { border-color: var(--orange) !important; color: var(--orange-text) !important; }
        .pkg-details-link:hover { text-decoration: underline; }
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
              <Image
                src={pkg.image || "/images/placeholder.jpg"}
                alt={pkg.name}
                fill
                style={{ objectFit: "cover" }}
              />
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
              <h3 style={styles.cardTitle}>{pkg.name}</h3>
              <ul style={styles.highlightsList}>
                {(pkg.highlights || []).slice(0, 4).map((h, i) => (
                  <li key={i} style={styles.highlightItem}>{h}</li>
                ))}
              </ul>
              <Link
                href={packagePath(pkg.id)}
                className="pkg-details-link"
                style={styles.detailsLink}
                aria-label={t("packages.detailsLinkAria", { name: pkg.name })}
              >
                {t("packages.detailsLink")}
              </Link>
              <div style={styles.cardActions}>
                <button
                  className="pkg-btn"
                  style={styles.btnView}
                  onClick={(e) => {
                    triggerRef.current = e.currentTarget;
                    setSelectedPkg(pkg);
                  }}
                >
                  {t("packages.viewDetails")}
                </button>
                <a
                  className="pkg-btn"
                  href={whatsappLink(packageEnquiryText(pkg.name, lang))}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ ...styles.btnBook, textDecoration: "none", textAlign: "center" }}
                >
                  {t("packages.bookNow")}
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedPkg && (
        <div style={styles.modalOverlay} onClick={() => setSelectedPkg(null)}>
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-label={selectedPkg.name}
            style={styles.modal}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={styles.modalHeader}>
              <Image
                src={selectedPkg.image || "/images/placeholder.jpg"}
                alt={selectedPkg.name}
                fill
                style={{ objectFit: "cover" }}
              />
              <button
                ref={closeBtnRef}
                style={styles.modalClose}
                aria-label={t("packages.closeDetailsAria")}
                onClick={() => setSelectedPkg(null)}
              >
                &#10005;
              </button>
            </div>
            <div style={styles.modalBody}>
              <h2 style={styles.modalTitle}>{selectedPkg.name}</h2>
              <div style={styles.modalMeta}>
                <span>{selectedPkg.duration}</span>
                <span>{selectedPkg.destination}</span>
                <span style={{ color: "var(--orange-text)", fontWeight: 700 }}>
                  &#8377;{formatPrice(selectedPkg.price)}
                </span>
              </div>
              {selectedPkg.description && (
                <p style={styles.modalDesc}>{selectedPkg.description}</p>
              )}

              {selectedPkg.itinerary && selectedPkg.itinerary.length > 0 && (
                <>
                  <h3 style={styles.sectionTitle}>{t("common.itinerary")}</h3>
                  {selectedPkg.itinerary.map((line, i) => (
                    <div key={i} style={styles.itineraryDay}>
                      <span style={styles.dayNum}>{t("common.day", { n: i + 1 })}</span>
                      <span style={styles.dayTitle}>{stripDayPrefix(line)}</span>
                    </div>
                  ))}
                </>
              )}

              {selectedPkg.inclusions && selectedPkg.inclusions.length > 0 && (
                <>
                  <h3 style={styles.sectionTitle}>{t("common.inclusions")}</h3>
                  <ul style={styles.inclusionList}>
                    {selectedPkg.inclusions.map((item, i) => (
                      <li key={i} style={styles.inclusionItem}>
                        <span style={{ color: "#27ae60" }}>&#10003;</span> {item}
                      </li>
                    ))}
                  </ul>
                </>
              )}

              <Link
                href={packagePath(selectedPkg.id)}
                className="pkg-btn"
                style={{ ...styles.btnBook, display: "block", textAlign: "center", padding: "12px 0", marginTop: 28 }}
              >
                {t("packages.viewFullDetails")}
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Packages;
