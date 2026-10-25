"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";

interface Package {
  _id: string;
  name: string;
  slug: string;
  destination: string;
  duration: string;
  price: number;
  originalPrice?: number;
  image: string;
  highlights: string[];
  itinerary?: { day: number; title: string; description: string }[];
  inclusions?: string[];
  exclusions?: string[];
  description?: string;
}

const Packages: React.FC = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPkg, setSelectedPkg] = useState<Package | null>(null);

  useEffect(() => {
    fetch("/api/packages")
      .then((r) => r.json())
      .then((data) => {
        setPackages(Array.isArray(data) ? data : data.packages || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

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
      color: "#e67e22",
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
      color: "#fff",
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
      background: "#27ae60",
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
      color: "#888",
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
      background: "rgba(26,58,107,0.06)",
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
      color: "#fff",
      fontSize: 14,
      fontWeight: 600,
      cursor: "pointer",
      fontFamily: "'Poppins', sans-serif",
      boxShadow: "0 4px 15px rgba(230,126,34,0.3)",
      transition: "all 0.3s",
    },
    originalPrice: {
      textDecoration: "line-through",
      color: "rgba(255,255,255,0.7)",
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
      color: "#888",
    },
    modalDesc: {
      fontSize: 15,
      lineHeight: 1.8,
      color: "var(--text2)",
      marginBottom: 24,
    },
    itineraryDay: {
      padding: "16px 0",
      borderBottom: "1px solid #eee",
    },
    dayNum: {
      display: "inline-block",
      background: "linear-gradient(135deg, #e67e22, #f39c12)",
      color: "#fff",
      padding: "3px 12px",
      borderRadius: 6,
      fontSize: 12,
      fontWeight: 700,
      marginRight: 10,
    },
    dayTitle: {
      fontSize: 15,
      fontWeight: 600,
      color: "#1a3a6b",
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
    loader: {
      textAlign: "center",
      padding: 60,
      fontSize: 16,
      color: "#888",
    },
  };

  return (
    <section id="packages" style={styles.section}>
      <style>{`
        .pkg-card:hover { transform: translateY(-8px); box-shadow: 0 16px 50px rgba(0,0,0,0.12) !important; }
        .pkg-btn:hover { transform: translateY(-2px); }
        @media (max-width: 768px) {
          .pkg-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={styles.header}>
        <span style={styles.badge}>Our Packages</span>
        <h2 style={styles.heading}>Popular Tour Packages</h2>
        <p style={styles.subheading}>
          Choose from our carefully curated travel packages designed for unforgettable experiences.
        </p>
      </div>

      {loading ? (
        <div style={styles.loader}>Loading packages...</div>
      ) : (
        <div className="pkg-grid" style={{ ...styles.grid, gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))" }}>
          {packages.map((pkg) => (
            <div key={pkg._id} className="pkg-card" style={styles.card}>
              <div style={styles.cardImgWrap}>
                <Image
                  src={pkg.image || "/images/placeholder.jpg"}
                  alt={pkg.name}
                  fill
                  style={{ objectFit: "cover" }}
                />
                <div style={styles.priceBadge}>
                  <div>&#8377;{pkg.price?.toLocaleString()}</div>
                  {pkg.originalPrice && (
                    <div style={styles.originalPrice}>
                      &#8377;{pkg.originalPrice.toLocaleString()}
                    </div>
                  )}
                </div>
                {pkg.originalPrice && (
                  <div style={styles.discountBadge}>
                    {discount(pkg.originalPrice, pkg.price)}% OFF
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
                <div style={styles.cardActions}>
                  <button
                    className="pkg-btn"
                    style={styles.btnView}
                    onClick={() => setSelectedPkg(pkg)}
                  >
                    View Details
                  </button>
                  <a
                    className="pkg-btn"
                    href={`https://wa.me/916388360881?text=Hi! I'm interested in the ${encodeURIComponent(pkg.name)} package.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ ...styles.btnBook, textDecoration: "none", textAlign: "center" }}
                  >
                    Book Now
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedPkg && (
        <div style={styles.modalOverlay} onClick={() => setSelectedPkg(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <Image
                src={selectedPkg.image || "/images/placeholder.jpg"}
                alt={selectedPkg.name}
                fill
                style={{ objectFit: "cover" }}
              />
              <button style={styles.modalClose} onClick={() => setSelectedPkg(null)}>
                &#10005;
              </button>
            </div>
            <div style={styles.modalBody}>
              <h2 style={styles.modalTitle}>{selectedPkg.name}</h2>
              <div style={styles.modalMeta}>
                <span>{selectedPkg.duration}</span>
                <span>{selectedPkg.destination}</span>
                <span style={{ color: "#e67e22", fontWeight: 700 }}>
                  &#8377;{selectedPkg.price?.toLocaleString()}
                </span>
              </div>
              {selectedPkg.description && (
                <p style={styles.modalDesc}>{selectedPkg.description}</p>
              )}

              {selectedPkg.itinerary && selectedPkg.itinerary.length > 0 && (
                <>
                  <h3 style={styles.sectionTitle}>Itinerary</h3>
                  {selectedPkg.itinerary.map((day) => (
                    <div key={day.day} style={styles.itineraryDay}>
                      <span style={styles.dayNum}>Day {day.day}</span>
                      <span style={styles.dayTitle}>{day.title}</span>
                      <p style={styles.dayDesc}>{day.description}</p>
                    </div>
                  ))}
                </>
              )}

              {selectedPkg.inclusions && selectedPkg.inclusions.length > 0 && (
                <>
                  <h3 style={styles.sectionTitle}>Inclusions</h3>
                  <ul style={styles.inclusionList}>
                    {selectedPkg.inclusions.map((item, i) => (
                      <li key={i} style={styles.inclusionItem}>
                        <span style={{ color: "#27ae60" }}>&#10003;</span> {item}
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {selectedPkg.exclusions && selectedPkg.exclusions.length > 0 && (
                <>
                  <h3 style={styles.sectionTitle}>Exclusions</h3>
                  <ul style={styles.inclusionList}>
                    {selectedPkg.exclusions.map((item, i) => (
                      <li key={i} style={styles.inclusionItem}>
                        <span style={{ color: "#e74c3c" }}>&#10007;</span> {item}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Packages;
