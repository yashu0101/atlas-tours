"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

const showcaseItems = [
  {
    src: "/images/showcase-group.jpeg",
    title: "Happy Tour Groups",
    description: "Our travelers enjoying memorable journeys across India",
  },
  {
    src: "/images/showcase-frontdesk.jpeg",
    title: "Professional Front Desk",
    description: "Dedicated team ensuring a warm welcome at every stay",
  },
];

const packagePosters = [
  {
    id: "pkg-odisha",
    src: "/images/pkg-odisha.jpeg",
    title: "Odisha Tour Package",
    duration: "6 Days / 5 Nights",
    price: "₹11,999",
    destinations: "Bhubaneswar • Puri • Konark • Chilika",
  },
  {
    id: "pkg-rajasthan",
    src: "/images/pkg-rajasthan.jpeg",
    title: "Royal Rajasthan Tour",
    duration: "8 Days / 7 Nights",
    price: "₹17,500",
    destinations: "Jaipur • Jodhpur • Jaisalmer • Udaipur",
  },
  {
    id: "pkg-up-spiritual",
    src: "/images/pkg-up-spiritual.jpeg",
    title: "Spiritual Wonders of UP",
    duration: "3 to 8 Days",
    price: "₹12,699",
    destinations: "Ayodhya • Varanasi • Prayagraj • Agra",
  },
];

const Showcase: React.FC = () => {
  const styles: Record<string, React.CSSProperties> = {
    section: {
      padding: "100px 24px",
      fontFamily: "'Poppins', sans-serif",
      background: "var(--bg2)",
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
      maxWidth: 540,
      margin: "0 auto",
    },
    grid: {
      maxWidth: 1100,
      margin: "0 auto",
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
      gap: 30,
    },
    card: {
      borderRadius: 18,
      overflow: "hidden",
      background: "var(--card-bg)",
      boxShadow: "var(--shadow)",
      transition: "transform 0.4s cubic-bezier(.16,1,.3,1), box-shadow 0.4s",
    },
    imgWrap: {
      position: "relative",
      height: 320,
      overflow: "hidden",
    },
    overlay: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      padding: "24px",
      background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
      color: "#fff",
      zIndex: 2,
    },
    title: {
      fontSize: 20,
      fontWeight: 700,
      marginBottom: 6,
      lineHeight: 1.3,
    },
    desc: {
      fontSize: 14,
      opacity: 0.85,
      lineHeight: 1.5,
    },
    packagesHeader: {
      textAlign: "center" as const,
      marginTop: 70,
      marginBottom: 40,
    },
    pkgGrid: {
      maxWidth: 1100,
      margin: "0 auto",
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
      gap: 28,
    },
    pkgCard: {
      borderRadius: 18,
      overflow: "hidden",
      background: "var(--card-bg)",
      boxShadow: "var(--shadow)",
      transition: "transform 0.4s cubic-bezier(.16,1,.3,1), box-shadow 0.4s",
      textDecoration: "none",
      color: "inherit",
      display: "block",
      cursor: "pointer",
    },
    pkgImgWrap: {
      position: "relative" as const,
      height: 380,
      overflow: "hidden",
    },
    pkgInfo: {
      padding: "20px 22px",
    },
    pkgTitle: {
      fontSize: 18,
      fontWeight: 700,
      color: "var(--primary)",
      marginBottom: 6,
    },
    pkgDest: {
      fontSize: 13,
      color: "var(--text2)",
      marginBottom: 10,
      lineHeight: 1.4,
    },
    pkgMeta: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    pkgDuration: {
      fontSize: 13,
      color: "var(--text2)",
      fontWeight: 500,
    },
    pkgPrice: {
      fontSize: 18,
      fontWeight: 800,
      color: "#e67e22",
    },
    viewBtn: {
      marginTop: 14,
      display: "inline-block",
      background: "linear-gradient(135deg, #e67e22, #f39c12)",
      color: "#fff",
      padding: "8px 20px",
      borderRadius: 20,
      fontSize: 13,
      fontWeight: 600,
      letterSpacing: 0.5,
    },
  };

  return (
    <section id="showcase" style={styles.section}>
      <style>{`
        .showcase-card:hover { transform: translateY(-8px); box-shadow: 0 16px 48px rgba(0,0,0,0.15) !important; }
        .showcase-card .showcase-img { transition: transform 0.8s cubic-bezier(.16,1,.3,1); }
        .showcase-card:hover .showcase-img { transform: scale(1.06); }
        .founder-card:hover { transform: translateY(-6px); box-shadow: 0 20px 50px rgba(0,0,0,0.12) !important; }
        .founder-card .founder-img { transition: transform 0.8s cubic-bezier(.16,1,.3,1); }
        .founder-card:hover .founder-img { transform: scale(1.04); }
        @media (max-width: 768px) {
          .showcase-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div className="reveal" style={styles.header}>
        <span style={styles.badge}>Showcase</span>
        <h2 style={styles.heading}>Our Moments</h2>
        <p style={styles.subheading}>
          A glimpse of the experiences, hospitality, and journeys that define Atlas Tours.
        </p>
      </div>

      <div className="showcase-grid" style={styles.grid}>
        {showcaseItems.map((item, i) => (
          <div
            key={i}
            className={`showcase-card card-hover reveal stagger-${i + 1}`}
            style={styles.card}
          >
            <div style={styles.imgWrap}>
              <Image
                className="showcase-img"
                src={item.src}
                alt={item.title}
                fill
                style={{ objectFit: "cover" }}
              />
              <div style={styles.overlay}>
                <div style={styles.title}>{item.title}</div>
                <div style={styles.desc}>{item.description}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Founder */}
      <div className="reveal" style={{ maxWidth: 480, margin: "60px auto 0", textAlign: "center" as const }}>
        <div
          className="founder-card"
          style={{
            borderRadius: 22,
            overflow: "hidden",
            background: "var(--card-bg)",
            boxShadow: "var(--shadow)",
            transition: "transform 0.4s cubic-bezier(.16,1,.3,1), box-shadow 0.4s",
          }}
        >
          <div style={{ position: "relative", height: 360, overflow: "hidden" }}>
            <Image
              className="founder-img"
              src="/images/founder.jpeg"
              alt="Ashfaque Ahmed — Founder, Atlas Tour & Travels"
              fill
              style={{ objectFit: "cover", objectPosition: "center top" }}
            />
          </div>
          <div style={{ padding: "22px 20px 26px" }}>
            <div style={{
              display: "inline-block",
              background: "linear-gradient(135deg, #e67e22, #f39c12)",
              color: "#fff",
              padding: "4px 16px",
              borderRadius: 14,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1.5,
              textTransform: "uppercase" as const,
              marginBottom: 10,
            }}>
              Founder
            </div>
            <div style={{
              fontSize: 22,
              fontWeight: 800,
              color: "var(--primary)",
              marginBottom: 4,
            }}>
              Ashfaque Ahmed
            </div>
            <div style={{
              fontSize: 14,
              color: "var(--text2)",
              lineHeight: 1.5,
            }}>
              Atlas Tour & Travels
            </div>
          </div>
        </div>
      </div>

      {/* Tour Package Posters */}
      <div className="reveal" style={styles.packagesHeader}>
        <span style={styles.badge}>Tour Packages</span>
        <h2 style={styles.heading}>Our Signature Tours</h2>
        <p style={styles.subheading}>
          Handcrafted itineraries for unforgettable journeys. Click to explore full details.
        </p>
      </div>

      <div className="showcase-grid" style={styles.pkgGrid}>
        {packagePosters.map((pkg, i) => (
          <Link
            key={pkg.id}
            href={`/packages/${pkg.id}`}
            className={`showcase-card card-hover reveal stagger-${i + 1}`}
            style={styles.pkgCard}
          >
            <div style={styles.pkgImgWrap}>
              <Image
                className="showcase-img"
                src={pkg.src}
                alt={pkg.title}
                fill
                style={{ objectFit: "cover" }}
              />
            </div>
            <div style={styles.pkgInfo}>
              <div style={styles.pkgTitle}>{pkg.title}</div>
              <div style={styles.pkgDest}>{pkg.destinations}</div>
              <div style={styles.pkgMeta}>
                <span style={styles.pkgDuration}>{pkg.duration}</span>
                <span style={styles.pkgPrice}>{pkg.price}</span>
              </div>
              <span style={styles.viewBtn}>View Details →</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default Showcase;
