import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getPackageById, isPostgres } from "@/lib/db";
import { makePackage, useTempDb } from "../helpers/temp-db";

// JSON backend (vitest forces DATABASE_URL=""): getPackageById.
describe("getPackageById (JSON backend)", () => {
  let tmp: ReturnType<typeof useTempDb>;
  beforeEach(() => {
    tmp = useTempDb({ packages: [makePackage({ id: "p1", name: "One" }), makePackage({ id: "p2", name: "Two", hidden: true })] });
  });
  afterEach(() => tmp.cleanup());

  it("finds a package by id, hidden or not, and returns null otherwise", async () => {
    expect(isPostgres()).toBe(false);
    expect(await getPackageById("p1")).toMatchObject({ id: "p1", name: "One" });
    expect(await getPackageById("p2")).toMatchObject({ id: "p2", hidden: true });
    expect(await getPackageById("nope")).toBeNull();
  });
});
