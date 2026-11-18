/**
 * Postgres schema and migrations. `initDB(sql)` is called by `POST /api/seed`.
 *
 * Each migration runs at most once per database: applied versions are recorded in
 * `schema_migrations`. A migration's statements run in ONE transaction (neon's
 * `sql.transaction([...])`, a non-interactive HTTP batch) together with the insert of its
 * version row, so it is applied completely or not at all — a failure halfway rolls back
 * every statement and leaves the version unrecorded, so the next `/api/seed` retries it.
 * The version row is inserted FIRST: if two seeds race, the second blocks on the primary
 * key until the first commits, then fails with a duplicate key and rolls back cleanly.
 *
 * v1 is the schema the pre-migration `initDB` created (CREATE TABLE IF NOT EXISTS plus the
 * two later columns), so it is a no-op on a database that code already created, and every
 * later version upgrades such a database in place without losing rows. A fresh database
 * takes the same path (v1 → latest), so there is only one schema history to reason about.
 *
 * Rules for editing:
 *  - NEVER change a migration that may have run somewhere; append a new version instead.
 *  - Neon's HTTP driver runs one statement per query, so each array entry is one statement.
 *  - Values in CHECK constraints are copied from the unions in `types.ts`; if a union
 *    gains a value, add a migration that drops and re-adds that constraint.
 *  - Adding a field = `types.ts` + the entity's definition in `db.ts` + a migration here
 *    + the route config.
 *
 * No foreign keys from bookings/enquiries to packages, on purpose: they are historical
 * customer records that keep `package_name`, and they must survive a package being deleted.
 */
import type { neon } from "@neondatabase/serverless";

export interface Migration {
  readonly version: number;
  readonly name: string;
  readonly statements: readonly string[];
}

/** Every table with a created_at column (all eight entities). */
const TABLES = ["packages", "enquiries", "bookings", "reviews", "gallery", "blogs", "faqs", "offers"] as const;
/** Tables listed `ORDER BY created_at DESC` (FAQs are listed by sort_order instead). */
const LISTED_BY_CREATED_AT = ["packages", "enquiries", "bookings", "reviews", "gallery", "blogs", "offers"] as const;
const ARRAY_COLUMNS = ["highlights", "itinerary", "inclusions"] as const; // packages

export const MIGRATIONS: readonly Migration[] = [
  {
    version: 1,
    name: "baseline",
    statements: [
      "CREATE TABLE IF NOT EXISTS packages (id TEXT PRIMARY KEY,name TEXT NOT NULL,destination TEXT,duration TEXT,price INTEGER,original_price INTEGER,image TEXT,description TEXT,highlights TEXT DEFAULT '[]',itinerary TEXT DEFAULT '[]',inclusions TEXT DEFAULT '[]',category TEXT DEFAULT 'spiritual',hidden BOOLEAN DEFAULT false,created_at TEXT)",
      "CREATE TABLE IF NOT EXISTS enquiries (id TEXT PRIMARY KEY,name TEXT NOT NULL,phone TEXT,email TEXT,package_id TEXT,travelers INTEGER DEFAULT 1,travel_date TEXT,message TEXT,status TEXT DEFAULT 'new',created_at TEXT)",
      "CREATE TABLE IF NOT EXISTS bookings (id TEXT PRIMARY KEY,name TEXT NOT NULL,phone TEXT,email TEXT,city TEXT,package_id TEXT,package_name TEXT,travelers INTEGER DEFAULT 1,travel_date TEXT,amount INTEGER,payment_status TEXT DEFAULT 'pending',booking_status TEXT DEFAULT 'pending',created_at TEXT)",
      "CREATE TABLE IF NOT EXISTS reviews (id TEXT PRIMARY KEY,name TEXT NOT NULL,rating INTEGER,text TEXT,city TEXT,package_name TEXT,active BOOLEAN DEFAULT true,created_at TEXT)",
      "CREATE TABLE IF NOT EXISTS gallery (id TEXT PRIMARY KEY,src TEXT NOT NULL,caption TEXT,category TEXT,active BOOLEAN DEFAULT true,created_at TEXT)",
      "CREATE TABLE IF NOT EXISTS blogs (id TEXT PRIMARY KEY,title TEXT NOT NULL,excerpt TEXT,content TEXT,image TEXT,category TEXT,author TEXT,active BOOLEAN DEFAULT true,created_at TEXT)",
      "CREATE TABLE IF NOT EXISTS faqs (id TEXT PRIMARY KEY,question TEXT NOT NULL,question_hi TEXT,answer TEXT NOT NULL,answer_hi TEXT,active BOOLEAN DEFAULT true,sort_order INTEGER DEFAULT 0,created_at TEXT)",
      "CREATE TABLE IF NOT EXISTS offers (id TEXT PRIMARY KEY,title TEXT NOT NULL,description TEXT,discount INTEGER,code TEXT,valid_from TEXT,valid_to TEXT,active BOOLEAN DEFAULT true,created_at TEXT)",
      "ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS kind TEXT", // N-6
      "ALTER TABLE reviews ADD COLUMN IF NOT EXISTS source TEXT", // N-5
    ],
  },
  {
    // TEXT ISO strings -> TIMESTAMPTZ. A value that is not a valid timestamp becomes NULL
    // instead of failing the migration (the app always wrote toISOString(), so none expected).
    version: 2,
    name: "created_at_timestamptz",
    statements: [
      `CREATE OR REPLACE FUNCTION atlas_try_timestamptz(v TEXT) RETURNS TIMESTAMPTZ LANGUAGE plpgsql AS $$
BEGIN
  IF v IS NULL OR btrim(v) = '' THEN RETURN NULL; END IF;
  RETURN v::timestamptz;
EXCEPTION WHEN others THEN RETURN NULL;
END $$`,
      ...TABLES.map(t => `ALTER TABLE ${t} ALTER COLUMN created_at TYPE TIMESTAMPTZ USING atlas_try_timestamptz(created_at)`),
      "DROP FUNCTION atlas_try_timestamptz(TEXT)",
    ],
  },
  {
    // JSON-array TEXT -> JSONB. NULL, empty, invalid JSON or a non-array value becomes '[]'
    // (what the app already showed for it, B-12) instead of failing the migration.
    version: 3,
    name: "package_arrays_jsonb",
    statements: [
      `CREATE OR REPLACE FUNCTION atlas_try_jsonb_array(v TEXT) RETURNS JSONB LANGUAGE plpgsql AS $$
DECLARE j JSONB;
BEGIN
  IF v IS NULL OR btrim(v) = '' THEN RETURN '[]'::jsonb; END IF;
  j := v::jsonb;
  IF jsonb_typeof(j) = 'array' THEN RETURN j; END IF;
  RETURN '[]'::jsonb;
EXCEPTION WHEN others THEN RETURN '[]'::jsonb;
END $$`,
      // The old TEXT default '[]' cannot be cast automatically, so drop it, convert, re-add.
      ...ARRAY_COLUMNS.map(c =>
        `ALTER TABLE packages ALTER COLUMN ${c} DROP DEFAULT, ALTER COLUMN ${c} TYPE JSONB USING atlas_try_jsonb_array(${c}), ALTER COLUMN ${c} SET DEFAULT '[]'::jsonb`),
      "DROP FUNCTION atlas_try_jsonb_array(TEXT)",
    ],
  },
  {
    // Repair first, then add fully validated constraints. (`NOT VALID` is not enough: Postgres
    // re-checks the whole row on every later UPDATE, so an old out-of-range row could no longer
    // be edited — not even hidden — and the admin would only see a 500.) Old, pre-validation
    // data is normalised to the nearest valid value: unknown statuses → the default, unknown
    // kind/source → NULL (= contact / admin), rating and discount clamped, a negative price → 0,
    // a negative original price → NULL (no strikethrough). NULL passes a CHECK, so optional
    // columns stay optional.
    version: 4,
    name: "check_constraints",
    statements: [
      "UPDATE enquiries SET status = 'new' WHERE status IS NOT NULL AND status NOT IN ('new','contacted','confirmed','cancelled')",
      "UPDATE enquiries SET kind = NULL WHERE kind IS NOT NULL AND kind NOT IN ('contact','trip-plan','callback')",
      "UPDATE bookings SET payment_status = 'pending' WHERE payment_status IS NOT NULL AND payment_status NOT IN ('pending','paid','failed','refunded')",
      "UPDATE bookings SET booking_status = 'pending' WHERE booking_status IS NOT NULL AND booking_status NOT IN ('pending','confirmed','completed','cancelled')",
      "UPDATE reviews SET source = NULL WHERE source IS NOT NULL AND source NOT IN ('admin','customer')",
      "UPDATE reviews SET rating = LEAST(GREATEST(rating, 1), 5) WHERE rating NOT BETWEEN 1 AND 5",
      "UPDATE packages SET price = 0 WHERE price < 0",
      "UPDATE packages SET original_price = NULL WHERE original_price < 0",
      "UPDATE offers SET discount = LEAST(GREATEST(discount, 0), 100) WHERE discount NOT BETWEEN 0 AND 100",
      "ALTER TABLE enquiries ADD CONSTRAINT enquiries_status_valid CHECK (status IN ('new','contacted','confirmed','cancelled'))",
      "ALTER TABLE enquiries ADD CONSTRAINT enquiries_kind_valid CHECK (kind IN ('contact','trip-plan','callback'))",
      "ALTER TABLE bookings ADD CONSTRAINT bookings_payment_status_valid CHECK (payment_status IN ('pending','paid','failed','refunded'))",
      "ALTER TABLE bookings ADD CONSTRAINT bookings_booking_status_valid CHECK (booking_status IN ('pending','confirmed','completed','cancelled'))",
      "ALTER TABLE reviews ADD CONSTRAINT reviews_source_valid CHECK (source IN ('admin','customer'))",
      "ALTER TABLE reviews ADD CONSTRAINT reviews_rating_range CHECK (rating BETWEEN 1 AND 5)",
      "ALTER TABLE packages ADD CONSTRAINT packages_price_nonnegative CHECK (price >= 0)",
      "ALTER TABLE packages ADD CONSTRAINT packages_original_price_nonnegative CHECK (original_price >= 0)",
      "ALTER TABLE offers ADD CONSTRAINT offers_discount_range CHECK (discount BETWEEN 0 AND 100)",
    ],
  },
  {
    // Plain CREATE INDEX (not CONCURRENTLY, which cannot run in a transaction): tables are small.
    version: 5,
    name: "indexes",
    statements: [
      ...LISTED_BY_CREATED_AT.map(t => `CREATE INDEX IF NOT EXISTS ${t}_created_at_idx ON ${t} (created_at DESC)`),
      "CREATE INDEX IF NOT EXISTS faqs_sort_order_idx ON faqs (sort_order)",
      // text_pattern_ops lets `id LIKE 'abcd1234%'` (findBookingsByIdPrefix) use the index in any collation.
      "CREATE INDEX IF NOT EXISTS bookings_id_prefix_idx ON bookings (id text_pattern_ops)",
    ],
  },
];

/**
 * Creates the tables on a fresh database, or upgrades one to the latest version. Safe to
 * re-run: applied migrations are skipped, so a second call only reads `schema_migrations`.
 */
export async function initDB(sql: ReturnType<typeof neon>) {
  await sql.query("CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())");
  const rows = (await sql.query("SELECT version FROM schema_migrations")) as Record<string, unknown>[];
  const applied = new Set(rows.map(r => Number(r.version)));
  for (const m of MIGRATIONS) {
    if (applied.has(m.version)) continue;
    await sql.transaction([
      sql.query("INSERT INTO schema_migrations (version, name) VALUES ($1, $2)", [m.version, m.name]),
      ...m.statements.map(s => sql.query(s)),
    ]);
  }
}
