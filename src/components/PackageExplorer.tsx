"use client";

import React, { useState } from "react";
import PackageCard, { PACKAGE_CARD_CSS } from "@/components/PackageCard";
import type { TourPackage } from "@/lib/types";
import { useApp } from "@/lib/context";
import { useT } from "@/lib/i18n/use-t";
import {
  PACKAGE_SORTS,
  categoryLabel,
  filterByCategory,
  isPackageSort,
  packageCategories,
  searchPackages,
  sortPackages,
  whatsappLink,
  type CategoryFilter,
  type PackageSort,
} from "@/app/packages/package-utils";

/**
 * /packages: search, category filter and sort over the public packages (loaded on the server).
 * The current filters are mirrored into the URL (?q=&category=&sort=) with replaceState, so a
 * filtered list can be shared or reloaded; the page reads them back as the initial state.
 */

export interface PackageExplorerProps {
  packages: TourPackage[];
  initialQuery?: string;
  initialCategory?: string;
  initialSort?: string;
}

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
  sortWrap: { display: "flex", flexDirection: "column", gap: 4 },
  sortLabel: { fontSize: 12, fontWeight: 600, color: "var(--text2)" },
  sort: {
    height: 50,
    padding: "0 14px",
    borderRadius: 14,
    border: "1.5px solid var(--input-border)",
    background: "var(--card-bg)",
    color: "var(--text)",
    fontSize: 14,
    fontWeight: 500,
    fontFamily: "'Poppins', sans-serif",
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
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
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

/** Writes the current filters into the address bar without a navigation or history entry. */
function syncUrl(query: string, category: CategoryFilter, sort: PackageSort) {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams();
  if (query.trim()) params.set("q", query.trim());
  if (category !== "all") params.set("category", category);
  if (sort !== "recommended") params.set("sort", sort);
  const qs = params.toString();
  window.history.replaceState(window.history.state, "", qs ? `?${qs}` : window.location.pathname);
}

const PackageExplorer: React.FC<PackageExplorerProps> = ({ packages, initialQuery = "", initialCategory, initialSort }) => {
  const t = useT();
  const { lang } = useApp();
  const categories = packageCategories(packages);

  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<CategoryFilter>(
    initialCategory && categories.includes(initialCategory) ? initialCategory : "all",
  );
  const [sort, setSort] = useState<PackageSort>(isPackageSort(initialSort) ? initialSort : "recommended");

  const update = (next: { query?: string; category?: CategoryFilter; sort?: PackageSort }) => {
    const q = next.query ?? query;
    const c = next.category ?? category;
    const s = next.sort ?? sort;
    if (next.query !== undefined) setQuery(q);
    if (next.category !== undefined) setCategory(c);
    if (next.sort !== undefined) setSort(s);
    syncUrl(q, c, s);
  };

  const results = sortPackages(searchPackages(filterByCategory(packages, category), query), sort);
  const filtered = query.trim() !== "" || category !== "all";

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
        .pkgx-chip:hover { border-color: var(--orange) !important; color: var(--orange-text) !important; }
        .pkgx-clear:hover { background: var(--bg3) !important; color: var(--text) !important; }
        .pkgx-search::-webkit-search-cancel-button { display: none; }
        [data-theme="dark"] #packages-explorer {
          --pkgx-chip-border: rgba(91,143,217,0.35);
          --pkgx-divider: rgba(148,163,184,0.25);
        }
        @media (max-width: 640px) {
          .pkgx-toolbar { grid-template-columns: 1fr !important; }
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
          <div style={styles.sortWrap}>
            <label htmlFor="pkgx-sort" style={styles.sortLabel}>{t("packagesPage.sortLabel")}</label>
            <select
              id="pkgx-sort"
              className="pkgx-input"
              value={sort}
              onChange={(e) => update({ sort: isPackageSort(e.target.value) ? e.target.value : "recommended" })}
              style={styles.sort}
            >
              {PACKAGE_SORTS.map((s) => (
                <option key={s} value={s}>{t(`packagesPage.sort.${s}`)}</option>
              ))}
            </select>
          </div>
        </form>

        <div style={styles.filterRow}>
          {categories.length > 1 ? (
            <div role="group" aria-label={t("packages.filterAria")} style={styles.chips}>
              {(["all", ...categories] as CategoryFilter[]).map((c) => {
                const active = category === c;
                return (
                  <button
                    key={c}
                    type="button"
                    className={active ? undefined : "pkgx-chip"}
                    aria-pressed={active}
                    onClick={() => update({ category: c })}
                    style={{ ...styles.chip, ...(active ? styles.chipActive : {}) }}
                  >
                    {c === "all" ? t("common.all") : categoryLabel(c, lang)}
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

        {results.length > 0 ? (
          <div className="pkgx-grid" style={styles.grid}>
            {results.map((pkg) => (
              <PackageCard key={pkg.id} pkg={pkg} index={packages.indexOf(pkg)} headingLevel="h2" reveal={false} />
            ))}
          </div>
        ) : (
          <div style={styles.empty}>
            <p>{t("packagesPage.noMatches")}</p>
            {filtered && (
              <button type="button" onClick={() => update({ query: "", category: "all" })} style={styles.emptyBtn}>
                {t("packagesPage.clearFilters")}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PackageExplorer;
