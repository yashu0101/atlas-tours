import type { BlogPost, FAQ, GalleryImage, Offer, Review, TourPackage } from "./types";

/**
 * Public-visibility rules for admin-managed content (B-05).
 *
 * Shared by the public API GETs (`crudRoute({ isPublic })`) and the
 * server-rendered home page (F-02) so the two can never drift apart.
 */
export const isPublicPackage = (p: TourPackage) => !p.hidden;
export const isPublicReview = (r: Review) => r.active !== false;
export const isPublicGalleryImage = (g: GalleryImage) => g.active !== false;
export const isPublicBlog = (b: BlogPost) => b.active !== false;
export const isPublicFAQ = (f: FAQ) => f.active !== false;
export const isPublicOffer = (o: Offer) => o.active !== false;
