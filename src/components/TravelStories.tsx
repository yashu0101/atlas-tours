"use client";

import React, { useRef, useState } from "react";
import { useT } from "@/lib/i18n/use-t";

// Text lives in en.ts under travelStories.<id> (title, description, location).
type StoryId = "aarti" | "rajasthan" | "temples" | "highlights" | "candid" | "onTheGo";

const stories: { src: string; id: StoryId }[] = [
  { src: "/videos/travel-story-1.mp4", id: "aarti" },
  { src: "/videos/travel-story-2.mp4", id: "rajasthan" },
  { src: "/videos/travel-story-3.mp4", id: "temples" },
  { src: "/videos/travel-story-4.mp4", id: "highlights" },
];

const travelMoments: { src: string; id: StoryId }[] = [
  { src: "/videos/travel-story-5.mp4", id: "candid" },
  { src: "/videos/travel-story-6.mp4", id: "onTheGo" },
];

const TravelStories: React.FC = () => {
  const t = useT();
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const handlePlay = (idx: number) => {
    // Pause all other videos
    videoRefs.current.forEach((v, i) => {
      if (v && i !== idx) {
        v.pause();
        v.currentTime = 0;
      }
    });
    setActiveIdx(idx);
  };

  const handlePause = (idx: number) => {
    if (activeIdx === idx) setActiveIdx(null);
  };

  return (
    <section id="travel-stories" style={styles.section}>
      <style>{`
        .story-card {
          transition: transform 0.45s cubic-bezier(.16,1,.3,1), box-shadow 0.45s;
        }
        .story-card:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 20px 50px rgba(0,0,0,0.2) !important;
        }
        .story-card video {
          transition: filter 0.4s;
        }
        .story-card:hover video {
          filter: brightness(1.05);
        }
        .story-play-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0,0,0,0.25);
          opacity: 1;
          transition: opacity 0.4s;
          pointer-events: none;
          z-index: 3;
        }
        .story-card.is-playing .story-play-overlay {
          opacity: 0;
        }
        .story-card.is-playing .story-info {
          opacity: 0;
        }
        .story-card.is-playing .story-gradient {
          opacity: 0;
        }
        .story-play-btn {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: rgba(230,126,34,0.9);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 20px rgba(230,126,34,0.5);
          transition: transform 0.3s, background 0.3s;
        }
        .story-card:hover .story-play-btn {
          transform: scale(1.1);
          background: rgba(243,156,18,0.95);
        }
        .story-location-tag {
          position: absolute;
          top: 14px;
          left: 14px;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(10px);
          color: #fff;
          padding: 5px 14px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.5px;
          z-index: 4;
          display: flex;
          align-items: center;
          gap: 5px;
          pointer-events: none;
        }
        .story-gradient {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 50%;
          background: linear-gradient(transparent, rgba(0,0,0,0.75));
          z-index: 2;
          pointer-events: none;
          transition: opacity 0.4s;
        }
        .story-info {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 20px;
          z-index: 3;
          color: #fff;
          pointer-events: none;
          transition: opacity 0.4s;
        }
        @media (max-width: 768px) {
          .stories-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 500px) {
          .stories-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div className="reveal" style={styles.header}>
        <span style={styles.badge}>{t("travelStories.badge")}</span>
        <h2 style={styles.heading}>{t("travelStories.heading")}</h2>
        <p style={styles.subheading}>
          {t("travelStories.subheading")}
        </p>
      </div>

      <div className="stories-grid" style={styles.grid}>
        {stories.map((story, i) => (
          <div
            key={i}
            className={`story-card card-hover reveal stagger-${i + 1}${activeIdx === i ? " is-playing" : ""}`}
            style={styles.card}
            onClick={() => {
              const v = videoRefs.current[i];
              if (!v) return;
              if (v.paused) {
                v.muted = false;
                v.play().catch(() => {
                  // Autoplay policy: retry muted
                  v.muted = true;
                  v.play();
                });
                handlePlay(i);
              } else {
                v.pause();
                handlePause(i);
              }
            }}
          >
            <div style={styles.videoWrap}>
              <video
                ref={(el) => { videoRefs.current[i] = el; }}
                src={story.src}
                style={styles.video}
                loop
                muted
                playsInline
                preload="auto"
                controls={activeIdx === i}
                onClick={(e) => e.stopPropagation()}
              />
              <div className="story-play-overlay">
                <div className="story-play-btn">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
              <div className="story-location-tag">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f39c12" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {t(`travelStories.${story.id}.location`)}
              </div>
              <div className="story-gradient" />
              <div className="story-info">
                <div style={styles.title}>{t(`travelStories.${story.id}.title`)}</div>
                <div style={styles.desc}>{t(`travelStories.${story.id}.description`)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Second block: candid clips (distinct from the Gallery heading "Travel Moments"). */}
      <div className="reveal" style={{ ...styles.header, marginTop: "clamp(40px, 5vw + 22px, 70px)" }}>
        <span style={styles.badge}>{t("travelStories.candidBadge")}</span>
        <h2 style={styles.heading}>{t("travelStories.candidHeading")}</h2>
        <p style={styles.subheading}>
          {t("travelStories.candidSubheading")}
        </p>
      </div>

      <div className="stories-grid" style={{ ...styles.grid, gridTemplateColumns: "repeat(2, 1fr)", maxWidth: 900 }}>
        {travelMoments.map((story, i) => {
          const idx = stories.length + i;
          return (
            <div
              key={idx}
              className={`story-card card-hover reveal stagger-${i + 1}${activeIdx === idx ? " is-playing" : ""}`}
              style={styles.card}
              onClick={() => {
                const v = videoRefs.current[idx];
                if (!v) return;
                if (v.paused) {
                  v.muted = false;
                  v.play().catch(() => {
                    v.muted = true;
                    v.play();
                  });
                  handlePlay(idx);
                } else {
                  v.pause();
                  handlePause(idx);
                }
              }}
            >
              <div style={{ ...styles.videoWrap, aspectRatio: "9/14" }}>
                <video
                  ref={(el) => { videoRefs.current[idx] = el; }}
                  src={story.src}
                  style={styles.video}
                  loop
                  muted
                  playsInline
                  preload="auto"
                  controls={activeIdx === idx}
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="story-play-overlay">
                  <div className="story-play-btn">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
                <div className="story-location-tag">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f39c12" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {t(`travelStories.${story.id}.location`)}
                </div>
                <div className="story-gradient" />
                <div className="story-info">
                  <div style={styles.title}>{t(`travelStories.${story.id}.title`)}</div>
                  <div style={styles.desc}>{t(`travelStories.${story.id}.description`)}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

const styles: Record<string, React.CSSProperties> = {
  section: {
    padding: "var(--section-pad) 24px",
    fontFamily: "'Poppins', sans-serif",
    background: "var(--bg)",
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
    maxWidth: 560,
    margin: "0 auto",
  },
  grid: {
    maxWidth: 1100,
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 22,
  },
  card: {
    borderRadius: 18,
    overflow: "hidden",
    background: "#000",
    boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
    cursor: "pointer",
    position: "relative",
  },
  videoWrap: {
    position: "relative",
    width: "100%",
    aspectRatio: "9/14",
    overflow: "hidden",
  },
  video: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 4,
    lineHeight: 1.3,
  },
  desc: {
    fontSize: 12,
    opacity: 0.85,
    lineHeight: 1.4,
  },
};

export default TravelStories;
