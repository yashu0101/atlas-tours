"use client";

import React, { useState } from "react";
import Image from "next/image";
import type { BlogPost } from "@/lib/types";

// Same output as toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
// for an Indian visitor (e.g. "1 Jun 2024"), but computed by hand in IST so the server-rendered
// text and the hydrated text can never differ by timezone or ICU version (F-02).
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
const IST_OFFSET_MS = 330 * 60 * 1000;
const formatBlogDate = (iso: string) => {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  const d = new Date(t + IST_OFFSET_MS);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};

/** Posts are loaded on the server (F-02) and passed in already filtered for public visibility. */
const Blog: React.FC<{ initialBlogs: BlogPost[] }> = ({ initialBlogs }) => {
  const blogs = initialBlogs;
  const [expanded, setExpanded] = useState<string | null>(null);

  const styles: Record<string, React.CSSProperties> = {
    section: {
      padding: "100px 24px",
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
      color: "var(--orange)",
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
      maxWidth: 500,
      margin: "0 auto",
    },
    grid: {
      maxWidth: 1200,
      margin: "0 auto",
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
      gap: 30,
    },
    card: {
      borderRadius: 18,
      overflow: "hidden",
      background: "var(--card-bg)",
      boxShadow: "var(--shadow)",
      transition: "transform 0.3s, box-shadow 0.3s",
      display: "flex",
      flexDirection: "column",
    },
    imgWrap: {
      position: "relative",
      height: 220,
      overflow: "hidden",
    },
    categoryBadge: {
      position: "absolute",
      top: 16,
      left: 16,
      background: "linear-gradient(135deg, #e67e22, #f39c12)",
      color: "#fff",
      padding: "4px 14px",
      borderRadius: 8,
      fontSize: 12,
      fontWeight: 600,
      zIndex: 2,
      textTransform: "uppercase",
    },
    body: {
      padding: "22px 24px",
      flex: 1,
      display: "flex",
      flexDirection: "column",
    },
    date: {
      fontSize: 13,
      color: "var(--blog-muted, #aaa)",
      marginBottom: 8,
    },
    title: {
      fontSize: 20,
      fontWeight: 700,
      color: "var(--primary)",
      marginBottom: 10,
      lineHeight: 1.35,
    },
    excerpt: {
      fontSize: 14,
      lineHeight: 1.7,
      color: "var(--text2)",
      marginBottom: 16,
      flex: 1,
    },
    content: {
      fontSize: 14,
      lineHeight: 1.8,
      color: "var(--text2)",
      marginBottom: 16,
      overflow: "hidden",
      transition: "max-height 0.4s ease",
    },
    readMore: {
      background: "none",
      border: "none",
      color: "var(--orange)",
      fontSize: 14,
      fontWeight: 600,
      cursor: "pointer",
      padding: 0,
      display: "flex",
      alignItems: "center",
      gap: 6,
      fontFamily: "'Poppins', sans-serif",
      transition: "color 0.3s",
      marginTop: "auto",
    },
  };

  return (
    <section id="blog" style={styles.section}>
      <style>{`
        .blog-card:hover { transform: translateY(-6px); box-shadow: 0 12px 40px rgba(0,0,0,0.12) !important; }
        .blog-read-more:hover { color: var(--primary) !important; }
        /* E-02: dark-mode override. Light mode uses the inline fallback (colour unchanged). */
        [data-theme="dark"] #blog { --blog-muted: var(--text2); }
        @media (max-width: 768px) {
          .blog-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div className="reveal" style={styles.header}>
        <span style={styles.badge}>Our Blog</span>
        <h2 style={styles.heading}>Travel Stories & Tips</h2>
        <p style={styles.subheading}>
          Inspiration and insights for your next adventure.
        </p>
      </div>

      <div className="blog-grid" style={styles.grid}>
        {blogs.map((blog) => {
          const isExpanded = expanded === blog.id;
          return (
            <div key={blog.id} className="blog-card card-hover reveal" style={styles.card}>
              <div className="img-zoom" style={styles.imgWrap}>
                <Image
                  src={blog.image || "/images/placeholder.jpg"}
                  alt={blog.title}
                  fill
                  style={{ objectFit: "cover" }}
                />
                {blog.category && (
                  <span style={styles.categoryBadge}>{blog.category}</span>
                )}
              </div>
              <div style={styles.body}>
                {blog.createdAt && (
                  <div style={styles.date}>
                    {formatBlogDate(blog.createdAt)}
                  </div>
                )}
                <h3 style={styles.title}>{blog.title}</h3>
                <div
                  style={{
                    ...styles.content,
                    maxHeight: isExpanded ? 1000 : 0,
                  }}
                >
                  {blog.content || blog.excerpt}
                </div>
                {!isExpanded && <p style={styles.excerpt}>{blog.excerpt}</p>}
                <button
                  className="blog-read-more"
                  style={styles.readMore}
                  onClick={() => setExpanded(isExpanded ? null : blog.id)}
                >
                  {isExpanded ? "Show Less" : "Read More"}{" "}
                  <span style={{ transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.3s", display: "inline-block" }}>
                    &#8595;
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default Blog;
