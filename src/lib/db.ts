import fs from "fs";
import path from "path";
import { TourPackage, Enquiry, Booking, Review, GalleryImage, BlogPost, FAQ, Offer, DB, AdminDB, AdminUser, AdminSession, AuditEntry } from "./types";
import { buildSeedDB, SEED_PACKAGES, SEED_REVIEWS, SEED_GALLERY, SEED_BLOGS, SEED_FAQS, SEED_OFFERS } from "./seed-data";
import {
  BOOKING_FILTER_SPEC, ENQUIRY_FILTER_SPEC, EMPTY_BOOKING_FILTERS, EMPTY_ENQUIRY_FILTERS, REFERENCE_LENGTH,
  compareNewestFirst, istRangeBounds, matchesInboxFilters, searchTerms,
  type BookingFilters, type EnquiryFilters, type InboxFilterSpec, type ListPage,
} from "./inbox-filters";

type Row = Record<string, unknown>;

/** The part of neon()'s query function this module uses: a tagged template and `.query(text, params)`. */
export interface SqlClient {
  (strings: TemplateStringsArray, ...params: unknown[]): PromiseLike<Row[]>;
  query(text: string, params?: unknown[]): PromiseLike<Row[]>;
}

// Test seam: tests install an in-process Postgres (PGlite) client here (tests/helpers/pglite-sql.ts).
let testClient: SqlClient | null = null;
/** Tests only: route every Postgres call to `client` (null restores normal behaviour). */
export function setSqlClientForTests(client: SqlClient | null) {
  if (client && process.env.NODE_ENV === "production") throw new Error("setSqlClientForTests() is for tests only");
  testClient = client;
}
/** True when the Postgres backend is in use: DATABASE_URL is set or a test client is installed. */
export function isPostgres(): boolean { return testClient !== null || !!process.env.DATABASE_URL; }

/**
 * Update payload (B-07): only keys that are present are written. `undefined` (or a
 * missing key) leaves the stored value alone; `null` clears it (SQL NULL in Postgres,
 * key deleted in the JSON backend). The API layer only lets `null` through for
 * fields declared `nullable(...)` in the route config.
 */
export type Patch<T> = { [K in keyof T]?: T[K] | null };

// ============================================================
// Entity definitions — the single description of each table
// ============================================================
// One definition per entity drives row mapping (both directions), INSERT, UPDATE and the
// JSON backend's update whitelist. Table and column names here are the ONLY identifiers
// ever interpolated into SQL (never user input); every value is a bound parameter.
//
// Adding a field: types.ts + the entity's `columns` below (tsc fails until every field of
// the type has a column) + a migration in db-schema.ts + the route config.

interface Column {
  /** snake_case Postgres column. */
  col: string;
  /**
   * array: string[] stored as JSONB (TEXT holding JSON before migration v3); read
   *   defensively, bad data → [] (B-12).
   * timestamp: TIMESTAMPTZ (TEXT before v2); always read back as an ISO string.
   */
  type?: "array" | "timestamp";
  /** SQL NULL is read back as `undefined` (an optional field) instead of `null`. */
  optional?: true;
  /** Value written on INSERT; default: `undefined` → NULL (arrays: `undefined` → []). */
  insert?: (v: unknown) => unknown;
}

interface Entity<T extends { id: string }> {
  table: string;
  /** Array key in the JSON file: `DB` (db.json) or, with `file: "admin"`, `AdminDB` (db.admin.json). */
  key: Exclude<keyof DB, "config"> | keyof AdminDB;
  /** JSON backend only: "admin" keeps the rows in db.admin.json instead of db.json (N-8). */
  file?: "admin";
  /** Every field of T, in the order columns are written. */
  columns: { readonly [K in keyof T & string]-?: Column };
  /** Fields an update may touch (B-07): never id or createdAt. */
  patchable: readonly (keyof T & string)[];
  orderBy: string;
}

const id: Column = { col: "id" };
const createdAt: Column = { col: "created_at", type: "timestamp" };
const c = (col: string, extra: Omit<Column, "col"> = {}): Column => ({ col, ...extra });

const PACKAGES: Entity<TourPackage> = {
  table: "packages", key: "packages", orderBy: "created_at DESC",
  columns: {
    id, name: c("name"), destination: c("destination"), duration: c("duration"), price: c("price"),
    originalPrice: c("original_price", { optional: true }), // `?? null`: 0 is kept (B-07)
    image: c("image"), description: c("description"),
    highlights: c("highlights", { type: "array" }), itinerary: c("itinerary", { type: "array" }), inclusions: c("inclusions", { type: "array" }),
    exclusions: c("exclusions", { type: "array" }), startsFrom: c("starts_from", { optional: true }),
    minTravelers: c("min_travelers", { optional: true }), priceNote: c("price_note", { optional: true }),
    category: c("category"), hidden: c("hidden", { insert: v => !!v }), createdAt,
  },
  patchable: [
    "name", "destination", "duration", "price", "originalPrice", "image", "description", "highlights", "itinerary", "inclusions",
    "exclusions", "startsFrom", "minTravelers", "priceNote", "category", "hidden",
  ],
};
const ENQUIRIES: Entity<Enquiry> = {
  table: "enquiries", key: "enquiries", orderBy: "created_at DESC",
  columns: {
    id, name: c("name"), phone: c("phone"), email: c("email"),
    packageId: c("package_id", { insert: v => v || null }), // read back as-is (NULL stays null)
    travelers: c("travelers"), travelDate: c("travel_date"), message: c("message"), status: c("status"),
    kind: c("kind", { optional: true }), createdAt,
  },
  patchable: ["status"],
};
const BOOKINGS: Entity<Booking> = {
  table: "bookings", key: "bookings", orderBy: "created_at DESC",
  columns: {
    id, name: c("name"), phone: c("phone"), email: c("email"), city: c("city"), packageId: c("package_id"),
    packageName: c("package_name"), travelers: c("travelers"), travelDate: c("travel_date"), amount: c("amount"),
    paymentStatus: c("payment_status"), bookingStatus: c("booking_status"),
    utr: c("utr", { optional: true }), paymentSubmittedAt: c("payment_submitted_at", { type: "timestamp", optional: true }), createdAt,
  },
  patchable: ["paymentStatus", "bookingStatus", "amount", "utr", "paymentSubmittedAt"],
};
const REVIEWS: Entity<Review> = {
  table: "reviews", key: "reviews", orderBy: "created_at DESC",
  columns: {
    id, name: c("name"), rating: c("rating"), text: c("text"), city: c("city"),
    packageName: c("package_name", { optional: true }), active: c("active"), source: c("source", { optional: true }), createdAt,
  },
  patchable: ["name", "rating", "text", "city", "packageName", "active"],
};
const GALLERY: Entity<GalleryImage> = {
  table: "gallery", key: "gallery", orderBy: "created_at DESC",
  columns: { id, src: c("src"), caption: c("caption"), category: c("category"), active: c("active"), createdAt },
  patchable: ["src", "caption", "category", "active"],
};
const BLOGS: Entity<BlogPost> = {
  table: "blogs", key: "blogs", orderBy: "created_at DESC",
  columns: {
    id, title: c("title"), excerpt: c("excerpt"), content: c("content"), image: c("image"),
    category: c("category"), author: c("author"), active: c("active"), createdAt,
  },
  patchable: ["title", "excerpt", "content", "image", "category", "author", "active"],
};
const FAQS: Entity<FAQ> = {
  table: "faqs", key: "faqs", orderBy: "sort_order",
  columns: {
    id, question: c("question"), questionHi: c("question_hi", { optional: true }), answer: c("answer"),
    answerHi: c("answer_hi", { optional: true }), active: c("active"), order: c("sort_order"), createdAt,
  },
  patchable: ["question", "questionHi", "answer", "answerHi", "active", "order"],
};
const OFFERS: Entity<Offer> = {
  table: "offers", key: "offers", orderBy: "created_at DESC",
  columns: {
    id, title: c("title"), description: c("description"), discount: c("discount"), code: c("code", { optional: true }),
    validFrom: c("valid_from"), validTo: c("valid_to"), active: c("active"), createdAt,
  },
  patchable: ["title", "description", "discount", "code", "validFrom", "validTo", "active"],
};

// N-8: admin users, server-side sessions and the audit log (JSON backend: db.admin.json).
const ADMIN_USERS: Entity<AdminUser> = {
  table: "admin_users", key: "adminUsers", file: "admin", orderBy: "created_at",
  columns: {
    id, email: c("email"), name: c("name"), passwordHash: c("password_hash"), active: c("active"), createdAt,
    lastLoginAt: c("last_login_at", { type: "timestamp", optional: true }),
  },
  patchable: ["name", "passwordHash", "active", "lastLoginAt"],
};
const ADMIN_SESSIONS: Entity<AdminSession> = {
  table: "admin_sessions", key: "adminSessions", file: "admin", orderBy: "created_at DESC",
  columns: {
    id, userId: c("user_id"), email: c("email"), createdAt, expiresAt: c("expires_at", { type: "timestamp" }),
    revokedAt: c("revoked_at", { type: "timestamp", optional: true }),
    userAgent: c("user_agent", { optional: true }), ip: c("ip", { optional: true }),
  },
  patchable: ["revokedAt"],
};
const AUDIT_LOG: Entity<AuditEntry> = {
  table: "audit_log", key: "auditLog", file: "admin", orderBy: "created_at DESC, seq DESC",
  columns: {
    id, createdAt, actorEmail: c("actor_email"), action: c("action"),
    entity: c("entity", { optional: true }), entityId: c("entity_id", { optional: true }), details: c("details", { type: "array" }),
  },
  patchable: [],
};

// ============================================================
// POSTGRES (Neon)
// ============================================================
function getSQL(): SqlClient {
  if (testClient) return testClient;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { neon } = require("@neondatabase/serverless");
  return neon(process.env.DATABASE_URL!);
}

// B-12: corrupt array data must not take down every package read.
const warnedBadArrays = new Set<string>();
function safeParseArray(value: unknown, where: string): string[] {
  if (Array.isArray(value)) return value as string[];
  if (value === null || value === undefined || value === "") return [];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch { /* fall through */ }
  }
  if (!warnedBadArrays.has(where)) {
    warnedBadArrays.add(where);
    console.warn(`[db] ${where} holds invalid JSON array data; treating it as []. (Logged once per column.)`);
  }
  return [];
}

/**
 * TIMESTAMPTZ comes back from the driver as a Date (neon and PGlite parse it by default),
 * but as a string if type parsing is off or the column is still TEXT (pre-v2). Either way
 * the API returns an ISO string; an unparseable string is passed through unchanged.
 */
function toIsoString(value: unknown): unknown {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString();
  if (typeof value === "string") {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? value : d.toISOString();
  }
  return value;
}

function fromRow<T extends { id: string }>(e: Entity<T>, r: Row): T {
  const out: Record<string, unknown> = {};
  for (const [field, col] of Object.entries(e.columns) as [string, Column][]) {
    const v = r[col.col];
    out[field] = col.optional && v == null ? undefined
      : col.type === "array" ? safeParseArray(v, `${e.table}.${col.col}`)
      : col.type === "timestamp" ? toIsoString(v)
      : col.optional ? v ?? undefined
      : v;
  }
  return out as T;
}

function toParam(col: Column, v: unknown): unknown {
  if (col.insert) return col.insert(v);
  if (col.type === "array") return JSON.stringify(v ?? []);
  return v ?? null;
}

/** INSERT of every column of `e`; returns the inserted ids (empty when skipped by ON CONFLICT). */
async function pgInsert<T extends { id: string }>(e: Entity<T>, item: T, onConflictDoNothing = false): Promise<Row[]> {
  const cols = Object.entries(e.columns) as [string, Column][];
  const params = cols.map(([field, col]) => toParam(col, (item as Record<string, unknown>)[field]));
  const text = `INSERT INTO ${e.table} (${cols.map(([, col]) => col.col).join(",")}) VALUES (${params.map((_, i) => `$${i + 1}`).join(",")})`
    + (onConflictDoNothing ? " ON CONFLICT (id) DO NOTHING" : "") + " RETURNING id";
  return getSQL().query(text, params);
}

async function pgList<T extends { id: string }>(e: Entity<T>): Promise<T[]> {
  const rows = await getSQL().query(`SELECT * FROM ${e.table} ORDER BY ${e.orderBy}`);
  return rows.map(r => fromRow(e, r));
}

async function pgGet<T extends { id: string }>(e: Entity<T>, rowId: string): Promise<T | null> {
  const rows = await getSQL().query(`SELECT * FROM ${e.table} WHERE id=$1`, [rowId]);
  return rows[0] ? fromRow(e, rows[0]) : null;
}

/**
 * `UPDATE <table> SET col=$1, ... WHERE id=$n RETURNING *` from the patchable keys present
 * in `u` (B-07). With nothing to update the current row is returned unchanged (or null if
 * the id does not exist).
 */
async function pgUpdate<T extends { id: string }>(e: Entity<T>, rowId: string, u: object): Promise<T | null> {
  const values = u as Record<string, unknown>;
  const sets: string[] = [];
  const params: unknown[] = [];
  for (const field of e.patchable) {
    if (!Object.prototype.hasOwnProperty.call(values, field)) continue;
    const v = values[field];
    if (v === undefined) continue;
    const col = e.columns[field];
    params.push(v === null ? null : col.type === "array" ? JSON.stringify(v) : v);
    sets.push(`${col.col}=$${params.length}`);
  }
  if (!sets.length) return pgGet(e, rowId);
  params.push(rowId);
  const rows = await getSQL().query(`UPDATE ${e.table} SET ${sets.join(", ")} WHERE id=$${params.length} RETURNING *`, params);
  return rows[0] ? fromRow(e, rows[0]) : null;
}

async function pgDelete<T extends { id: string }>(e: Entity<T>, rowId: string): Promise<boolean> {
  const rows = await getSQL().query(`DELETE FROM ${e.table} WHERE id=$1 RETURNING id`, [rowId]);
  return rows.length > 0;
}

/** N-4: bookings whose id starts with `prefix` (validated as lowercase hex by the exported wrapper). */
async function pgFindBookingsByIdPrefix(prefix: string): Promise<Booking[]> {
  const rows = await getSQL().query(`SELECT * FROM ${BOOKINGS.table} WHERE id LIKE $1 ORDER BY ${BOOKINGS.orderBy}`, [prefix + "%"]);
  return rows.map(r => fromRow(BOOKINGS, r));
}

// --- Seed content (B-11) ---
export type SeedSummary = Record<"packages" | "reviews" | "gallery" | "blogs" | "faqs" | "offers", number>;

/**
 * Inserts the shared default content (`seed-data.ts`) into Postgres. Idempotent and
 * non-destructive: each row is `INSERT … ON CONFLICT (id) DO NOTHING`, so an id that
 * already exists (including one an admin has since edited) is left untouched, and
 * nothing is ever updated or deleted. Bookings/enquiries are never seeded. Returns how
 * many rows were actually inserted per table. Tables must already exist (`initDB`).
 */
async function pgSeedContent(): Promise<SeedSummary> {
  const seed = async <T extends { id: string }>(e: Entity<T>, items: readonly T[]) =>
    (await Promise.all(items.map(item => pgInsert(e, item, true)))).reduce((n, rows) => n + rows.length, 0);
  // Sequential per table so a failure reports a clear partial state; rows within a table run in parallel.
  const packages = await seed(PACKAGES, SEED_PACKAGES);
  const reviews = await seed(REVIEWS, SEED_REVIEWS);
  const gallery = await seed(GALLERY, SEED_GALLERY);
  const blogs = await seed(BLOGS, SEED_BLOGS);
  const faqs = await seed(FAQS, SEED_FAQS);
  const offers = await seed(OFFERS, SEED_OFFERS);
  return { packages, reviews, gallery, blogs, faqs, offers };
}

/** Postgres only — the JSON backend seeds itself when its file is missing. Throws in JSON mode. */
export async function seedContent(): Promise<SeedSummary> {
  if (!isPostgres()) throw new Error("seedContent() requires DATABASE_URL; the JSON backend seeds itself when its file is missing.");
  return pgSeedContent();
}

// ============================================================
// JSON FILE — local dev
// ============================================================

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
  writeJsonFile(dbPath(), data);
}

function writeJsonFile(file: string, data: unknown): void {
  warnIfJsonInProduction();
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


/**
 * N-8: admin users, sessions and the audit log live in a second file next to db.json
 * (`<name>.admin.json`, so `data/db.admin.json` by default, git-ignored), so logging in or
 * out never rewrites the git-tracked content file. A missing file is an empty store.
 */
function adminDbPath(): string {
  return dbPath().replace(/\.json$/i, "") + ".admin.json";
}

function readAdminDB(): AdminDB {
  warnIfJsonInProduction();
  const file = adminDbPath();
  let raw: string;
  try {
    raw = fs.readFileSync(file, "utf-8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
    return { adminUsers: [], adminSessions: [], auditLog: [] };
  }
  let data: Partial<AdminDB>;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    throw new Error(`[db] ${file} is not valid JSON; refusing to overwrite it. Fix or delete the file. (${(err as Error).message})`);
  }
  return { adminUsers: data.adminUsers ?? [], adminSessions: data.adminSessions ?? [], auditLog: data.auditLog ?? [] };
}

type JsonStore = Record<string, unknown>;
const readStore = (file?: "admin"): JsonStore => (file === "admin" ? readAdminDB() : readDB()) as unknown as JsonStore;
const writeStore = (file: "admin" | undefined, data: JsonStore) =>
  (file === "admin" ? writeJsonFile(adminDbPath(), data) : writeDB(data as unknown as DB));

// JSON CRUD helpers — same semantics as the pg* functions, driven by the same definitions.
function jsonCRUD<T extends { id: string }>(e: Entity<T>) {
  // Shadow the db.json helpers so every entity reads and writes its own file.
  const readDB = () => readStore(e.file);
  const writeDB = (db: JsonStore) => writeStore(e.file, db);
  const all = (db: JsonStore) => db[e.key] as T[];
  return {
    getAll: (): T[] => all(readDB()),
    add: (item: T): T => {
      // Optional fields that were cleared/never set are omitted rather than stored as null.
      const clean = Object.fromEntries(Object.entries(item).filter(([, v]) => v !== null && v !== undefined)) as T;
      const db = readDB(); all(db).push(clean); writeDB(db); return clean;
    },
    /**
     * Same semantics as `pgUpdate` (B-07): only patchable keys present in `updates` are
     * applied (so `id`/`createdAt` can never be rewritten); `null` deletes the key.
     */
    update: (rowId: string, updates: object): T | null => {
      const db = readDB(); const arr = all(db); const idx = arr.findIndex(i => i.id === rowId);
      if (idx === -1) return null;
      const target = arr[idx] as unknown as Record<string, unknown>;
      const values = updates as Record<string, unknown>;
      for (const field of e.patchable) {
        if (!Object.prototype.hasOwnProperty.call(values, field)) continue;
        const v = values[field];
        if (v === undefined) continue;
        if (v === null) delete target[field]; else target[field] = v;
      }
      writeDB(db); return arr[idx];
    },
    remove: (rowId: string): boolean => {
      const db = readDB(); const arr = all(db); const idx = arr.findIndex(i => i.id === rowId);
      if (idx === -1) return false; arr.splice(idx, 1); writeDB(db); return true;
    },
  };
}

/** One entity's CRUD, dispatching to Postgres or the JSON file on every call. */
function store<T extends { id: string }>(e: Entity<T>) {
  const json = jsonCRUD(e);
  return {
    list: async (): Promise<T[]> => (isPostgres() ? pgList(e) : json.getAll()),
    get: async (rowId: string): Promise<T | null> => (isPostgres() ? pgGet(e, rowId) : json.getAll().find(i => i.id === rowId) ?? null),
    /** `item` is complete (server-generated id/createdAt). Postgres returns it as given; JSON returns it without null/undefined keys. */
    add: async (item: T): Promise<T> => {
      if (!isPostgres()) return json.add(item);
      await pgInsert(e, item);
      return item;
    },
    update: async (rowId: string, u: object): Promise<T | null> => (isPostgres() ? pgUpdate(e, rowId, u) : json.update(rowId, u)),
    remove: async (rowId: string): Promise<boolean> => (isPostgres() ? pgDelete(e, rowId) : json.remove(rowId)),
  };
}

const packages = store(PACKAGES);
const enquiries = store(ENQUIRIES);
const bookings = store(BOOKINGS);
const reviews = store(REVIEWS);
const gallery = store(GALLERY);
const blogs = store(BLOGS);
const faqs = store(FAQS);
const offers = store(OFFERS);

// Ids and createdAt are always generated server-side (B-10); any client-supplied id is overwritten.
const stamp = <T extends object>(x: T) => ({ ...x, id: crypto.randomUUID(), createdAt: new Date().toISOString() });

// ============================================================
// EXPORTED API
// ============================================================
export async function getPackages() { return packages.list(); }
/** One package by id, hidden or not (callers apply visibility), or null. */
export async function getPackageById(packageId: string): Promise<TourPackage | null> { return packages.get(packageId); }
export async function addPackage(p: Omit<TourPackage, "id"|"createdAt">) { return packages.add(stamp(p)); }
export async function updatePackage(id: string, u: Patch<TourPackage>) { return packages.update(id, u); }
export async function deletePackage(id: string) { return packages.remove(id); }

export async function getEnquiries() { return enquiries.list(); }
export async function addEnquiry(e: Omit<Enquiry, "id"|"createdAt"|"status">) { return enquiries.add({ ...stamp(e), status: "new" as const }); }
export async function updateEnquiryStatus(id: string, status: Enquiry["status"]) { return enquiries.update(id, { status }); }
export async function deleteEnquiry(id: string) { return enquiries.remove(id); }

export async function getBookings() { return bookings.list(); }
export async function addBooking(b: Omit<Booking, "id"|"createdAt"|"paymentStatus"|"bookingStatus">) {
  return bookings.add({ ...stamp(b), paymentStatus: "pending" as const, bookingStatus: "pending" as const });
}
/**
 * N-4: bookings whose id starts with `prefix`. The customer-facing booking reference is the
 * first 8 hex characters of the id, upper-cased (BookingForm). `prefix` must be lowercase
 * hex/dashes — it feeds a LIKE pattern, so anything else (`%`, `_`) returns [].
 */
export async function findBookingsByIdPrefix(prefix: string) {
  if (!/^[0-9a-f-]+$/.test(prefix)) return [];
  return isPostgres() ? pgFindBookingsByIdPrefix(prefix) : (await bookings.list()).filter(b => b.id.startsWith(prefix));
}
export async function getBookingById(id: string): Promise<Booking | null> { return bookings.get(id); }
/** The booking that already carries this UTR (unique), or null. */
export async function findBookingByUtr(utr: string): Promise<Booking | null> {
  if (isPostgres()) {
    const rows = await getSQL().query(`SELECT * FROM ${BOOKINGS.table} WHERE utr = $1 LIMIT 1`, [utr]);
    return rows[0] ? fromRow(BOOKINGS, rows[0]) : null;
  }
  return (await bookings.list()).find(b => b.utr === utr) ?? null;
}
/** `null` clears `utr` / `paymentSubmittedAt` (SQL NULL / key deleted in the JSON file). */
export async function updateBooking(id: string, u: Patch<Pick<Booking, "paymentStatus"|"bookingStatus"|"amount"|"utr"|"paymentSubmittedAt">>) { return bookings.update(id, u); }
export async function deleteBooking(id: string) { return bookings.remove(id); }

export async function getReviews() { return reviews.list(); }
export async function addReview(r: Omit<Review, "id"|"createdAt">) { return reviews.add(stamp(r)); }
export async function updateReview(id: string, u: Patch<Review>) { return reviews.update(id, u); }
export async function deleteReview(id: string) { return reviews.remove(id); }

export async function getGallery() { return gallery.list(); }
export async function addGalleryImage(i: Omit<GalleryImage, "id"|"createdAt">) { return gallery.add(stamp(i)); }
export async function updateGalleryImage(id: string, u: Patch<GalleryImage>) { return gallery.update(id, u); }
export async function deleteGalleryImage(id: string) { return gallery.remove(id); }

export async function getBlogs() { return blogs.list(); }
export async function addBlog(b: Omit<BlogPost, "id"|"createdAt">) { return blogs.add(stamp(b)); }
export async function updateBlog(id: string, u: Patch<BlogPost>) { return blogs.update(id, u); }
export async function deleteBlog(id: string) { return blogs.remove(id); }

// Sorted by `order` in both backends (Postgres sorts by sort_order).
export async function getFAQs() {
  const list = await faqs.list();
  return isPostgres() ? list : [...list].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}
export async function addFAQ(f: Omit<FAQ, "id"|"createdAt">) { return faqs.add(stamp(f)); }
export async function updateFAQ(id: string, u: Patch<FAQ>) { return faqs.update(id, u); }
export async function deleteFAQ(id: string) { return faqs.remove(id); }

export async function getOffers() { return offers.list(); }
export async function addOffer(o: Omit<Offer, "id"|"createdAt">) { return offers.add(stamp(o)); }
export async function updateOffer(id: string, u: Patch<Offer>) { return offers.update(id, u); }
export async function deleteOffer(id: string) { return offers.remove(id); }

export function getConfig() { return readDB().config; }

// ============================================================
// Admin inbox queries (review point #6): filtered, paginated bookings / enquiries
// ============================================================
// Filter semantics live in ONE place, `src/lib/inbox-filters.ts` (BOOKING_FILTER_SPEC /
// ENQUIRY_FILTER_SPEC). The JSON backend runs that spec in memory (`matchesInboxFilters`);
// `pgInboxWhere` compiles the same spec to SQL. Column names come from the entity
// definitions above; every value (search pattern, status, date bound) is a bound parameter.

/** Escapes LIKE/ILIKE wildcards so user input matches literally (default escape char `\`). */
export function escapeLike(s: string): string {
  return s.replace(/[\\%_]/g, m => "\\" + m);
}

type InboxItem = { id: string; createdAt: string };
type InboxFilterBase = { search: string; from: string; to: string };

function pgInboxWhere<T extends InboxItem, F extends InboxFilterBase>(
  e: Entity<T>, spec: InboxFilterSpec<T, F>, filters: F,
): { where: string; params: unknown[] } {
  const params: unknown[] = [];
  const p = (v: unknown) => { params.push(v); return `$${params.length}`; };
  const col = (field: string) => (e.columns as Record<string, Column>)[field].col;
  const clauses: string[] = [];
  for (const { filter, field, ifMissing } of spec.equals) {
    const want = filters[filter] as unknown as string;
    if (!want) continue;
    clauses.push(ifMissing !== undefined ? `COALESCE(${col(field)}, ${p(ifMissing)}) = ${p(want)}` : `${col(field)} = ${p(want)}`);
  }
  const { start, end } = istRangeBounds(filters.from, filters.to);
  if (start) clauses.push(`created_at >= ${p(start.toISOString())}::timestamptz`);
  if (end) clauses.push(`created_at < ${p(end.toISOString())}::timestamptz`);
  const { text, digits } = searchTerms(filters.search);
  if (text) {
    const pattern = p(`%${escapeLike(text)}%`);
    const ors = spec.searchFields.map(f => `${col(f)} ILIKE ${pattern}`);
    if (spec.referenceField) ors.push(`left(${col(spec.referenceField)}, ${REFERENCE_LENGTH}) ILIKE ${pattern}`);
    if (digits && spec.phoneField) ors.push(`regexp_replace(${col(spec.phoneField)}, '\\D', '', 'g') LIKE ${p(`%${digits}%`)}`);
    clauses.push(`(${ors.join(" OR ")})`);
  }
  return { where: clauses.length ? ` WHERE ${clauses.join(" AND ")}` : "", params };
}

async function pgInboxPage<T extends InboxItem, F extends InboxFilterBase>(
  e: Entity<T>, spec: InboxFilterSpec<T, F>, filters: F, page: number, pageSize: number,
): Promise<ListPage<T>> {
  const sql = getSQL();
  const { where, params } = pgInboxWhere(e, spec, filters);
  const n = params.length;
  const rowsAt = (pg: number) => sql.query(
    `SELECT * FROM ${e.table}${where} ORDER BY created_at DESC NULLS LAST, id DESC LIMIT $${n + 1} OFFSET $${n + 2}`,
    [...params, pageSize, (pg - 1) * pageSize],
  );
  const [countRows, rows] = await Promise.all([sql.query(`SELECT COUNT(*)::int AS total FROM ${e.table}${where}`, params), rowsAt(page)]);
  const total = Number(countRows[0]?.total ?? 0);
  const last = Math.max(1, Math.ceil(total / pageSize));
  // Past the end (e.g. the last row of the last page was just deleted): serve the last page.
  if (page > last) return { items: (await rowsAt(last)).map(r => fromRow(e, r)), total, page: last, pageSize };
  return { items: rows.map(r => fromRow(e, r)), total, page, pageSize };
}

function jsonInboxPage<T extends InboxItem, F extends InboxFilterBase>(
  all: readonly T[], spec: InboxFilterSpec<T, F>, filters: F, page: number, pageSize: number,
): ListPage<T> {
  const matched = all.filter(item => matchesInboxFilters(spec, item, filters)).sort(compareNewestFirst);
  const total = matched.length;
  const current = Math.min(page, Math.max(1, Math.ceil(total / pageSize)));
  const start = (current - 1) * pageSize;
  return { items: matched.slice(start, start + pageSize), total, page: current, pageSize };
}

/** `page` is 1-based (clamped to the last page), `pageSize` ≥ 1. Newest first. */
export type Paging = { page: number; pageSize: number };

export async function queryBookings(filters: BookingFilters, { page, pageSize }: Paging): Promise<ListPage<Booking>> {
  return isPostgres()
    ? pgInboxPage(BOOKINGS, BOOKING_FILTER_SPEC, filters, page, pageSize)
    : jsonInboxPage(await bookings.list(), BOOKING_FILTER_SPEC, filters, page, pageSize);
}

export async function queryEnquiries(filters: EnquiryFilters, { page, pageSize }: Paging): Promise<ListPage<Enquiry>> {
  return isPostgres()
    ? pgInboxPage(ENQUIRIES, ENQUIRY_FILTER_SPEC, filters, page, pageSize)
    : jsonInboxPage(await enquiries.list(), ENQUIRY_FILTER_SPEC, filters, page, pageSize);
}

/** What the admin Dashboard and the sidebar counts need, without loading the full lists. */
export type InboxSummary = {
  bookings: { total: number; pending: number; paidRevenue: number; recent: Booking[] };
  enquiries: { total: number; new: number; recent: Enquiry[] };
};

const RECENT_COUNT = 5;

export async function getInboxSummary(): Promise<InboxSummary> {
  const one = { page: 1, pageSize: 1 };
  const paid: BookingFilters = { ...EMPTY_BOOKING_FILTERS, paymentStatus: "paid" };
  const revenue = async (): Promise<number> => {
    if (!isPostgres()) {
      return (await bookings.list())
        .filter(b => matchesInboxFilters(BOOKING_FILTER_SPEC, b, paid))
        .reduce((s, b) => s + (Number(b.amount) || 0), 0);
    }
    const { where, params } = pgInboxWhere(BOOKINGS, BOOKING_FILTER_SPEC, paid);
    const rows = await getSQL().query(`SELECT COALESCE(SUM(amount), 0)::float8 AS revenue FROM ${BOOKINGS.table}${where}`, params);
    return Number(rows[0]?.revenue ?? 0);
  };
  const [allB, pendingB, paidRevenue, allE, newE] = await Promise.all([
    queryBookings(EMPTY_BOOKING_FILTERS, { page: 1, pageSize: RECENT_COUNT }),
    queryBookings({ ...EMPTY_BOOKING_FILTERS, bookingStatus: "pending" }, one),
    revenue(),
    queryEnquiries(EMPTY_ENQUIRY_FILTERS, { page: 1, pageSize: RECENT_COUNT }),
    queryEnquiries({ ...EMPTY_ENQUIRY_FILTERS, status: "new" }, one),
  ]);
  return {
    bookings: { total: allB.total, pending: pendingB.total, paidRevenue, recent: allB.items },
    enquiries: { total: allE.total, new: newE.total, recent: allE.items },
  };
}

// ============================================================
// ADMIN USERS, SESSIONS, AUDIT LOG (N-8)
// ============================================================
// Raw rows: an AdminUser here includes `passwordHash`. Only server code (auth.ts, the
// admin-users route) calls these; API responses go through `toPublicAdminUser` (admin-users.ts).

const adminUsers = store(ADMIN_USERS);
const adminSessions = store(ADMIN_SESSIONS);
const auditLog = store(AUDIT_LOG);

/** Thrown by `addAdminUser` when the e-mail is already taken (case-insensitive). */
export class DuplicateEmailError extends Error {
  constructor() { super("An admin user with this email already exists"); this.name = "DuplicateEmailError"; }
}

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export async function getAdminUsers(): Promise<AdminUser[]> { return adminUsers.list(); }
export async function getAdminUserById(userId: string): Promise<AdminUser | null> { return adminUsers.get(userId); }
export async function getAdminUserByEmail(email: string): Promise<AdminUser | null> {
  const e = normalizeEmail(email);
  if (!e) return null;
  if (!isPostgres()) return (await adminUsers.list()).find(u => u.email === e) ?? null;
  const rows = await getSQL().query(`SELECT * FROM ${ADMIN_USERS.table} WHERE lower(email)=$1`, [e]);
  return rows[0] ? fromRow(ADMIN_USERS, rows[0]) : null;
}
/** The e-mail is stored lower-case. Throws `DuplicateEmailError` if it is taken. */
export async function addAdminUser(u: Omit<AdminUser, "id" | "createdAt">): Promise<AdminUser> {
  const item = stamp({ ...u, email: normalizeEmail(u.email) });
  if (!isPostgres()) {
    if (await getAdminUserByEmail(item.email)) throw new DuplicateEmailError();
    return adminUsers.add(item);
  }
  try {
    return await adminUsers.add(item);
  } catch (err) {
    // The unique index on lower(email) also catches a concurrent insert.
    if ((err as { code?: string }).code === "23505") throw new DuplicateEmailError();
    throw err;
  }
}
export async function updateAdminUser(userId: string, u: Partial<Pick<AdminUser, "name" | "passwordHash" | "active" | "lastLoginAt">>) {
  return adminUsers.update(userId, u);
}
export async function deleteAdminUser(userId: string) { return adminUsers.remove(userId); }

export async function getAdminSession(sessionId: string): Promise<AdminSession | null> { return adminSessions.get(sessionId); }
/** `s.id` is the JWT id (jti), generated by auth.ts. */
export async function addAdminSession(s: AdminSession): Promise<AdminSession> { return adminSessions.add(s); }
/** Marks one session revoked (a no-op if it already is, or does not exist). */
export async function revokeAdminSession(sessionId: string, now = new Date()): Promise<void> {
  if (isPostgres()) {
    await getSQL().query(`UPDATE ${ADMIN_SESSIONS.table} SET revoked_at=$1 WHERE id=$2 AND revoked_at IS NULL`, [now.toISOString(), sessionId]);
    return;
  }
  const s = await adminSessions.get(sessionId);
  if (s && !s.revokedAt) await adminSessions.update(sessionId, { revokedAt: now.toISOString() });
}
/** Revokes every live session of `userId` except `exceptSessionId` (if given). Returns how many were revoked. */
export async function revokeAdminSessionsForUser(userId: string, exceptSessionId?: string, now = new Date()): Promise<number> {
  const at = now.toISOString();
  if (isPostgres()) {
    const rows = await getSQL().query(
      `UPDATE ${ADMIN_SESSIONS.table} SET revoked_at=$1 WHERE user_id=$2 AND revoked_at IS NULL AND id<>$3 RETURNING id`,
      [at, userId, exceptSessionId ?? ""]);
    return rows.length;
  }
  const db = readAdminDB();
  let n = 0;
  for (const s of db.adminSessions) {
    if (s.userId === userId && !s.revokedAt && s.id !== exceptSessionId) { s.revokedAt = at; n++; }
  }
  if (n) writeJsonFile(adminDbPath(), db);
  return n;
}
/**
 * Deletes sessions that can never be used again: expired, or revoked more than a day ago.
 * Called opportunistically on login. Returns how many rows were removed.
 */
export async function pruneAdminSessions(now = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  if (isPostgres()) {
    const rows = await getSQL().query(
      `DELETE FROM ${ADMIN_SESSIONS.table} WHERE expires_at < $1 OR revoked_at < $2 RETURNING id`, [now.toISOString(), cutoff.toISOString()]);
    return rows.length;
  }
  const db = readAdminDB();
  const keep = db.adminSessions.filter(s =>
    !(Date.parse(s.expiresAt) < now.getTime() || (s.revokedAt && Date.parse(s.revokedAt) < cutoff.getTime())));
  const n = db.adminSessions.length - keep.length;
  if (n) { db.adminSessions = keep; writeJsonFile(adminDbPath(), db); }
  return n;
}

export async function addAuditEntry(e: Omit<AuditEntry, "id" | "createdAt">): Promise<AuditEntry> { return auditLog.add(stamp(e)); }
/**
 * Deletes audit entries older than `before` (retention; called opportunistically on login).
 * Returns how many were removed.
 */
export async function pruneAuditLog(before: Date): Promise<number> {
  if (isPostgres()) {
    const rows = await getSQL().query(`DELETE FROM ${AUDIT_LOG.table} WHERE created_at < $1 RETURNING id`, [before.toISOString()]);
    return rows.length;
  }
  const db = readAdminDB();
  const keep = db.auditLog.filter(e => !(Date.parse(e.createdAt) < before.getTime()));
  const n = db.auditLog.length - keep.length;
  if (n) { db.auditLog = keep; writeJsonFile(adminDbPath(), db); }
  return n;
}

/** Newest first, at most `limit` entries. */
export async function getAuditLog(limit: number): Promise<AuditEntry[]> {
  if (isPostgres()) {
    const rows = await getSQL().query(`SELECT * FROM ${AUDIT_LOG.table} ORDER BY created_at DESC, seq DESC LIMIT $1`, [limit]);
    return rows.map(r => fromRow(AUDIT_LOG, r));
  }
  // Appended in time order, so newest first is the reversed file order (stable for equal timestamps).
  return [...(await auditLog.list())].reverse().slice(0, limit);
}
