"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";

interface BlogPost {
  _id: string;
  title: string;
  excerpt: string;
  content?: string;
  image: string;
  category?: string;
  date?: string;
  author?: string;
}

const Blog: React.FC = () => {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/blogs")
      .then((r) => r.json())
      .then((data) => {
        setBlogs(Array.isArray(data) ? data : data.blogs || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

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
      color: "#aaa",
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
      color: "#e67e22",
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
    loader: {
      textAlign: "center",
      padding: 60,
      fontSize: 16,
      color: "#888",
    },
  };

  return (
    <section id="blog" style={styles.section}>
      <style>{`
        .blog-card:hover { transform: translateY(-6px); box-shadow: 0 12px 40px rgba(0,0,0,0.12) !important; }
        .blog-read-more:hover { color: #1a3a6b !important; }
        @media (max-width: 768px) {
          .blog-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={styles.header}>
        <span style={styles.badge}>Our Blog</span>
        <h2 style={styles.heading}>Travel Stories & Tips</h2>
        <p style={styles.subheading}>
          Inspiration and insights for your next adventure.
        </p>
      </div>

      {loading ? (
        <div style={styles.loader}>Loading blogs...</div>
      ) : (
        <div className="blog-grid" style={styles.grid}>
          {blogs.map((blog) => {
            const isExpanded = expanded === blog._id;
            return (
              <div key={blog._id} className="blog-card" style={styles.card}>
                <div style={styles.imgWrap}>
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
                  {blog.date && (
                    <div style={styles.date}>
                      {new Date(blog.date).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
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
                    onClick={() => setExpanded(isExpanded ? null : blog._id)}
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
      )}
    </section>
  );
};

export default Blog;
