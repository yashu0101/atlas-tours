"use client";

import React, { useState, useEffect, useRef } from "react";
import { SITE_CONFIG } from "@/lib/config";
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

const stats = [
  { value: "500+", labelKey: "hero.statHappyTravellers" },
  { value: "15+", labelKey: "hero.statTourPackages" },
  { value: "10+", labelKey: "hero.statDestinations" },
] as const;

const Hero: React.FC = () => {
  const t = useT();
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
        .hero-play-btn:hover { background: rgba(255,255,255,0.2) !important; border-color: #fff !important; }
        @keyframes blink-cursor { 0%, 100% { border-color: #f39c12; } 50% { border-color: transparent; } }
      `}</style>

      {/* N-9: preload="none" and no src until it will actually play, so small screens and
          slow/data-saver connections only download the poster. */}
      <video
        ref={videoRef}
        className="kenburns"
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

      <div style={styles.content}>
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
          <a href="#packages" className="hero-btn-primary pulse-glow" style={styles.btnPrimary}>
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
            <div key={s.labelKey} className="glass" style={styles.statCard}>
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

      <div style={styles.scrollIndicator}>
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
