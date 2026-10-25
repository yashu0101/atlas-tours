import { TourPackage, Enquiry, Booking, Review, GalleryImage, BlogPost, FAQ, Offer } from "./types";

const IS_POSTGRES = !!process.env.DATABASE_URL;

// ============================================================
// POSTGRES (Neon)
// ============================================================
function getSQL() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { neon } = require("@neondatabase/serverless");
  return neon(process.env.DATABASE_URL!);
}

// --- Packages ---
async function pgGetPackages(): Promise<TourPackage[]> {
  const sql = getSQL();
  const rows = await sql`SELECT * FROM packages ORDER BY created_at DESC`;
  return rows.map((r: Record<string, unknown>) => ({ id: r.id, name: r.name, destination: r.destination, duration: r.duration, price: r.price, originalPrice: r.original_price, image: r.image, description: r.description, highlights: JSON.parse((r.highlights as string) || "[]"), itinerary: JSON.parse((r.itinerary as string) || "[]"), inclusions: JSON.parse((r.inclusions as string) || "[]"), category: r.category, hidden: r.hidden, createdAt: r.created_at })) as TourPackage[];
}
async function pgAddPackage(p: Omit<TourPackage, "createdAt">): Promise<TourPackage> {
  const sql = getSQL(); const now = new Date().toISOString();
  await sql`INSERT INTO packages (id,name,destination,duration,price,original_price,image,description,highlights,itinerary,inclusions,category,hidden,created_at) VALUES (${p.id},${p.name},${p.destination},${p.duration},${p.price},${p.originalPrice||null},${p.image},${p.description},${JSON.stringify(p.highlights)},${JSON.stringify(p.itinerary)},${JSON.stringify(p.inclusions)},${p.category},${!!p.hidden},${now})`;
  return { ...p, createdAt: now };
}
async function pgUpdatePackage(id: string, u: Partial<TourPackage>): Promise<TourPackage | null> {
  const sql = getSQL();
  const rows = await sql`UPDATE packages SET name=COALESCE(${u.name??null},name),destination=COALESCE(${u.destination??null},destination),duration=COALESCE(${u.duration??null},duration),price=COALESCE(${u.price??null},price),original_price=COALESCE(${u.originalPrice??null},original_price),image=COALESCE(${u.image??null},image),description=COALESCE(${u.description??null},description),highlights=COALESCE(${u.highlights?JSON.stringify(u.highlights):null},highlights),itinerary=COALESCE(${u.itinerary?JSON.stringify(u.itinerary):null},itinerary),inclusions=COALESCE(${u.inclusions?JSON.stringify(u.inclusions):null},inclusions),category=COALESCE(${u.category??null},category),hidden=COALESCE(${u.hidden??null},hidden) WHERE id=${id} RETURNING *`;
  if (!rows.length) return null;
  const r = rows[0];
  return { id: r.id, name: r.name, destination: r.destination, duration: r.duration, price: r.price, originalPrice: r.original_price, image: r.image, description: r.description, highlights: JSON.parse(r.highlights||"[]"), itinerary: JSON.parse(r.itinerary||"[]"), inclusions: JSON.parse(r.inclusions||"[]"), category: r.category, hidden: r.hidden, createdAt: r.created_at } as TourPackage;
}
async function pgDeletePackage(id: string): Promise<boolean> {
  const sql = getSQL(); const rows = await sql`DELETE FROM packages WHERE id=${id} RETURNING id`; return rows.length > 0;
}

// --- Enquiries ---
async function pgGetEnquiries(): Promise<Enquiry[]> {
  const sql = getSQL();
  const rows = await sql`SELECT * FROM enquiries ORDER BY created_at DESC`;
  return rows.map((r: Record<string, unknown>) => ({ id: r.id, name: r.name, phone: r.phone, email: r.email, packageId: r.package_id, travelers: r.travelers, travelDate: r.travel_date, message: r.message, status: r.status, createdAt: r.created_at })) as Enquiry[];
}
async function pgAddEnquiry(e: Omit<Enquiry, "id"|"createdAt"|"status">): Promise<Enquiry> {
  const sql = getSQL(); const id = crypto.randomUUID(); const now = new Date().toISOString();
  await sql`INSERT INTO enquiries (id,name,phone,email,package_id,travelers,travel_date,message,status,created_at) VALUES (${id},${e.name},${e.phone},${e.email},${e.packageId||null},${e.travelers},${e.travelDate},${e.message},'new',${now})`;
  return { ...e, id, createdAt: now, status: "new" };
}
async function pgUpdateEnquiryStatus(id: string, status: Enquiry["status"]): Promise<Enquiry | null> {
  const sql = getSQL();
  const rows = await sql`UPDATE enquiries SET status=${status} WHERE id=${id} RETURNING *`;
  if (!rows.length) return null;
  const r = rows[0];
  return { id: r.id, name: r.name, phone: r.phone, email: r.email, packageId: r.package_id, travelers: r.travelers, travelDate: r.travel_date, message: r.message, status: r.status, createdAt: r.created_at } as Enquiry;
}
async function pgDeleteEnquiry(id: string): Promise<boolean> {
  const sql = getSQL(); const rows = await sql`DELETE FROM enquiries WHERE id=${id} RETURNING id`; return rows.length > 0;
}

// --- Bookings ---
async function pgGetBookings(): Promise<Booking[]> {
  const sql = getSQL();
  const rows = await sql`SELECT * FROM bookings ORDER BY created_at DESC`;
  return rows.map((r: Record<string, unknown>) => ({ id: r.id, name: r.name, phone: r.phone, email: r.email, city: r.city, packageId: r.package_id, packageName: r.package_name, travelers: r.travelers, travelDate: r.travel_date, amount: r.amount, paymentStatus: r.payment_status, bookingStatus: r.booking_status, createdAt: r.created_at })) as Booking[];
}
async function pgAddBooking(b: Omit<Booking, "id"|"createdAt"|"paymentStatus"|"bookingStatus">): Promise<Booking> {
  const sql = getSQL(); const id = crypto.randomUUID(); const now = new Date().toISOString();
  await sql`INSERT INTO bookings (id,name,phone,email,city,package_id,package_name,travelers,travel_date,amount,payment_status,booking_status,created_at) VALUES (${id},${b.name},${b.phone},${b.email},${b.city},${b.packageId},${b.packageName},${b.travelers},${b.travelDate},${b.amount},'pending','pending',${now})`;
  return { ...b, id, createdAt: now, paymentStatus: "pending", bookingStatus: "pending" };
}
async function pgUpdateBooking(id: string, u: Partial<Pick<Booking, "paymentStatus"|"bookingStatus">>): Promise<Booking | null> {
  const sql = getSQL();
  const rows = await sql`UPDATE bookings SET payment_status=COALESCE(${u.paymentStatus??null},payment_status),booking_status=COALESCE(${u.bookingStatus??null},booking_status) WHERE id=${id} RETURNING *`;
  if (!rows.length) return null;
  const r = rows[0];
  return { id: r.id, name: r.name, phone: r.phone, email: r.email, city: r.city, packageId: r.package_id, packageName: r.package_name, travelers: r.travelers, travelDate: r.travel_date, amount: r.amount, paymentStatus: r.payment_status, bookingStatus: r.booking_status, createdAt: r.created_at } as Booking;
}
async function pgDeleteBooking(id: string): Promise<boolean> {
  const sql = getSQL(); const rows = await sql`DELETE FROM bookings WHERE id=${id} RETURNING id`; return rows.length > 0;
}

// --- Reviews ---
async function pgGetReviews(): Promise<Review[]> {
  const sql = getSQL(); const rows = await sql`SELECT * FROM reviews ORDER BY created_at DESC`;
  return rows.map((r: Record<string, unknown>) => ({ id: r.id, name: r.name, rating: r.rating, text: r.text, city: r.city, packageName: r.package_name, active: r.active, createdAt: r.created_at })) as Review[];
}
async function pgAddReview(rev: Omit<Review, "id"|"createdAt">): Promise<Review> {
  const sql = getSQL(); const id = crypto.randomUUID(); const now = new Date().toISOString();
  await sql`INSERT INTO reviews (id,name,rating,text,city,package_name,active,created_at) VALUES (${id},${rev.name},${rev.rating},${rev.text},${rev.city},${rev.packageName||null},${rev.active},${now})`;
  return { ...rev, id, createdAt: now };
}
async function pgUpdateReview(id: string, u: Partial<Review>): Promise<Review | null> {
  const sql = getSQL();
  const rows = await sql`UPDATE reviews SET name=COALESCE(${u.name??null},name),rating=COALESCE(${u.rating??null},rating),text=COALESCE(${u.text??null},text),city=COALESCE(${u.city??null},city),package_name=COALESCE(${u.packageName??null},package_name),active=COALESCE(${u.active??null},active) WHERE id=${id} RETURNING *`;
  if (!rows.length) return null;
  const r = rows[0]; return { id: r.id, name: r.name, rating: r.rating, text: r.text, city: r.city, packageName: r.package_name, active: r.active, createdAt: r.created_at } as Review;
}
async function pgDeleteReview(id: string): Promise<boolean> {
  const sql = getSQL(); const rows = await sql`DELETE FROM reviews WHERE id=${id} RETURNING id`; return rows.length > 0;
}

// --- Gallery ---
async function pgGetGallery(): Promise<GalleryImage[]> {
  const sql = getSQL(); const rows = await sql`SELECT * FROM gallery ORDER BY created_at DESC`;
  return rows.map((r: Record<string, unknown>) => ({ id: r.id, src: r.src, caption: r.caption, category: r.category, active: r.active, createdAt: r.created_at })) as GalleryImage[];
}
async function pgAddGalleryImage(img: Omit<GalleryImage, "id"|"createdAt">): Promise<GalleryImage> {
  const sql = getSQL(); const id = crypto.randomUUID(); const now = new Date().toISOString();
  await sql`INSERT INTO gallery (id,src,caption,category,active,created_at) VALUES (${id},${img.src},${img.caption},${img.category},${img.active},${now})`;
  return { ...img, id, createdAt: now };
}
async function pgUpdateGalleryImage(id: string, u: Partial<GalleryImage>): Promise<GalleryImage | null> {
  const sql = getSQL();
  const rows = await sql`UPDATE gallery SET src=COALESCE(${u.src??null},src),caption=COALESCE(${u.caption??null},caption),category=COALESCE(${u.category??null},category),active=COALESCE(${u.active??null},active) WHERE id=${id} RETURNING *`;
  if (!rows.length) return null;
  const r = rows[0]; return { id: r.id, src: r.src, caption: r.caption, category: r.category, active: r.active, createdAt: r.created_at } as GalleryImage;
}
async function pgDeleteGalleryImage(id: string): Promise<boolean> {
  const sql = getSQL(); const rows = await sql`DELETE FROM gallery WHERE id=${id} RETURNING id`; return rows.length > 0;
}

// --- Blogs ---
async function pgGetBlogs(): Promise<BlogPost[]> {
  const sql = getSQL(); const rows = await sql`SELECT * FROM blogs ORDER BY created_at DESC`;
  return rows.map((r: Record<string, unknown>) => ({ id: r.id, title: r.title, excerpt: r.excerpt, content: r.content, image: r.image, category: r.category, author: r.author, active: r.active, createdAt: r.created_at })) as BlogPost[];
}
async function pgAddBlog(b: Omit<BlogPost, "id"|"createdAt">): Promise<BlogPost> {
  const sql = getSQL(); const id = crypto.randomUUID(); const now = new Date().toISOString();
  await sql`INSERT INTO blogs (id,title,excerpt,content,image,category,author,active,created_at) VALUES (${id},${b.title},${b.excerpt},${b.content},${b.image},${b.category},${b.author},${b.active},${now})`;
  return { ...b, id, createdAt: now };
}
async function pgUpdateBlog(id: string, u: Partial<BlogPost>): Promise<BlogPost | null> {
  const sql = getSQL();
  const rows = await sql`UPDATE blogs SET title=COALESCE(${u.title??null},title),excerpt=COALESCE(${u.excerpt??null},excerpt),content=COALESCE(${u.content??null},content),image=COALESCE(${u.image??null},image),category=COALESCE(${u.category??null},category),author=COALESCE(${u.author??null},author),active=COALESCE(${u.active??null},active) WHERE id=${id} RETURNING *`;
  if (!rows.length) return null;
  const r = rows[0]; return { id: r.id, title: r.title, excerpt: r.excerpt, content: r.content, image: r.image, category: r.category, author: r.author, active: r.active, createdAt: r.created_at } as BlogPost;
}
async function pgDeleteBlog(id: string): Promise<boolean> {
  const sql = getSQL(); const rows = await sql`DELETE FROM blogs WHERE id=${id} RETURNING id`; return rows.length > 0;
}

// --- FAQs ---
async function pgGetFAQs(): Promise<FAQ[]> {
  const sql = getSQL(); const rows = await sql`SELECT * FROM faqs ORDER BY sort_order`;
  return rows.map((r: Record<string, unknown>) => ({ id: r.id, question: r.question, questionHi: r.question_hi, answer: r.answer, answerHi: r.answer_hi, active: r.active, order: r.sort_order, createdAt: r.created_at })) as FAQ[];
}
async function pgAddFAQ(f: Omit<FAQ, "id"|"createdAt">): Promise<FAQ> {
  const sql = getSQL(); const id = crypto.randomUUID(); const now = new Date().toISOString();
  await sql`INSERT INTO faqs (id,question,question_hi,answer,answer_hi,active,sort_order,created_at) VALUES (${id},${f.question},${f.questionHi||null},${f.answer},${f.answerHi||null},${f.active},${f.order},${now})`;
  return { ...f, id, createdAt: now };
}
async function pgUpdateFAQ(id: string, u: Partial<FAQ>): Promise<FAQ | null> {
  const sql = getSQL();
  const rows = await sql`UPDATE faqs SET question=COALESCE(${u.question??null},question),question_hi=COALESCE(${u.questionHi??null},question_hi),answer=COALESCE(${u.answer??null},answer),answer_hi=COALESCE(${u.answerHi??null},answer_hi),active=COALESCE(${u.active??null},active),sort_order=COALESCE(${u.order??null},sort_order) WHERE id=${id} RETURNING *`;
  if (!rows.length) return null;
  const r = rows[0]; return { id: r.id, question: r.question, questionHi: r.question_hi, answer: r.answer, answerHi: r.answer_hi, active: r.active, order: r.sort_order, createdAt: r.created_at } as FAQ;
}
async function pgDeleteFAQ(id: string): Promise<boolean> {
  const sql = getSQL(); const rows = await sql`DELETE FROM faqs WHERE id=${id} RETURNING id`; return rows.length > 0;
}

// --- Offers ---
async function pgGetOffers(): Promise<Offer[]> {
  const sql = getSQL(); const rows = await sql`SELECT * FROM offers ORDER BY created_at DESC`;
  return rows.map((r: Record<string, unknown>) => ({ id: r.id, title: r.title, description: r.description, discount: r.discount, code: r.code, validFrom: r.valid_from, validTo: r.valid_to, active: r.active, createdAt: r.created_at })) as Offer[];
}
async function pgAddOffer(o: Omit<Offer, "id"|"createdAt">): Promise<Offer> {
  const sql = getSQL(); const id = crypto.randomUUID(); const now = new Date().toISOString();
  await sql`INSERT INTO offers (id,title,description,discount,code,valid_from,valid_to,active,created_at) VALUES (${id},${o.title},${o.description},${o.discount},${o.code||null},${o.validFrom},${o.validTo},${o.active},${now})`;
  return { ...o, id, createdAt: now };
}
async function pgUpdateOffer(id: string, u: Partial<Offer>): Promise<Offer | null> {
  const sql = getSQL();
  const rows = await sql`UPDATE offers SET title=COALESCE(${u.title??null},title),description=COALESCE(${u.description??null},description),discount=COALESCE(${u.discount??null},discount),code=COALESCE(${u.code??null},code),valid_from=COALESCE(${u.validFrom??null},valid_from),valid_to=COALESCE(${u.validTo??null},valid_to),active=COALESCE(${u.active??null},active) WHERE id=${id} RETURNING *`;
  if (!rows.length) return null;
  const r = rows[0]; return { id: r.id, title: r.title, description: r.description, discount: r.discount, code: r.code, validFrom: r.valid_from, validTo: r.valid_to, active: r.active, createdAt: r.created_at } as Offer;
}
async function pgDeleteOffer(id: string): Promise<boolean> {
  const sql = getSQL(); const rows = await sql`DELETE FROM offers WHERE id=${id} RETURNING id`; return rows.length > 0;
}

// ============================================================
// JSON FILE — local dev
// ============================================================
import fs from "fs";
import path from "path";
import { DB } from "./types";
import { SITE_CONFIG, DEFAULT_PACKAGES } from "./config";

const DB_PATH = path.join(process.cwd(), "data", "db.json");

function readDB(): DB {
  try {
    const raw = fs.readFileSync(DB_PATH, "utf-8");
    const data = JSON.parse(raw);
    if (!data.packages) data.packages = [];
    if (!data.enquiries) data.enquiries = [];
    if (!data.bookings) data.bookings = [];
    if (!data.reviews) data.reviews = [];
    if (!data.gallery) data.gallery = [];
    if (!data.blogs) data.blogs = [];
    if (!data.faqs) data.faqs = [];
    if (!data.offers) data.offers = [];
    return data;
  } catch {
    const initial: DB = { packages: DEFAULT_PACKAGES, enquiries: [], bookings: [], reviews: [], gallery: [], blogs: [], faqs: [], offers: [], config: SITE_CONFIG };
    writeDB(initial);
    return initial;
  }
}

function writeDB(data: DB): void {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
}

// JSON CRUD helpers
function jsonCRUD<T extends { id: string }>(key: keyof DB) {
  return {
    getAll: (): T[] => readDB()[key] as unknown as T[],
    add: (item: T): T => { const db = readDB(); (db[key] as unknown as T[]).push(item); writeDB(db); return item; },
    update: (id: string, updates: Partial<T>): T | null => {
      const db = readDB(); const arr = db[key] as unknown as T[]; const idx = arr.findIndex(i => i.id === id);
      if (idx === -1) return null; Object.assign(arr[idx], updates); writeDB(db); return arr[idx];
    },
    remove: (id: string): boolean => {
      const db = readDB(); const arr = db[key] as unknown as T[]; const idx = arr.findIndex(i => i.id === id);
      if (idx === -1) return false; arr.splice(idx, 1); writeDB(db); return true;
    },
  };
}

const jsonPkgs = jsonCRUD<TourPackage>("packages");
const jsonEnqs = jsonCRUD<Enquiry>("enquiries");
const jsonBooks = jsonCRUD<Booking>("bookings");
const jsonRevs = jsonCRUD<Review>("reviews");
const jsonGall = jsonCRUD<GalleryImage>("gallery");
const jsonBlgs = jsonCRUD<BlogPost>("blogs");
const jsonFaqs = jsonCRUD<FAQ>("faqs");
const jsonOffs = jsonCRUD<Offer>("offers");

// ============================================================
// EXPORTED API
// ============================================================
export async function getPackages() { return IS_POSTGRES ? pgGetPackages() : jsonPkgs.getAll(); }
export async function addPackage(p: Omit<TourPackage, "createdAt">) { return IS_POSTGRES ? pgAddPackage(p) : jsonPkgs.add({ ...p, createdAt: new Date().toISOString() }); }
export async function updatePackage(id: string, u: Partial<TourPackage>) { return IS_POSTGRES ? pgUpdatePackage(id, u) : jsonPkgs.update(id, u); }
export async function deletePackage(id: string) { return IS_POSTGRES ? pgDeletePackage(id) : jsonPkgs.remove(id); }

export async function getEnquiries() { return IS_POSTGRES ? pgGetEnquiries() : jsonEnqs.getAll(); }
export async function addEnquiry(e: Omit<Enquiry, "id"|"createdAt"|"status">) {
  const full = { ...e, id: crypto.randomUUID(), createdAt: new Date().toISOString(), status: "new" as const };
  return IS_POSTGRES ? pgAddEnquiry(e) : jsonEnqs.add(full);
}
export async function updateEnquiryStatus(id: string, status: Enquiry["status"]) { return IS_POSTGRES ? pgUpdateEnquiryStatus(id, status) : jsonEnqs.update(id, { status } as Partial<Enquiry>); }
export async function deleteEnquiry(id: string) { return IS_POSTGRES ? pgDeleteEnquiry(id) : jsonEnqs.remove(id); }

export async function getBookings() { return IS_POSTGRES ? pgGetBookings() : jsonBooks.getAll(); }
export async function addBooking(b: Omit<Booking, "id"|"createdAt"|"paymentStatus"|"bookingStatus">) {
  const full = { ...b, id: crypto.randomUUID(), createdAt: new Date().toISOString(), paymentStatus: "pending" as const, bookingStatus: "pending" as const };
  return IS_POSTGRES ? pgAddBooking(b) : jsonBooks.add(full);
}
export async function updateBooking(id: string, u: Partial<Pick<Booking, "paymentStatus"|"bookingStatus">>) { return IS_POSTGRES ? pgUpdateBooking(id, u) : jsonBooks.update(id, u as Partial<Booking>); }
export async function deleteBooking(id: string) { return IS_POSTGRES ? pgDeleteBooking(id) : jsonBooks.remove(id); }

export async function getReviews() { return IS_POSTGRES ? pgGetReviews() : jsonRevs.getAll(); }
export async function addReview(r: Omit<Review, "id"|"createdAt">) { const full = { ...r, id: crypto.randomUUID(), createdAt: new Date().toISOString() }; return IS_POSTGRES ? pgAddReview(r) : jsonRevs.add(full); }
export async function updateReview(id: string, u: Partial<Review>) { return IS_POSTGRES ? pgUpdateReview(id, u) : jsonRevs.update(id, u); }
export async function deleteReview(id: string) { return IS_POSTGRES ? pgDeleteReview(id) : jsonRevs.remove(id); }

export async function getGallery() { return IS_POSTGRES ? pgGetGallery() : jsonGall.getAll(); }
export async function addGalleryImage(i: Omit<GalleryImage, "id"|"createdAt">) { const full = { ...i, id: crypto.randomUUID(), createdAt: new Date().toISOString() }; return IS_POSTGRES ? pgAddGalleryImage(i) : jsonGall.add(full); }
export async function updateGalleryImage(id: string, u: Partial<GalleryImage>) { return IS_POSTGRES ? pgUpdateGalleryImage(id, u) : jsonGall.update(id, u); }
export async function deleteGalleryImage(id: string) { return IS_POSTGRES ? pgDeleteGalleryImage(id) : jsonGall.remove(id); }

export async function getBlogs() { return IS_POSTGRES ? pgGetBlogs() : jsonBlgs.getAll(); }
export async function addBlog(b: Omit<BlogPost, "id"|"createdAt">) { const full = { ...b, id: crypto.randomUUID(), createdAt: new Date().toISOString() }; return IS_POSTGRES ? pgAddBlog(b) : jsonBlgs.add(full); }
export async function updateBlog(id: string, u: Partial<BlogPost>) { return IS_POSTGRES ? pgUpdateBlog(id, u) : jsonBlgs.update(id, u); }
export async function deleteBlog(id: string) { return IS_POSTGRES ? pgDeleteBlog(id) : jsonBlgs.remove(id); }

export async function getFAQs() { return IS_POSTGRES ? pgGetFAQs() : jsonFaqs.getAll(); }
export async function addFAQ(f: Omit<FAQ, "id"|"createdAt">) { const full = { ...f, id: crypto.randomUUID(), createdAt: new Date().toISOString() }; return IS_POSTGRES ? pgAddFAQ(f) : jsonFaqs.add(full); }
export async function updateFAQ(id: string, u: Partial<FAQ>) { return IS_POSTGRES ? pgUpdateFAQ(id, u) : jsonFaqs.update(id, u); }
export async function deleteFAQ(id: string) { return IS_POSTGRES ? pgDeleteFAQ(id) : jsonFaqs.remove(id); }

export async function getOffers() { return IS_POSTGRES ? pgGetOffers() : jsonOffs.getAll(); }
export async function addOffer(o: Omit<Offer, "id"|"createdAt">) { const full = { ...o, id: crypto.randomUUID(), createdAt: new Date().toISOString() }; return IS_POSTGRES ? pgAddOffer(o) : jsonOffs.add(full); }
export async function updateOffer(id: string, u: Partial<Offer>) { return IS_POSTGRES ? pgUpdateOffer(id, u) : jsonOffs.update(id, u); }
export async function deleteOffer(id: string) { return IS_POSTGRES ? pgDeleteOffer(id) : jsonOffs.remove(id); }

export function getConfig() { return readDB().config; }
