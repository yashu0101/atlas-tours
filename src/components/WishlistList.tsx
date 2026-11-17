"use client";

import React, { useSyncExternalStore } from "react";
import Link from "next/link";
import SmartImage from "@/components/SmartImage";
import { CompareToggle } from "@/components/PackageToggles";
import type { TourPackage } from "@/lib/types";
import { useT } from "@/lib/i18n/use-t";
import { useWishlist } from "@/lib/wishlist";
import { formatPrice, packagePath } from "@/app/packages/package-utils";

const noopSubscribe = () => () => {};
/** false on the server and during hydration, true afterwards (no setState-in-effect needed). */
const useHydrated = () => useSyncExternalStore(noopSubscribe, () => true, () => false);

const styles: Record<string, React.CSSProperties> = {
  grid: {
    maxWidth: 1200,
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: 30,
  },
  card: {
    borderRadius: 18,
    overflow: "hidden",
    background: "var(--card-bg)",
    boxShadow: "var(--shadow)",
    display: "flex",
    flexDirection: "column",
  },
  imgWrap: { position: "relative", height: 200, overflow: "hidden", display: "block" },
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
  body: { padding: "20px 24px", flex: 1, display: "flex", flexDirection: "column" },
  meta: { display: "flex", gap: 16, marginBottom: 10, fontSize: 13, color: "var(--text2)" },
  title: { fontSize: 20, fontWeight: 700, color: "var(--primary)", marginBottom: 16 },
  titleLink: { color: "inherit", textDecoration: "none" },
  actions: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginTop: "auto" },
  btnView: {
    flex: 1,
    padding: "10px 16px",
    border: "none",
    borderRadius: 10,
    background: "linear-gradient(135deg, #e67e22, #f39c12)",
    color: "var(--on-accent)",
    fontSize: 14,
    fontWeight: 600,
    textAlign: "center",
    textDecoration: "none",
    boxShadow: "0 4px 15px rgba(230,126,34,0.3)",
    whiteSpace: "nowrap",
  },
  btnRemove: {
    flex: 1,
    padding: "8px 16px",
    border: "2px solid var(--primary)",
    borderRadius: 10,
    background: "transparent",
    color: "var(--primary)",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'Poppins', sans-serif",
    whiteSpace: "nowrap",
  },
  compareRow: { marginBottom: 14 },
  empty: { maxWidth: 600, margin: "0 auto", textAlign: "center", color: "var(--text2)", fontSize: 16, lineHeight: 1.7 },
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
  note: { maxWidth: 1200, margin: "24px auto 0", textAlign: "center", fontSize: 14, color: "var(--text2)" },
};

/** N-7: the visitor's saved packages, resolved against the public packages sent by the server. */
const WishlistList: React.FC<{ packages: TourPackage[] }> = ({ packages }) => {
  const t = useT();
  const hydrated = useHydrated();
  const { ids, remove } = useWishlist();

  if (!hydrated) {
    return <p role="status" style={styles.empty}>{t("wishlist.loading")}</p>;
  }

  const byId = new Map(packages.map((p) => [p.id, p]));
  const saved = ids.map((id) => byId.get(id)).filter((p): p is TourPackage => !!p);
  const unavailable = ids.length - saved.length;

  if (saved.length === 0) {
    return (
      <div style={styles.empty}>
        <p role="status">{t("wishlist.empty")}</p>
        <Link href="/#packages" className="wl-btn" style={styles.emptyLink}>{t("wishlist.browse")}</Link>
        {unavailable > 0 && <p style={styles.note}>{t("wishlist.unavailable", { count: unavailable })}</p>}
      </div>
    );
  }

  return (
    <>
      <style>{`
        .wl-btn:hover { transform: translateY(-2px); }
        .wl-remove:hover { background: var(--primary) !important; color: var(--bg) !important; }
      `}</style>
      <ul style={{ ...styles.grid, listStyle: "none", padding: 0 }}>
        {saved.map((pkg) => (
          <li key={pkg.id} className="card-hover" style={styles.card}>
            <Link href={packagePath(pkg.id)} style={styles.imgWrap} tabIndex={-1} aria-hidden="true">
              <SmartImage
                src={pkg.image || "/images/placeholder.jpg"}
                alt=""
                fill
                sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 380px"
                style={{ objectFit: "cover" }}
              />
              <span style={styles.priceBadge}>&#8377;{formatPrice(pkg.price)}</span>
            </Link>
            <div style={styles.body}>
              <div style={styles.meta}>
                <span>{pkg.duration}</span>
                <span>{pkg.destination}</span>
              </div>
              <h2 style={styles.title}>
                <Link href={packagePath(pkg.id)} style={styles.titleLink}>{pkg.name}</Link>
              </h2>
              <div style={styles.compareRow}>
                <CompareToggle id={pkg.id} name={pkg.name} />
              </div>
              <div style={styles.actions}>
                <Link href={packagePath(pkg.id)} className="wl-btn" style={styles.btnView}>
                  {t("wishlist.viewDetails")}
                </Link>
                <button
                  type="button"
                  className="wl-remove"
                  style={styles.btnRemove}
                  onClick={() => remove(pkg.id)}
                  aria-label={t("wishlist.removeAria", { name: pkg.name })}
                >
                  {t("wishlist.remove")}
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {unavailable > 0 && <p style={styles.note}>{t("wishlist.unavailable", { count: unavailable })}</p>}
    </>
  );
};

export default WishlistList;
