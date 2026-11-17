import { TourPackage, Enquiry, Booking, Review, GalleryImage, BlogPost, FAQ, Offer } from "./types";
import { buildSeedDB, SEED_PACKAGES, SEED_REVIEWS, SEED_GALLERY, SEED_BLOGS, SEED_FAQS, SEED_OFFERS } from "./seed-data";

const IS_POSTGRES = !!process.env.DATABASE_URL;

/**
 * Update payload (B-07): only keys that are present are written. `undefined` (or a
 * missing key) leaves the stored value alone; `null` clears it (SQL NULL in Postgres,
 * key deleted in the JSON backend). The API layer only lets `null` through for
 * fields declared `nullable(...)` in the route config.
 */
export type Patch<T> = { [K in keyof T]?: T[K] | null };

// ============================================================
// Field <-> column whitelists
// ============================================================
// Fixed maps of camelCase field -> snake_case column. They are the ONLY source of
// identifiers interpolated into UPDATE statements (never user input), and they also
// whitelist which keys an update may touch in the JSON backend. `json: true` marks
// array fields stored as JSON strings in TEXT columns.
type ColumnMap = Readonly<Record<string, { col: string; json?: true }>>;

const PACKAGE_COLS = {
  name: { col: "name" }, destination: { col: "destination" }, duration: { col: "duration" }, price: { col: "price" },
  originalPrice: { col: "original_price" }, image: { col: "image" }, description: { col: "description" },
  highlights: { col: "highlights", json: true }, itinerary: { col: "itinerary", json: true }, inclusions: { col: "inclusions", json: true },
  category: { col: "category" }, hidden: { col: "hidden" },
} as const satisfies ColumnMap;
const ENQUIRY_COLS = { status: { col: "status" } } as const satisfies ColumnMap;
const BOOKING_COLS = { paymentStatus: { col: "payment_status" }, bookingStatus: { col: "booking_status" } } as const satisfies ColumnMap;
const REVIEW_COLS = {
  name: { col: "name" }, rating: { col: "rating" }, text: { col: "text" }, city: { col: "city" },
  packageName: { col: "package_name" }, active: { col: "active" },
} as const satisfies ColumnMap;
const GALLERY_COLS = { src: { col: "src" }, caption: { col: "caption" }, category: { col: "category" }, active: { col: "active" } } as const satisfies ColumnMap;
const BLOG_COLS = {
  title: { col: "title" }, excerpt: { col: "excerpt" }, content: { col: "content" }, image: { col: "image" },
  category: { col: "category" }, author: { col: "author" }, active: { col: "active" },
} as const satisfies ColumnMap;
const FAQ_COLS = {
  question: { col: "question" }, questionHi: { col: "question_hi" }, answer: { col: "answer" }, answerHi: { col: "answer_hi" },
  active: { col: "active" }, order: { col: "sort_order" },
} as const satisfies ColumnMap;
const OFFER_COLS = {
  title: { col: "title" }, description: { col: "description" }, discount: { col: "discount" }, code: { col: "code" },
  validFrom: { col: "valid_from" }, validTo: { col: "valid_to" }, active: { col: "active" },
} as const satisfies ColumnMap;

// ============================================================
// POSTGRES (Neon)
// ============================================================
function getSQL() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { neon } = require("@neondatabase/serverless");
  return neon(process.env.DATABASE_URL!);
}

type Row = Record<string, unknown>;

// B-12: array columns are JSON text; corrupt data must not take down every package read.
const warnedBadArrays = new Set<string>();
function safeParseArray(value: unknown, where: string): string[] {
  if (Array.isArray(value)) return value as string[];
  if (value === null || value === undefined || value === "") return [];
  try {
    const parsed = JSON.parse(String(value));
    if (Array.isArray(parsed)) return parsed;
  } catch { /* fall through */ }
  if (!warnedBadArrays.has(where)) {
    warnedBadArrays.add(where);
    console.warn(`[db] ${where} holds invalid JSON array data; treating it as []. (Logged once per column.)`);
  }
  return [];
}

/**
 * Builds `UPDATE <table> SET col=$1, ... WHERE id=$n RETURNING *` from the keys present
 * in `u`. Column names come only from the fixed `cols` whitelist and `table` is a
 * literal from this file; every value is a bound parameter. With nothing to update
 * the current row is returned unchanged (or null if the id does not exist).
 */
async function pgUpdate(table: string, cols: ColumnMap, id: string, u: object): Promise<Row | null> {
  const values = u as Record<string, unknown>;
  const sets: string[] = [];
  const params: unknown[] = [];
  for (const [key, { col, json }] of Object.entries(cols)) {
    if (!Object.prototype.hasOwnProperty.call(values, key)) continue;
    const v = values[key];
    if (v === undefined) continue;
    params.push(v === null ? null : json ? JSON.stringify(v) : v);
    sets.push(`${col}=$${params.length}`);
  }
  params.push(id);
  const text = sets.length
    ? `UPDATE ${table} SET ${sets.join(", ")} WHERE id=$${params.length} RETURNING *`
    : `SELECT * FROM ${table} WHERE id=$1`;
  const rows: Row[] = await getSQL().query(text, params);
  return rows[0] ?? null;
}

// --- Row mappers (snake_case -> camelCase); NULL optional columns become undefined ---
const rowToPackage = (r: Row) => ({ id: r.id, name: r.name, destination: r.destination, duration: r.duration, price: r.price, originalPrice: r.original_price ?? undefined, image: r.image, description: r.description, highlights: safeParseArray(r.highlights, "packages.highlights"), itinerary: safeParseArray(r.itinerary, "packages.itinerary"), inclusions: safeParseArray(r.inclusions, "packages.inclusions"), category: r.category, hidden: r.hidden, createdAt: r.created_at }) as TourPackage;
const rowToEnquiry = (r: Row) => ({ id: r.id, name: r.name, phone: r.phone, email: r.email, packageId: r.package_id, travelers: r.travelers, travelDate: r.travel_date, message: r.message, status: r.status, kind: r.kind ?? undefined, createdAt: r.created_at }) as Enquiry;
const rowToBooking = (r: Row) => ({ id: r.id, name: r.name, phone: r.phone, email: r.email, city: r.city, packageId: r.package_id, packageName: r.package_name, travelers: r.travelers, travelDate: r.travel_date, amount: r.amount, paymentStatus: r.payment_status, bookingStatus: r.booking_status, createdAt: r.created_at }) as Booking;
const rowToReview = (r: Row) => ({ id: r.id, name: r.name, rating: r.rating, text: r.text, city: r.city, packageName: r.package_name ?? undefined, active: r.active, source: r.source ?? undefined, createdAt: r.created_at }) as Review;
const rowToGallery = (r: Row) => ({ id: r.id, src: r.src, caption: r.caption, category: r.category, active: r.active, createdAt: r.created_at }) as GalleryImage;
const rowToBlog = (r: Row) => ({ id: r.id, title: r.title, excerpt: r.excerpt, content: r.content, image: r.image, category: r.category, author: r.author, active: r.active, createdAt: r.created_at }) as BlogPost;
const rowToFAQ = (r: Row) => ({ id: r.id, question: r.question, questionHi: r.question_hi ?? undefined, answer: r.answer, answerHi: r.answer_hi ?? undefined, active: r.active, order: r.sort_order, createdAt: r.created_at }) as FAQ;
const rowToOffer = (r: Row) => ({ id: r.id, title: r.title, description: r.description, discount: r.discount, code: r.code ?? undefined, validFrom: r.valid_from, validTo: r.valid_to, active: r.active, createdAt: r.created_at }) as Offer;

const mapOne = <T>(map: (r: Row) => T) => (r: Row | null): T | null => (r ? map(r) : null);

// --- Packages ---
async function pgGetPackages(): Promise<TourPackage[]> {
  const sql = getSQL();
  const rows: Row[] = await sql`SELECT * FROM packages ORDER BY created_at DESC`;
  return rows.map(rowToPackage);
}
async function pgAddPackage(p: Omit<TourPackage, "createdAt">): Promise<TourPackage> {
  const sql = getSQL(); const now = new Date().toISOString();
  // `?? null`, not `|| null`: an originalPrice of 0 must be stored as 0 (B-07).
  await sql`INSERT INTO packages (id,name,destination,duration,price,original_price,image,description,highlights,itinerary,inclusions,category,hidden,created_at) VALUES (${p.id},${p.name},${p.destination},${p.duration},${p.price},${p.originalPrice ?? null},${p.image},${p.description},${JSON.stringify(p.highlights ?? [])},${JSON.stringify(p.itinerary ?? [])},${JSON.stringify(p.inclusions ?? [])},${p.category},${!!p.hidden},${now})`;
  return { ...p, createdAt: now };
}
const pgUpdatePackage = async (id: string, u: Patch<TourPackage>) => mapOne(rowToPackage)(await pgUpdate("packages", PACKAGE_COLS, id, u));
async function pgDeletePackage(id: string): Promise<boolean> {
  const sql = getSQL(); const rows = await sql`DELETE FROM packages WHERE id=${id} RETURNING id`; return rows.length > 0;
}

// --- Enquiries ---
async function pgGetEnquiries(): Promise<Enquiry[]> {
  const sql = getSQL();
  const rows: Row[] = await sql`SELECT * FROM enquiries ORDER BY created_at DESC`;
  return rows.map(rowToEnquiry);
}
async function pgAddEnquiry(e: Omit<Enquiry, "id"|"createdAt"|"status">): Promise<Enquiry> {
  const sql = getSQL(); const id = crypto.randomUUID(); const now = new Date().toISOString();
  await sql`INSERT INTO enquiries (id,name,phone,email,package_id,travelers,travel_date,message,status,kind,created_at) VALUES (${id},${e.name},${e.phone},${e.email},${e.packageId||null},${e.travelers},${e.travelDate},${e.message},'new',${e.kind ?? null},${now})`;
  return { ...e, id, createdAt: now, status: "new" };
}
const pgUpdateEnquiryStatus = async (id: string, status: Enquiry["status"]) => mapOne(rowToEnquiry)(await pgUpdate("enquiries", ENQUIRY_COLS, id, { status }));
async function pgDeleteEnquiry(id: string): Promise<boolean> {
  const sql = getSQL(); const rows = await sql`DELETE FROM enquiries WHERE id=${id} RETURNING id`; return rows.length > 0;
}

// --- Bookings ---
async function pgGetBookings(): Promise<Booking[]> {
  const sql = getSQL();
  const rows: Row[] = await sql`SELECT * FROM bookings ORDER BY created_at DESC`;
  return rows.map(rowToBooking);
}
async function pgAddBooking(b: Omit<Booking, "id"|"createdAt"|"paymentStatus"|"bookingStatus">): Promise<Booking> {
  const sql = getSQL(); const id = crypto.randomUUID(); const now = new Date().toISOString();
  await sql`INSERT INTO bookings (id,name,phone,email,city,package_id,package_name,travelers,travel_date,amount,payment_status,booking_status,created_at) VALUES (${id},${b.name},${b.phone},${b.email},${b.city},${b.packageId},${b.packageName},${b.travelers},${b.travelDate},${b.amount},'pending','pending',${now})`;
  return { ...b, id, createdAt: now, paymentStatus: "pending", bookingStatus: "pending" };
}
const pgUpdateBooking = async (id: string, u: Partial<Pick<Booking, "paymentStatus"|"bookingStatus">>) => mapOne(rowToBooking)(await pgUpdate("bookings", BOOKING_COLS, id, u));
/** N-4: bookings whose id starts with `prefix` (validated as lowercase hex by the exported wrapper). */
async function pgFindBookingsByIdPrefix(prefix: string): Promise<Booking[]> {
  const sql = getSQL();
  const rows: Row[] = await sql`SELECT * FROM bookings WHERE id LIKE ${prefix + "%"} ORDER BY created_at DESC`;
  return rows.map(rowToBooking);
}
async function pgDeleteBooking(id: string): Promise<boolean> {
  const sql = getSQL(); const rows = await sql`DELETE FROM bookings WHERE id=${id} RETURNING id`; return rows.length > 0;
}

// --- Reviews ---
async function pgGetReviews(): Promise<Review[]> {
  const sql = getSQL(); const rows: Row[] = await sql`SELECT * FROM reviews ORDER BY created_at DESC`;
  return rows.map(rowToReview);
}
async function pgAddReview(rev: Omit<Review, "id"|"createdAt">): Promise<Review> {
  const sql = getSQL(); const id = crypto.randomUUID(); const now = new Date().toISOString();
  await sql`INSERT INTO reviews (id,name,rating,text,city,package_name,active,source,created_at) VALUES (${id},${rev.name},${rev.rating},${rev.text},${rev.city},${rev.packageName ?? null},${rev.active},${rev.source ?? null},${now})`;
  return { ...rev, id, createdAt: now };
}
const pgUpdateReview = async (id: string, u: Patch<Review>) => mapOne(rowToReview)(await pgUpdate("reviews", REVIEW_COLS, id, u));
async function pgDeleteReview(id: string): Promise<boolean> {
  const sql = getSQL(); const rows = await sql`DELETE FROM reviews WHERE id=${id} RETURNING id`; return rows.length > 0;
}

// --- Gallery ---
async function pgGetGallery(): Promise<GalleryImage[]> {
  const sql = getSQL(); const rows: Row[] = await sql`SELECT * FROM gallery ORDER BY created_at DESC`;
  return rows.map(rowToGallery);
}
async function pgAddGalleryImage(img: Omit<GalleryImage, "id"|"createdAt">): Promise<GalleryImage> {
  const sql = getSQL(); const id = crypto.randomUUID(); const now = new Date().toISOString();
  await sql`INSERT INTO gallery (id,src,caption,category,active,created_at) VALUES (${id},${img.src},${img.caption},${img.category},${img.active},${now})`;
  return { ...img, id, createdAt: now };
}
const pgUpdateGalleryImage = async (id: string, u: Patch<GalleryImage>) => mapOne(rowToGallery)(await pgUpdate("gallery", GALLERY_COLS, id, u));
async function pgDeleteGalleryImage(id: string): Promise<boolean> {
  const sql = getSQL(); const rows = await sql`DELETE FROM gallery WHERE id=${id} RETURNING id`; return rows.length > 0;
}

// --- Blogs ---
async function pgGetBlogs(): Promise<BlogPost[]> {
  const sql = getSQL(); const rows: Row[] = await sql`SELECT * FROM blogs ORDER BY created_at DESC`;
  return rows.map(rowToBlog);
}
async function pgAddBlog(b: Omit<BlogPost, "id"|"createdAt">): Promise<BlogPost> {
  const sql = getSQL(); const id = crypto.randomUUID(); const now = new Date().toISOString();
  await sql`INSERT INTO blogs (id,title,excerpt,content,image,category,author,active,created_at) VALUES (${id},${b.title},${b.excerpt},${b.content},${b.image},${b.category},${b.author},${b.active},${now})`;
  return { ...b, id, createdAt: now };
}
const pgUpdateBlog = async (id: string, u: Patch<BlogPost>) => mapOne(rowToBlog)(await pgUpdate("blogs", BLOG_COLS, id, u));
async function pgDeleteBlog(id: string): Promise<boolean> {
  const sql = getSQL(); const rows = await sql`DELETE FROM blogs WHERE id=${id} RETURNING id`; return rows.length > 0;
}

// --- FAQs ---
async function pgGetFAQs(): Promise<FAQ[]> {
  const sql = getSQL(); const rows: Row[] = await sql`SELECT * FROM faqs ORDER BY sort_order`;
  return rows.map(rowToFAQ);
}
async function pgAddFAQ(f: Omit<FAQ, "id"|"createdAt">): Promise<FAQ> {
  const sql = getSQL(); const id = crypto.randomUUID(); const now = new Date().toISOString();
  await sql`INSERT INTO faqs (id,question,question_hi,answer,answer_hi,active,sort_order,created_at) VALUES (${id},${f.question},${f.questionHi ?? null},${f.answer},${f.answerHi ?? null},${f.active},${f.order},${now})`;
  return { ...f, id, createdAt: now };
}
const pgUpdateFAQ = async (id: string, u: Patch<FAQ>) => mapOne(rowToFAQ)(await pgUpdate("faqs", FAQ_COLS, id, u));
async function pgDeleteFAQ(id: string): Promise<boolean> {
  const sql = getSQL(); const rows = await sql`DELETE FROM faqs WHERE id=${id} RETURNING id`; return rows.length > 0;
}

// --- Offers ---
async function pgGetOffers(): Promise<Offer[]> {
  const sql = getSQL(); const rows: Row[] = await sql`SELECT * FROM offers ORDER BY created_at DESC`;
  return rows.map(rowToOffer);
}
async function pgAddOffer(o: Omit<Offer, "id"|"createdAt">): Promise<Offer> {
  const sql = getSQL(); const id = crypto.randomUUID(); const now = new Date().toISOString();
  await sql`INSERT INTO offers (id,title,description,discount,code,valid_from,valid_to,active,created_at) VALUES (${id},${o.title},${o.description},${o.discount},${o.code ?? null},${o.validFrom},${o.validTo},${o.active},${now})`;
  return { ...o, id, createdAt: now };
}
const pgUpdateOffer = async (id: string, u: Patch<Offer>) => mapOne(rowToOffer)(await pgUpdate("offers", OFFER_COLS, id, u));
async function pgDeleteOffer(id: string): Promise<boolean> {
  const sql = getSQL(); const rows = await sql`DELETE FROM offers WHERE id=${id} RETURNING id`; return rows.length > 0;
}

// --- Seed content (B-11) ---
export type SeedSummary = Record<"packages" | "reviews" | "gallery" | "blogs" | "faqs" | "offers", number>;

/**
 * Inserts the shared default content (`seed-data.ts`) into Postgres. Idempotent and
 * non-destructive: each row is `INSERT … ON CONFLICT (id) DO NOTHING`, so an id that
 * already exists (including one an admin has since edited) is left untouched, and
 * nothing is ever updated or deleted. Bookings/enquiries are never seeded. Values are
 * bound parameters via tagged templates. Returns how many rows were actually inserted
 * per table. Tables must already exist (`initDB`).
 */
async function pgSeedContent(): Promise<SeedSummary> {
  const sql = getSQL();
  const count = async (inserts: Promise<Row[]>[]) => (await Promise.all(inserts)).reduce((n, rows) => n + rows.length, 0);
  // Sequential per table so a failure reports a clear partial state; rows within a table run in parallel.
  const packages = await count(SEED_PACKAGES.map(p => sql`INSERT INTO packages (id,name,destination,duration,price,original_price,image,description,highlights,itinerary,inclusions,category,hidden,created_at) VALUES (${p.id},${p.name},${p.destination},${p.duration},${p.price},${p.originalPrice ?? null},${p.image},${p.description},${JSON.stringify(p.highlights ?? [])},${JSON.stringify(p.itinerary ?? [])},${JSON.stringify(p.inclusions ?? [])},${p.category},${!!p.hidden},${p.createdAt}) ON CONFLICT (id) DO NOTHING RETURNING id`));
  const reviews = await count(SEED_REVIEWS.map(r => sql`INSERT INTO reviews (id,name,rating,text,city,package_name,active,created_at) VALUES (${r.id},${r.name},${r.rating},${r.text},${r.city},${r.packageName ?? null},${r.active},${r.createdAt}) ON CONFLICT (id) DO NOTHING RETURNING id`));
  const gallery = await count(SEED_GALLERY.map(g => sql`INSERT INTO gallery (id,src,caption,category,active,created_at) VALUES (${g.id},${g.src},${g.caption},${g.category},${g.active},${g.createdAt}) ON CONFLICT (id) DO NOTHING RETURNING id`));
  const blogs = await count(SEED_BLOGS.map(b => sql`INSERT INTO blogs (id,title,excerpt,content,image,category,author,active,created_at) VALUES (${b.id},${b.title},${b.excerpt},${b.content},${b.image},${b.category},${b.author},${b.active},${b.createdAt}) ON CONFLICT (id) DO NOTHING RETURNING id`));
  const faqs = await count(SEED_FAQS.map(f => sql`INSERT INTO faqs (id,question,question_hi,answer,answer_hi,active,sort_order,created_at) VALUES (${f.id},${f.question},${f.questionHi ?? null},${f.answer},${f.answerHi ?? null},${f.active},${f.order},${f.createdAt}) ON CONFLICT (id) DO NOTHING RETURNING id`));
  const offers = await count(SEED_OFFERS.map(o => sql`INSERT INTO offers (id,title,description,discount,code,valid_from,valid_to,active,created_at) VALUES (${o.id},${o.title},${o.description},${o.discount},${o.code ?? null},${o.validFrom},${o.validTo},${o.active},${o.createdAt}) ON CONFLICT (id) DO NOTHING RETURNING id`));
  return { packages, reviews, gallery, blogs, faqs, offers };
}

/** Postgres only — the JSON backend seeds itself when its file is missing. Throws in JSON mode. */
export async function seedContent(): Promise<SeedSummary> {
  if (!IS_POSTGRES) throw new Error("seedContent() requires DATABASE_URL; the JSON backend seeds itself when its file is missing.");
  return pgSeedContent();
}

// ============================================================
// JSON FILE — local dev
// ============================================================
import fs from "fs";
import path from "path";
import { DB } from "./types";

/**
 * JSON backend file. Defaults to `data/db.json`; set `JSON_DB_PATH` (absolute, or
 * relative to the cwd) to use another file, e.g. a temp file in tests. If the file is
 * missing it is created from the shared seed (`src/lib/seed-data.ts`). Resolved on every
 * call so a test can set the env var after this module is imported.
 */
function dbPath(): string {
  const override = process.env.JSON_DB_PATH;
  return override ? path.resolve(override) : path.join(process.cwd(), "data", "db.json");
}

// The JSON backend is for local development only: the filesystem is read-only or
// ephemeral on serverless hosts and there is no cross-process locking. Warn loudly
// (once per process) if it is used in production. Checked lazily, not at import,
// so `next build` stays quiet.
let warnedJsonInProd = false;
function warnIfJsonInProduction() {
  if (warnedJsonInProd || process.env.NODE_ENV !== "production") return;
  warnedJsonInProd = true;
  console.error(
    "[db] WARNING: DATABASE_URL is not set, so the JSON file backend (data/db.json) is in use in PRODUCTION. " +
    "Writes may be lost or fail on serverless/read-only filesystems and are not safe across instances. Set DATABASE_URL."
  );
}

function readDB(): DB {
  warnIfJsonInProduction();
  const file = dbPath();
  let raw: string;
  try {
    raw = fs.readFileSync(file, "utf-8");
  } catch (err) {
    // Only a missing file is (re)seeded. Any other error must not overwrite existing data.
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
    const initial = buildSeedDB();
    writeDB(initial);
    return initial;
  }
  let data: DB;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    throw new Error(`[db] ${file} is not valid JSON; refusing to overwrite it. Fix or delete the file. (${(err as Error).message})`);
  }
  if (!data.packages) data.packages = [];
  if (!data.enquiries) data.enquiries = [];
  if (!data.bookings) data.bookings = [];
  if (!data.reviews) data.reviews = [];
  if (!data.gallery) data.gallery = [];
  if (!data.blogs) data.blogs = [];
  if (!data.faqs) data.faqs = [];
  if (!data.offers) data.offers = [];
  return data;
}

/** Synchronous sleep used only to back off between rename retries. */
function sleepSync(ms: number) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/**
 * Atomic write: serialize to a temp file in the same directory, then rename over
 * the target, so a crash mid-write never leaves a truncated db.json. On Windows the
 * rename can briefly fail with EPERM/EBUSY while another handle has the file open,
 * so it is retried a few times.
 */
function writeDB(data: DB): void {
  warnIfJsonInProduction();
  const file = dbPath();
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const tmp = path.join(dir, `.${path.basename(file)}.${process.pid}.${crypto.randomUUID()}.tmp`);
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf-8");
  for (let attempt = 1; ; attempt++) {
    try {
      fs.renameSync(tmp, file);
      return;
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (attempt < 5 && (code === "EPERM" || code === "EBUSY" || code === "EACCES")) { sleepSync(20 * attempt); continue; }
      try { fs.unlinkSync(tmp); } catch { /* ignore */ }
      throw err;
    }
  }
}

// JSON CRUD helpers
function jsonCRUD<T extends { id: string }>(key: keyof DB, cols: ColumnMap) {
  return {
    getAll: (): T[] => readDB()[key] as unknown as T[],
    add: (item: T): T => {
      // Optional fields that were cleared/never set are omitted rather than stored as null.
      const clean = Object.fromEntries(Object.entries(item).filter(([, v]) => v !== null && v !== undefined)) as T;
      const db = readDB(); (db[key] as unknown as T[]).push(clean); writeDB(db); return clean;
    },
    /**
     * Same semantics as `pgUpdate` (B-07): only whitelisted keys present in `updates`
     * are applied (so `id`/`createdAt` can never be rewritten); `null` deletes the key.
     */
    update: (id: string, updates: Patch<T>): T | null => {
      const db = readDB(); const arr = db[key] as unknown as T[]; const idx = arr.findIndex(i => i.id === id);
      if (idx === -1) return null;
      const target = arr[idx] as unknown as Record<string, unknown>;
      const values = updates as Record<string, unknown>;
      for (const field of Object.keys(cols)) {
        if (!Object.prototype.hasOwnProperty.call(values, field)) continue;
        const v = values[field];
        if (v === undefined) continue;
        if (v === null) delete target[field]; else target[field] = v;
      }
      writeDB(db); return arr[idx];
    },
    remove: (id: string): boolean => {
      const db = readDB(); const arr = db[key] as unknown as T[]; const idx = arr.findIndex(i => i.id === id);
      if (idx === -1) return false; arr.splice(idx, 1); writeDB(db); return true;
    },
  };
}

const jsonPkgs = jsonCRUD<TourPackage>("packages", PACKAGE_COLS);
const jsonEnqs = jsonCRUD<Enquiry>("enquiries", ENQUIRY_COLS);
const jsonBooks = jsonCRUD<Booking>("bookings", BOOKING_COLS);
const jsonRevs = jsonCRUD<Review>("reviews", REVIEW_COLS);
const jsonGall = jsonCRUD<GalleryImage>("gallery", GALLERY_COLS);
const jsonBlgs = jsonCRUD<BlogPost>("blogs", BLOG_COLS);
const jsonFaqs = jsonCRUD<FAQ>("faqs", FAQ_COLS);
const jsonOffs = jsonCRUD<Offer>("offers", OFFER_COLS);

// ============================================================
// EXPORTED API
// ============================================================
export async function getPackages() { return IS_POSTGRES ? pgGetPackages() : jsonPkgs.getAll(); }
export async function addPackage(p: Omit<TourPackage, "id"|"createdAt">) {
  // Ids are always generated server-side (B-10); any client-supplied id is overwritten.
  const withId = { ...p, id: crypto.randomUUID() };
  return IS_POSTGRES ? pgAddPackage(withId) : jsonPkgs.add({ ...withId, createdAt: new Date().toISOString() });
}
export async function updatePackage(id: string, u: Patch<TourPackage>) { return IS_POSTGRES ? pgUpdatePackage(id, u) : jsonPkgs.update(id, u); }
export async function deletePackage(id: string) { return IS_POSTGRES ? pgDeletePackage(id) : jsonPkgs.remove(id); }

export async function getEnquiries() { return IS_POSTGRES ? pgGetEnquiries() : jsonEnqs.getAll(); }
export async function addEnquiry(e: Omit<Enquiry, "id"|"createdAt"|"status">) {
  const full = { ...e, id: crypto.randomUUID(), createdAt: new Date().toISOString(), status: "new" as const };
  return IS_POSTGRES ? pgAddEnquiry(e) : jsonEnqs.add(full);
}
export async function updateEnquiryStatus(id: string, status: Enquiry["status"]) { return IS_POSTGRES ? pgUpdateEnquiryStatus(id, status) : jsonEnqs.update(id, { status }); }
export async function deleteEnquiry(id: string) { return IS_POSTGRES ? pgDeleteEnquiry(id) : jsonEnqs.remove(id); }

export async function getBookings() { return IS_POSTGRES ? pgGetBookings() : jsonBooks.getAll(); }
export async function addBooking(b: Omit<Booking, "id"|"createdAt"|"paymentStatus"|"bookingStatus">) {
  const full = { ...b, id: crypto.randomUUID(), createdAt: new Date().toISOString(), paymentStatus: "pending" as const, bookingStatus: "pending" as const };
  return IS_POSTGRES ? pgAddBooking(b) : jsonBooks.add(full);
}
/**
 * N-4: bookings whose id starts with `prefix`. The customer-facing booking reference is the
 * first 8 hex characters of the id, upper-cased (BookingForm). `prefix` must be lowercase
 * hex/dashes — it feeds a LIKE pattern, so anything else (`%`, `_`) returns [].
 */
export async function findBookingsByIdPrefix(prefix: string) {
  if (!/^[0-9a-f-]+$/.test(prefix)) return [];
  return IS_POSTGRES ? pgFindBookingsByIdPrefix(prefix) : jsonBooks.getAll().filter(b => b.id.startsWith(prefix));
}
export async function updateBooking(id: string, u: Partial<Pick<Booking, "paymentStatus"|"bookingStatus">>) { return IS_POSTGRES ? pgUpdateBooking(id, u) : jsonBooks.update(id, u); }
export async function deleteBooking(id: string) { return IS_POSTGRES ? pgDeleteBooking(id) : jsonBooks.remove(id); }

export async function getReviews() { return IS_POSTGRES ? pgGetReviews() : jsonRevs.getAll(); }
export async function addReview(r: Omit<Review, "id"|"createdAt">) { const full = { ...r, id: crypto.randomUUID(), createdAt: new Date().toISOString() }; return IS_POSTGRES ? pgAddReview(r) : jsonRevs.add(full); }
export async function updateReview(id: string, u: Patch<Review>) { return IS_POSTGRES ? pgUpdateReview(id, u) : jsonRevs.update(id, u); }
export async function deleteReview(id: string) { return IS_POSTGRES ? pgDeleteReview(id) : jsonRevs.remove(id); }

export async function getGallery() { return IS_POSTGRES ? pgGetGallery() : jsonGall.getAll(); }
export async function addGalleryImage(i: Omit<GalleryImage, "id"|"createdAt">) { const full = { ...i, id: crypto.randomUUID(), createdAt: new Date().toISOString() }; return IS_POSTGRES ? pgAddGalleryImage(i) : jsonGall.add(full); }
export async function updateGalleryImage(id: string, u: Patch<GalleryImage>) { return IS_POSTGRES ? pgUpdateGalleryImage(id, u) : jsonGall.update(id, u); }
export async function deleteGalleryImage(id: string) { return IS_POSTGRES ? pgDeleteGalleryImage(id) : jsonGall.remove(id); }

export async function getBlogs() { return IS_POSTGRES ? pgGetBlogs() : jsonBlgs.getAll(); }
export async function addBlog(b: Omit<BlogPost, "id"|"createdAt">) { const full = { ...b, id: crypto.randomUUID(), createdAt: new Date().toISOString() }; return IS_POSTGRES ? pgAddBlog(b) : jsonBlgs.add(full); }
export async function updateBlog(id: string, u: Patch<BlogPost>) { return IS_POSTGRES ? pgUpdateBlog(id, u) : jsonBlgs.update(id, u); }
export async function deleteBlog(id: string) { return IS_POSTGRES ? pgDeleteBlog(id) : jsonBlgs.remove(id); }

// Sorted by `order` in both backends (Postgres sorts by sort_order).
export async function getFAQs() { return IS_POSTGRES ? pgGetFAQs() : [...jsonFaqs.getAll()].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)); }
export async function addFAQ(f: Omit<FAQ, "id"|"createdAt">) { const full = { ...f, id: crypto.randomUUID(), createdAt: new Date().toISOString() }; return IS_POSTGRES ? pgAddFAQ(f) : jsonFaqs.add(full); }
export async function updateFAQ(id: string, u: Patch<FAQ>) { return IS_POSTGRES ? pgUpdateFAQ(id, u) : jsonFaqs.update(id, u); }
export async function deleteFAQ(id: string) { return IS_POSTGRES ? pgDeleteFAQ(id) : jsonFaqs.remove(id); }

export async function getOffers() { return IS_POSTGRES ? pgGetOffers() : jsonOffs.getAll(); }
export async function addOffer(o: Omit<Offer, "id"|"createdAt">) { const full = { ...o, id: crypto.randomUUID(), createdAt: new Date().toISOString() }; return IS_POSTGRES ? pgAddOffer(o) : jsonOffs.add(full); }
export async function updateOffer(id: string, u: Patch<Offer>) { return IS_POSTGRES ? pgUpdateOffer(id, u) : jsonOffs.update(id, u); }
export async function deleteOffer(id: string) { return IS_POSTGRES ? pgDeleteOffer(id) : jsonOffs.remove(id); }

export function getConfig() { return readDB().config; }
