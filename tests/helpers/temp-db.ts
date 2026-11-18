import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { buildSeedDB } from "@/lib/seed-data";
import type { DB, TourPackage } from "@/lib/types";

/**
 * Points the JSON backend at a fresh temp file (via JSON_DB_PATH) so tests never
 * touch data/db.json. Returns helpers to read the file back and to clean up.
 */
export function useTempDb(overrides: Partial<DB> = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "atlas-tours-test-"));
  const file = path.join(dir, "db.json");
  const db: DB = { ...buildSeedDB(), enquiries: [], bookings: [], ...overrides };
  fs.writeFileSync(file, JSON.stringify(db, null, 2));
  process.env.JSON_DB_PATH = file;

  return {
    file,
    read: (): DB => JSON.parse(fs.readFileSync(file, "utf-8")),
    cleanup: () => {
      delete process.env.JSON_DB_PATH;
      fs.rmSync(dir, { recursive: true, force: true });
    },
  };
}

export function makePackage(overrides: Partial<TourPackage>): TourPackage {
  return {
    id: "pkg",
    name: "Package",
    destination: "Varanasi",
    duration: "1 Day",
    price: 1000,
    image: "",
    description: "",
    highlights: [],
    itinerary: [],
    inclusions: [],
    category: "spiritual",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

let ipCounter = 0;
/** A unique client IP per call so the in-memory form rate limiter never interferes. */
export function uniqueIp(): string {
  ipCounter++;
  return `10.0.${Math.floor(ipCounter / 256)}.${ipCounter % 256}`;
}
