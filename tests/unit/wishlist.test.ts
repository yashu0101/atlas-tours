import { describe, expect, it } from "vitest";
import {
  COMPARE_MAX,
  addWithMax,
  comparePath,
  parseIds,
  parseIdsParam,
  sanitizeIds,
  toggleId,
} from "@/lib/wishlist-ids";
import { getIds, setIds, COMPARE_KEY } from "@/lib/wishlist";

describe("parseIds / sanitizeIds (N-7)", () => {
  it("parses a stored JSON array of ids", () => {
    expect(parseIds('["pkg-a","pkg-b"]')).toEqual(["pkg-a", "pkg-b"]);
  });

  it("returns [] for missing, malformed or non-array values", () => {
    expect(parseIds(null)).toEqual([]);
    expect(parseIds(undefined)).toEqual([]);
    expect(parseIds("")).toEqual([]);
    expect(parseIds("{not json")).toEqual([]);
    expect(parseIds('{"a":1}')).toEqual([]);
    expect(parseIds('"pkg-a"')).toEqual([]);
    expect(parseIds("null")).toEqual([]);
  });

  it("drops non-strings, blanks, duplicates and overlong ids, and trims", () => {
    expect(sanitizeIds(["a", 1, null, "", "  ", " b ", "a", "x".repeat(101), { id: "c" }])).toEqual(["a", "b"]);
  });

  it("caps the list at max", () => {
    expect(parseIds('["a","b","c","d"]', 3)).toEqual(["a", "b", "c"]);
    expect(sanitizeIds(["a", "a", "b", "c", "d"], 3)).toEqual(["a", "b", "c"]);
  });
});

describe("toggleId / addWithMax", () => {
  it("adds a missing id at the end and removes a present one", () => {
    expect(toggleId(["a"], "b")).toEqual(["a", "b"]);
    expect(toggleId(["a", "b"], "a")).toEqual(["b"]);
  });

  it("does not add past max, but can still remove when full", () => {
    const full = ["a", "b", "c"];
    expect(toggleId(full, "d", COMPARE_MAX)).toEqual(full);
    expect(toggleId(full, "b", COMPARE_MAX)).toEqual(["a", "c"]);
  });

  it("addWithMax never duplicates or evicts, and returns a new array", () => {
    const ids = ["a"];
    const next = addWithMax(ids, "a", 3);
    expect(next).toEqual(["a"]);
    expect(next).not.toBe(ids);
    expect(addWithMax(["a", "b", "c"], "d", 3)).toEqual(["a", "b", "c"]);
    expect(addWithMax(["a"], "b", 3)).toEqual(["a", "b"]);
  });
});

describe("parseIdsParam / comparePath", () => {
  it("splits, cleans and caps ?ids=", () => {
    expect(parseIdsParam("a,b")).toEqual(["a", "b"]);
    expect(parseIdsParam(" a , ,a,b,c,d")).toEqual(["a", "b", "c"]);
    expect(parseIdsParam(["a,b", "c"])).toEqual(["a", "b", "c"]);
    expect(parseIdsParam(undefined)).toEqual([]);
    expect(parseIdsParam("")).toEqual([]);
  });

  it("builds an encoded /compare link with at most 3 ids", () => {
    expect(comparePath(["a", "b"])).toBe("/compare?ids=a,b");
    expect(comparePath(["a b", "c&d", "e", "f"])).toBe("/compare?ids=a%20b,c%26d,e");
  });
});

describe("store without window (server)", () => {
  it("getIds is empty and setIds does not throw when storage is unavailable", () => {
    expect(getIds(COMPARE_KEY)).toEqual([]);
    // No window in the node test environment: setIds must swallow the ReferenceError.
    expect(() => setIds(COMPARE_KEY, ["a"])).not.toThrow();
  });
});
