"use client";

import React from "react";
import Image from "next/image";

const features = [
  { icon: "shield", title: "Trusted Agency", desc: "Registered and reliable travel partner with years of trust." },
  { icon: "tag", title: "Best Prices", desc: "Competitive pricing with no hidden charges or surprises." },
  { icon: "users", title: "Expert Guides", desc: "Knowledgeable local guides for immersive experiences." },
  { icon: "headphones", title: "24/7 Support", desc: "Round-the-clock assistance throughout your journey." },
];

const iconPaths: Record<string, string> = {
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  tag: "M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01",
  users: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
  headphones: "M3 18v-6a9 9 0 0118 0v6M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z",
};

const About: React.FC = () => {
  const styles: Record<string, React.CSSProperties> = {
    section: {
      padding: "100px 24px",
      fontFamily: "'Poppins', sans-serif",
      background: "#f8f9fa",
    },
    container: {
      maxWidth: 1200,
      margin: "0 auto",
      display: "flex",
      gap: 60,
      alignItems: "center",
      flexWrap: "wrap",
    },
    imageCol: {
      flex: "1 1 400px",
      position: "relative",
    },
    imgWrap: {
      borderRadius: 20,
      overflow: "hidden",
      boxShadow: "0 20px 60px rgba(26,58,107,0.15)",
      position: "relative",
    },
    imgDecor: {
      position: "absolute",
      bottom: -20,
      right: -20,
      width: 150,
      height: 150,
      border: "4px solid #e67e22",
      borderRadius: 20,
      zIndex: -1,
    },
    textCol: {
      flex: "1 1 400px",
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
      marginBottom: 16,
    },
    heading: {
      fontSize: "clamp(28px, 4vw, 40px)",
      fontWeight: 800,
      color: "#1a3a6b",
      lineHeight: 1.25,
      marginBottom: 20,
    },
    accent: {
      color: "#e67e22",
    },
    desc: {
      fontSize: 16,
      lineHeight: 1.8,
      color: "#555",
      marginBottom: 32,
    },
    featuresGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(2, 1fr)",
      gap: 20,
      marginBottom: 36,
    },
    featureCard: {
      display: "flex",
      gap: 14,
      alignItems: "flex-start",
      padding: 16,
      borderRadius: 12,
      background: "#fff",
      boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
      transition: "transform 0.3s, box-shadow 0.3s",
    },
    featureIcon: {
      width: 44,
      height: 44,
      borderRadius: 10,
      background: "linear-gradient(135deg, #e67e22, #f39c12)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    featureTitle: {
      fontSize: 15,
      fontWeight: 700,
      color: "#1a3a6b",
      marginBottom: 4,
    },
    featureDesc: {
      fontSize: 13,
      color: "#777",
      lineHeight: 1.5,
    },
    btnGroup: {
      display: "flex",
      gap: 14,
      flexWrap: "wrap",
    },
    btnPrimary: {
      background: "linear-gradient(135deg, #e67e22, #f39c12)",
      color: "#fff",
      border: "none",
      borderRadius: 28,
      padding: "12px 32px",
      fontSize: 15,
      fontWeight: 600,
      cursor: "pointer",
      textDecoration: "none",
      boxShadow: "0 6px 20px rgba(230,126,34,0.35)",
      fontFamily: "'Poppins', sans-serif",
    },
    btnOutline: {
      background: "transparent",
      color: "#1a3a6b",
      border: "2px solid #1a3a6b",
      borderRadius: 28,
      padding: "12px 32px",
      fontSize: 15,
      fontWeight: 600,
      cursor: "pointer",
      textDecoration: "none",
      fontFamily: "'Poppins', sans-serif",
    },
  };

  return (
    <section id="about" style={styles.section}>
      <style>{`
        .about-feature:hover { transform: translateY(-4px); box-shadow: 0 8px 25px rgba(0,0,0,0.1) !important; }
        @media (max-width: 768px) {
          .about-features-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
      <div style={styles.container}>
        <div style={styles.imageCol}>
          <div style={styles.imgWrap}>
            <Image
              src="/images/about.jpg"
              alt="About Atlas Tours"
              width={500}
              height={600}
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </div>
          <div style={styles.imgDecor} />
        </div>

        <div style={styles.textCol}>
          <span style={styles.badge}>About Us</span>
          <h2 style={styles.heading}>
            Crafting Unforgettable <span style={styles.accent}>Travel Experiences</span>
          </h2>
          <p style={styles.desc}>
            Atlas Tours is a premier travel agency specializing in spiritual and
            cultural tours across India. From the sacred ghats of Varanasi to the
            majestic peaks of the Himalayas, we curate journeys that transform
            and inspire. With a commitment to quality and personalized service, we
            ensure every trip becomes a cherished memory.
          </p>

          <div className="about-features-grid" style={styles.featuresGrid}>
            {features.map((f) => (
              <div key={f.title} className="about-feature" style={styles.featureCard}>
                <div style={styles.featureIcon}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={iconPaths[f.icon]} />
                  </svg>
                </div>
                <div>
                  <div style={styles.featureTitle}>{f.title}</div>
                  <div style={styles.featureDesc}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={styles.btnGroup}>
            <a href="#packages" style={styles.btnPrimary}>
              Explore Packages
            </a>
            <a href="#contact" style={styles.btnOutline}>
              Get In Touch
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
