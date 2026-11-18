import { describe, expect, it, vi } from "vitest";
import {
  addOffer, addPackage, addReview, getEnquiries, getFAQs, getPackages, getReviews,
  seedContent, updateBooking, updateEnquiryStatus, updateReview, addBooking, addEnquiry,
} from "@/lib/db";
import { initDB, MIGRATIONS } from "@/lib/db-schema";
import { isIsoString, setupPgDb } from "../helpers/pglite-sql";
import { OLD_SCHEMA_SQL } from "./fixtures/old-schema";

const pg = setupPgDb({ init: false });
const init = () => initDB(pg.sql as unknown as Parameters<typeof initDB>[0]);
const LATEST = MIGRATIONS[MIGRATIONS.length - 1].version;

async function exec(statements: readonly string[]) {
  for (const s of statements) await pg.db.query(s);
}
const versions = async () => (await pg.db.query<{ version: number }>("SELECT version FROM schema_migrations ORDER BY version")).rows.map(r => r.version);
const columnType = async (table: string, column: string) =>
  (await pg.db.query<{ data_type: string }>("SELECT data_type FROM information_schema.columns WHERE table_name=$1 AND column_name=$2", [table, column])).rows[0]?.data_type;

/** Rows as the old code wrote them (TEXT timestamps, TEXT JSON arrays), plus bad data. */
async function insertOldRows() {
  const insertPkg = (id: string, highlights: string | null, createdAt: string | null) => pg.db.query(
    "INSERT INTO packages (id,name,destination,duration,price,original_price,image,description,highlights,itinerary,inclusions,category,hidden,created_at) VALUES ($1,$2,'Varanasi','2 Days',4999,NULL,'','d',$3,'[\"Day 1\"]','[]','spiritual',false,$4)",
    [id, `pkg ${id}`, highlights, createdAt]);
  await insertPkg("good", '["Aarti","Boat"]', "2024-03-01T10:00:00.000Z");
  await insertPkg("bad-json", "not json at all", "2024-02-01T10:00:00.000Z");
  await insertPkg("object-json", '{"a":1}', "2024-01-01T10:00:00.000Z");
  await insertPkg("null-array", null, "not a date");
  await pg.db.query("INSERT INTO reviews (id,name,rating,text,city,active,created_at) VALUES ('r-bad','Old',7,'t','c',true,'2024-05-05T00:00:00.000Z')");
  await pg.db.query("INSERT INTO enquiries (id,name,phone,email,travelers,travel_date,message,status,created_at) VALUES ('e-bad','Old','1','e',2,'2024-06-01','m','weird','2024-05-06T00:00:00.000Z')");
  await pg.db.query("INSERT INTO faqs (id,question,answer,active,sort_order,created_at) VALUES ('f2','Q2','A2',true,2,'2024-01-01T00:00:00.000Z'),('f1','Q1','A1',true,1,'2024-01-01T00:00:00.000Z')");
}

describe("migrations: upgrading a database created by the old initDB", () => {
  it("keeps every row readable through the API, converts column types and records all versions", async () => {
    await exec(OLD_SCHEMA_SQL);
    await insertOldRows();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    await init();

    expect(await versions()).toEqual(MIGRATIONS.map(m => m.version));
    expect(await columnType("packages", "created_at")).toBe("timestamp with time zone");
    expect(await columnType("bookings", "created_at")).toBe("timestamp with time zone");
    expect(await columnType("packages", "highlights")).toBe("jsonb");
    expect(await columnType("packages", "inclusions")).toBe("jsonb");

    const pkgs = Object.fromEntries((await getPackages()).map(p => [p.id, p]));
    expect(Object.keys(pkgs).sort()).toEqual(["bad-json", "good", "null-array", "object-json"]);
    expect(pkgs.good).toMatchObject({ highlights: ["Aarti", "Boat"], itinerary: ["Day 1"], inclusions: [], price: 4999, createdAt: "2024-03-01T10:00:00.000Z" });
    expect(pkgs["bad-json"].highlights).toEqual([]);
    expect(pkgs["object-json"].highlights).toEqual([]);
    expect(pkgs["null-array"].highlights).toEqual([]);
    expect(pkgs["null-array"].createdAt).toBeNull(); // unparseable timestamp becomes NULL, row kept
    expect(isIsoString(pkgs["bad-json"].createdAt)).toBe(true);
    expect(warn).not.toHaveBeenCalled(); // the migration already turned bad data into []

    // Existing bad rows are repaired by v4 (not dropped), and stay editable afterwards.
    expect((await getReviews())[0]).toMatchObject({ id: "r-bad", rating: 5 });
    expect((await getEnquiries())[0]).toMatchObject({ id: "e-bad", status: "new", createdAt: "2024-05-06T00:00:00.000Z" });
    await expect(updateReview("r-bad", { active: false })).resolves.toMatchObject({ id: "r-bad", active: false });
    await expect(updateEnquiryStatus("e-bad", "contacted")).resolves.toMatchObject({ status: "contacted" });
    expect((await getFAQs()).map(f => f.id)).toEqual(["f1", "f2"]);

    // New writes work with the new types.
    const added = await addPackage({ name: "n", destination: "d", duration: "1", price: 1, image: "", description: "", highlights: ["x"], itinerary: [], inclusions: [], category: "heritage" });
    // (DESC puts the NULL created_at row first, as it did with TEXT; the new row comes right after it.)
    expect((await getPackages()).map(p => p.id).slice(0, 2)).toEqual(["null-array", added.id]);
    expect((await getPackages()).find(p => p.id === added.id)).toMatchObject({ highlights: ["x"], createdAt: added.createdAt });
  });

  it("is a no-op when run again", async () => {
    await exec(OLD_SCHEMA_SQL);
    await insertOldRows();
    await init();
    const before = (await pg.db.query("SELECT * FROM schema_migrations ORDER BY version")).rows;
    const pkgsBefore = await getPackages();

    const transaction = vi.spyOn(pg.sql, "transaction");
    await init();
    await init();
    expect(transaction).not.toHaveBeenCalled();
    expect((await pg.db.query("SELECT * FROM schema_migrations ORDER BY version")).rows).toEqual(before);
    expect(await getPackages()).toEqual(pkgsBefore);
  });

  it("also upgrades a database from before the kind/source columns existed", async () => {
    await exec(OLD_SCHEMA_SQL.filter(s => !s.startsWith("ALTER")));
    await pg.db.query("INSERT INTO reviews (id,name,rating,text,city,active,created_at) VALUES ('r1','Old',5,'t','c',true,'2024-05-05T00:00:00.000Z')");
    await init();
    expect((await getReviews())[0]).toMatchObject({ id: "r1", source: undefined });
    expect(await columnType("enquiries", "kind")).toBe("text");
  });

  it("rolls a failing migration back completely and retries it on the next run", async () => {
    await exec(OLD_SCHEMA_SQL);
    // A conflicting object makes v4 fail on its 6th statement.
    await pg.db.query("ALTER TABLE reviews ADD CONSTRAINT reviews_rating_range CHECK (true)");
    await expect(init()).rejects.toThrow(/already exists/);
    expect(await versions()).toEqual([1, 2, 3]);
    const constraint = async (name: string) => (await pg.db.query("SELECT 1 FROM pg_constraint WHERE conname=$1", [name])).rows.length;
    expect(await constraint("enquiries_status_valid")).toBe(0); // earlier statements of v4 were rolled back

    await pg.db.query("ALTER TABLE reviews DROP CONSTRAINT reviews_rating_range");
    await init();
    expect(await versions()).toEqual(MIGRATIONS.map(m => m.version));
    expect(await constraint("enquiries_status_valid")).toBe(1);
  });
});

describe("migrations: fresh database", () => {
  it("creates the latest schema, seeds, and re-runs safely", async () => {
    await init();
    await init();
    expect((await versions()).at(-1)).toBe(LATEST);
    expect(await seedContent()).toMatchObject({ packages: 3 });
    expect(await seedContent()).toMatchObject({ packages: 0 });
  });

  it("creates the indexes", async () => {
    await init();
    const names = (await pg.db.query<{ indexname: string }>("SELECT indexname FROM pg_indexes WHERE schemaname='public'")).rows.map(r => r.indexname);
    expect(names).toEqual(expect.arrayContaining([
      "packages_created_at_idx", "enquiries_created_at_idx", "bookings_created_at_idx", "reviews_created_at_idx",
      "gallery_created_at_idx", "blogs_created_at_idx", "offers_created_at_idx", "faqs_sort_order_idx", "bookings_id_prefix_idx",
    ]));
  });

  it("enforces the CHECK constraints on new writes", async () => {
    await init();
    const base = { name: "n", destination: "d", duration: "1", image: "", description: "", highlights: [], itinerary: [], inclusions: [], category: "heritage" as const };
    await expect(addPackage({ ...base, price: -1 })).rejects.toThrow(/packages_price_nonnegative/);
    await expect(addPackage({ ...base, price: 1, originalPrice: -5 })).rejects.toThrow(/packages_original_price_nonnegative/);
    await expect(addReview({ name: "n", rating: 6, text: "t", city: "c", active: true })).rejects.toThrow(/reviews_rating_range/);
    await expect(addReview({ name: "n", rating: 0, text: "t", city: "c", active: true })).rejects.toThrow(/reviews_rating_range/);
    await expect(addReview({ name: "n", rating: 5, text: "t", city: "c", active: true, source: "bot" as "admin" })).rejects.toThrow(/reviews_source_valid/);
    await expect(addOffer({ title: "t", description: "d", discount: 101, validFrom: "", validTo: "", active: true })).rejects.toThrow(/offers_discount_range/);

    const e = await addEnquiry({ name: "n", phone: "p", email: "e", travelers: 1, travelDate: "", message: "" });
    await expect(updateEnquiryStatus(e.id, "bogus" as "new")).rejects.toThrow(/enquiries_status_valid/);
    await expect(addEnquiry({ name: "n", phone: "p", email: "e", travelers: 1, travelDate: "", message: "", kind: "spam" as "contact" })).rejects.toThrow(/enquiries_kind_valid/);

    const b = await addBooking({ name: "n", phone: "p", email: "e", city: "c", packageId: "x", packageName: "x", travelers: 1, travelDate: "", amount: 1 });
    await expect(updateBooking(b.id, { paymentStatus: "stolen" as "paid" })).rejects.toThrow(/bookings_payment_status_valid/);
    await expect(updateBooking(b.id, { bookingStatus: "lost" as "confirmed" })).rejects.toThrow(/bookings_booking_status_valid/);

    // Boundaries and optional NULLs are allowed.
    await expect(addReview({ name: "n", rating: 1, text: "t", city: "c", active: true })).resolves.toBeTruthy();
    await expect(addOffer({ title: "t", description: "d", discount: 0, validFrom: "", validTo: "", active: true })).resolves.toBeTruthy();
    await expect(addPackage({ ...base, price: 0, originalPrice: 0 })).resolves.toBeTruthy();
  });
});
