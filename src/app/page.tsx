import Header from "@/components/Header";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Packages from "@/components/Packages";
import Gallery from "@/components/Gallery";
import Counter from "@/components/Counter";
import Reviews from "@/components/Reviews";
import Blog from "@/components/Blog";
import FAQ from "@/components/FAQ";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import WhatsApp from "@/components/WhatsApp";
import BackToTop from "@/components/BackToTop";
import ScrollProgress from "@/components/ScrollProgress";
import RevealObserver from "@/components/RevealObserver";
import { getBlogs, getFAQs, getGallery, getPackages, getReviews } from "@/lib/db";
import { isPublicBlog, isPublicFAQ, isPublicGalleryImage, isPublicPackage, isPublicReview } from "@/lib/visibility";
import { faqPageJsonLd, jsonLdString } from "@/lib/seo";
import type { BlogPost, FAQ as FAQItem, GalleryImage, Review, TourPackage } from "@/lib/types";

// F-02: content is read from the DB on every request so admin edits appear
// immediately (and the JSON backend reads a local file that changes at runtime).
export const dynamic = "force-dynamic";

async function loadPublic<T>(label: string, load: () => Promise<T[]>, isPublic: (item: T) => boolean): Promise<T[]> {
  try {
    const items = await load();
    return Array.isArray(items) ? items.filter(isPublic) : [];
  } catch (err) {
    console.error(`[home] failed to load ${label}:`, err);
    return [];
  }
}

export default async function HomePage() {
  const [packages, gallery, reviews, blogs, faqs]: [TourPackage[], GalleryImage[], Review[], BlogPost[], FAQItem[]] =
    await Promise.all([
      loadPublic("packages", getPackages, isPublicPackage),
      loadPublic("gallery", getGallery, isPublicGalleryImage),
      loadPublic("reviews", getReviews, isPublicReview),
      loadPublic("blogs", getBlogs, isPublicBlog),
      loadPublic("faqs", getFAQs, isPublicFAQ),
    ]);

  return (
    <>
      {/* E-11: first focusable element; off-screen until it receives keyboard focus. */}
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <ScrollProgress />
      <Header />
      {/* Unstyled block wrapper (Header is position:fixed, no CSS targets sibling structure),
          so wrapping the sections in <main> does not change layout. */}
      <main id="main-content" tabIndex={-1}>
        <Hero />
        <WaveDivider fill="var(--bg2)" />
        <About />
        <WaveDivider fill="var(--bg)" />
        <Packages initialPackages={packages} />
        <WaveDivider fill="var(--bg2)" />
        <Gallery initialImages={gallery} />
        <Counter />
        <WaveDivider fill="var(--bg)" />
        <Reviews initialReviews={reviews} />
        <WaveDivider fill="var(--bg2)" />
        <Blog initialBlogs={blogs} />
        <WaveDivider fill="var(--bg)" />
        <FAQ initialFaqs={faqs} />
        <Contact initialPackages={packages} />
      </main>
      <Footer />
      <WhatsApp />
      <BackToTop />
      {/* Last child so its effect runs after every section's mount effects, like the old page-level effect. */}
      <RevealObserver />
      {faqs.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdString(faqPageJsonLd(faqs)) }}
        />
      )}
    </>
  );
}

function WaveDivider({ fill }: { fill: string }) {
  return (
    <div className="wave-divider">
      <svg viewBox="0 0 1440 120" preserveAspectRatio="none">
        <path d="M0,60 C240,120 480,0 720,60 C960,120 1200,0 1440,60 L1440,120 L0,120Z" fill={fill} />
      </svg>
    </div>
  );
}
