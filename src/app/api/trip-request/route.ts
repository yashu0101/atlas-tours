import { NextResponse } from "next/server";
import { addEnquiry } from "@/lib/db";
import { badRequest, oneOf, positiveInt, readJson, str, withHandler } from "@/lib/api";
import { contactFields, guardPublicForm, isDateKey, isHoneypotTripped } from "@/lib/public-form";
import { notifyAfterResponse } from "@/lib/notify";
import { istDateKey } from "@/lib/visibility";
import {
  BUDGETS,
  CALLBACK_MAX_DAYS_AHEAD,
  CALLBACK_SLOTS,
  INTERESTS,
  MAX_TRIP_DAYS,
  TRIP_REQUEST_KINDS,
  tripRequestMessage,
  type Interest,
} from "@/lib/trip-request";

/**
 * N-6: "Plan my trip" and "Request a callback" (public, unauthenticated; same guards as the
 * other public forms — see public-form.ts). Saved as an Enquiry with `kind` set to
 * "trip-plan" or "callback"; the structured answers are written into `message` as labelled
 * lines (see tripRequestMessage) so the admin Enquiries tab and CSV export show them without
 * new columns.
 *
 * A callback needs `callbackDate` (today … +30 days, IST) and `callbackSlot`. A trip plan may
 * include them too, as a preferred time to be called.
 */
export const POST = withHandler(async (req) => {
  await guardPublicForm(req, "trip-request");
  const body = await readJson(req);
  if (isHoneypotTripped(body)) return NextResponse.json({ success: true });

  const kind = oneOf(body.kind ?? "trip-plan", TRIP_REQUEST_KINDS, "kind");
  const contact = contactFields(body);
  const destinations = str(body, "destinations", 300);
  const notes = str(body, "message", 2000);

  const days = body.days === undefined || body.days === null || body.days === ""
    ? undefined
    : positiveInt(body.days, "days", 1, MAX_TRIP_DAYS);
  const budget = body.budget === undefined || body.budget === null || body.budget === ""
    ? undefined
    : oneOf(body.budget, BUDGETS, "budget");

  let interests: Interest[] = [];
  if (body.interests !== undefined && body.interests !== null) {
    if (!Array.isArray(body.interests)) throw badRequest("interests must be an array");
    interests = [...new Set(body.interests.map((i) => oneOf(i, INTERESTS, "interests")))];
  }

  const callbackDate = str(body, "callbackDate", 10);
  const rawSlot = str(body, "callbackSlot", 20);
  const callbackSlot = rawSlot ? oneOf(rawSlot, CALLBACK_SLOTS, "callbackSlot") : undefined;
  if (kind === "callback" && (!callbackDate || !callbackSlot)) {
    throw badRequest("callbackDate and callbackSlot are required for a callback request");
  }
  if (callbackDate) {
    if (!isDateKey(callbackDate)) throw badRequest("callbackDate must be YYYY-MM-DD");
    const now = new Date();
    const today = istDateKey(now);
    const last = istDateKey(new Date(now.getTime() + CALLBACK_MAX_DAYS_AHEAD * 24 * 60 * 60 * 1000));
    if (callbackDate < today || callbackDate > last) {
      throw badRequest(`callbackDate must be between today and ${CALLBACK_MAX_DAYS_AHEAD} days from now`);
    }
    if (!callbackSlot) throw badRequest("callbackSlot is required with callbackDate");
  }
  if (kind === "trip-plan" && !destinations && !notes) {
    throw badRequest("Tell us where you'd like to go (destinations) or add a message");
  }

  const enquiry = await addEnquiry({
    kind,
    name: contact.name,
    phone: contact.phone,
    email: contact.email,
    travelers: contact.travelers,
    travelDate: contact.travelDate,
    message: tripRequestMessage({
      kind,
      destinations,
      days,
      budget,
      interests,
      callbackDate: callbackDate || undefined,
      callbackSlot,
      notes,
    }),
  });
  // G-02 / N-10: owner alert + customer acknowledgement (with the chosen callback slot, if any),
  // sent after the response (notify.ts).
  notifyAfterResponse({
    type: "enquiry",
    enquiry,
    callback: callbackDate && callbackSlot ? { date: callbackDate, slot: callbackSlot } : undefined,
  });
  return NextResponse.json({ success: true });
});
