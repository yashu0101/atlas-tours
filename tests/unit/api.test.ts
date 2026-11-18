import { describe, expect, it } from "vitest";
import {
  HttpError,
  int,
  isEmail,
  isPhone,
  isSafeImageUrl,
  nullable,
  oneOf,
  pickFields,
  positiveInt,
  requireFields,
  str,
} from "@/lib/api";

/** Asserts that `fn` throws an HttpError with the given status. */
function expectHttpError(fn: () => unknown, status = 400, message?: RegExp) {
  try {
    fn();
  } catch (err) {
    expect(err).toBeInstanceOf(HttpError);
    expect((err as HttpError).status).toBe(status);
    if (message) expect((err as HttpError).message).toMatch(message);
    return;
  }
  throw new Error("expected function to throw");
}

describe("str", () => {
  it("trims strings and stringifies numbers", () => {
    expect(str({ a: "  hi  " }, "a", 10)).toBe("hi");
    expect(str({ a: 42 }, "a", 10)).toBe("42");
  });

  it("returns empty string for missing optional values", () => {
    expect(str({}, "a", 10)).toBe("");
    expect(str({ a: null }, "a", 10)).toBe("");
  });

  it("rejects missing or blank required values", () => {
    expectHttpError(() => str({}, "a", 10, true), 400, /a is required/);
    expectHttpError(() => str({ a: "   " }, "a", 10, true), 400, /a is required/);
  });

  it("rejects non-string values and over-long strings", () => {
    expectHttpError(() => str({ a: { x: 1 } }, "a", 10), 400, /must be a string/);
    expectHttpError(() => str({ a: ["x"] }, "a", 10), 400, /must be a string/);
    expectHttpError(() => str({ a: "abcdef" }, "a", 5), 400, /at most 5/);
  });
});

describe("oneOf", () => {
  const allowed = ["new", "done"] as const;

  it("accepts allowed values", () => {
    expect(oneOf("new", allowed, "status")).toBe("new");
  });

  it("rejects anything else", () => {
    expectHttpError(() => oneOf("other", allowed, "status"), 400, /status must be one of: new, done/);
    expectHttpError(() => oneOf(1, allowed, "status"));
    expectHttpError(() => oneOf(undefined, allowed, "status"));
  });
});

describe("positiveInt", () => {
  it("returns the fallback for missing or empty values", () => {
    expect(positiveInt(undefined, "n", 3, 10)).toBe(3);
    expect(positiveInt(null, "n", 3, 10)).toBe(3);
    expect(positiveInt("", "n", 3, 10)).toBe(3);
  });

  it("parses numeric strings, floors fractions and clamps to max", () => {
    expect(positiveInt("4", "n", 1, 10)).toBe(4);
    expect(positiveInt(2.9, "n", 1, 10)).toBe(2);
    expect(positiveInt(500, "n", 1, 10)).toBe(10);
  });

  it("rejects zero, negatives and non-numbers", () => {
    expectHttpError(() => positiveInt(0, "n", 1, 10), 400, /positive integer/);
    expectHttpError(() => positiveInt(-1, "n", 1, 10));
    expectHttpError(() => positiveInt("abc", "n", 1, 10));
    expectHttpError(() => positiveInt(Infinity, "n", 1, 10));
  });
});

describe("isEmail", () => {
  it.each(["a@b.co", "first.last+tag@example.org"])("accepts %s", (s) => {
    expect(isEmail(s)).toBe(true);
  });
  it.each(["", "plain", "a@b", "a b@c.com", "@b.com"])("rejects %j", (s) => {
    expect(isEmail(s)).toBe(false);
  });
});

describe("isPhone", () => {
  it.each(["+91 98765 43210", "(0542) 250-1234", "1234567", "123456789012345"])("accepts %s", (s) => {
    expect(isPhone(s)).toBe(true);
  });
  it.each(["123456", "1234567890123456", "98765abc12", "", "+91-98765-4321x"])("rejects %j", (s) => {
    expect(isPhone(s)).toBe(false);
  });
});

describe("isSafeImageUrl", () => {
  it.each(["https://images.unsplash.com/x.jpg", "/images/a.png"])("accepts %s", (s) => {
    expect(isSafeImageUrl(s)).toBe(true);
  });
  it.each(["http://x.com/a.png", "javascript:alert(1)", "data:image/png;base64,AA", "//evil.com/a.png", "/\\evil.com", "/a b.png", "relative.png"])(
    "rejects %j",
    (s) => {
      expect(isSafeImageUrl(s)).toBe(false);
    },
  );
});

describe("pickFields", () => {
  const spec = {
    name: "string",
    body: "text",
    price: "number",
    hidden: "boolean",
    tags: "string[]",
    image: "image",
    category: ["a", "b"],
    originalPrice: nullable("number"),
    note: nullable("string"),
    cover: nullable("image"),
    rating: int(1, 5),
    cost: nullable(int(0, 1000)),
  } as const;

  it("whitelists known keys and omits absent ones", () => {
    const out = pickFields({ name: "Tour", id: "client-id", createdAt: "x", evil: 1 }, spec);
    expect(out).toEqual({ name: "Tour" });
  });

  it("coerces numeric strings and validates types", () => {
    expect(pickFields({ price: "1500" }, spec)).toEqual({ price: 1500 });
    expectHttpError(() => pickFields({ price: "abc" }, spec), 400, /price must be a number/);
    expectHttpError(() => pickFields({ price: "" }, spec), 400, /price must be a number/);
    expectHttpError(() => pickFields({ hidden: "true" }, spec), 400, /boolean/);
    expectHttpError(() => pickFields({ name: 5 }, spec), 400, /string/);
    expectHttpError(() => pickFields({ tags: ["ok", 1] }, spec), 400, /array of strings/);
    expectHttpError(() => pickFields({ category: "c" }, spec), 400, /one of: a, b/);
  });

  it("caps string and text lengths", () => {
    expectHttpError(() => pickFields({ name: "x".repeat(2001) }, spec), 400, /at most 2000/);
    expect(pickFields({ body: "x".repeat(5000) }, spec).body).toHaveLength(5000);
  });

  it("rejects null for non-nullable fields", () => {
    expectHttpError(() => pickFields({ name: null }, spec), 400, /name cannot be null/);
  });

  it("maps null and blank strings to null for nullable fields", () => {
    expect(pickFields({ originalPrice: null, note: "  ", cover: "" }, spec)).toEqual({
      originalPrice: null,
      note: null,
      cover: null,
    });
    expect(pickFields({ originalPrice: "" }, spec)).toEqual({ originalPrice: null });
  });

  it("validates nullable values that are present", () => {
    expect(pickFields({ originalPrice: 2000, note: "hi" }, spec)).toEqual({ originalPrice: 2000, note: "hi" });
    expectHttpError(() => pickFields({ originalPrice: "abc" }, spec));
    expectHttpError(() => pickFields({ cover: "http://x.com/a.png" }, spec), 400, /https/);
  });

  describe("int fields (B-13)", () => {
    it("accepts whole numbers in range, including numeric strings", () => {
      expect(pickFields({ rating: 1 }, spec)).toEqual({ rating: 1 });
      expect(pickFields({ rating: "5" }, spec)).toEqual({ rating: 5 });
      expect(pickFields({ cost: 0 }, spec)).toEqual({ cost: 0 });
    });

    it("rejects decimals, out-of-range values and non-numbers", () => {
      for (const bad of [2.5, "2.5", 0, 6, -1, "", "abc", true, NaN, Infinity]) {
        expectHttpError(() => pickFields({ rating: bad }, spec), 400, /rating must be a whole number from 1 to 5/);
      }
      expectHttpError(() => pickFields({ cost: 1001 }, spec), 400, /from 0 to 1000/);
    });

    it("can be nullable", () => {
      expect(pickFields({ cost: null }, spec)).toEqual({ cost: null });
      expect(pickFields({ cost: "" }, spec)).toEqual({ cost: null });
      expectHttpError(() => pickFields({ cost: -5 }, spec), 400, /cost must be a whole number/);
    });
  });

  describe('"image" type', () => {
    it("accepts https URLs and site-relative paths, trimming whitespace", () => {
      expect(pickFields({ image: " https://x.com/a.jpg " }, spec)).toEqual({ image: "https://x.com/a.jpg" });
      expect(pickFields({ image: "/a.jpg" }, spec)).toEqual({ image: "/a.jpg" });
    });

    it('treats "" as "no image" on a non-nullable field', () => {
      expect(pickFields({ image: "" }, spec)).toEqual({ image: "" });
    });

    it("rejects unsafe URLs and non-strings", () => {
      for (const bad of ["javascript:alert(1)", "http://x.com/a.jpg", "//x.com/a.jpg", "data:image/png;base64,AA"]) {
        expectHttpError(() => pickFields({ image: bad }, spec), 400, /https/);
      }
      expectHttpError(() => pickFields({ image: 1 }, spec), 400, /string/);
    });
  });
});

describe("requireFields", () => {
  it("passes when all keys are present and non-blank", () => {
    expect(() => requireFields({ a: "x", b: 0, c: false }, ["a", "b", "c"])).not.toThrow();
  });

  it.each([{}, { a: null }, { a: "  " }])("rejects %j", (data) => {
    expectHttpError(() => requireFields(data, ["a"]), 400, /a is required/);
  });
});
