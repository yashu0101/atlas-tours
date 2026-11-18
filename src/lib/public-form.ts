import { NextRequest } from "next/server";
import { Body, HttpError, badRequest, isEmail, isPhone, positiveInt, str } from "./api";
import { clientIp, consume } from "./rate-limit";
import { istDateKey } from "./visibility";

/**
 * Guards shared by the unauthenticated form endpoints `/api/book` and `/api/enquiry` (B-04).
 */

export { str };

// 5 submissions per IP per minute, per route. Shared via Upstash when configured, else in memory per instance — see rate-limit.ts.
const FORM_LIMIT = 5;
const FORM_WINDOW_MS = 60 * 1000;

export async function guardPublicForm(req: NextRequest, route: string): Promise<void> {
  if (await consume(`${route}:${clientIp(req)}`, FORM_LIMIT, FORM_WINDOW_MS)) {
    throw new HttpError(429, "Too many requests. Please try again in a minute.");
  }
}

/**
 * Honeypot: the forms render a visually hidden `website` input that humans leave empty.
 * Callers return a fake 200 without saving when this is true, so bots get no signal.
 */
export function isHoneypotTripped(body: Body): boolean {
  return typeof body.website === "string" && body.website.trim() !== "";
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** "YYYY-MM-DD" that is also a real calendar date. */
export function isDateKey(s: string): boolean {
  return DATE_RE.test(s) && !Number.isNaN(Date.parse(s));
}

/**
 * Earliest travel date a public form accepts: yesterday in India (IST). The forms offer today (IST)
 * as the minimum; the extra day is slack for visitors whose local date is behind India's.
 */
export function earliestTravelDate(now: Date = new Date()): string {
  return istDateKey(new Date(now.getTime() - 24 * 60 * 60 * 1000));
}

/** N-5: length limits of the public review text (also used by the review form). */
export const REVIEW_TEXT_MIN = 20;
export const REVIEW_TEXT_MAX = 1000;

/**
 * N-4: phone numbers compared by digits only, last 10 digits (an Indian mobile number), so
 * "+91 98765 43210", "098765-43210" and "9876543210" all match.
 */
export function phoneKey(s: string): string {
  return s.replace(/\D/g, "").slice(-10);
}

/** Validated, trimmed and length-capped contact fields common to both forms. */
export function contactFields(body: Body) {
  const name = str(body, "name", 100, true);
  const phone = str(body, "phone", 20, true);
  if (!isPhone(phone)) throw badRequest("phone is not a valid phone number");
  const email = str(body, "email", 200);
  if (email && !isEmail(email)) throw badRequest("email is not a valid email address");
  const travelDate = str(body, "travelDate", 10);
  if (travelDate && !isDateKey(travelDate)) {
    throw badRequest("travelDate must be YYYY-MM-DD");
  }
  if (travelDate && travelDate < earliestTravelDate()) {
    throw badRequest("travelDate cannot be in the past");
  }
  const travelers = positiveInt(body.travelers, "travelers", 1, 100);
  return { name, phone, email, travelDate, travelers };
}
