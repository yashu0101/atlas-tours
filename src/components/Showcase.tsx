"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { PHONE_DISPLAY, SITE_CONFIG } from "@/lib/config";

const showcaseItems = [
  {
    src: "/images/showcase-group.jpeg",
    title: "46 Pax Group from Bhopal",
    description: "A memorable pilgrimage group tour organized by Atlas Tours",
    gallery: [
      "/images/showcase-group.jpeg",
      "/images/bhopal-group-1.jpeg",
      "/images/bhopal-group-2.jpeg",
    ],
  },
  {
    src: "/images/showcase-frontdesk.jpeg",
    title: "Professional Front Desk",
    description: "Dedicated team ensuring a warm welcome at every stay",
  },
];

const packageCategories = [
  {
    label: "Hindu Pilgrimage",
    tag: "pilgrimage",
    packages: [
      { id: "pkg-chardham", src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=75", title: "Char Dham Yatra", duration: "11 Days / 10 Nights", price: "₹22,999", destinations: "Yamunotri • Gangotri • Kedarnath • Badrinath" },
      { id: "pkg-dodham", src: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=75", title: "Do Dham Yatra", duration: "7 Days / 6 Nights", price: "₹15,999", destinations: "Kedarnath • Badrinath" },
      { id: "pkg-up-spiritual", src: "/images/pkg-up-spiritual.jpeg", title: "Spiritual Wonders of UP", duration: "3 to 8 Days", price: "₹12,699", destinations: "Ayodhya • Varanasi • Prayagraj • Agra" },
      { id: "pkg-kailash", src: "https://images.unsplash.com/photo-1585409677983-0f6c41ca9c3b?w=600&q=75", title: "Kailash Mansarovar Yatra", duration: "14-16 Days", price: "₹1,85,000", destinations: "Kailash Mansarovar • Tibet" },
    ],
  },
  {
    label: "Jain Pilgrimage",
    tag: "jain",
    packages: [
      { id: "pkg-jain-pilgrimage", src: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=600&q=75", title: "Jain Pilgrimage Tour", duration: "8 Days / 7 Nights", price: "₹19,999", destinations: "Palitana • Ranakpur • Dilwara • Shravanabelagola" },
    ],
  },
  {
    label: "Domestic",
    tag: "domestic",
    packages: [
      { id: "pkg-rajasthan", src: "/images/pkg-rajasthan.jpeg", title: "Royal Rajasthan Tour", duration: "8 Days / 7 Nights", price: "₹17,500", destinations: "Jaipur • Jodhpur • Jaisalmer • Udaipur" },
      { id: "pkg-odisha", src: "/images/pkg-odisha.jpeg", title: "Odisha Tour Package", duration: "6 Days / 5 Nights", price: "₹11,999", destinations: "Bhubaneswar • Puri • Konark • Chilika" },
    ],
  },
  {
    label: "International",
    tag: "international",
    packages: [
      { id: "pkg-dubai", src: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=75", title: "Dubai Tour Package", duration: "5 Days / 4 Nights", price: "₹35,999", destinations: "Dubai • Abu Dhabi • UAE" },
      { id: "pkg-thailand", src: "https://images.unsplash.com/photo-1528181304800-259b08848526?w=600&q=75", title: "Thailand Tour Package", duration: "6 Days / 5 Nights", price: "₹29,999", destinations: "Bangkok • Pattaya • Phuket" },
      { id: "pkg-vietnam", src: "https://images.unsplash.com/photo-1528127269322-539801943592?w=600&q=75", title: "Vietnam Tour Package", duration: "6 Days / 5 Nights", price: "₹34,999", destinations: "Hanoi • Ha Long Bay • Ho Chi Minh" },
      { id: "pkg-bali", src: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=75", title: "Bali Tour Package", duration: "6 Days / 5 Nights", price: "₹32,999", destinations: "Bali • Ubud • Kuta • Nusa Penida" },
    ],
  },
];

const Showcase: React.FC = () => {
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);

  const styles: Record<string, React.CSSProperties> = {
    section: {
      padding: "var(--section-pad) 24px",
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
      gridTemplateColumns: "repeat(auto-fit, minmax(min(340px, 100%), 1fr))",
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
      marginTop: "clamp(40px, 5vw + 22px, 70px)",
      marginBottom: 40,
    },
    pkgGrid: {
      maxWidth: 1100,
      margin: "0 auto",
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(min(300px, 100%), 1fr))",
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
            style={{ ...styles.card, cursor: item.gallery ? "pointer" : "default" }}
            onClick={() => item.gallery && setLightbox({ images: item.gallery, index: 0 })}
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
                {item.gallery && (
                  <div style={{ marginTop: 8, fontSize: 12, fontWeight: 600, color: "#f39c12" }}>
                    View {item.gallery.length} Photos →
                  </div>
                )}
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
            <a href="tel:+919616074995" style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              marginTop: 8,
              fontSize: 14,
              color: "var(--text2)",
              textDecoration: "none",
              fontWeight: 500,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e67e22" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
              </svg>
              +91 9616074995
            </a>
            <div style={{
              marginTop: 14,
              padding: "12px 16px",
              background: "var(--bg2)",
              borderRadius: 12,
              textAlign: "left" as const,
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#e67e22", letterSpacing: 1, textTransform: "uppercase" as const, marginBottom: 6 }}>
                Varanasi Office
              </div>
              <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.5 }}>
                Hotel Ganga Imperial, Tilamapur,<br />
                Varanasi, Rustampur, Uttar Pradesh 221112
              </div>
            </div>
          </div>
        </div>

        {/* Travel Manager */}
        <div style={{
          marginTop: 20,
          padding: "18px 22px",
          background: "var(--card-bg)",
          borderRadius: 16,
          boxShadow: "var(--shadow)",
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #1a3a6b, #2a5298)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f39c12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div style={{ textAlign: "left" as const }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--primary)" }}>Bushra Ashfaque</div>
            <div style={{ fontSize: 12, color: "#e67e22", fontWeight: 600, marginBottom: 2 }}>Managing Director</div>
            <a href={`tel:${SITE_CONFIG.phone}`} style={{ fontSize: 13, color: "var(--text2)", textDecoration: "none" }}>
              {PHONE_DISPLAY}
            </a>
          </div>
        </div>

        {/* GM - Hotel Ganga Imperial */}
        <div style={{
          marginTop: 12,
          padding: "18px 22px",
          background: "var(--card-bg)",
          borderRadius: 16,
          boxShadow: "var(--shadow)",
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #1a3a6b, #2a5298)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f39c12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div style={{ textAlign: "left" as const }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--primary)" }}>Dinesh Ji</div>
            <div style={{ fontSize: 12, color: "#e67e22", fontWeight: 600, marginBottom: 2 }}>General Manager — Hotel Ganga Imperial</div>
          </div>
        </div>
      </div>

      {/* All Packages — Customized */}
      <div className="reveal" style={styles.packagesHeader}>
        <span style={styles.badge}>Tour Packages</span>
        <h2 style={styles.heading}>Our Signature Tours</h2>
        <p style={styles.subheading}>
          Serving travelers since 1983. All packages are fully customized. Click to explore full details.
        </p>
      </div>

      {packageCategories.map((cat) => (
        <div key={cat.tag}>
          <div className="reveal" style={{ textAlign: "center" as const, marginTop: 50, marginBottom: 28 }}>
            <span style={{
              display: "inline-block",
              background: "linear-gradient(135deg, #1a3a6b, #2a5298)",
              color: "#fff",
              padding: "8px 24px",
              borderRadius: 24,
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: 1,
            }}>
              {cat.label}
            </span>
          </div>
          <div className="showcase-grid" style={styles.pkgGrid}>
            {cat.packages.map((pkg, i) => (
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
                    unoptimized={pkg.src.startsWith("http")}
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
        </div>
      ))}

      {/* Lightbox */}
      {lightbox && (
        <>
          <style>{`
            .lightbox-overlay { position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,0.92); display: flex; align-items: center; justify-content: center; }
            .lightbox-close { position: absolute; top: 20px; right: 24px; background: none; border: none; color: #fff; font-size: 36px; cursor: pointer; z-index: 10001; line-height: 1; }
            .lightbox-close:hover { color: #f39c12; }
            .lightbox-nav { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(255,255,255,0.15); border: none; color: #fff; font-size: 32px; width: 48px; height: 48px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); }
            .lightbox-nav:hover { background: rgba(243,156,18,0.6); }
            .lightbox-prev { left: 16px; }
            .lightbox-next { right: 16px; }
            .lightbox-img-wrap { position: relative; max-width: 90vw; max-height: 80vh; width: 900px; aspect-ratio: 16/10; }
            .lightbox-counter { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); color: #fff; font-size: 14px; font-weight: 600; background: rgba(0,0,0,0.5); padding: 6px 16px; border-radius: 20px; }
          `}</style>
          <div className="lightbox-overlay" onClick={() => setLightbox(null)}>
            <button className="lightbox-close" onClick={() => setLightbox(null)}>×</button>
            {lightbox.images.length > 1 && (
              <>
                <button className="lightbox-nav lightbox-prev" onClick={(e) => { e.stopPropagation(); setLightbox({ ...lightbox, index: (lightbox.index - 1 + lightbox.images.length) % lightbox.images.length }); }}>‹</button>
                <button className="lightbox-nav lightbox-next" onClick={(e) => { e.stopPropagation(); setLightbox({ ...lightbox, index: (lightbox.index + 1) % lightbox.images.length }); }}>›</button>
              </>
            )}
            <div className="lightbox-img-wrap" onClick={(e) => e.stopPropagation()}>
              <Image
                src={lightbox.images[lightbox.index]}
                alt={`Photo ${lightbox.index + 1}`}
                fill
                style={{ objectFit: "contain" }}
              />
            </div>
            <div className="lightbox-counter">{lightbox.index + 1} / {lightbox.images.length}</div>
          </div>
        </>
      )}
    </section>
  );
};

export default Showcase;
