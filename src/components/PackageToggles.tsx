"use client";

import React from "react";
import { useT } from "@/lib/i18n/use-t";
import { COMPARE_MAX, useCompare, useWishlist } from "@/lib/wishlist";

/**
 * N-7: "save" (heart) and "compare" toggles for a package.
 * - `card`: heart floats over the card image; compare is a small pill in the card body.
 * - `hero`: both are outline pills on the dark hero of /packages/[id].
 * Both stop click propagation so they never trigger a surrounding card/modal handler.
 * The server render (and first client render) shows the "not selected" state; the stored
 * state appears right after hydration (useSyncExternalStore, see src/lib/wishlist.ts).
 */

type Variant = "card" | "hero";

const HeartIcon = ({ filled, size = 18 }: { filled: boolean; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
  </svg>
);

const CompareIcon = ({ checked }: { checked: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="4" />
    {checked && <path d="M7 12.5l3.2 3.2L17 9" />}
  </svg>
);

const stop = (e: React.SyntheticEvent) => e.stopPropagation();

const styles: Record<string, React.CSSProperties> = {
  heartCard: {
    position: "absolute",
    bottom: 14,
    right: 14,
    zIndex: 2,
    width: 40,
    height: 40,
    borderRadius: "50%",
    border: "none",
    background: "rgba(255,255,255,0.92)",
    color: "#1a3a6b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
    transition: "transform 0.2s",
  },
  heartCardOn: { color: "#c0392b" },
  pillCard: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 12px",
    borderRadius: 20,
    border: "1.5px solid var(--input-border)",
    background: "transparent",
    color: "var(--primary)",
    fontSize: 12,
    fontWeight: 600,
    fontFamily: "'Poppins', sans-serif",
    cursor: "pointer",
    transition: "all 0.3s",
    whiteSpace: "nowrap",
  },
  pillHero: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 18px",
    borderRadius: 30,
    border: "2px solid rgba(255,255,255,0.5)",
    background: "transparent",
    color: "#fff",
    fontSize: 14,
    fontWeight: 600,
    fontFamily: "'Poppins', sans-serif",
    cursor: "pointer",
    transition: "all 0.3s",
  },
  pillOn: {
    border: "1.5px solid transparent",
    background: "linear-gradient(135deg, #e67e22, #f39c12)",
    color: "var(--on-accent)",
  },
  disabled: { opacity: 0.5, cursor: "not-allowed" },
};

const toggleCss = `
  .pt-heart:hover { transform: scale(1.1); }
  .pt-pill:not(:disabled):hover { border-color: var(--orange) !important; }
  .pt-pill-hero:not(:disabled):hover { background: rgba(255,255,255,0.15) !important; border-color: #fff !important; }
`;

export function SaveToggle({ id, name, variant = "card" }: { id: string; name: string; variant?: Variant }) {
  const t = useT();
  const { has, toggle } = useWishlist();
  const saved = has(id);
  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    toggle(id);
  };

  if (variant === "hero") {
    return (
      <button
        type="button"
        className="pt-pill-hero"
        aria-pressed={saved}
        aria-label={t("wishlist.toggleAria", { name })}
        onClick={onClick}
        onKeyDown={stop}
        style={{ ...styles.pillHero, ...(saved ? { ...styles.pillOn, border: "2px solid transparent" } : {}) }}
      >
        <HeartIcon filled={saved} size={16} />
        {saved ? t("wishlist.saved") : t("wishlist.save")}
      </button>
    );
  }

  return (
    <>
      <style>{toggleCss}</style>
      <button
        type="button"
        className="pt-heart"
        aria-pressed={saved}
        aria-label={t("wishlist.toggleAria", { name })}
        title={t("wishlist.toggleAria", { name })}
        onClick={onClick}
        onKeyDown={stop}
        style={{ ...styles.heartCard, ...(saved ? styles.heartCardOn : {}) }}
      >
        <HeartIcon filled={saved} />
      </button>
    </>
  );
}

export function CompareToggle({ id, name, variant = "card" }: { id: string; name: string; variant?: Variant }) {
  const t = useT();
  const { has, isFull, toggle } = useCompare();
  const selected = has(id);
  const blocked = isFull && !selected;
  const label = blocked
    ? t("compare.fullAria", { name, max: COMPARE_MAX })
    : t("compare.toggleAria", { name });
  const base = variant === "hero" ? styles.pillHero : styles.pillCard;
  const on = variant === "hero" ? { ...styles.pillOn, border: "2px solid transparent" } : styles.pillOn;

  return (
    <>
      <style>{toggleCss}</style>
      <button
        type="button"
        className={variant === "hero" ? "pt-pill-hero" : "pt-pill"}
        aria-pressed={selected}
        aria-label={label}
        title={blocked ? t("compare.fullTitle", { max: COMPARE_MAX }) : undefined}
        disabled={blocked}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          toggle(id);
        }}
        onKeyDown={stop}
        style={{ ...base, ...(selected ? on : {}), ...(blocked ? styles.disabled : {}) }}
      >
        <CompareIcon checked={selected} />
        {t("compare.toggle")}
      </button>
    </>
  );
}
