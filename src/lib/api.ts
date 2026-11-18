import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "./auth";

/**
 * Shared helpers for API route handlers (B-03).
 *
 * - `withHandler` wraps a handler in try/catch: an `HttpError` becomes `{ error }`
 *   with its status; anything else is logged server-side and returned as a generic 500.
 * - Successful responses stay bare entities/arrays (no envelope).
 * - Validation helpers are hand-rolled (no zod) and throw `HttpError(400)`.
 */

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "HttpError";
  }
}

export const badRequest = (msg: string) => new HttpError(400, msg);
export const notFound = (msg = "Not found") => new HttpError(404, msg);

type Handler = (req: NextRequest) => Promise<Response>;

export function withHandler(handler: Handler): Handler {
  return async (req) => {
    try {
      return await handler(req);
    } catch (err) {
      if (err instanceof HttpError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      console.error(`[api] ${req.method} ${req.nextUrl.pathname} failed:`, err);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  };
}

export async function requireAdmin(): Promise<void> {
  const s = await verifySession();
  if (!s.authenticated) throw new HttpError(401, "Unauthorized");
}

/** True only for an authenticated admin who explicitly asked for `?all=1` (B-05). */
export async function wantsAll(req: NextRequest): Promise<boolean> {
  if (req.nextUrl.searchParams.get("all") !== "1") return false;
  return (await verifySession()).authenticated;
}

export type Body = Record<string, unknown>;

/** Parses the JSON body; malformed JSON or a non-object body is a 400. */
export async function readJson(req: NextRequest): Promise<Body> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw badRequest("Malformed JSON body");
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) throw badRequest("Request body must be a JSON object");
  return body as Body;
}

export function requireId(body: Body): string {
  const id = body.id;
  if (typeof id !== "string" || !id.trim()) throw badRequest("Missing id");
  return id;
}

// ------------------------------------------------------------
// Field validation
// ------------------------------------------------------------

/** Trimmed string capped at `max`; returns "" for missing values. Non-strings are a 400. */
export function str(body: Body, key: string, max: number, required = false): string {
  const v = body[key];
  if (v === undefined || v === null) {
    if (required) throw badRequest(`${key} is required`);
    return "";
  }
  if (typeof v !== "string" && typeof v !== "number") throw badRequest(`${key} must be a string`);
  const s = String(v).trim();
  if (required && !s) throw badRequest(`${key} is required`);
  if (s.length > max) throw badRequest(`${key} must be at most ${max} characters`);
  return s;
}

export function oneOf<T extends string>(value: unknown, allowed: readonly T[], key: string): T {
  if (typeof value !== "string" || !(allowed as readonly string[]).includes(value)) {
    throw badRequest(`${key} must be one of: ${allowed.join(", ")}`);
  }
  return value as T;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function isEmail(s: string): boolean {
  return EMAIL_RE.test(s);
}

/** Allows digits, spaces, +, -, (), . with 7–15 digits in total. */
export function isPhone(s: string): boolean {
  if (!/^[+\d\s().-]+$/.test(s)) return false;
  const digits = s.replace(/\D/g, "").length;
  return digits >= 7 && digits <= 15;
}

/** Coerces to a positive integer in [1, max]; missing/empty → `fallback`. */
export function positiveInt(value: unknown, key: string, fallback: number, max: number): number {
  if (value === undefined || value === null || value === "") return fallback;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 1) throw badRequest(`${key} must be a positive integer`);
  return Math.min(Math.floor(n), max);
}

// ------------------------------------------------------------
// Entity field specs (admin CMS writes)
// ------------------------------------------------------------

/**
 * - `"image"`: a URL that may be rendered as an image src. Only `https:` URLs or
 *   site-relative paths starting with a single `/` are accepted (B-09); `""` means
 *   "no image". Anything else (`http:`, `javascript:`, `data:`, `//host`, …) is a 400.
 */
export type BaseFieldType = "string" | "text" | "number" | "boolean" | "string[]" | "image" | readonly string[] | IntField;

/**
 * B-13: a whole number within [min, max] (inclusive). Use it for every field stored in a
 * Postgres INTEGER column: plain `"number"` accepts 1999.5 or -5, which the JSON backend
 * stores but Postgres rejects with a 500 (and a negative price makes negative booking amounts).
 * Numeric strings are coerced like `"number"`.
 */
export type IntField = { readonly int: readonly [min: number, max: number] };
export const int = (min: number, max: number): IntField => ({ int: [min, max] });

/**
 * A field that may be cleared (B-07). On write, `null` — or `""` for string-like
 * types (`string`, `text`, `image`, and `number`, since HTML inputs yield `""`) —
 * becomes `null`, which tells the db layer to clear the stored value (SQL NULL in
 * Postgres; the key is deleted in the JSON backend). Non-nullable fields reject `null`.
 */
export type NullableField = { readonly nullable: BaseFieldType };
export type FieldType = BaseFieldType | NullableField;
export type FieldSpec = Record<string, FieldType>;

export const nullable = (type: BaseFieldType): NullableField => ({ nullable: type });

const STRING_MAX = 2_000;
const TEXT_MAX = 100_000;
const ARRAY_MAX_ITEMS = 100;

/** True for `https:` URLs and site-relative paths (`/x`, not `//x` or `/\x`). */
export function isSafeImageUrl(s: string): boolean {
  if (s.startsWith("/")) {
    // `//host` and `/\host` are protocol-relative in browsers; control chars/whitespace are never valid.
    if (s.startsWith("//") || s.startsWith("/\\") || s.includes("\\") || /\s/.test(s)) return false;
    for (let i = 0; i < s.length; i++) {
      const c = s.charCodeAt(i);
      if (c < 0x20 || c === 0x7f) return false;
    }
    return true;
  }
  try {
    return new URL(s).protocol === "https:";
  } catch {
    return false;
  }
}

function coerceField(key: string, type: BaseFieldType, v: unknown): unknown {
  if (Array.isArray(type)) return oneOf(v, type as readonly string[], key);
  if (typeof type === "object" && "int" in type) {
    const [min, max] = type.int;
    const n = typeof v === "number" ? v : typeof v === "string" && v.trim() ? Number(v) : NaN;
    if (!Number.isInteger(n) || n < min || n > max) throw badRequest(`${key} must be a whole number from ${min} to ${max}`);
    return n;
  }
  switch (type) {
    case "string":
    case "text": {
      if (typeof v !== "string") throw badRequest(`${key} must be a string`);
      const max = type === "text" ? TEXT_MAX : STRING_MAX;
      if (v.length > max) throw badRequest(`${key} must be at most ${max} characters`);
      return v;
    }
    case "image": {
      if (typeof v !== "string") throw badRequest(`${key} must be a string`);
      const s = v.trim();
      if (s.length > STRING_MAX) throw badRequest(`${key} must be at most ${STRING_MAX} characters`);
      if (s && !isSafeImageUrl(s)) throw badRequest(`${key} must be an https:// URL or a site-relative path starting with /`);
      return s;
    }
    case "number": {
      const n = typeof v === "number" ? v : typeof v === "string" && v.trim() ? Number(v) : NaN;
      if (!Number.isFinite(n)) throw badRequest(`${key} must be a number`);
      return n;
    }
    case "boolean":
      if (typeof v !== "boolean") throw badRequest(`${key} must be a boolean`);
      return v;
    case "string[]":
      if (!Array.isArray(v) || v.length > ARRAY_MAX_ITEMS || !v.every((x) => typeof x === "string" && x.length <= STRING_MAX)) {
        throw badRequest(`${key} must be an array of strings`);
      }
      return v;
  }
  return v;
}

/**
 * Whitelists and type-checks `body` against `spec`. Unknown keys (including
 * client-supplied `id` / `createdAt`) are dropped and absent (`undefined`) keys are
 * omitted, so a PATCH only touches the fields actually sent (B-07).
 *
 * Nullable fields map `null` / `""` to `null` (= clear). Non-nullable fields reject `null`.
 */
export function pickFields(body: Body, spec: FieldSpec): Body {
  const out: Body = {};
  for (const [key, fieldType] of Object.entries(spec)) {
    const v = body[key];
    if (v === undefined) continue;
    const isNullable = typeof fieldType === "object" && !Array.isArray(fieldType) && "nullable" in fieldType;
    const type: BaseFieldType = isNullable ? (fieldType as NullableField).nullable : (fieldType as BaseFieldType);
    if (isNullable && (v === null || (typeof v === "string" && !v.trim() && !Array.isArray(type) && type !== "boolean" && type !== "string[]"))) {
      out[key] = null;
      continue;
    }
    if (v === null) throw badRequest(`${key} cannot be null`);
    out[key] = coerceField(key, type, v);
  }
  return out;
}

export function requireFields(data: Body, keys: readonly string[]): void {
  for (const k of keys) {
    const v = data[k];
    if (v === undefined || v === null || (typeof v === "string" && !v.trim())) throw badRequest(`${k} is required`);
  }
}
