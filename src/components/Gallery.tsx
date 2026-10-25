"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";

interface GalleryImage {
  id: string;
  src: string;
  caption?: string;
  category?: string;
}

const Gallery: React.FC = () => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/gallery")
      .then((r) => r.json())
      .then((data) => {
        setImages(Array.isArray(data) ? data : data.images || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const openLightbox = (i: number) => setLightboxIndex(i);
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
      color: "var(--text)",
      marginBottom: 12,
    },
    subheading: {
      fontSize: 16,
      color: "var(--text2)",
      maxWidth: 500,
      margin: "0 auto",
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
      background: "linear-gradient(transparent 60%, rgba(26,58,107,0.6))",
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
    loader: {
      textAlign: "center",
      padding: 60,
      fontSize: 16,
      color: "#888",
    },
  };

  return (
    <section id="gallery" style={styles.section}>
      <style>{`
        .gallery-item:hover { transform: scale(1.02); }
        .gallery-item:hover .gallery-overlay { opacity: 1 !important; }
        .lb-arrow:hover { background: rgba(255,255,255,0.3) !important; }
      `}</style>

      <div style={styles.header}>
        <span style={styles.badge}>Gallery</span>
        <h2 style={styles.heading}>Travel Moments</h2>
        <p style={styles.subheading}>
          A visual journey through the destinations we love.
        </p>
      </div>

      {loading ? (
        <div style={styles.loader}>Loading gallery...</div>
      ) : (
        <div style={styles.masonry}>
          {images.map((img, i) => (
            <div
              key={img.id}
              className="gallery-item"
              style={styles.masonryItem}
              onClick={() => openLightbox(i)}
            >
              <Image
                src={img.src}
                alt={img.caption || "Gallery image"}
                width={400}
                height={300 + (i % 3) * 80}
                style={{ width: "100%", height: "auto", display: "block" }}
              />
              <div className="gallery-overlay" style={styles.imgOverlay}>
                {img.caption || img.category || ""}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && images[lightboxIndex] && (
        <div style={styles.lightbox} onClick={closeLightbox}>
          <button style={styles.lbClose} onClick={closeLightbox}>
            &#10005;
          </button>
          <button
            className="lb-arrow"
            style={{ ...styles.lbArrow, left: 24 }}
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
          >
            &#8249;
          </button>
          <div style={styles.lbImgWrap} onClick={(e) => e.stopPropagation()}>
            <Image
              src={images[lightboxIndex].src}
              alt={images[lightboxIndex].caption || ""}
              width={1000}
              height={700}
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
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
          >
            &#8250;
          </button>
          <div style={styles.lbCounter}>
            {lightboxIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </section>
  );
};

export default Gallery;
