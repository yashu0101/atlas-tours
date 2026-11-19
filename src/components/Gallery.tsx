"use client";
import RevealWords from "@/components/RevealWords";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import SmartImage from "@/components/SmartImage";
import type { GalleryImage } from "@/lib/types";
import { useT } from "@/lib/i18n/use-t";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const ALL = "All";

/** Distinct, non-empty categories in first-seen order (G-06). Exported for tests. */
export function galleryCategories(images: readonly GalleryImage[]): string[] {
  const seen = new Set<string>();
  for (const img of images) {
    const c = typeof img.category === "string" ? img.category.trim() : "";
    if (c) seen.add(c);
  }
  return [...seen];
}

/** Images shown for a category tab; "All" (or an unknown category) shows everything. */
export function filterGallery(images: readonly GalleryImage[], category: string): GalleryImage[] {
  if (category === ALL) return [...images];
  return images.filter((img) => (typeof img.category === "string" ? img.category.trim() : "") === category);
}

/** Images are loaded on the server (F-02) and passed in already filtered for public visibility. */
const Gallery: React.FC<{ initialImages: GalleryImage[] }> = ({ initialImages }) => {
  const t = useT();
  const categories = useMemo(() => galleryCategories(initialImages), [initialImages]);
  const [activeCategory, setActiveCategory] = useState(ALL);
  // The grid and the lightbox both work on the filtered set, so arrows/counter stay within the tab.
  const images = useMemo(() => filterGallery(initialImages, activeCategory), [initialImages, activeCategory]);
  // Tabs only make sense with at least two categories.
  const showFilters = categories.length > 1;
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const lightboxRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const isLightboxOpen = lightboxIndex !== null;

  // Move focus into the lightbox on open; restore it to the clicked tile on close.
  useEffect(() => {
    if (!isLightboxOpen) return;
    closeBtnRef.current?.focus({ preventScroll: true });
    return () => {
      triggerRef.current?.focus({ preventScroll: true });
      triggerRef.current = null;
    };
  }, [isLightboxOpen]);

  const openLightbox = (i: number, trigger: HTMLElement) => {
    triggerRef.current = trigger;
    setLightboxIndex(i);
  };
  const closeLightbox = () => setLightboxIndex(null);
  const goPrev = () =>
    setLightboxIndex((p) => (p !== null ? (p - 1 + images.length) % images.length : null));
  const goNext = () =>
    setLightboxIndex((p) => (p !== null ? (p + 1) % images.length : null));

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
      // Trap Tab focus inside the lightbox.
      const root = lightboxRef.current;
      if (e.key === "Tab" && root) {
        const nodes = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE));
        if (nodes.length === 0) {
          e.preventDefault();
          return;
        }
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && (active === first || !root.contains(active))) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && (active === last || !root.contains(active))) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lightboxIndex, images.length]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

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
      color: "var(--orange-text)",
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
      color: "var(--text)",
      marginBottom: 12,
    },
    subheading: {
      fontSize: 16,
      color: "var(--text2)",
      maxWidth: 500,
      margin: "0 auto",
    },
    filters: {
      display: "flex",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: 10,
      maxWidth: 1200,
      margin: "0 auto 36px",
      padding: 0,
      listStyle: "none",
    },
    filterBtn: {
      padding: "8px 20px",
      borderRadius: 20,
      border: "none",
      background: "rgba(230,126,34,0.1)",
      color: "var(--orange-text)",
      fontSize: 14,
      fontWeight: 600,
      cursor: "pointer",
      fontFamily: "'Poppins', sans-serif",
      transition: "all 0.3s",
    },
    filterBtnActive: {
      background: "linear-gradient(135deg, #e67e22, #f39c12)",
      color: "var(--on-accent)",
      boxShadow: "0 4px 15px rgba(230,126,34,0.3)",
    },
    masonry: {
      maxWidth: 1200,
      margin: "0 auto",
      columns: "3 320px",
      columnGap: 20,
    },
    masonryItem: {
      breakInside: "avoid" as const,
      marginBottom: 20,
      borderRadius: 14,
      overflow: "hidden",
      cursor: "pointer",
      position: "relative",
      transition: "transform 0.3s",
    },
    imgOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      background: "linear-gradient(transparent 60%, rgba(26,58,107,0.9))",
      opacity: 0,
      transition: "opacity 0.3s",
      display: "flex",
      alignItems: "flex-end",
      padding: 16,
      color: "#fff",
      fontSize: 14,
      fontWeight: 500,
    },
    lightbox: {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      background: "rgba(0,0,0,0.92)",
      zIndex: 3000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    lbClose: {
      position: "absolute",
      top: 24,
      right: 24,
      width: 44,
      height: 44,
      borderRadius: "50%",
      background: "rgba(255,255,255,0.15)",
      border: "none",
      color: "#fff",
      fontSize: 22,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 3,
    },
    lbArrow: {
      position: "absolute",
      top: "50%",
      transform: "translateY(-50%)",
      width: 50,
      height: 50,
      borderRadius: "50%",
      background: "rgba(255,255,255,0.15)",
      border: "none",
      color: "#fff",
      fontSize: 24,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "background 0.3s",
    },
    lbImgWrap: {
      maxWidth: "85vw",
      maxHeight: "85vh",
      position: "relative",
    },
    lbCounter: {
      position: "absolute",
      bottom: 24,
      left: "50%",
      transform: "translateX(-50%)",
      color: "rgba(255,255,255,0.7)",
      fontSize: 14,
      fontWeight: 500,
    },
  };

  return (
    <section id="gallery" style={styles.section}>
      <style>{`
        .gallery-item:hover { transform: scale(1.02); }
        .gallery-item:hover .gallery-overlay { opacity: 1 !important; }
        .lb-arrow:hover { background: rgba(255,255,255,0.3) !important; }
        .gallery-filter[aria-pressed="false"]:hover { background: rgba(230,126,34,0.2) !important; }
      `}</style>

      <div className="reveal" style={styles.header}>
        <span style={styles.badge}>{t("gallery.badge")}</span>
        <h2 className="heading-line" style={styles.heading}><RevealWords text={t("gallery.heading")} /></h2>
        <p style={styles.subheading}>
          {t("gallery.subheading")}
        </p>
      </div>

      {showFilters && (
        <div role="group" aria-label={t("gallery.filterAria")} style={styles.filters}>
          {[ALL, ...categories].map((cat) => {
            const active = cat === activeCategory;
            return (
              <button
                key={cat}
                type="button"
                className="gallery-filter"
                aria-pressed={active}
                style={active ? { ...styles.filterBtn, ...styles.filterBtnActive } : styles.filterBtn}
                onClick={() => setActiveCategory(cat)}
              >
                {cat === ALL ? t("common.all") : cat}
              </button>
            );
          })}
        </div>
      )}

      <div style={styles.masonry}>
        {images.map((img, i) => (
          <div
            key={img.id}
            className={`gallery-item img-zoom scroll-zoom reveal stagger-${(i % 3) + 1}`}
            style={styles.masonryItem}
            role="button"
            tabIndex={0}
            aria-label={img.caption || img.category || t("gallery.imageFallback")}
            onClick={(e) => openLightbox(i, e.currentTarget)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                openLightbox(i, e.currentTarget);
              } else if (e.key === " ") {
                e.preventDefault(); // stop page scroll
              }
            }}
            onKeyUp={(e) => {
              // Open on key-up like a native button, so the same key-up
              // doesn't immediately "click" the lightbox close button.
              if (e.key === " ") {
                e.preventDefault();
                openLightbox(i, e.currentTarget);
              }
            }}
          >
            <SmartImage
              src={img.src}
              alt={img.caption || t("gallery.imageFallback")}
              width={400}
              height={300 + (i % 3) * 80}
              sizes="(max-width: 720px) 100vw, (max-width: 1100px) 50vw, 390px"
              style={{ width: "100%", height: "auto", display: "block" }}
            />
            <div className="gallery-overlay" style={styles.imgOverlay}>
              {img.caption || img.category || ""}
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && images[lightboxIndex] && (
        <div
          ref={lightboxRef}
          role="dialog"
          aria-modal="true"
          aria-label={images[lightboxIndex].caption || t("gallery.viewerAria")}
          style={styles.lightbox}
          onClick={closeLightbox}
        >
          <button ref={closeBtnRef} style={styles.lbClose} aria-label={t("gallery.closeViewerAria")} onClick={closeLightbox}>
            &#10005;
          </button>
          <button
            className="lb-arrow"
            style={{ ...styles.lbArrow, left: 24 }}
            aria-label={t("gallery.previousAria")}
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
          >
            &#8249;
          </button>
          <div style={styles.lbImgWrap} onClick={(e) => e.stopPropagation()}>
            {/* N-9: deliberately unoptimised. This image sizes itself from the file (width/height
                "auto"), so a resized/DPR srcset would change how large it appears. */}
            <SmartImage
              src={images[lightboxIndex].src}
              alt={images[lightboxIndex].caption || ""}
              width={1000}
              height={700}
              unoptimized
              style={{
                maxWidth: "85vw",
                maxHeight: "85vh",
                objectFit: "contain",
                borderRadius: 8,
                width: "auto",
                height: "auto",
              }}
            />
          </div>
          <button
            className="lb-arrow"
            style={{ ...styles.lbArrow, right: 24 }}
            aria-label={t("gallery.nextAria")}
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
          >
            &#8250;
          </button>
          <div style={styles.lbCounter}>
            {t("gallery.counter", { current: lightboxIndex + 1, total: images.length })}
          </div>
        </div>
      )}
    </section>
  );
};

export default Gallery;
