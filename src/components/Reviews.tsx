"use client";

import React, { useState, useEffect, useRef } from "react";

interface Review {
  _id: string;
  name: string;
  city?: string;
  packageName?: string;
  rating: number;
  message: string;
  avatar?: string;
}

const Reviews: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch("/api/reviews")
      .then((r) => r.json())
      .then((data) => {
        setReviews(Array.isArray(data) ? data : data.reviews || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (reviews.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setCurrent((p) => (p + 1) % reviews.length);
    }, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [reviews.length]);

  const goTo = (i: number) => {
    setCurrent(i);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrent((p) => (p + 1) % reviews.length);
    }, 5000);
  };

  const renderStars = (n: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <span key={i} style={{ color: i < n ? "#f39c12" : "#ddd", fontSize: 20 }}>
        &#9733;
      </span>
    ));

  const styles: Record<string, React.CSSProperties> = {
    section: {
      padding: "100px 24px",
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
      color: "#f39c12",
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
      color: "#fff",
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
      color: "#f39c12",
      marginBottom: 4,
    },
    meta: {
      fontSize: 13,
      color: "rgba(255,255,255,0.5)",
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
    loader: {
      textAlign: "center",
      padding: 60,
      fontSize: 16,
      color: "rgba(255,255,255,0.5)",
    },
  };

  if (loading) {
    return (
      <section id="reviews" style={styles.section}>
        <div style={styles.loader}>Loading reviews...</div>
      </section>
    );
  }

  if (reviews.length === 0) return null;

  const review = reviews[current];

  return (
    <section id="reviews" style={styles.section}>
      <style>{`
        .review-arrow:hover { background: rgba(243,156,18,0.3) !important; border-color: #f39c12 !important; }
      `}</style>
      <div style={styles.header}>
        <span style={styles.badge}>Testimonials</span>
        <h2 style={styles.heading}>What Our Travellers Say</h2>
        <p style={styles.subheading}>
          Real experiences from our happy customers.
        </p>
      </div>

      <div style={styles.carousel}>
        <div style={styles.card}>
          <div style={styles.avatar}>
            {review.name?.charAt(0).toUpperCase()}
          </div>
          <div style={styles.stars}>{renderStars(review.rating)}</div>
          <p style={styles.message}>&ldquo;{review.message}&rdquo;</p>
          <div style={styles.name}>{review.name}</div>
          <div style={styles.meta}>
            {[review.city, review.packageName].filter(Boolean).join(" | ")}
          </div>
        </div>

        <div style={styles.arrows}>
          <button
            className="review-arrow"
            style={styles.arrow}
            onClick={() => goTo((current - 1 + reviews.length) % reviews.length)}
          >
            &#8249;
          </button>
          <button
            className="review-arrow"
            style={styles.arrow}
            onClick={() => goTo((current + 1) % reviews.length)}
          >
            &#8250;
          </button>
        </div>

        <div style={styles.dots}>
          {reviews.map((_, i) => (
            <button
              key={i}
              style={{
                ...styles.dot,
                background: i === current ? "#f39c12" : "rgba(255,255,255,0.25)",
                transform: i === current ? "scale(1.3)" : "scale(1)",
              }}
              onClick={() => goTo(i)}
              aria-label={`Go to review ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Reviews;
