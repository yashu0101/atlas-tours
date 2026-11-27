"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { TourPackage } from "@/lib/types";
import { useApp } from "@/lib/context";
import { useT } from "@/lib/i18n/use-t";
import {
  BUDGET_RANGES,
  DURATION_RANGES,
  PACKAGE_SORTS,
  applyPackageFilters,
  categoryLabel,
  type BudgetFilter,
  type CategoryFilter,
  type DurationFilter,
  type PackageFilters,
  type PackageSort,
} from "@/app/packages/package-utils";

/**
 * /packages filter modal: trip type, budget per person, trip length and sort, each option with
 * the number of packages it would leave (given the search box and the other choices). Choices
 * are a draft until "Show N packages"; closing discards them. Centred card on wide screens,
 * bottom sheet on phones; fade/scale (sheet: slide up) in and out, none for reduced motion.
 * Focus is kept inside while open, Escape closes, and the opener gets focus back (the caller).
 */

export interface FilterDraft {
  category: CategoryFilter;
  budget: BudgetFilter;
  days: DurationFilter;
  sort: PackageSort;
}

interface Props {
  open: boolean;
  packages: TourPackage[];
  categories: string[];
  query: string;
  value: FilterDraft;
  onApply: (draft: FilterDraft) => void;
  onClose: () => void;
}

/** Keeps the dialog mounted while its closing animation runs. */
const EXIT_MS = 240;

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

const CSS = `
  .pfm-overlay {
    position: fixed; inset: 0; z-index: 1200;
    display: flex; align-items: center; justify-content: center; padding: 24px;
    background: rgba(8, 18, 36, 0.55);
    -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px);
    opacity: 0; transition: opacity ${EXIT_MS}ms ease;
  }
  .pfm-overlay[data-state="open"] { opacity: 1; }
  .pfm-panel {
    position: relative; width: min(600px, 100%); max-height: min(86vh, 780px);
    display: flex; flex-direction: column; overflow: hidden;
    background: var(--card-bg); color: var(--text); border-radius: 24px;
    box-shadow: 0 30px 80px rgba(8, 18, 36, 0.35), 0 2px 8px rgba(8, 18, 36, 0.12);
    font-family: 'Poppins', sans-serif;
    opacity: 0; transform: translateY(18px) scale(0.96);
    transition: opacity ${EXIT_MS}ms ease, transform ${EXIT_MS + 120}ms cubic-bezier(0.2, 0.9, 0.25, 1.15);
  }
  .pfm-overlay[data-state="open"] .pfm-panel { opacity: 1; transform: none; }
  .pfm-overlay[data-state="closed"] .pfm-panel { transition-timing-function: ease, ease-in; }
  .pfm-handle { display: none; }
  .pfm-head {
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    padding: 20px 24px 16px; border-bottom: 1px solid var(--pfm-line, rgba(26,58,107,0.1));
  }
  .pfm-title { margin: 0; font-size: 20px; font-weight: 800; color: var(--primary); letter-spacing: -0.3px; }
  .pfm-close {
    width: 40px; height: 40px; border-radius: 12px; border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    background: var(--bg3); color: var(--text); transition: background 0.2s, transform 0.2s;
  }
  .pfm-close:hover { transform: rotate(90deg); }
  .pfm-body { flex: 1; overflow-y: auto; overscroll-behavior: contain; padding: 8px 24px 20px; }
  .pfm-section { border: none; margin: 0; padding: 18px 0 4px; min-width: 0; }
  .pfm-section + .pfm-section { border-top: 1px solid var(--pfm-line, rgba(26,58,107,0.1)); }
  /* float: the legend becomes a normal block, so the section's top border is not cut by it. */
  .pfm-legend { float: left; width: 100%; padding: 0; margin: 0 0 12px; font-size: 15px; font-weight: 700; color: var(--text); }
  .pfm-chips { clear: both; display: flex; flex-wrap: wrap; gap: 8px; }
  .pfm-grid { clear: both; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .pfm-input { position: absolute; opacity: 0; width: 1px; height: 1px; pointer-events: none; }
  .pfm-chip, .pfm-card {
    position: relative; display: inline-flex; align-items: center; gap: 8px; cursor: pointer;
    border: 1.5px solid var(--pfm-border, rgba(26,58,107,0.18)); background: var(--card-bg); color: var(--text);
    font-size: 14px; font-weight: 600; user-select: none;
    transition: border-color 0.2s, background 0.2s, color 0.2s, box-shadow 0.2s, transform 0.15s;
  }
  .pfm-chip { padding: 8px 14px; border-radius: 999px; }
  .pfm-card { justify-content: space-between; padding: 12px 14px; border-radius: 14px; }
  .pfm-chip:hover, .pfm-card:hover { border-color: var(--orange); }
  .pfm-chip:active, .pfm-card:active { transform: scale(0.97); }
  .pfm-count {
    min-width: 22px; padding: 1px 7px; border-radius: 999px; text-align: center;
    font-size: 12px; font-weight: 700; background: var(--bg3); color: var(--text2);
    transition: background 0.2s, color 0.2s;
  }
  .pfm-tick {
    width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0;
    display: inline-flex; align-items: center; justify-content: center;
    border: 1.5px solid var(--pfm-border, rgba(26,58,107,0.25)); color: transparent;
    transition: background 0.2s, border-color 0.2s, color 0.2s, transform 0.25s cubic-bezier(0.2, 0.9, 0.3, 1.4);
  }
  .pfm-input:checked + .pfm-chip, .pfm-input:checked + .pfm-card {
    border-color: var(--primary); background: var(--pfm-selected, rgba(26,58,107,0.06)); color: var(--primary);
    box-shadow: 0 0 0 3px var(--pfm-ring, rgba(26,58,107,0.08));
  }
  .pfm-input:checked + .pfm-chip .pfm-count, .pfm-input:checked + .pfm-card .pfm-count { background: var(--primary); color: var(--bg); }
  .pfm-input:checked + .pfm-card .pfm-tick { background: var(--primary); border-color: var(--primary); color: var(--bg); transform: scale(1.08); }
  .pfm-input:focus-visible + .pfm-chip, .pfm-input:focus-visible + .pfm-card { outline: 2px solid var(--orange); outline-offset: 2px; }
  .pfm-input:disabled + .pfm-chip, .pfm-input:disabled + .pfm-card { opacity: 0.45; cursor: not-allowed; }
  .pfm-foot {
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    padding: 16px 24px calc(16px + env(safe-area-inset-bottom));
    border-top: 1px solid var(--pfm-line, rgba(26,58,107,0.1)); background: var(--card-bg);
  }
  .pfm-clear {
    border: none; background: none; padding: 10px 4px; cursor: pointer;
    font-family: inherit; font-size: 14px; font-weight: 600; color: var(--text);
    text-decoration: underline; text-underline-offset: 3px;
  }
  .pfm-clear:disabled { opacity: 0.4; cursor: default; }
  .pfm-apply {
    flex: 1; max-width: 300px; min-height: 48px; padding: 0 22px; border: none; border-radius: 14px; cursor: pointer;
    background: linear-gradient(135deg, #e67e22, #f39c12); color: var(--on-accent);
    font-family: inherit; font-size: 15px; font-weight: 700;
    box-shadow: 0 8px 22px rgba(230, 126, 34, 0.35); transition: transform 0.2s, box-shadow 0.2s, opacity 0.2s;
  }
  .pfm-apply:not(:disabled):hover { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(230, 126, 34, 0.45); }
  .pfm-apply:disabled { opacity: 0.55; cursor: not-allowed; box-shadow: none; }
  .pfm-apply-count { display: inline-block; animation: pfm-pop 0.3s cubic-bezier(0.2, 0.9, 0.3, 1.4); }
  @keyframes pfm-pop { from { transform: scale(0.85); opacity: 0.4; } to { transform: none; opacity: 1; } }

  [data-theme="dark"] .pfm-panel {
    --pfm-line: rgba(148,163,184,0.18);
    --pfm-border: rgba(148,163,184,0.3);
    --pfm-selected: rgba(91,143,217,0.14);
    --pfm-ring: rgba(91,143,217,0.18);
  }

  /* Phones: bottom sheet that slides up. */
  @media (max-width: 640px) {
    .pfm-overlay { align-items: flex-end; padding: 0; }
    .pfm-panel {
      width: 100%; max-height: 88vh; border-radius: 24px 24px 0 0;
      transform: translateY(100%); opacity: 1;
      transition: transform ${EXIT_MS + 80}ms cubic-bezier(0.2, 0.85, 0.25, 1);
    }
    .pfm-overlay[data-state="closed"] .pfm-panel { transition-timing-function: ease-in; }
    .pfm-handle { display: block; width: 44px; height: 5px; border-radius: 99px; margin: 10px auto 0; background: var(--pfm-border, rgba(26,58,107,0.2)); }
    .pfm-head { padding: 12px 20px 14px; }
    .pfm-body { padding: 4px 20px 16px; }
    .pfm-foot { padding: 14px 20px calc(14px + env(safe-area-inset-bottom)); }
    .pfm-grid { grid-template-columns: 1fr; }
    .pfm-apply { max-width: none; }
  }
  @media (prefers-reduced-motion: reduce) {
    .pfm-overlay, .pfm-panel, .pfm-tick, .pfm-chip, .pfm-card, .pfm-close { transition: none !important; }
    .pfm-apply-count { animation: none; }
  }
`;

const PackageFilterModal: React.FC<Props> = ({ open, packages, categories, query, value, onApply, onClose }) => {
  const t = useT();
  const { lang } = useApp();
  const uid = useId();
  const titleId = `${uid}-title`;
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const [draft, setDraft] = useState<FilterDraft>(value);
  const [mounted, setMounted] = useState(open);
  const [entered, setEntered] = useState(false);
  const [prevOpen, setPrevOpen] = useState(open);

  // Opening: mount and reset the draft to the applied filters (state adjusted during render).
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setDraft(value);
      setMounted(true);
    }
  }

  // Once mounted and open, flip to "open" two frames later so the CSS transition runs.
  // Closing: data-state turns "closed" at once (shown = open && entered); unmount after the exit.
  useEffect(() => {
    if (open && mounted) {
      let raf2 = 0;
      const raf1 = requestAnimationFrame(() => { raf2 = requestAnimationFrame(() => setEntered(true)); });
      return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(raf2); };
    }
    if (!open && mounted) {
      const timer = window.setTimeout(() => { setMounted(false); setEntered(false); }, EXIT_MS + 80);
      return () => window.clearTimeout(timer);
    }
  }, [open, mounted]);
  const shown = open && entered;

  // While mounted: lock page scroll and focus the close button.
  useEffect(() => {
    if (!mounted) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => { document.body.style.overflow = prev; };
  }, [mounted]);

  if (!mounted || typeof document === "undefined") return null;

  // Number of packages left with `patch` applied to the draft (and the current search text).
  const countWith = (patch: Partial<PackageFilters>) =>
    applyPackageFilters(packages, { query, category: draft.category, budget: draft.budget, days: draft.days, ...patch }).length;
  const total = countWith({});
  const draftActive = draft.category !== "all" || draft.budget !== "any" || draft.days !== "any";

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== "Tab" || !panelRef.current) return;
    // Focus trap: cycle within the panel.
    const focusables = [...panelRef.current.querySelectorAll<HTMLElement>("button:not(:disabled), input:not(:disabled)")]
      .filter((el) => el.getAttribute("type") !== "radio" || (el as HTMLInputElement).checked || !panelRef.current!.querySelector(`input[name="${(el as HTMLInputElement).name}"]:checked`));
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  const option = (
    group: keyof FilterDraft,
    val: string,
    label: string,
    count: number | null,
    variant: "chip" | "card",
  ) => {
    const id = `${uid}-${group}-${val}`;
    const checked = draft[group] === val;
    return (
      <span key={val} style={{ position: "relative", display: variant === "card" ? "block" : "inline-block" }}>
        <input
          id={id}
          type="radio"
          className="pfm-input"
          name={`${uid}-${group}`}
          value={val}
          checked={checked}
          disabled={count === 0 && !checked}
          onChange={() => setDraft((d) => ({ ...d, [group]: val }))}
        />
        <label htmlFor={id} className={variant === "chip" ? "pfm-chip" : "pfm-card"} style={variant === "card" ? { display: "flex", width: "100%", boxSizing: "border-box" } : undefined}>
          {variant === "card" && <span className="pfm-tick"><CheckIcon /></span>}
          <span style={variant === "card" ? { flex: 1 } : undefined}>{label}</span>
          {count !== null && <span className="pfm-count" aria-hidden="true">{count}</span>}
        </label>
      </span>
    );
  };

  return createPortal(
    <div
      className="pfm-overlay"
      data-state={shown ? "open" : "closed"}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <style>{CSS}</style>
      <div
        ref={panelRef}
        className="pfm-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={onKeyDown}
      >
        <span className="pfm-handle" aria-hidden="true" />
        <div className="pfm-head">
          <h2 id={titleId} className="pfm-title">{t("packagesPage.filtersTitle")}</h2>
          <button ref={closeRef} type="button" className="pfm-close" aria-label={t("packagesPage.filtersClose")} onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <div className="pfm-body">
          {categories.length > 1 && (
            <fieldset className="pfm-section">
              <legend className="pfm-legend">{t("packagesPage.filtersTripType")}</legend>
              <div className="pfm-chips">
                {option("category", "all", t("common.all"), countWith({ category: "all" }), "chip")}
                {categories.map((c) => option("category", c, categoryLabel(c, lang), countWith({ category: c }), "chip"))}
              </div>
            </fieldset>
          )}

          <fieldset className="pfm-section">
            <legend className="pfm-legend">{t("packagesPage.filtersBudget")}</legend>
            <div className="pfm-grid">
              {option("budget", "any", t("packagesPage.filtersAny"), countWith({ budget: "any" }), "card")}
              {BUDGET_RANGES.map((r) => option("budget", r.id, t(`packagesPage.budget.${r.id}`), countWith({ budget: r.id }), "card"))}
            </div>
          </fieldset>

          <fieldset className="pfm-section">
            <legend className="pfm-legend">{t("packagesPage.filtersDuration")}</legend>
            <div className="pfm-grid">
              {option("days", "any", t("packagesPage.filtersAny"), countWith({ days: "any" }), "card")}
              {DURATION_RANGES.map((r) => option("days", r.id, t(`packagesPage.duration.${r.id}`), countWith({ days: r.id }), "card"))}
            </div>
          </fieldset>

          <fieldset className="pfm-section">
            <legend className="pfm-legend">{t("packagesPage.filtersSort")}</legend>
            <div className="pfm-chips">
              {PACKAGE_SORTS.map((s) => option("sort", s, t(`packagesPage.sort.${s}`), null, "chip"))}
            </div>
          </fieldset>
        </div>

        <div className="pfm-foot">
          <button
            type="button"
            className="pfm-clear"
            disabled={!draftActive}
            onClick={() => setDraft((d) => ({ ...d, category: "all", budget: "any", days: "any" }))}
          >
            {t("packagesPage.filtersClearAll")}
          </button>
          <button type="button" className="pfm-apply" disabled={total === 0} onClick={() => onApply(draft)}>
            <span key={total} className="pfm-apply-count">
              {total === 0
                ? t("packagesPage.filtersShowNone")
                : total === 1
                  ? t("packagesPage.filtersShowOne")
                  : t("packagesPage.filtersShow", { count: total })}
            </span>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default PackageFilterModal;
