export interface TourPackage {
  id: string;
  name: string;
  destination: string;
  duration: string;
  price: number;
  originalPrice?: number;
  image: string;
  description: string;
  highlights: string[];
  itinerary: string[];
  inclusions: string[];
  /** What the price does not cover (N-18). Missing on JSON rows saved before N-18 — treat as []. */
  exclusions?: string[];
  /** City the trip starts from, e.g. "Prayagraj" (N-18). */
  startsFrom?: string;
  /** Smallest group the package can be booked for (N-18); /api/book rejects fewer travellers. */
  minTravelers?: number;
  /** Shown under the price, e.g. "Based on double sharing" (N-18). */
  priceNote?: string;
  /**
   * N-22: per-person rates by hotel category × group size (src/lib/pricing.ts). When set, the
   * booking form asks for a hotel category and /api/book charges the matching rate.
   */
  pricing?: PackagePricing;
  category: "spiritual" | "cultural" | "adventure" | "heritage" | "pilgrimage" | "international" | "honeymoon";
  hidden?: boolean;
  createdAt: string;
}

/** N-22: one hotel category row of a package's price grid. */
export interface PricingTier {
  /** e.g. "3★ Deluxe". Unique within the package; saved with the booking. */
  name: string;
  /** Per-person rate for each `PackagePricing.groupSizes` column; null = not offered. */
  prices: (number | null)[];
  /** Extra bed (third person in the room), per person. */
  extraBed?: number;
  /** Child without bed ("CNB"), per child. */
  childNoBed?: number;
}

/** N-22: hotel categories × group sizes. `groupSizes` are increasing, e.g. [2, 4, 6, 8, 10, 12]. */
export interface PackagePricing {
  groupSizes: number[];
  tiers: PricingTier[];
}

export interface Enquiry {
  id: string;
  name: string;
  phone: string;
  email: string;
  packageId?: string;
  travelers: number;
  travelDate: string;
  message: string;
  status: "new" | "contacted" | "confirmed" | "cancelled";
  /**
   * Which public form created it (N-6). Missing on enquiries saved before N-6 and on
   * Postgres rows from before the column existed — treat missing as "contact".
   */
  kind?: EnquiryKind;
  createdAt: string;
}

/** contact = Contact section form; trip-plan = "Plan my trip" form; callback = callback-slot request (N-6). */
export type EnquiryKind = "contact" | "trip-plan" | "callback";

export interface Booking {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  packageId: string;
  packageName: string;
  travelers: number;
  travelDate: string;
  amount: number;
  paymentStatus: "pending" | "verifying" | "paid" | "failed" | "refunded";
  bookingStatus: "pending" | "confirmed" | "completed" | "cancelled";
  /** UPI transaction reference (UTR) the customer submitted (N-13). Unique across bookings. */
  utr?: string;
  /** When the UTR was submitted (ISO). */
  paymentSubmittedAt?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  name: string;
  rating: number;
  text: string;
  city: string;
  packageName?: string;
  active: boolean;
  /**
   * N-5: "customer" = submitted through the public review form (saved inactive until an
   * admin approves it). Missing = added by the admin (including every review from before N-5).
   */
  source?: "admin" | "customer";
  createdAt: string;
}

export interface GalleryImage {
  id: string;
  src: string;
  caption: string;
  category: string;
  active: boolean;
  createdAt: string;
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  category: string;
  author: string;
  active: boolean;
  createdAt: string;
}

export interface FAQ {
  id: string;
  question: string;
  questionHi?: string;
  answer: string;
  answerHi?: string;
  active: boolean;
  order: number;
  createdAt: string;
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  discount: number;
  code?: string;
  validFrom: string;
  validTo: string;
  active: boolean;
  createdAt: string;
}

export interface SiteConfig {
  name: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  tagline: string;
  established?: number;
}

export interface DB {
  packages: TourPackage[];
  enquiries: Enquiry[];
  bookings: Booking[];
  reviews: Review[];
  gallery: GalleryImage[];
  blogs: BlogPost[];
  faqs: FAQ[];
  offers: Offer[];
  config: SiteConfig;
}

// ============================================================
// Admin users, sessions and audit log (N-8). Stored outside `DB`: the JSON backend keeps
// them in a separate file next to db.json (`db.admin.json`), Postgres in their own tables.
// ============================================================

/** A database admin user. All admins have equal permissions. `passwordHash` never leaves the server. */
export interface AdminUser {
  id: string;
  /** Stored lower-case; unique (case-insensitive). */
  email: string;
  name: string;
  /** bcrypt hash. Never sent to the client (see `PublicAdminUser`). */
  passwordHash: string;
  active: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

/** What the admin API returns for a user. */
export type PublicAdminUser = Omit<AdminUser, "passwordHash">;

/** `userId` of sessions created by the env admin (ADMIN_EMAIL + ADMIN_PASSWORD(_HASH)). */
export const ENV_ADMIN_ID = "env";

/** A server-side admin session; `id` is the JWT's `jti`. */
export interface AdminSession {
  id: string;
  /** AdminUser id, or `ENV_ADMIN_ID` for the env admin. */
  userId: string;
  email: string;
  createdAt: string;
  expiresAt: string;
  revokedAt?: string;
  userAgent?: string;
  ip?: string;
}

export type AuditAction =
  | "create" | "update" | "delete"
  | "login" | "logout" | "login_failed" | "signout_all" | "password_change";

/** One admin action. `details` lists the changed field NAMES only — never values or passwords. */
export interface AuditEntry {
  id: string;
  createdAt: string;
  actorEmail: string;
  action: AuditAction;
  entity?: string;
  entityId?: string;
  details: string[];
}

/** The JSON backend's admin file (`db.admin.json`). */
export interface AdminDB {
  adminUsers: AdminUser[];
  adminSessions: AdminSession[];
  auditLog: AuditEntry[];
}
