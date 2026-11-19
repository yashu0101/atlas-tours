import Header from "@/components/Header";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Packages from "@/components/Packages";
import Offers from "@/components/Offers";
import Gallery from "@/components/Gallery";
import Counter from "@/components/Counter";
import Reviews from "@/components/Reviews";
import Blog from "@/components/Blog";
import FAQ from "@/components/FAQ";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import WhatsApp from "@/components/WhatsApp";
import Showcase from "@/components/Showcase";
import BackToTop from "@/components/BackToTop";
import ScrollProgress from "@/components/ScrollProgress";
import RevealObserver from "@/components/RevealObserver";
import CompareBar from "@/components/CompareBar";
import { getBlogs, getFAQs, getGallery, getOffers, getPackages, getReviews } from "@/lib/db";
import { isPublicBlog, isPublicFAQ, isPublicGalleryImage, isPublicOffer, isPublicPackage, isPublicReview, istDateKey } from "@/lib/visibility";
import { faqPageJsonLd, jsonLdString } from "@/lib/seo";
import { translate } from "@/lib/i18n";
import type { BlogPost, FAQ as FAQItem, GalleryImage, Offer, Review, TourPackage } from "@/lib/types";

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
  const [packages, gallery, reviews, blogs, faqs, offers]:
    [TourPackage[], GalleryImage[], Review[], BlogPost[], FAQItem[], Offer[]] =
    await Promise.all([
      loadPublic("packages", getPackages, isPublicPackage),
      loadPublic("gallery", getGallery, isPublicGalleryImage),
      loadPublic("reviews", getReviews, isPublicReview),
      loadPublic("blogs", getBlogs, isPublicBlog),
      loadPublic("faqs", getFAQs, isPublicFAQ),
      // G-05: active and not expired (IST calendar date), same rule as GET /api/offers.
      loadPublic("offers", getOffers, isPublicOffer),
    ]);

  return (
    <>
      {/* E-11: first focusable element; off-screen until it receives keyboard focus. */}
      <a href="#main-content" className="skip-link">{translate("en", "common.skipToContent")}</a>
      <ScrollProgress />
      <Header />
      <main id="main-content" tabIndex={-1}>
        <Hero />
        <WaveDivider fill="var(--bg2)" />
        <About />
        <WaveDivider fill="var(--bg)" />
        <Packages initialPackages={packages} />
        {offers.length > 0 && (
          <>
            <WaveDivider fill="var(--bg3)" />
            <Offers initialOffers={offers} />
          </>
        )}
        <WaveDivider fill="var(--bg2)" />
        <Gallery initialImages={gallery} />
        <Counter />
        <WaveDivider fill="var(--bg2)" />
        <Showcase />
        <WaveDivider fill="var(--bg)" />
        <Reviews initialReviews={reviews} />
        <WaveDivider fill="var(--bg2)" />
        <Blog initialBlogs={blogs} />
        <WaveDivider fill="var(--bg)" />
        <FAQ initialFaqs={faqs} />
        <Contact initialPackages={packages} minDate={istDateKey(new Date())} />
      </main>
      <Footer />
      <CompareBar />
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
