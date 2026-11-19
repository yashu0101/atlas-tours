"use client";

import React, { useState, useEffect, useRef } from "react";
import { SITE_CONFIG, SITE_STATS } from "@/lib/config";
import { useT } from "@/lib/i18n/use-t";
import { shouldAutoplayVideo } from "@/lib/images";

const HERO_VIDEO_SRC = "https://assets.mixkit.co/videos/4064/4064-720.mp4";

/**
 * N-9 video states. "idle" on the server and the first client render (no source attached, so
 * nothing downloads); then "auto" (desktop, fast connection, motion OK) or "manual" (poster +
 * Play button). "playing" after the visitor pressed Play.
 */
type VideoState = "idle" | "auto" | "manual" | "playing";

type NetworkInformationLike = { saveData?: boolean; effectiveType?: string };

const typingKeys = ["hero.typing1", "hero.typing2", "hero.typing3"] as const;

type HeroProps = {
  /** Q-7: number of publicly visible packages, so the stat matches the Packages section. */
  packageCount: number;
};

const Hero: React.FC<HeroProps> = ({ packageCount }) => {
  const t = useT();
  // Q-7: same figures as the Counter section (SITE_STATS); the package stat is hidden when there are none.
  const stats = [
    { value: `${SITE_STATS.happyTravellers}+`, labelKey: "hero.statHappyTravellers" as const },
    ...(packageCount > 0 ? [{ value: String(packageCount), labelKey: "hero.statTourPackages" as const }] : []),
    { value: `${SITE_STATS.destinations}+`, labelKey: "hero.statDestinations" as const },
  ];
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [displayText, setDisplayText] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const [dots, setDots] = useState<
    Array<{ left: number; top: number; delay: number; duration: number; width: number; height: number }>
  >([]);
  // null until mounted (SSR-safe); true when the user prefers reduced motion.
  const [reducedMotion, setReducedMotion] = useState<boolean | null>(null);
  const [videoState, setVideoState] = useState<VideoState>("idle");
  const loadVideo = videoState === "auto" || videoState === "playing";

  useEffect(() => {
    // Generated once on mount (not during render) so SSR/client markup match
    // and sizes don't re-roll on every typing tick.
    const generated = Array.from({ length: 20 }, () => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 3 + Math.random() * 4,
      width: 4 + Math.random() * 6,
      height: 4 + Math.random() * 6,
    }));
    // Intentional mount-only setState: random values must not be generated during
    // render or the server and client markup would differ (hydration mismatch).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDots(generated);
  }, []);

  useEffect(() => {
    const reduce =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Intentional mount-only setState: matchMedia is browser-only, so the
    // preference can't be known during the server render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReducedMotion(reduce);
    const connection = (navigator as Navigator & { connection?: NetworkInformationLike }).connection;
    const auto = shouldAutoplayVideo({
      viewportWidth: window.innerWidth,
      reducedMotion: reduce,
      saveData: connection?.saveData,
      effectiveType: connection?.effectiveType,
    });
    setVideoState(auto ? "auto" : "manual");
  }, []);

  // Start playback once a source is attached (autoplay) or the visitor pressed Play.
  // If the browser refuses autoplay, fall back to the poster + Play button.
  useEffect(() => {
    if (videoState !== "auto" && videoState !== "playing") return;
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    const p = video.play();
    if (p && typeof p.catch === "function") {
      p.catch(() => {
        if (videoState === "auto") setVideoState("manual");
      });
    }
  }, [videoState]);

  useEffect(() => {
    if (reducedMotion !== false) return; // not mounted yet, or reduced motion: no typing loop
    const current = t(typingKeys[textIndex]);

    // Fully typed: hold the phrase, then start deleting. 2680ms reproduces the
    // previous effective hold (an 1800ms nested timer plus overshoot ticks).
    if (!isDeleting && charIndex >= current.length) {
      const hold = setTimeout(() => setIsDeleting(true), 2680);
      return () => clearTimeout(hold);
    }

    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          setDisplayText(current.substring(0, charIndex + 1));
          setCharIndex((p) => p + 1);
        } else {
          setDisplayText(current.substring(0, charIndex - 1));
          setCharIndex((p) => p - 1);
          if (charIndex - 1 === 0) {
            setIsDeleting(false);
            setTextIndex((p) => (p + 1) % typingKeys.length);
          }
        }
      },
      isDeleting ? 40 : 80
    );
    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, textIndex, reducedMotion, t]);

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
      perspective: "1200px",
      transformStyle: "preserve-3d" as const,
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
      background: "linear-gradient(135deg, rgba(26,58,107,0.82) 0%, rgba(15,37,72,0.8) 50%, rgba(230,126,34,0.25) 100%)",
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
      color: "var(--gold-text)",
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
      color: "var(--gold-text)",
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
      color: "var(--on-accent)",
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
      color: "var(--gold-text)",
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 13,
      color: "rgba(255,255,255,0.9)",
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
      color: "rgba(255,255,255,0.8)",
      fontSize: 12,
      letterSpacing: 2,
      textTransform: "uppercase",
    },
    // N-9: bottom-left so it never sits under the fixed WhatsApp button (bottom-right).
    playBtn: {
      position: "absolute",
      bottom: 30,
      left: 24,
      zIndex: 3,
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "8px 16px",
      borderRadius: 30,
      border: "2px solid rgba(255,255,255,0.5)",
      background: "rgba(255,255,255,0.1)",
      color: "#fff",
      fontSize: 13,
      fontWeight: 600,
      cursor: "pointer",
      fontFamily: "'Poppins', sans-serif",
      transition: "all 0.3s",
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
    <section id="home" data-header-tone="dark" style={styles.section}>
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
        .hero-play-btn:hover { background: rgba(255,255,255,0.2) !important; border-color: #fff !important; }
        @keyframes blink-cursor { 0%, 100% { border-color: #f39c12; } 50% { border-color: transparent; } }
      `}</style>

      {/* N-9: preload="none" and no src until it will actually play, so small screens and
          slow/data-saver connections only download the poster. */}
      <video
        ref={videoRef}
        className="kenburns"
        data-parallax="0.35"
        style={styles.video}
        src={loadVideo ? HERO_VIDEO_SRC : undefined}
        autoPlay={loadVideo}
        preload="none"
        muted
        loop
        playsInline
        poster="/images/hero-fallback.jpg"
        aria-hidden="true"
      />

      <div style={styles.overlay} />

      {/* 3D gradient mesh orbs */}
      <div className="hero-mesh" style={{ top: "-10%", left: "-10%", background: "radial-gradient(circle, #f39c12, #e67e22)" }} />
      <div className="hero-mesh" style={{ bottom: "-15%", right: "-10%", background: "radial-gradient(circle, #3498db, #1a3a6b)", animationDelay: "-7s", animationDirection: "reverse" }} />

      {/* 3D floating travel icons */}
      {/* Compass/navigation */}
      <svg className="hero-3d-icon" style={{ top: "10%", left: "6%", width: 110, height: 110 }} viewBox="0 0 24 24" fill="none" stroke="#f39c12" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="rgba(243,156,18,0.15)"/></svg>
      {/* Globe */}
      <svg className="hero-3d-icon" style={{ top: "15%", right: "8%", width: 90, height: 90 }} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
      {/* 3D cube */}
      <svg className="hero-3d-icon" style={{ bottom: "22%", left: "4%", width: 100, height: 100 }} viewBox="0 0 24 24" fill="none" stroke="rgba(243,156,18,0.6)" strokeWidth="1"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"/></svg>
      {/* Airplane */}
      <svg className="hero-3d-icon" style={{ bottom: "12%", right: "6%", width: 85, height: 85 }} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2"><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1z"/></svg>
      {/* Map pin */}
      <svg className="hero-3d-icon" style={{ top: "45%", left: "12%", width: 70, height: 70 }} viewBox="0 0 24 24" fill="none" stroke="rgba(243,156,18,0.45)" strokeWidth="1.2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>

      {/* Floating dots */}
      {dots.map((d, i) => (
        <div
          key={i}
          style={{
            ...styles.dot,
            left: `${d.left}%`,
            top: `${d.top}%`,
            width: d.width,
            height: d.height,
            animation: `float-dot ${d.duration}s ease-in-out ${d.delay}s infinite`,
          }}
        />
      ))}

      <div className="parallax-fade" data-parallax="0.2" style={styles.content}>
        <p className="hero-stagger-1" style={styles.subtitle}>{t("hero.welcome")}</p>
        <h1 className="hero-stagger-2" style={styles.heading}>{t("hero.discover")}</h1>
        <div className="hero-stagger-2" style={styles.typingWrap}>
          <span style={{ ...styles.typingText, animation: "blink-cursor 0.8s infinite" }}>
            {reducedMotion ? t("hero.typing1") : displayText}
          </span>
        </div>
        <p className="hero-stagger-3" style={styles.description}>
          {t("hero.description")}
        </p>
        <div className="hero-stagger-4" style={styles.btnGroup}>
          <a href="#packages" className="hero-btn-primary btn-3d-glow" style={styles.btnPrimary}>
            {t("hero.viewPackages")}
          </a>
          <a
            href={`https://wa.me/${SITE_CONFIG.whatsapp}?text=${encodeURIComponent(t("hero.whatsappMessage"))}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hero-btn-secondary"
            style={styles.btnSecondary}
          >
            {t("hero.bookWhatsApp")}
          </a>
        </div>
        <div className="hero-stagger-5" style={styles.statsRow}>
          {stats.map((s) => (
            <div key={s.labelKey} className="glass stat-3d glass-shimmer" style={{ ...styles.statCard, position: "relative", overflow: "hidden" }}>
              <div style={styles.statValue}>{s.value}</div>
              <div style={styles.statLabel}>{t(s.labelKey)}</div>
            </div>
          ))}
        </div>
      </div>

      {videoState === "manual" && (
        <button
          type="button"
          className="hero-play-btn"
          style={styles.playBtn}
          onClick={() => setVideoState("playing")}
          aria-label={t("hero.playVideoAria")}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M7 4.5v15a1 1 0 001.5.86l12.5-7.5a1 1 0 000-1.72L8.5 3.64A1 1 0 007 4.5z" />
          </svg>
          {t("hero.playVideo")}
        </button>
      )}

      <div className="parallax-fade" data-parallax="0" style={styles.scrollIndicator}>
        <span>{t("hero.scroll")}</span>
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
