import { NextRequest } from "next/server";
import { Body, HttpError, badRequest, isEmail, isPhone, positiveInt, str } from "./api";
import { clientIp, consume } from "./rate-limit";

/**
 * Guards shared by the unauthenticated form endpoints `/api/book` and `/api/enquiry` (B-04).
 */

export { str };

// 5 submissions per IP per minute, per route. In-memory and per instance — see rate-limit.ts.
const FORM_LIMIT = 5;
const FORM_WINDOW_MS = 60 * 1000;

export function guardPublicForm(req: NextRequest, route: string): void {
  if (consume(`${route}:${clientIp(req)}`, FORM_LIMIT, FORM_WINDOW_MS)) {
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

/** Validated, trimmed and length-capped contact fields common to both forms. */
export function contactFields(body: Body) {
  const name = str(body, "name", 100, true);
  const phone = str(body, "phone", 20, true);
  if (!isPhone(phone)) throw badRequest("phone is not a valid phone number");
  const email = str(body, "email", 200);
  if (email && !isEmail(email)) throw badRequest("email is not a valid email address");
  const travelDate = str(body, "travelDate", 10);
  if (travelDate && (!DATE_RE.test(travelDate) || Number.isNaN(Date.parse(travelDate)))) {
    throw badRequest("travelDate must be YYYY-MM-DD");
  }
  const travelers = positiveInt(body.travelers, "travelers", 1, 100);
  return { name, phone, email, travelDate, travelers };
}
