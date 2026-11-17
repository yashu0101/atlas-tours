"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import type { TourPackage, Booking, Enquiry, Review, GalleryImage, BlogPost, FAQ, Offer } from "@/lib/types";
import { loadList, type LoadResult } from "./_lib/api";
import { entityCrud, useEntityTab } from "./_lib/crud";
import AdminStyles from "./_components/AdminStyles";
import Dashboard from "./_components/Dashboard";
import PackagesTab from "./_components/PackagesTab";
import BookingsTab from "./_components/BookingsTab";
import EnquiriesTab from "./_components/EnquiriesTab";
import ReviewsTab from "./_components/ReviewsTab";
import GalleryTab from "./_components/GalleryTab";
import BlogsTab from "./_components/BlogsTab";
import FaqsTab from "./_components/FaqsTab";
import OffersTab from "./_components/OffersTab";

type Tab = "dashboard" | "packages" | "bookings" | "enquiries" | "reviews" | "gallery" | "blogs" | "faqs" | "offers";

export default function AdminPage() {
  const router = useRouter();
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

  if (loading) return <div style={{ display: "grid", placeItems: "center", height: "100vh", background: "#0f1422", color: "#E67E22", fontFamily: "Poppins, sans-serif", fontSize: "1.2rem" }}>Loading...</div>;

  const tabKeys: Tab[] = ["dashboard", "packages", "bookings", "enquiries", "reviews", "gallery", "blogs", "faqs", "offers"];
  const tabLabels: Record<Tab, string> = {
    dashboard: "Dashboard", packages: "Packages", bookings: "Bookings", enquiries: "Enquiries",
    reviews: "Reviews", gallery: "Gallery", blogs: "Blogs", faqs: "FAQs", offers: "Offers",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0f1422", color: "#EDE6DA", fontFamily: "'Poppins', sans-serif" }}>
      <AdminStyles />

      <div className="adm-header">
        <h1>ATLAS TOUR & TRAVELS - Admin</h1>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Link href="/" style={{ color: "#8a8070", textDecoration: "none", fontSize: ".85rem" }}>View Site</Link>
          <button className="adm-btn" onClick={logout}>Logout</button>
        </div>
      </div>

      <div className="adm-tabs">
        {tabKeys.map(tk => (
          <button key={tk} className={`adm-tab${tab === tk ? " active" : ""}`} onClick={() => setTab(tk)}>
            {tabLabels[tk]}
          </button>
        ))}
      </div>

      <div className="adm-body">
        {tab === "dashboard" && <Dashboard packages={packages} bookings={bookings} enquiries={enquiries} offers={offers} reviews={reviews} />}
        {tab === "packages" && <PackagesTab {...packagesTab} />}
        {tab === "bookings" && <BookingsTab bookings={bookings} onUpdate={bookingCrud.update} onRemove={bookingCrud.remove} />}
        {tab === "enquiries" && <EnquiriesTab enquiries={enquiries} onUpdateStatus={(id, status) => enquiryCrud.update(id, { status })} onRemove={enquiryCrud.remove} />}
        {tab === "reviews" && <ReviewsTab {...reviewsTab} />}
        {tab === "gallery" && <GalleryTab {...galleryTab} />}
        {tab === "blogs" && <BlogsTab {...blogsTab} />}
        {tab === "faqs" && <FaqsTab {...faqsTab} />}
        {tab === "offers" && <OffersTab {...offersTab} />}
      </div>
    </div>
  );
}
