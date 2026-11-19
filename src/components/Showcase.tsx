"use client";

import React from "react";
import Image from "next/image";

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
  };

  return (
    <section id="showcase" style={styles.section}>
      <style>{`
        .showcase-card:hover { transform: translateY(-8px); box-shadow: 0 16px 48px rgba(0,0,0,0.15) !important; }
        .showcase-card .showcase-img { transition: transform 0.8s cubic-bezier(.16,1,.3,1); }
        .showcase-card:hover .showcase-img { transform: scale(1.06); }
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
    </section>
  );
};

export default Showcase;
