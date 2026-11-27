"use client";

import React, { useRef, useState } from "react";
import PackageCard, { PACKAGE_CARD_CSS } from "@/components/PackageCard";
import PackageFilterModal, { type FilterDraft } from "@/components/PackageFilterModal";
import type { TourPackage } from "@/lib/types";
import { useApp } from "@/lib/context";
import { useT } from "@/lib/i18n/use-t";
import {
  activeFilterCount,
  applyPackageFilters,
  categoryLabel,
  isBudgetId,
  isDurationId,
  isPackageSort,
  packageCategories,
  sortPackages,
  whatsappLink,
  type BudgetFilter,
  type CategoryFilter,
  type DurationFilter,
  type PackageSort,
} from "@/app/packages/package-utils";

/**
 * /packages: search, category chips and a filter modal (trip type, budget, trip length, sort)
 * over the public packages (loaded on the server). The current filters are mirrored
 * into the URL (?q=&category=&budget=&days=&sort=) with replaceState, so a filtered list can be
 * shared or reloaded; the page reads them back as the initial state.
 */

export interface PackageExplorerProps {
  packages: TourPackage[];
  initialQuery?: string;
  initialCategory?: string;
  initialSort?: string;
  initialBudget?: string;
  initialDays?: string;
}

const FilterIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12" />
    <circle cx="16" cy="6" r="2" />
    <circle cx="10" cy="12" r="2" />
    <circle cx="18" cy="18" r="2" />
  </svg>
);

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </svg>
);

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

const styles: Record<string, React.CSSProperties> = {
  wrap: { maxWidth: 1200, margin: "0 auto" },
  toolbar: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    gap: 12,
    alignItems: "end",
    marginBottom: 18,
  },
  searchWrap: { position: "relative" },
  searchIcon: {
    position: "absolute",
    left: 16,
    top: "50%",
    transform: "translateY(-50%)",
    color: "var(--text2)",
    display: "flex",
    pointerEvents: "none",
  },
  search: {
    width: "100%",
    height: 50,
    padding: "0 48px 0 46px",
    borderRadius: 14,
    border: "1.5px solid var(--input-border)",
    background: "var(--card-bg)",
    color: "var(--text)",
    fontSize: 15,
    fontFamily: "'Poppins', sans-serif",
  },
  clearBtn: {
    position: "absolute",
    right: 8,
    top: "50%",
    transform: "translateY(-50%)",
    width: 34,
    height: 34,
    borderRadius: 10,
    border: "none",
    background: "transparent",
    color: "var(--text2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
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
  filterRow: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingBottom: 22,
    marginBottom: 30,
    borderBottom: "1px solid var(--pkgx-divider, rgba(26,58,107,0.12))",
  },
  chips: { display: "flex", flexWrap: "wrap", gap: 8 },
  chip: {
    padding: "7px 18px",
    borderRadius: 20,
    border: "2px solid var(--pkgx-chip-border, rgba(26,58,107,0.15))",
    background: "transparent",
    color: "var(--primary)",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'Poppins', sans-serif",
    transition: "border-color 0.2s, color 0.2s",
  },
  chipActive: {
    border: "2px solid var(--primary)",
    background: "var(--primary)",
    color: "var(--bg)",
  },
  count: { fontSize: 14, fontWeight: 600, color: "var(--text2)", margin: 0 },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(min(320px, 100%), 1fr))",
    gap: 28,
  },
  empty: {
    textAlign: "center",
    padding: "56px 24px",
    borderRadius: 18,
    border: "2px dashed var(--pkgx-chip-border, rgba(26,58,107,0.15))",
    color: "var(--text2)",
    fontSize: 16,
  },
  emptyBtn: {
    marginTop: 14,
    padding: "10px 22px",
    borderRadius: 10,
    border: "2px solid var(--primary)",
    background: "transparent",
    color: "var(--primary)",
    fontSize: 14,
    fontWeight: 600,
    fontFamily: "'Poppins', sans-serif",
    cursor: "pointer",
  },
  emptyLink: {
    display: "inline-block",
    marginTop: 14,
    padding: "10px 22px",
    borderRadius: 10,
    background: "var(--green)",
    color: "var(--on-accent)",
    fontSize: 14,
    fontWeight: 600,
    textDecoration: "none",
  },
};

interface State {
  query: string;
  category: CategoryFilter;
  budget: BudgetFilter;
  days: DurationFilter;
  sort: PackageSort;
}

/** Writes the current filters into the address bar without a navigation or history entry. */
function syncUrl(s: State) {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams();
  if (s.query.trim()) params.set("q", s.query.trim());
  if (s.category !== "all") params.set("category", s.category);
  if (s.budget !== "any") params.set("budget", s.budget);
  if (s.days !== "any") params.set("days", s.days);
  if (s.sort !== "recommended") params.set("sort", s.sort);
  const qs = params.toString();
  window.history.replaceState(window.history.state, "", qs ? `?${qs}` : window.location.pathname);
}

const PackageExplorer: React.FC<PackageExplorerProps> = ({ packages, initialQuery = "", initialCategory, initialSort, initialBudget, initialDays }) => {
  const t = useT();
  const { lang } = useApp();
  const categories = packageCategories(packages);

  const [state, setState] = useState<State>(() => ({
    query: initialQuery,
    category: initialCategory && categories.includes(initialCategory) ? initialCategory : "all",
    budget: isBudgetId(initialBudget) ? initialBudget : "any",
    days: isDurationId(initialDays) ? initialDays : "any",
    sort: isPackageSort(initialSort) ? initialSort : "recommended",
  }));
  const { query, category, budget, days, sort } = state;
  const [modalOpen, setModalOpen] = useState(false);
  const filterBtnRef = useRef<HTMLButtonElement>(null);

  const update = (next: Partial<State>) => {
    const merged = { ...state, ...next };
    setState(merged);
    syncUrl(merged);
  };
  const closeModal = () => {
    setModalOpen(false);
    filterBtnRef.current?.focus();
  };
  const applyDraft = (d: FilterDraft) => {
    update(d);
    closeModal();
  };

  const results = sortPackages(applyPackageFilters(packages, state), sort);
  const activeCount = activeFilterCount(state);
  const filtered = query.trim() !== "" || activeCount > 0;
  // Changing a filter (not each keystroke in the search box) replays the cards' entrance animation.
  const gridKey = [category, budget, days, sort].join("|");
  const pills: { key: string; label: string; clear: Partial<State> }[] = [
    ...(budget !== "any" ? [{ key: "budget", label: t(`packagesPage.budget.${budget}`), clear: { budget: "any" as const } }] : []),
    ...(days !== "any" ? [{ key: "days", label: t(`packagesPage.duration.${days}`), clear: { days: "any" as const } }] : []),
    ...(sort !== "recommended" ? [{ key: "sort", label: t(`packagesPage.sort.${sort}`), clear: { sort: "recommended" as const } }] : []),
  ];

  if (packages.length === 0) {
    return (
      <div style={{ ...styles.wrap, ...styles.empty }}>
        <p>{t("packagesPage.noPackages")}</p>
        <a href={whatsappLink(t("packagesPage.whatsappMessage"))} target="_blank" rel="noopener noreferrer" style={styles.emptyLink}>
          {t("packagesPage.whatsappCta")}
        </a>
      </div>
    );
  }

  return (
    <div style={styles.wrap}>
      <style>{`
        ${PACKAGE_CARD_CSS}
        .pkgx-input { transition: border-color 0.2s, box-shadow 0.2s; }
        .pkgx-input:focus { border-color: var(--orange) !important; box-shadow: 0 0 0 4px rgba(230,126,34,0.15); }
        .pkgx-chip { display: inline-flex; align-items: center; gap: 8px; transition: border-color 0.2s, color 0.2s, background 0.25s, box-shadow 0.25s, transform 0.15s !important; }
        .pkgx-chip:not(.is-active):hover { border-color: var(--orange) !important; color: var(--orange-text) !important; transform: translateY(-1px); }
        .pkgx-chip:active { transform: scale(0.96); }
        .pkgx-chip.is-active { box-shadow: 0 6px 16px rgba(26,58,107,0.22); }
        .pkgx-chip-count {
          min-width: 20px; padding: 0 6px; border-radius: 999px; font-size: 11.5px; font-weight: 700; line-height: 18px; text-align: center;
          background: var(--pkgx-count-bg, rgba(26,58,107,0.08)); color: var(--text2); transition: background 0.25s, color 0.25s;
        }
        .pkgx-chip.is-active .pkgx-chip-count { background: rgba(255,255,255,0.22); color: inherit; }
        .pkgx-chip.is-empty { opacity: 0.5; }
        .pkgx-filter-btn {
          position: relative; display: inline-flex; align-items: center; gap: 8px; height: 50px; padding: 0 18px;
          border-radius: 14px; border: 1.5px solid var(--input-border); background: var(--card-bg); color: var(--text);
          font-family: 'Poppins', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer;
          transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s, background 0.2s, color 0.2s;
        }
        .pkgx-filter-btn:hover { border-color: var(--orange); box-shadow: 0 6px 18px rgba(230,126,34,0.16); transform: translateY(-1px); }
        .pkgx-filter-btn:active { transform: scale(0.97); }
        .pkgx-filter-btn svg { transition: transform 0.35s cubic-bezier(0.2,0.9,0.3,1.4); }
        .pkgx-filter-btn:hover svg { transform: rotate(-12deg) scale(1.08); }
        .pkgx-filter-btn.is-active { border-color: var(--primary); background: var(--primary); color: var(--bg); }
        .pkgx-filter-badge {
          min-width: 22px; height: 22px; padding: 0 6px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center;
          background: linear-gradient(135deg, #e67e22, #f39c12); color: var(--on-accent); font-size: 12px; font-weight: 800;
          animation: pkgx-pop 0.35s cubic-bezier(0.2,0.9,0.3,1.5);
        }
        @keyframes pkgx-pop { from { transform: scale(0.4); opacity: 0; } to { transform: none; opacity: 1; } }
        .pkgx-pills { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: -12px 0 26px; animation: pkgx-fade 0.3s ease both; }
        .pkgx-pill {
          display: inline-flex; align-items: center; gap: 8px; padding: 7px 10px 7px 14px; border-radius: 999px; cursor: pointer;
          border: 1.5px solid var(--orange); background: var(--pkgx-pill-bg, rgba(230,126,34,0.08)); color: var(--orange-text);
          font-family: 'Poppins', sans-serif; font-size: 13px; font-weight: 600; animation: pkgx-pop 0.3s cubic-bezier(0.2,0.9,0.3,1.3) both;
          transition: background 0.2s;
        }
        .pkgx-pill:hover { background: var(--pkgx-pill-hover, rgba(230,126,34,0.16)); }
        .pkgx-pill-clear { border: none; background: none; cursor: pointer; padding: 6px; font-family: 'Poppins', sans-serif; font-size: 13px; font-weight: 600; color: var(--text2); text-decoration: underline; text-underline-offset: 3px; }
        @keyframes pkgx-fade { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
        @keyframes pkgx-in { from { opacity: 0; transform: translateY(16px) scale(0.985); } to { opacity: 1; transform: none; } }
        .pkgx-anim > * { animation: pkgx-in 0.45s cubic-bezier(0.2,0.7,0.2,1) both; }
        .pkgx-anim > :nth-child(2) { animation-delay: 50ms; }
        .pkgx-anim > :nth-child(3) { animation-delay: 100ms; }
        .pkgx-anim > :nth-child(4) { animation-delay: 150ms; }
        .pkgx-anim > :nth-child(5) { animation-delay: 200ms; }
        .pkgx-anim > :nth-child(6) { animation-delay: 250ms; }
        .pkgx-anim > :nth-child(n+7) { animation-delay: 300ms; }
        @media (prefers-reduced-motion: reduce) {
          .pkgx-anim > *, .pkgx-pills, .pkgx-pill, .pkgx-filter-badge { animation: none !important; }
          .pkgx-chip, .pkgx-filter-btn, .pkgx-filter-btn svg { transition: none !important; }
        }
        .pkgx-clear:hover { background: var(--bg3) !important; color: var(--text) !important; }
        .pkgx-search::-webkit-search-cancel-button { display: none; }
        [data-theme="dark"] #packages-explorer {
          --pkgx-chip-border: rgba(91,143,217,0.35);
          --pkgx-divider: rgba(148,163,184,0.25);
          --pkgx-count-bg: rgba(148,163,184,0.16);
          --pkgx-pill-bg: rgba(230,126,34,0.12);
          --pkgx-pill-hover: rgba(230,126,34,0.2);
        }
        /* Two columns until three fit (3 × 320px + gaps); a lone last card is centred. */
        @media (min-width: 641px) and (max-width: 1063px) {
          .pkgx-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
          .pkgx-grid > :last-child:nth-child(odd) { grid-column: 1 / -1; justify-self: center; width: calc((100% - 28px) / 2); }
        }
        @media (max-width: 640px) {
          /* One row of chips that swipes sideways instead of four wrapped rows. */
          .pkgx-chips {
            flex-wrap: nowrap !important; overflow-x: auto; scroll-snap-type: x proximity; scroll-padding-inline: 24px; scrollbar-width: none;
            margin: 0 -24px; padding: 4px 24px 8px; width: calc(100% + 48px);
            -webkit-mask-image: linear-gradient(90deg, transparent 0, #000 20px, #000 calc(100% - 28px), transparent 100%);
            mask-image: linear-gradient(90deg, transparent 0, #000 20px, #000 calc(100% - 28px), transparent 100%);
          }
          .pkgx-chips::-webkit-scrollbar { display: none; }
          .pkgx-chips > * { flex-shrink: 0; scroll-snap-align: start; }
          .pkgx-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div id="packages-explorer">
        <form role="search" className="pkgx-toolbar" style={styles.toolbar} onSubmit={(e) => e.preventDefault()}>
          <div style={styles.searchWrap}>
            <label htmlFor="pkgx-search" style={styles.srOnly}>{t("packagesPage.searchLabel")}</label>
            <span style={styles.searchIcon}><SearchIcon /></span>
            <input
              id="pkgx-search"
              type="search"
              className="pkgx-input pkgx-search"
              value={query}
              placeholder={t("packagesPage.searchPlaceholder")}
              autoComplete="off"
              onChange={(e) => update({ query: e.target.value })}
              style={styles.search}
            />
            {query && (
              <button
                type="button"
                className="pkgx-clear"
                aria-label={t("packagesPage.clearSearch")}
                onClick={() => update({ query: "" })}
                style={styles.clearBtn}
              >
                <CloseIcon />
              </button>
            )}
          </div>
          <button
            ref={filterBtnRef}
            type="button"
            className={`pkgx-filter-btn${activeCount > 0 ? " is-active" : ""}`}
            aria-haspopup="dialog"
            aria-expanded={modalOpen}
            aria-label={activeCount > 0 ? t("packagesPage.filtersButtonAria", { count: activeCount }) : undefined}
            onClick={() => setModalOpen(true)}
          >
            <FilterIcon />
            <span>{t("packagesPage.filtersButton")}</span>
            {activeCount > 0 && <span key={activeCount} className="pkgx-filter-badge" aria-hidden="true">{activeCount}</span>}
          </button>
        </form>

        <div style={styles.filterRow}>
          {categories.length > 1 ? (
            <div role="group" aria-label={t("packages.filterAria")} className="pkgx-chips" style={styles.chips}>
              {(["all", ...categories] as CategoryFilter[]).map((c) => {
                const active = category === c;
                const n = applyPackageFilters(packages, { ...state, category: c }).length;
                return (
                  <button
                    key={c}
                    type="button"
                    className={`pkgx-chip${active ? " is-active" : ""}${n === 0 && !active ? " is-empty" : ""}`}
                    aria-pressed={active}
                    onClick={() => update({ category: c })}
                    style={{ ...styles.chip, ...(active ? styles.chipActive : {}) }}
                  >
                    {c === "all" ? t("common.all") : categoryLabel(c, lang)}
                    <span className="pkgx-chip-count" aria-hidden="true">{n}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <span />
          )}
          <p role="status" aria-live="polite" style={styles.count}>
            {results.length === 1
              ? t("packagesPage.resultCountOne")
              : t("packagesPage.resultCount", { count: results.length })}
          </p>
        </div>

        {pills.length > 0 && (
          <div className="pkgx-pills" role="group" aria-label={t("packagesPage.filtersActive")}>
            {pills.map((p) => (
              <button key={p.key} type="button" className="pkgx-pill" aria-label={t("packagesPage.removeFilter", { label: p.label })} onClick={() => update(p.clear)}>
                {p.label}
                <CloseIcon />
              </button>
            ))}
            <button type="button" className="pkgx-pill-clear" onClick={() => update({ category: "all", budget: "any", days: "any", sort: "recommended" })}>
              {t("packagesPage.filtersClearAll")}
            </button>
          </div>
        )}

        {results.length > 0 ? (
          <div key={gridKey} className="pkgx-grid pkgx-anim" style={styles.grid}>
            {results.map((pkg) => (
              <PackageCard key={pkg.id} pkg={pkg} index={packages.indexOf(pkg)} headingLevel="h2" reveal={false} />
            ))}
          </div>
        ) : (
          <div style={styles.empty}>
            <p>{t("packagesPage.noMatches")}</p>
            {filtered && (
              <button type="button" onClick={() => update({ query: "", category: "all", budget: "any", days: "any" })} style={styles.emptyBtn}>
                {t("packagesPage.clearFilters")}
              </button>
            )}
          </div>
        )}
      </div>

      <PackageFilterModal
        open={modalOpen}
        packages={packages}
        categories={categories}
        query={query}
        value={{ category, budget, days, sort }}
        onApply={applyDraft}
        onClose={closeModal}
      />
    </div>
  );
};

export default PackageExplorer;
