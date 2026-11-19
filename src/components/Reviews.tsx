"use client";
import RevealWords from "@/components/RevealWords";

import React, { useState, useEffect } from "react";
import type { Review } from "@/lib/types";
import { useT } from "@/lib/i18n/use-t";

/** Reviews are loaded on the server (F-02) and passed in already filtered for public visibility. */
const Reviews: React.FC<{ initialReviews: Review[] }> = ({ initialReviews }) => {
  const reviews = initialReviews;
  const t = useT();
  const [current, setCurrent] = useState(0);
  const [slideDir, setSlideDir] = useState<"right" | "left">("right");
  // E-08 / Q-6 (WCAG 2.2.2): auto-advance pauses while the carousel is hovered or holds
  // *keyboard* focus (mouse clicks don't count), never runs under prefers-reduced-motion, and
  // can be stopped with the visible pause/play button (userPaused persists until play is pressed).
  // Pressing play also clears the focus pause, so rotation resumes even though focus stays on
  // the button (the usual carousel pattern).
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const canRotate = reviews.length > 1 && !reducedMotion;
  const rotating = canRotate && !userPaused && !hovered && !focused;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // One timeout per slide: any change of slide (auto or manual) restarts the 5s countdown,
  // and pausing clears it.
  useEffect(() => {
    if (!rotating) return;
    const timer = setTimeout(() => {
      setSlideDir("right");
      setCurrent((p) => (p + 1) % reviews.length);
    }, 5000);
    return () => clearTimeout(timer);
  }, [rotating, current, reviews.length]);

  const goTo = (i: number, dir: "right" | "left" = "right") => {
    setSlideDir(dir);
    setCurrent(i);
  };

  const renderStars = (n: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <span key={i} aria-hidden="true" style={{ color: i < n ? "#f39c12" : "#ddd", fontSize: 20 }}>
        &#9733;
      </span>
    ));

  const styles: Record<string, React.CSSProperties> = {
    section: {
      padding: "var(--section-pad) 24px",
      fontFamily: "'Poppins', sans-serif",
      background: "linear-gradient(135deg, #1a3a6b 0%, #0f2548 100%)",
      color: "#fff",
    },
    header: {
      textAlign: "center",
      marginBottom: 50,
    },
    badge: {
      display: "inline-block",
      background: "rgba(243,156,18,0.2)",
      color: "var(--gold-text)",
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
      marginBottom: 12,
    },
    subheading: {
      fontSize: 16,
      color: "rgba(255,255,255,0.6)",
      maxWidth: 500,
      margin: "0 auto",
    },
    carousel: {
      maxWidth: 700,
      margin: "0 auto",
      textAlign: "center",
      position: "relative",
      minHeight: 280,
    },
    card: {
      background: "rgba(255,255,255,0.08)",
      backdropFilter: "blur(12px)",
      border: "1px solid rgba(255,255,255,0.12)",
      borderRadius: 20,
      padding: "40px 36px",
      transition: "all 0.5s ease",
    },
    avatar: {
      width: 70,
      height: 70,
      borderRadius: "50%",
      background: "linear-gradient(135deg, #e67e22, #f39c12)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 28,
      fontWeight: 700,
      margin: "0 auto 16px",
      color: "var(--on-accent)",
    },
    stars: {
      marginBottom: 16,
    },
    message: {
      fontSize: 17,
      lineHeight: 1.8,
      color: "rgba(255,255,255,0.85)",
      fontStyle: "italic",
      marginBottom: 20,
    },
    name: {
      fontSize: 18,
      fontWeight: 700,
      color: "var(--gold-text)",
      marginBottom: 4,
    },
    meta: {
      fontSize: 13,
      color: "rgba(255,255,255,0.7)",
    },
    dots: {
      display: "flex",
      justifyContent: "center",
      gap: 10,
      marginTop: 30,
    },
    dot: {
      width: 12,
      height: 12,
      borderRadius: "50%",
      border: "none",
      cursor: "pointer",
      transition: "all 0.3s",
      padding: 0,
    },
    arrows: {
      display: "flex",
      justifyContent: "center",
      gap: 16,
      marginTop: 24,
    },
    arrow: {
      width: 44,
      height: 44,
      borderRadius: "50%",
      background: "rgba(255,255,255,0.1)",
      border: "1px solid rgba(255,255,255,0.2)",
      color: "#fff",
      fontSize: 20,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "all 0.3s",
    },
  };

  if (reviews.length === 0) return null;

  const review = reviews[current];

  return (
    <section id="reviews" data-header-tone="dark" style={styles.section}>
      <style>{`
        .review-arrow:hover { background: rgba(243,156,18,0.3) !important; border-color: #f39c12 !important; }
      `}</style>
      <div className="reveal" style={styles.header}>
        <span style={styles.badge}>{t("reviews.badge")}</span>
        <h2 className="heading-line" style={styles.heading}><RevealWords text={t("reviews.heading")} /></h2>
        <p style={styles.subheading}>
          {t("reviews.subheading")}
        </p>
      </div>

      <div
        className="reveal-blur"
        style={styles.carousel}
        role="region"
        aria-roledescription="carousel"
        aria-label={t("reviews.carouselAria")}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={(e) => {
          if ((e.target as HTMLElement).matches?.(":focus-visible")) setFocused(true);
        }}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false);
        }}
      >
        {/* Stable live region (the slide itself remounts via key); silent while auto-rotating. */}
        <div aria-live={rotating ? "off" : "polite"} aria-atomic="true">
          <div
            key={current}
            role="group"
            aria-roledescription="slide"
            aria-label={t("reviews.slideAria", { current: current + 1, total: reviews.length })}
            className={slideDir === "right" ? "slide-in-right" : "slide-in-left"}
            style={styles.card}
          >
            <div style={styles.avatar} aria-hidden="true">
              {review.name?.charAt(0).toUpperCase()}
            </div>
            <div style={styles.stars} role="img" aria-label={t("reviews.starsAria", { rating: review.rating })}>
              {renderStars(review.rating)}
            </div>
            <p style={styles.message}>&ldquo;{review.text}&rdquo;</p>
            <div style={styles.name}>{review.name}</div>
            <div style={styles.meta}>
              {[review.city, review.packageName].filter(Boolean).join(" | ")}
            </div>
          </div>
        </div>

        <div style={styles.arrows}>
          <button
            className="review-arrow"
            style={styles.arrow}
            onClick={() => goTo((current - 1 + reviews.length) % reviews.length, "left")}
            aria-label={t("reviews.previousAria")}
          >
            <span aria-hidden="true">&#8249;</span>
          </button>
          {canRotate && (
            <button
              className="review-arrow"
              style={styles.arrow}
              onClick={() => {
                if (userPaused) setFocused(false);
                setUserPaused(!userPaused);
              }}
              aria-label={userPaused ? t("reviews.playAria") : t("reviews.pauseAria")}
            >
              {userPaused ? (
                <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" focusable="false">
                  <path d="M3 1.5v11l9-5.5z" fill="currentColor" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" focusable="false">
                  <rect x="2.5" y="1.5" width="3" height="11" rx="0.5" fill="currentColor" />
                  <rect x="8.5" y="1.5" width="3" height="11" rx="0.5" fill="currentColor" />
                </svg>
              )}
            </button>
          )}
          <button
            className="review-arrow"
            style={styles.arrow}
            onClick={() => goTo((current + 1) % reviews.length)}
            aria-label={t("reviews.nextAria")}
          >
            <span aria-hidden="true">&#8250;</span>
          </button>
        </div>

        <div style={styles.dots}>
          {reviews.map((_, i) => (
            <button
              key={i}
              style={{
                ...styles.dot,
                background: i === current ? "#f39c12" : "rgba(255,255,255,0.4)",
                transform: i === current ? "scale(1.3)" : "scale(1)",
              }}
              onClick={() => goTo(i)}
              aria-label={t("reviews.goToAria", { n: i + 1 })}
              aria-current={i === current ? "true" : undefined}
            />
          ))}
        </div>
      </div>

      {/* N-5: entry point to the public review form. */}
      <p style={{ textAlign: "center", marginTop: 28, fontSize: 14 }}>
        <a href="/reviews/new" style={{ color: "var(--gold-text)", fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 3 }}>
          {t("reviews.writeReview")}
        </a>
      </p>
    </section>
  );
};

export default Reviews;
