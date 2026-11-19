"use client";
import RevealWords from "@/components/RevealWords";

import React, { useEffect, useRef, useState } from "react";
import type { Offer } from "@/lib/types";
import { useT } from "@/lib/i18n/use-t";
import { formatISTDate } from "@/app/blog/_lib/format-date";

type CopyState = { id: string; ok: boolean } | null;

/**
 * G-05: active, unexpired offers. Loaded on the server (F-02) and passed in already
 * filtered by `isPublicOffer`; the home page renders this section only when non-empty.
 */
const Offers: React.FC<{ initialOffers: Offer[] }> = ({ initialOffers }) => {
  const offers = initialOffers;
  const t = useT();
  const [copied, setCopied] = useState<CopyState>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const copyCode = async (offer: Offer) => {
    if (!offer.code) return;
    let ok = false;
    try {
      await navigator.clipboard.writeText(offer.code);
      ok = true;
    } catch {
      ok = false;
    }
    setCopied({ id: offer.id, ok });
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(null), 2500);
  };

  const styles: Record<string, React.CSSProperties> = {
    section: {
      padding: "var(--section-pad) 24px",
      fontFamily: "'Poppins', sans-serif",
      background: "var(--bg3)",
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
      maxWidth: 520,
      margin: "0 auto",
    },
    grid: {
      maxWidth: 1200,
      margin: "0 auto",
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(min(300px, 100%), 1fr))",
      gap: 30,
    },
    card: {
      position: "relative",
      borderRadius: 18,
      background: "var(--card-bg)",
      boxShadow: "var(--shadow)",
      padding: "28px 24px 24px",
      display: "flex",
      flexDirection: "column",
      borderTop: "4px solid var(--orange)",
      transition: "transform 0.3s, box-shadow 0.3s",
    },
    discount: {
      alignSelf: "flex-start",
      background: "linear-gradient(135deg, #e67e22, #f39c12)",
      color: "var(--on-accent)",
      padding: "8px 16px",
      borderRadius: 12,
      fontSize: 18,
      fontWeight: 800,
      boxShadow: "0 4px 12px rgba(230,126,34,0.4)",
      marginBottom: 18,
    },
    title: {
      fontSize: 20,
      fontWeight: 700,
      color: "var(--primary)",
      marginBottom: 10,
      lineHeight: 1.35,
    },
    description: {
      fontSize: 14,
      lineHeight: 1.7,
      color: "var(--text2)",
      marginBottom: 20,
      flex: 1,
    },
    codeRow: {
      display: "flex",
      alignItems: "stretch",
      gap: 10,
      marginBottom: 8,
    },
    code: {
      flex: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      border: "2px dashed var(--orange)",
      borderRadius: 10,
      padding: "8px 12px",
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
      fontSize: 16,
      fontWeight: 700,
      letterSpacing: 2,
      color: "var(--primary)",
      background: "rgba(230,126,34,0.06)",
      userSelect: "all",
      overflowWrap: "anywhere",
    },
    copyBtn: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "10px 16px",
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
    status: {
      minHeight: 20,
      fontSize: 13,
      fontWeight: 500,
      marginBottom: 6,
    },
    validity: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      fontSize: 13,
      color: "var(--offer-muted, #6e6e6e)",
    },
  };

  return (
    <section id="offers" style={styles.section} aria-labelledby="offers-heading">
      <style>{`
        .offer-card:hover { transform: translateY(-6px); box-shadow: 0 12px 40px rgba(0,0,0,0.12) !important; }
        .offer-copy-btn:hover { transform: translateY(-2px); }
        /* Dark-mode override; light mode uses the inline fallback. */
        [data-theme="dark"] #offers { --offer-muted: var(--text2); }
      `}</style>

      <div className="reveal" style={styles.header}>
        <span style={styles.badge}>{t("offers.badge")}</span>
        <h2 id="offers-heading" className="heading-line" style={styles.heading}><RevealWords text={t("offers.heading")} /></h2>
        <p style={styles.subheading}>
          {t("offers.subheading")}
        </p>
      </div>

      <div style={styles.grid}>
        {offers.map((offer, i) => {
          const validTo = offer.validTo ? formatISTDate(offer.validTo) : "";
          const state = copied?.id === offer.id ? copied : null;
          return (
            <article
              key={offer.id}
              className={`offer-card reveal stagger-${(i % 3) + 1}`}
              style={styles.card}
            >
              {offer.discount > 0 && <div style={styles.discount}>{t("common.percentOff", { percent: offer.discount })}</div>}
              <h3 style={styles.title}>{offer.title}</h3>
              {offer.description && <p style={styles.description}>{offer.description}</p>}

              {offer.code && (
                <>
                  <div style={styles.codeRow}>
                    <span style={styles.code}>{offer.code}</span>
                    <button
                      type="button"
                      className="offer-copy-btn"
                      style={styles.copyBtn}
                      onClick={() => copyCode(offer)}
                      aria-label={t("offers.copyAria", { code: offer.code })}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="9" y="9" width="13" height="13" rx="2" />
                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                      </svg>
                      {t("offers.copy")}
                    </button>
                  </div>
                  <div
                    role="status"
                    aria-live="polite"
                    style={{ ...styles.status, color: state && !state.ok ? "var(--error-text)" : "var(--success-text)" }}
                  >
                    {state ? (state.ok ? t("offers.copied", { code: offer.code }) : t("offers.copyFailed")) : ""}
                  </div>
                </>
              )}

              {validTo && (
                <p style={styles.validity}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M16 2v4M8 2v4M3 10h18" />
                  </svg>
                  {t("offers.validTill")} <time dateTime={offer.validTo}>{validTo}</time>
                </p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default Offers;
