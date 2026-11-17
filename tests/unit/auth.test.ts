import { describe, expect, it } from "vitest";
import { safeEqual } from "@/lib/auth";

describe("safeEqual", () => {
  it("is true only for identical strings", () => {
    expect(safeEqual("admin123", "admin123")).toBe(true);
    expect(safeEqual("", "")).toBe(true);
    expect(safeEqual("admin123", "admin124")).toBe(false);
    expect(safeEqual("Admin123", "admin123")).toBe(false);
  });

  it("handles different lengths without throwing", () => {
    expect(safeEqual("short", "a much longer string")).toBe(false);
    expect(safeEqual("abc", "")).toBe(false);
  });

  it("is false for non-string inputs", () => {
    expect(safeEqual(undefined, undefined)).toBe(false);
    expect(safeEqual(null, "x")).toBe(false);
    expect(safeEqual(123, "123")).toBe(false);
    expect(safeEqual({}, {})).toBe(false);
  });

  it("compares unicode by content", () => {
    expect(safeEqual("होम", "होम")).toBe(true);
    expect(safeEqual("होम", "होमा")).toBe(false);
  });
});
