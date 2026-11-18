"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import type { TourPackage, Booking, Enquiry, Review, GalleryImage, BlogPost, FAQ, Offer } from "@/lib/types";
import { useApp } from "@/lib/context";
import { loadList, type LoadResult } from "./_lib/api";
import { entityCrud, useEntityTab } from "./_lib/crud";
import { isAwaitingApproval } from "./_lib/table";
import type { Tab } from "./_lib/tabs";
import AdminStyles from "./_components/AdminStyles";
import { Icon, type IconName } from "./_components/icons";
import Dashboard from "./_components/Dashboard";
import PackagesTab from "./_components/PackagesTab";
import BookingsTab from "./_components/BookingsTab";
import EnquiriesTab from "./_components/EnquiriesTab";
import ReviewsTab from "./_components/ReviewsTab";
import GalleryTab from "./_components/GalleryTab";
import BlogsTab from "./_components/BlogsTab";
import FaqsTab from "./_components/FaqsTab";
import OffersTab from "./_components/OffersTab";

const NAV: Record<Tab, { label: string; icon: IconName }> = {
  dashboard: { label: "Dashboard", icon: "dashboard" },
  bookings: { label: "Bookings", icon: "bookings" },
  enquiries: { label: "Enquiries", icon: "enquiries" },
  reviews: { label: "Reviews", icon: "reviews" },
  packages: { label: "Packages", icon: "packages" },
  gallery: { label: "Gallery", icon: "gallery" },
  blogs: { label: "Blogs", icon: "blogs" },
  faqs: { label: "FAQs", icon: "faqs" },
  offers: { label: "Offers", icon: "offers" },
};
const INBOX_TABS: Tab[] = ["bookings", "enquiries", "reviews"];
const CONTENT_TABS: Tab[] = ["packages", "gallery", "blogs", "faqs", "offers"];

export default function AdminPage() {
  const router = useRouter();
  const { theme, setTheme } = useApp();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("dashboard");
  const [packages, setPackages] = useState<TourPackage[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);

  // Content tabs: list + add/edit modal state + CRUD (see _lib/crud.ts).
  const packagesTab = useEntityTab("/api/packages", "package", packages, setPackages);
  const reviewsTab = useEntityTab("/api/reviews", "review", reviews, setReviews);
  const galleryTab = useEntityTab("/api/gallery", "image", gallery, setGallery);
  const blogsTab = useEntityTab("/api/blogs", "blog post", blogs, setBlogs);
  const faqsTab = useEntityTab("/api/faqs", "FAQ", faqs, setFaqs);
  const offersTab = useEntityTab("/api/offers", "offer", offers, setOffers);
  // Bookings and enquiries are only status-updated and deleted from the admin.
  const bookingCrud = entityCrud("/api/bookings", "booking", setBookings);
  const enquiryCrud = entityCrud("/api/enquiries", "enquiry", setEnquiries);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => { if (!r.ok) router.push("/login"); else setLoading(false); })
      .catch(err => { console.error("Session check failed", err); router.push("/login"); });
  }, [router]);

  useEffect(() => {
    if (loading) return;
    let cancelled = false;
    // Content entities use ?all=1 so the admin also sees hidden/inactive items (B-05).
    const sources = [
      ["/api/packages?all=1", "packages"], ["/api/bookings", "bookings"], ["/api/enquiries", "enquiries"],
      ["/api/reviews?all=1", "reviews"], ["/api/gallery?all=1", "gallery"], ["/api/blogs?all=1", "blogs"],
      ["/api/faqs?all=1", "FAQs"], ["/api/offers?all=1", "offers"],
    ] as const;
    Promise.all(sources.map(([url, label]) => loadList(url, label))).then(results => {
      if (cancelled) return;
      if (results.some(r => r.status === 401)) { router.push("/login"); return; }
      const failed = results.filter(r => r.status < 200 || r.status >= 300 || !Array.isArray(r.data));
      if (failed.length) {
        console.error("Admin data load failed", failed);
        alert(`Failed to load: ${failed.map(r => `${r.label} (${r.status || "network error"}${typeof r.data === "string" && r.data ? `: ${r.data}` : ""})`).join(", ")}`);
      }
      const arr = <T,>(r: LoadResult): T[] => (Array.isArray(r.data) ? (r.data as T[]) : []);
      const [pk, bk, en, rv, gl, bl, fq, of] = results;
      setPackages(arr<TourPackage>(pk)); setBookings(arr<Booking>(bk)); setEnquiries(arr<Enquiry>(en)); setReviews(arr<Review>(rv));
      setGallery(arr<GalleryImage>(gl)); setBlogs(arr<BlogPost>(bl)); setFaqs(arr<FAQ>(fq)); setOffers(arr<Offer>(of));
    });
    return () => { cancelled = true; };
  }, [loading, router]);

  const logout = async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/login"); };

  if (loading) {
    return (
      <div className="adm-root">
        <AdminStyles />
        <div className="adm-loading" role="status"><div className="adm-spinner" />Loading admin…</div>
      </div>
    );
  }

  // Inbox counts: items waiting for the owner to act on.
  const counts: Partial<Record<Tab, number>> = {
    bookings: bookings.filter(b => b.bookingStatus === "pending").length,
    enquiries: enquiries.filter(e => e.status === "new").length,
    reviews: reviews.filter(isAwaitingApproval).length,
  };

  const go = (tk: Tab) => { setTab(tk); window.scrollTo({ top: 0 }); };

  // aria-label keeps the button's accessible name to the bare label; the count is announced via title.
  const navItem = (tk: Tab) => (
    <button key={tk} type="button" className={`adm-nav-item${tab === tk ? " active" : ""}`}
      aria-current={tab === tk ? "page" : undefined} aria-label={NAV[tk].label} onClick={() => go(tk)}>
      <Icon name={NAV[tk].icon} />
      <span>{NAV[tk].label}</span>
      {!!counts[tk] && <span className="adm-nav-count tnum" title={`${counts[tk]} waiting`}>{counts[tk]}</span>}
    </button>
  );

  return (
    <div className="adm-root">
      <AdminStyles />
      <div className="adm-shell">
        <aside className="adm-side">
          <div className="adm-brand">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/atlas-logo.jpeg" alt="" />
            <h1>Atlas Tour &amp; Travels <span>Admin</span></h1>
          </div>
          <nav className="adm-nav" aria-label="Admin sections">
            {navItem("dashboard")}
            <div className="adm-nav-group">Inbox</div>
            {INBOX_TABS.map(navItem)}
            <div className="adm-nav-group">Website content</div>
            {CONTENT_TABS.map(navItem)}
          </nav>
          <div className="adm-side-foot">
            <button type="button" className="adm-nav-item" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
              <Icon name={theme === "dark" ? "sun" : "moon"} />
              <span className="adm-nav-label">{theme === "dark" ? "Light mode" : "Dark mode"}</span>
            </button>
            <Link href="/" className="adm-nav-item" target="_blank" rel="noopener">
              <Icon name="external" /><span className="adm-nav-label">View website</span>
            </Link>
            <button type="button" className="adm-nav-item" onClick={logout}>
              <Icon name="logout" /><span className="adm-nav-label">Log out</span>
            </button>
          </div>
        </aside>

        <main className="adm-main">
          <div className="adm-body">
            {tab === "dashboard" && <Dashboard packages={packages} bookings={bookings} enquiries={enquiries} offers={offers} reviews={reviews} onNavigate={go} />}
            {tab === "packages" && <PackagesTab {...packagesTab} />}
            {tab === "bookings" && <BookingsTab bookings={bookings} onUpdate={bookingCrud.update} onRemove={bookingCrud.remove} />}
            {tab === "enquiries" && <EnquiriesTab enquiries={enquiries} onUpdateStatus={(id, status) => enquiryCrud.update(id, { status })} onRemove={enquiryCrud.remove} />}
            {tab === "reviews" && <ReviewsTab {...reviewsTab} />}
            {tab === "gallery" && <GalleryTab {...galleryTab} />}
            {tab === "blogs" && <BlogsTab {...blogsTab} />}
            {tab === "faqs" && <FaqsTab {...faqsTab} />}
            {tab === "offers" && <OffersTab {...offersTab} />}
          </div>
        </main>
      </div>
    </div>
  );
}
