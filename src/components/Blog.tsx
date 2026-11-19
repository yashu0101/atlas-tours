"use client";
import RevealWords from "@/components/RevealWords";

import React, { useState } from "react";
import SmartImage from "@/components/SmartImage";
import Link from "next/link";
import type { BlogPost } from "@/lib/types";
import { useT } from "@/lib/i18n/use-t";
import { formatISTDate as formatBlogDate } from "@/app/blog/_lib/format-date";

/** Posts are loaded on the server (F-02) and passed in already filtered for public visibility. */
const Blog: React.FC<{ initialBlogs: BlogPost[] }> = ({ initialBlogs }) => {
  const blogs = initialBlogs;
  const t = useT();
  const [expanded, setExpanded] = useState<string | null>(null);

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
      gridTemplateColumns: "repeat(auto-fill, minmax(min(350px, 100%), 1fr))",
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
      color: "var(--on-accent)",
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
      color: "var(--blog-muted, #767676)",
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
      color: "var(--orange-text)",
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
    actions: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      flexWrap: "wrap",
      marginTop: "auto",
    },
    fullLink: {
      color: "var(--orange-text)",
      fontSize: 14,
      fontWeight: 600,
      textDecoration: "none",
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      transition: "color 0.3s",
    },
  };

  return (
    <section id="blog" style={styles.section}>
      <style>{`
        .blog-card:hover { transform: translateY(-6px); box-shadow: 0 12px 40px rgba(0,0,0,0.12) !important; }
        .blog-read-more:hover, .blog-full-link:hover { color: var(--primary) !important; }
        /* E-02: dark-mode override. Light mode uses the inline fallback (colour unchanged). */
        [data-theme="dark"] #blog { --blog-muted: var(--text2); }
        /* Tablets: two columns, a lone last card centred; one column on phones. */
        @media (min-width: 641px) and (max-width: 1157px) {
          .blog-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
          .blog-grid > :last-child:nth-child(odd) { grid-column: 1 / -1; justify-self: center; width: calc((100% - 30px) / 2); }
        }
        @media (max-width: 640px) {
          .blog-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div className="reveal" style={styles.header}>
        <span style={styles.badge}>{t("blog.badge")}</span>
        <h2 className="heading-line" style={styles.heading}><RevealWords text={t("blog.heading")} /></h2>
        <p style={styles.subheading}>
          {t("blog.subheading")}
        </p>
      </div>

      <div className="blog-grid" style={styles.grid}>
        {blogs.map((blog) => {
          const isExpanded = expanded === blog.id;
          return (
            <div key={blog.id} className="blog-card card-hover reveal" style={styles.card}>
              <div className="img-zoom scroll-zoom" style={styles.imgWrap}>
                <SmartImage
                  src={blog.image || "/images/placeholder.jpg"}
                  alt={blog.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 380px"
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
                <div style={styles.actions}>
                  <button
                    className="blog-read-more"
                    style={{ ...styles.readMore, marginTop: 0 }}
                    onClick={() => setExpanded(isExpanded ? null : blog.id)}
                  >
                    {isExpanded ? t("blog.showLess") : t("blog.readMore")}{" "}
                    <span style={{ transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.3s", display: "inline-block" }}>
                      &#8595;
                    </span>
                  </button>
                  {/* G-07: full article page; the inline expand above is kept as-is. */}
                  <Link
                    href={`/blog/${encodeURIComponent(blog.id)}`}
                    className="blog-full-link"
                    style={styles.fullLink}
                    aria-label={t("blog.fullArticleAria", { title: blog.title })}
                  >
                    {t("blog.fullArticle")} <span aria-hidden="true">&#8594;</span>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default Blog;
