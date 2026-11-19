import type React from "react";
import { cache } from "react";
import type { Metadata } from "next";
import SmartImage from "@/components/SmartImage";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsApp from "@/components/WhatsApp";
import BackToTop from "@/components/BackToTop";
import ScrollProgress from "@/components/ScrollProgress";
import RevealObserver from "@/components/RevealObserver";
import { getBlogs } from "@/lib/db";
import { isPublicBlog } from "@/lib/visibility";
import { SITE_CONFIG } from "@/lib/config";
import { absoluteUrl, blogPostingJsonLd, jsonLdString } from "@/lib/seo";
import type { BlogPost } from "@/lib/types";
import { getT } from "@/lib/i18n";
import { formatISTDate } from "../_lib/format-date";
import { contentParagraphs, metaDescription } from "../_lib/content";

// G-07: read from the DB on every request (like the home page, F-02) so admin edits
// and deactivations take effect immediately.
export const dynamic = "force-dynamic";

// Server-rendered in English; the language toggle only exists client-side (G-08).
const t = getT("en");

type Params = { params: Promise<{ id: string }> };

/** The post if it exists and is publicly visible; deduped between generateMetadata and the page. */
const getPublicPost = cache(async (id: string): Promise<BlogPost | undefined> => {
  const blogs = await getBlogs();
  const post = Array.isArray(blogs) ? blogs.find((b) => b.id === id) : undefined;
  return post && isPublicBlog(post) ? post : undefined;
});

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const post = await getPublicPost(id);
  if (!post) return { title: t("blogDetail.notFoundTitle"), robots: { index: false } };

  const description = metaDescription(post);
  const path = `/blog/${encodeURIComponent(post.id)}`;
  const images = post.image ? [absoluteUrl(post.image)] : undefined;
  return {
    title: post.title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      locale: "en_IN",
      url: path,
      siteName: SITE_CONFIG.name,
      title: post.title,
      description,
      publishedTime: post.createdAt || undefined,
      authors: post.author ? [post.author] : undefined,
      section: post.category || undefined,
      images,
    },
    twitter: { card: "summary_large_image", title: post.title, description, images },
  };
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    background: "var(--bg)",
    fontFamily: "'Poppins', sans-serif",
  },
  // Dark band behind the fixed, initially transparent site Header (white links) so it
  // is readable before the page is scrolled; same navy as the home hero/counter.
  heroBand: {
    height: 120,
    background: "linear-gradient(135deg, #1a3a6b 0%, #0a1628 100%)",
  },
  article: {
    maxWidth: 820,
    margin: "0 auto",
    padding: "48px 24px 100px",
  },
  backLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    color: "var(--orange-text)",
    fontSize: 14,
    fontWeight: 600,
    textDecoration: "none",
    marginBottom: 24,
    transition: "color 0.3s",
  },
  badge: {
    display: "inline-block",
    background: "linear-gradient(135deg, #e67e22, #f39c12)",
    color: "var(--on-accent)",
    padding: "4px 14px",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    textTransform: "uppercase",
    marginBottom: 14,
  },
  title: {
    fontSize: "clamp(28px, 4vw, 40px)",
    fontWeight: 800,
    color: "var(--primary)",
    lineHeight: 1.25,
    marginBottom: 12,
  },
  meta: {
    fontSize: 14,
    color: "var(--blog-muted, #767676)",
    marginBottom: 28,
  },
  imgWrap: {
    position: "relative",
    width: "100%",
    aspectRatio: "16 / 9",
    borderRadius: 18,
    overflow: "hidden",
    boxShadow: "var(--shadow)",
    marginBottom: 36,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 1.85,
    color: "var(--text)",
    marginBottom: 20,
    whiteSpace: "pre-line",
    overflowWrap: "anywhere",
  },
  footerBack: {
    marginTop: 40,
    paddingTop: 24,
    borderTop: "1px solid var(--bg3)",
  },
};

export default async function BlogPostPage({ params }: Params) {
  const { id } = await params;
  const post = await getPublicPost(id);
  if (!post) notFound();

  const date = post.createdAt ? formatISTDate(post.createdAt) : "";
  const paragraphs = contentParagraphs(post.content || post.excerpt || "");

  const backLink = (
    <Link href="/#blog" className="blog-back-link" style={styles.backLink}>
      <span aria-hidden="true">&#8592;</span> {t("blogDetail.back")}
    </Link>
  );

  return (
    <>
      <a href="#main-content" className="skip-link">{t("common.skipToContent")}</a>
      <ScrollProgress />
      <Header />
      <style>{`
        .blog-back-link:hover { color: var(--primary) !important; }
        [data-theme="dark"] #blog-post { --blog-muted: var(--text2); }
      `}</style>
      <div data-header-tone="dark" style={styles.heroBand} aria-hidden="true" />
      <main id="main-content" tabIndex={-1} style={styles.page}>
        <article id="blog-post" style={styles.article}>
          {backLink}
          <header>
            {post.category && <div style={styles.badge}>{post.category}</div>}
            <h1 style={styles.title}>{post.title}</h1>
            {(date || post.author) && (
              <p style={styles.meta}>
                {date && <time dateTime={post.createdAt}>{date}</time>}
                {date && post.author && " · "}
                {post.author && <span>{t("blogDetail.byAuthor", { author: post.author })}</span>}
              </p>
            )}
          </header>

          <div style={styles.imgWrap}>
            <SmartImage
              src={post.image || "/images/placeholder.jpg"}
              alt={post.title}
              fill
              priority
              sizes="(max-width: 820px) 100vw, 820px"
              style={{ objectFit: "cover" }}
            />
          </div>

          {/* Plain text only: React escapes it, and pre-line keeps single line breaks. */}
          {paragraphs.map((text, i) => (
            <p key={i} style={styles.paragraph}>{text}</p>
          ))}

          <div style={styles.footerBack}>{backLink}</div>
        </article>
      </main>
      <Footer />
      <WhatsApp />
      <BackToTop />
      <RevealObserver />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(blogPostingJsonLd(post)) }}
      />
    </>
  );
}
