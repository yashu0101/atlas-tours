"use client";

import React from "react";
import Link from "next/link";
import { useT } from "@/lib/i18n/use-t";
import { COMPARE_MAX, comparePath, useCompare, useWishlist } from "@/lib/wishlist";

/**
 * N-7: floating bar with "Compare (n/3)" → /compare?ids=…, Clear, and a link to the saved
 * packages. Renders nothing until something is selected or saved (and nothing on the server,
 * since the stored lists are empty there).
 *
 * Placement: bottom-left, leaving the right 100px free for the WhatsApp FAB (right 24, 60px wide)
 * and BackToTop (right 28, bottom 96). z-index sits below both (900 / 899) and below modals.
 */
const CompareBar: React.FC<{ showSavedLink?: boolean }> = ({ showSavedLink = true }) => {
  const t = useT();
  const compare = useCompare();
  const wishlist = useWishlist();
  const n = compare.ids.length;
  const saved = showSavedLink ? wishlist.ids.length : 0;
  if (n === 0 && saved === 0) return null;

  const styles: Record<string, React.CSSProperties> = {
    dock: {
      position: "fixed",
      left: 16,
      right: 100,
      bottom: 24,
      zIndex: 898,
      display: "flex",
      justifyContent: "center",
      pointerEvents: "none",
      fontFamily: "'Poppins', sans-serif",
    },
    bar: {
      pointerEvents: "auto",
      display: "flex",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 8,
      padding: 8,
      borderRadius: 30,
      background: "var(--card-bg)",
      boxShadow: "0 8px 30px rgba(0,0,0,0.18)",
      border: "1px solid var(--input-border)",
      maxWidth: "100%",
    },
    primary: {
      display: "inline-flex",
      alignItems: "center",
      padding: "10px 20px",
      borderRadius: 30,
      background: "linear-gradient(135deg, #e67e22, #f39c12)",
      color: "var(--on-accent)",
      fontSize: 14,
      fontWeight: 600,
      textDecoration: "none",
      boxShadow: "0 4px 15px rgba(230,126,34,0.3)",
      whiteSpace: "nowrap",
    },
    secondary: {
      display: "inline-flex",
      alignItems: "center",
      padding: "8px 16px",
      borderRadius: 30,
      border: "2px solid var(--primary)",
      background: "transparent",
      color: "var(--primary)",
      fontSize: 14,
      fontWeight: 600,
      fontFamily: "'Poppins', sans-serif",
      cursor: "pointer",
      textDecoration: "none",
      whiteSpace: "nowrap",
    },
  };

  return (
    <div style={styles.dock}>
      <style>{`
        .cmpbar-secondary:hover { border-color: var(--orange) !important; color: var(--orange-text) !important; }
        .cmpbar-primary:hover { transform: translateY(-2px); }
      `}</style>
      <div role="region" aria-label={t("compare.barAria")} style={styles.bar}>
        {saved > 0 && (
          <Link
            href="/wishlist"
            className="cmpbar-secondary"
            style={styles.secondary}
            aria-label={t("compare.savedLinkAria", { count: saved })}
          >
            {t("compare.savedLink", { count: saved })}
          </Link>
        )}
        {n > 0 && (
          <>
            <Link href={comparePath(compare.ids)} className="cmpbar-primary" style={styles.primary}>
              {t("compare.barButton", { count: n, max: COMPARE_MAX })}
            </Link>
            <button
              type="button"
              className="cmpbar-secondary"
              style={styles.secondary}
              onClick={compare.clear}
              aria-label={t("compare.clearAria")}
            >
              {t("compare.clear")}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default CompareBar;
