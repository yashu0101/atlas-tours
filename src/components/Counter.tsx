"use client";

import React, { useState, useEffect, useRef } from "react";
import { useT } from "@/lib/i18n/use-t";
import { SITE_STATS } from "@/lib/config";

const counters = [
  {
    num: SITE_STATS.happyTravellers,
    suffix: "+",
    label: "counter.happyTravelers" as const,
    icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
  },
  {
    num: SITE_STATS.destinations,
    suffix: "+",
    label: "counter.destinations" as const,
    icon: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 13a3 3 0 100-6 3 3 0 000 6z",
  },
  {
    num: SITE_STATS.yearsExperience,
    suffix: "+",
    label: "counter.yearsExperience" as const,
    icon: "M12 15l-2 5-3-2-3 3V4a1 1 0 011-1h10a1 1 0 011 1v17l-3-3-3 2z",
  },
  {
    num: SITE_STATS.tripsCompleted,
    suffix: "+",
    label: "counter.tripsCompleted" as const,
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4",
  },
];

const AnimatedNumber: React.FC<{ target: number; triggered: boolean }> = ({
  target,
  triggered,
}) => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!triggered) return;
    let startTime = 0;
    let frame = 0;
    const duration = 2200;
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setValue(Math.floor(easeOutCubic(progress) * target));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    // D-04: stop the loop if the component unmounts mid-animation.
    return () => cancelAnimationFrame(frame);
  }, [triggered, target]);

  return <>{value}</>;
};

const Counter: React.FC = () => {
  const t = useT();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTriggered(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const styles: Record<string, React.CSSProperties> = {
    section: {
      background: "linear-gradient(135deg, #1a3a6b 0%, #0a1628 100%)",
      padding: "calc(var(--section-pad) * 0.8) 24px",
      fontFamily: "'Poppins', sans-serif",
      position: "relative",
      overflow: "hidden",
    },
    bgDecor: {
      // Taller than the section so the parallax shift (data-parallax) never shows an edge.
      position: "absolute",
      top: "-50%",
      left: 0,
      width: "100%",
      height: "200%",
      opacity: 0.05,
      backgroundImage:
        "radial-gradient(circle at 20% 50%, #f39c12 0%, transparent 50%), radial-gradient(circle at 80% 50%, #e67e22 0%, transparent 50%)",
      pointerEvents: "none",
    },
    container: {
      maxWidth: 1100,
      margin: "0 auto",
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: 30,
      position: "relative",
      zIndex: 1,
    },
    card: {
      textAlign: "center",
      padding: "36px 20px",
      borderRadius: 16,
      background: "rgba(255,255,255,0.04)",
      backdropFilter: "blur(8px)",
      border: "1px solid rgba(255,255,255,0.08)",
      transition: "all 0.3s",
    },
    iconWrap: {
      width: 64,
      height: 64,
      borderRadius: 16,
      background: "linear-gradient(135deg, rgba(230,126,34,0.2), rgba(243,156,18,0.1))",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      margin: "0 auto 20px",
      border: "1px solid rgba(243,156,18,0.2)",
    },
    value: {
      fontSize: 46,
      fontWeight: 800,
      color: "#fff",
      lineHeight: 1,
      marginBottom: 8,
    },
    label: {
      fontSize: 14,
      color: "rgba(255,255,255,0.7)",
      textTransform: "uppercase",
      letterSpacing: 1.5,
      fontWeight: 500,
    },
    divider: {
      position: "absolute",
      top: "50%",
      transform: "translateY(-50%)",
      width: 1,
      height: 60,
      background: "rgba(255,255,255,0.1)",
    },
  };

  return (
    <section ref={sectionRef} data-header-tone="dark" style={styles.section}>
      <style>{`
        .counter-card:hover {
          background: rgba(255,255,255,0.08) !important;
          transform: translateY(-4px);
          border-color: rgba(243,156,18,0.3) !important;
        }
        @media (max-width: 868px) {
          .counter-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        /* Phones: keep 2 × 2 with compact cards (one per row made four numbers ~1000px tall). */
        @media (max-width: 500px) {
          .counter-grid { gap: 12px !important; }
          .counter-card { padding: 22px 8px !important; }
          .counter-icon { width: 48px !important; height: 48px !important; margin-bottom: 14px !important; }
          .counter-value { font-size: 32px !important; }
          .counter-label { font-size: 11px !important; letter-spacing: 1px !important; }
        }
      `}</style>
      <div style={styles.bgDecor} data-parallax="0.25" aria-hidden="true" />
      <div className="counter-grid" style={styles.container}>
        {counters.map((c, i) => (
          <div key={i} className={`counter-card counter-3d reveal-scale stagger-${i + 1} glass-shimmer`} style={{ ...styles.card, position: "relative", overflow: "hidden" }}>
            <div className="counter-icon" style={styles.iconWrap}>
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#f39c12"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d={c.icon} />
              </svg>
            </div>
            <div className="counter-value" style={styles.value}>
              <AnimatedNumber target={c.num} triggered={triggered} />
              {c.suffix}
            </div>
            <div className="counter-label" style={styles.label}>{t(c.label)}</div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Counter;
