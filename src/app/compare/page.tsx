import type React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsApp from "@/components/WhatsApp";
import BackToTop from "@/components/BackToTop";
import ScrollProgress from "@/components/ScrollProgress";
import RevealObserver from "@/components/RevealObserver";
import SmartImage from "@/components/SmartImage";
import { getPackages } from "@/lib/db";
import { isPublicPackage } from "@/lib/visibility";
import { getT } from "@/lib/i18n";
import type { TourPackage } from "@/lib/types";
import { COMPARE_MAX, parseIdsParam } from "@/lib/wishlist-ids";
import { categoryLabel, discountPercent, formatPrice, packagePath } from "../packages/package-utils";

// Server-rendered from ?ids= (N-7), so a comparison link can be shared. Fresh data per request (F-02).
export const dynamic = "force-dynamic";

const t = getT("en");

export const metadata: Metadata = {
  title: t("compare.metaTitle"),
  description: t("compare.metaDescription"),
  robots: { index: false, follow: true },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** Ids read from the query before filtering; bounds the work for a hand-made URL. */
const MAX_QUERY_IDS = 10;

/** Up to 3 public packages in the order given; unknown, hidden and duplicate ids are ignored. */
async function loadComparedPackages(ids: string[]): Promise<TourPackage[]> {
  if (ids.length === 0) return [];
  try {
    const byId = new Map((await getPackages()).filter(isPublicPackage).map((p) => [p.id, p]));
    return ids
      .map((id) => byId.get(id))
      .filter((p): p is TourPackage => !!p)
      .slice(0, COMPARE_MAX);
  } catch (err) {
    console.error("[compare] failed to load packages:", err);
    return [];
  }
}

const styles: Record<string, React.CSSProperties> = {
  heroBand: { height: 120, background: "linear-gradient(135deg, #1a3a6b 0%, #0a1628 100%)" },
  page: { background: "var(--bg)", fontFamily: "'Poppins', sans-serif", padding: "48px 24px 100px" },
  header: { textAlign: "center", marginBottom: 40 },
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
  heading: { fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 800, color: "var(--primary)", marginBottom: 12 },
  subheading: { fontSize: 16, color: "var(--text2)", maxWidth: 550, margin: "0 auto" },
  scroller: {
    maxWidth: 1200,
    margin: "0 auto",
    overflowX: "auto",
    borderRadius: 18,
    background: "var(--card-bg)",
    boxShadow: "var(--shadow)",
  },
  table: { width: "100%", borderCollapse: "collapse", tableLayout: "fixed", fontSize: 14, color: "var(--text2)" },
  rowHead: {
    textAlign: "left",
    verticalAlign: "top",
    padding: "14px 18px",
    width: 160,
    fontWeight: 700,
    color: "var(--primary)",
    background: "var(--cmp-head-bg, rgba(26,58,107,0.04))",
    borderBottom: "1px solid var(--cmp-divider, #eee)",
  },
  colHead: { textAlign: "left", verticalAlign: "top", padding: 16, borderBottom: "1px solid var(--cmp-divider, #eee)" },
  cell: { verticalAlign: "top", padding: "14px 18px", borderBottom: "1px solid var(--cmp-divider, #eee)", lineHeight: 1.6 },
  imgBox: { position: "relative", height: 150, borderRadius: 12, overflow: "hidden", marginBottom: 12 },
  name: { fontSize: 17, fontWeight: 700, color: "var(--primary)", lineHeight: 1.35 },
  nameLink: { color: "inherit", textDecoration: "none" },
  price: { fontSize: 18, fontWeight: 800, color: "var(--orange-text)" },
  perPerson: { fontSize: 12, fontWeight: 500, color: "var(--text2)", marginLeft: 4 },
  strike: { textDecoration: "line-through" },
  discount: {
    display: "inline-block",
    background: "#1e874a",
    color: "#fff",
    padding: "3px 10px",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 700,
  },
  list: { listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 4 },
  detailsBtn: {
    display: "inline-block",
    padding: "10px 20px",
    borderRadius: 10,
    background: "linear-gradient(135deg, #e67e22, #f39c12)",
    color: "var(--on-accent)",
    fontSize: 14,
    fontWeight: 600,
    textDecoration: "none",
    boxShadow: "0 4px 15px rgba(230,126,34,0.3)",
    whiteSpace: "nowrap",
  },
  hint: { maxWidth: 1200, margin: "0 auto 12px", fontSize: 13, color: "var(--text2)" },
  empty: { maxWidth: 600, margin: "0 auto", textAlign: "center", color: "var(--text2)", fontSize: 16, lineHeight: 1.7 },
  emptyHeading: { fontSize: 22, fontWeight: 700, color: "var(--primary)", marginBottom: 8 },
  emptyLink: {
    display: "inline-block",
    marginTop: 20,
    padding: "12px 32px",
    borderRadius: 30,
    background: "linear-gradient(135deg, #e67e22, #f39c12)",
    color: "var(--on-accent)",
    fontWeight: 600,
    textDecoration: "none",
    boxShadow: "0 6px 25px rgba(230,126,34,0.35)",
  },
};

const none = t("compare.none");

function ItemList({ items }: { items: string[] | undefined }) {
  if (!items?.length) return none;
  return (
    <ul style={styles.list}>
      {items.map((item, i) => (
        <li key={i}>
          <span style={{ color: "#27ae60" }} aria-hidden="true">&#10003;</span> {item}
        </li>
      ))}
    </ul>
  );
}

export default async function ComparePage({ searchParams }: Props) {
  const { ids } = await searchParams;
  const packages = await loadComparedPackages(parseIdsParam(ids, MAX_QUERY_IDS));

  const rows: { key: string; label: string; render: (p: TourPackage) => React.ReactNode }[] = [
    {
      key: "price",
      label: t("compare.rowPrice"),
      render: (p) => (
        <span style={styles.price}>
          &#8377;{formatPrice(p.price)}
          <span style={styles.perPerson}>{t("packageDetail.perPerson")}</span>
        </span>
      ),
    },
    {
      key: "original",
      label: t("compare.rowOriginalPrice"),
      render: (p) =>
        typeof p.originalPrice === "number" && p.originalPrice > p.price ? (
          <span style={styles.strike}>&#8377;{formatPrice(p.originalPrice)}</span>
        ) : none,
    },
    {
      key: "discount",
      label: t("compare.rowDiscount"),
      render: (p) =>
        typeof p.originalPrice === "number" && p.originalPrice > p.price ? (
          <span style={styles.discount}>{t("common.percentOff", { percent: discountPercent(p.originalPrice, p.price) })}</span>
        ) : none,
    },
    { key: "duration", label: t("compare.rowDuration"), render: (p) => p.duration || none },
    { key: "destination", label: t("compare.rowDestination"), render: (p) => p.destination || none },
    { key: "category", label: t("compare.rowCategory"), render: (p) => (p.category ? categoryLabel(p.category) : none) },
    { key: "highlights", label: t("compare.rowHighlights"), render: (p) => <ItemList items={p.highlights} /> },
    { key: "inclusions", label: t("compare.rowInclusions"), render: (p) => <ItemList items={p.inclusions} /> },
    {
      key: "itinerary",
      label: t("compare.rowItinerary"),
      render: (p) => {
        const n = p.itinerary?.length ?? 0;
        if (n === 0) return none;
        return n === 1 ? t("compare.itineraryOneDay") : t("compare.itineraryDays", { count: n });
      },
    },
    {
      key: "details",
      label: "",
      render: (p) => (
        <Link
          href={packagePath(p.id)}
          className="cmp-btn"
          style={styles.detailsBtn}
          aria-label={t("compare.detailsAria", { name: p.name })}
        >
          {t("compare.details")}
        </Link>
      ),
    },
  ];

  return (
    <>
      <a href="#main-content" className="skip-link">{t("common.skipToContent")}</a>
      <ScrollProgress />
      <Header />
      <style>{`
        [data-theme="dark"] #compare {
          --cmp-head-bg: rgba(91,143,217,0.08);
          --cmp-divider: var(--bg3);
        }
        .cmp-btn:hover { transform: translateY(-2px); }
        .cmp-name:hover { color: var(--orange-text); }
        #compare tr:last-child > * { border-bottom: none !important; }
        .cmp-hint { display: none; }
        @media (max-width: 768px) { .cmp-hint { display: block; } }
      `}</style>
      <div data-header-tone="dark" style={styles.heroBand} aria-hidden="true" />
      <main id="main-content" tabIndex={-1} style={styles.page}>
        <div id="compare">
          <div style={styles.header}>
            <span style={styles.badge}>{t("compare.badge")}</span>
            <h1 style={styles.heading}>{t("compare.heading")}</h1>
            <p style={styles.subheading}>{t("compare.subheading", { max: COMPARE_MAX })}</p>
          </div>

          {packages.length === 0 ? (
            <div style={styles.empty}>
              <h2 style={styles.emptyHeading}>{t("compare.emptyHeading")}</h2>
              <p>{t("compare.emptyText", { max: COMPARE_MAX })}</p>
              <Link href="/#packages" className="cmp-btn" style={styles.emptyLink}>{t("compare.browse")}</Link>
            </div>
          ) : (
            <>
              {packages.length > 1 && <p className="cmp-hint" style={styles.hint}>{t("compare.scrollHint")}</p>}
              {/* Focusable so keyboard users can scroll the table sideways on small screens. */}
              <div role="region" aria-label={t("compare.tableCaption")} tabIndex={0} style={styles.scroller}>
                <table style={{ ...styles.table, minWidth: 160 + packages.length * 240 }}>
                  <caption style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>
                    {t("compare.tableCaption")}
                  </caption>
                  <thead>
                    <tr>
                      <th scope="row" style={styles.rowHead}>{t("compare.rowPackage")}</th>
                      {packages.map((p) => (
                        <th key={p.id} scope="col" style={styles.colHead}>
                          <div style={styles.imgBox}>
                            <SmartImage
                              src={p.image || "/images/placeholder.jpg"}
                              alt=""
                              fill
                              sizes="(max-width: 768px) 240px, 340px"
                              style={{ objectFit: "cover" }}
                            />
                          </div>
                          <Link href={packagePath(p.id)} className="cmp-name" style={{ ...styles.name, ...styles.nameLink }}>
                            {p.name}
                          </Link>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.key}>
                        <th scope="row" style={styles.rowHead}>
                          {row.label || <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}>{t("compare.details")}</span>}
                        </th>
                        {packages.map((p) => (
                          <td key={p.id} style={styles.cell}>{row.render(p)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
      <WhatsApp />
      <BackToTop />
      <RevealObserver />
    </>
  );
}
