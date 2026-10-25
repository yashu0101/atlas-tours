"use client";

import React, { useState, useEffect, useRef } from "react";

const typingTexts = [
  "Incredible Destinations",
  "Spiritual Journeys",
  "Divine Experiences",
];

const stats = [
  { value: "500+", label: "Happy Travellers" },
  { value: "15+", label: "Tour Packages" },
  { value: "10+", label: "Destinations" },
];

const Hero: React.FC = () => {
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [displayText, setDisplayText] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const [dots, setDots] = useState<Array<{ left: number; top: number; delay: number; duration: number }>>([]);

  useEffect(() => {
    const generated = Array.from({ length: 20 }, () => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 3 + Math.random() * 4,
    }));
    setDots(generated);
  }, []);

  useEffect(() => {
    const current = typingTexts[textIndex];
    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          setDisplayText(current.substring(0, charIndex + 1));
          setCharIndex((p) => p + 1);
          if (charIndex + 1 === current.length) {
            setTimeout(() => setIsDeleting(true), 1800);
          }
        } else {
          setDisplayText(current.substring(0, charIndex - 1));
          setCharIndex((p) => p - 1);
          if (charIndex - 1 === 0) {
            setIsDeleting(false);
            setTextIndex((p) => (p + 1) % typingTexts.length);
          }
        }
      },
      isDeleting ? 40 : 80
    );
    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, textIndex]);

  const styles: Record<string, React.CSSProperties> = {
    section: {
      position: "relative",
      width: "100%",
      height: "100vh",
      minHeight: 700,
      overflow: "hidden",
      fontFamily: "'Poppins', sans-serif",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    video: {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      objectFit: "cover",
      zIndex: 0,
    },
    overlay: {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      background: "linear-gradient(135deg, rgba(26,58,107,0.82) 0%, rgba(15,37,72,0.7) 50%, rgba(230,126,34,0.25) 100%)",
      zIndex: 1,
    },
    content: {
      position: "relative",
      zIndex: 2,
      textAlign: "center",
      color: "#fff",
      maxWidth: 900,
      padding: "0 24px",
    },
    subtitle: {
      fontSize: 16,
      fontWeight: 500,
      letterSpacing: 4,
      textTransform: "uppercase",
      color: "#f39c12",
      marginBottom: 16,
    },
    heading: {
      fontSize: "clamp(36px, 6vw, 64px)",
      fontWeight: 800,
      lineHeight: 1.15,
      marginBottom: 8,
    },
    typingWrap: {
      minHeight: 70,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 24,
    },
    typingText: {
      fontSize: "clamp(24px, 4vw, 44px)",
      fontWeight: 700,
      color: "#f39c12",
      borderRight: "3px solid #f39c12",
      paddingRight: 4,
    },
    description: {
      fontSize: 17,
      lineHeight: 1.7,
      color: "rgba(255,255,255,0.85)",
      maxWidth: 600,
      margin: "0 auto 36px",
    },
    btnGroup: {
      display: "flex",
      gap: 16,
      justifyContent: "center",
      flexWrap: "wrap",
      marginBottom: 50,
    },
    btnPrimary: {
      background: "linear-gradient(135deg, #e67e22, #f39c12)",
      color: "#fff",
      border: "none",
      borderRadius: 30,
      padding: "14px 36px",
      fontSize: 16,
      fontWeight: 600,
      cursor: "pointer",
      textDecoration: "none",
      boxShadow: "0 6px 25px rgba(230,126,34,0.45)",
      transition: "all 0.3s",
      fontFamily: "'Poppins', sans-serif",
    },
    btnSecondary: {
      background: "transparent",
      color: "#fff",
      border: "2px solid rgba(255,255,255,0.5)",
      borderRadius: 30,
      padding: "14px 36px",
      fontSize: 16,
      fontWeight: 600,
      cursor: "pointer",
      textDecoration: "none",
      transition: "all 0.3s",
      fontFamily: "'Poppins', sans-serif",
    },
    statsRow: {
      display: "flex",
      justifyContent: "center",
      gap: 24,
      flexWrap: "wrap",
    },
    statCard: {
      background: "rgba(255,255,255,0.1)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      border: "1px solid rgba(255,255,255,0.2)",
      borderRadius: 16,
      padding: "20px 32px",
      minWidth: 180,
      textAlign: "center",
    },
    statValue: {
      fontSize: 30,
      fontWeight: 800,
      color: "#f39c12",
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 13,
      color: "rgba(255,255,255,0.8)",
      fontWeight: 500,
    },
    scrollIndicator: {
      position: "absolute",
      bottom: 30,
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 3,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 8,
      color: "rgba(255,255,255,0.6)",
      fontSize: 12,
      letterSpacing: 2,
      textTransform: "uppercase",
    },
    scrollMouse: {
      width: 26,
      height: 40,
      border: "2px solid rgba(255,255,255,0.5)",
      borderRadius: 13,
      position: "relative",
    },
    dot: {
      position: "absolute",
      borderRadius: "50%",
      background: "rgba(243,156,18,0.3)",
      pointerEvents: "none",
      zIndex: 1,
    },
  };

  return (
    <section id="home" style={styles.section}>
      <style>{`
        @keyframes float-dot {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
          50% { transform: translateY(-30px) scale(1.3); opacity: 0.7; }
        }
        @keyframes scroll-wheel {
          0% { top: 6px; opacity: 1; }
          100% { top: 22px; opacity: 0; }
        }
        .hero-btn-primary:hover { transform: translateY(-3px); box-shadow: 0 8px 30px rgba(230,126,34,0.6) !important; }
        .hero-btn-secondary:hover { background: rgba(255,255,255,0.15) !important; border-color: #fff !important; }
        @keyframes blink-cursor { 0%, 100% { border-color: #f39c12; } 50% { border-color: transparent; } }
      `}</style>

      <video
        ref={videoRef}
        style={styles.video}
        autoPlay
        muted
        loop
        playsInline
        poster="/images/hero-fallback.jpg"
      >
        <source
          src="https://assets.mixkit.co/videos/4064/4064-720.mp4"
          type="video/mp4"
        />
      </video>

      <div style={styles.overlay} />

      {/* Floating dots */}
      {dots.map((d, i) => (
        <div
          key={i}
          style={{
            ...styles.dot,
            left: `${d.left}%`,
            top: `${d.top}%`,
            width: 4 + Math.random() * 6,
            height: 4 + Math.random() * 6,
            animation: `float-dot ${d.duration}s ease-in-out ${d.delay}s infinite`,
          }}
        />
      ))}

      <div style={styles.content}>
        <p style={styles.subtitle}>Welcome to Atlas Tours</p>
        <h1 style={styles.heading}>Discover</h1>
        <div style={styles.typingWrap}>
          <span style={{ ...styles.typingText, animation: "blink-cursor 0.8s infinite" }}>
            {displayText}
          </span>
        </div>
        <p style={styles.description}>
          Experience the magic of India with curated travel packages designed
          for spiritual seekers, adventure lovers, and culture enthusiasts.
        </p>
        <div style={styles.btnGroup}>
          <a href="#packages" className="hero-btn-primary" style={styles.btnPrimary}>
            View Packages
          </a>
          <a
            href="https://wa.me/916388360881?text=Hello!%20I%20am%20interested%20in%20booking%20a%20tour."
            target="_blank"
            rel="noopener noreferrer"
            className="hero-btn-secondary"
            style={styles.btnSecondary}
          >
            Book on WhatsApp
          </a>
        </div>
        <div style={styles.statsRow}>
          {stats.map((s) => (
            <div key={s.label} style={styles.statCard}>
              <div style={styles.statValue}>{s.value}</div>
              <div style={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.scrollIndicator}>
        <span>Scroll</span>
        <div style={styles.scrollMouse}>
          <div
            style={{
              width: 4,
              height: 8,
              borderRadius: 2,
              background: "#f39c12",
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              animation: "scroll-wheel 1.5s infinite",
            }}
          />
        </div>
      </div>
    </section>
  );
};

export default Hero;
