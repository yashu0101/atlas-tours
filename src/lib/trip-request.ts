/**
 * N-6: option values shared by the "Plan my trip" / callback form and `POST /api/trip-request`.
 * The values are what the form sends; the English labels are only used to write the
 * enquiry message the admin reads. The form shows translated labels from the i18n catalog
 * (`tripRequest.*` keys).
 */
export const TRIP_REQUEST_KINDS = ["trip-plan", "callback"] as const;
export type TripRequestKind = (typeof TRIP_REQUEST_KINDS)[number];

export const BUDGETS = ["under-10k", "10k-25k", "25k-50k", "50k-plus"] as const;
export type Budget = (typeof BUDGETS)[number];
export const BUDGET_LABELS: Record<Budget, string> = {
  "under-10k": "Under ₹10,000 per person",
  "10k-25k": "₹10,000 – ₹25,000 per person",
  "25k-50k": "₹25,000 – ₹50,000 per person",
  "50k-plus": "Above ₹50,000 per person",
};

export const INTERESTS = ["spiritual", "heritage", "food", "boat-ride", "photography", "adventure"] as const;
export type Interest = (typeof INTERESTS)[number];
export const INTEREST_LABELS: Record<Interest, string> = {
  spiritual: "Temples & spiritual",
  heritage: "Heritage & history",
  food: "Food & local markets",
  "boat-ride": "Ganga boat rides",
  photography: "Photography",
  adventure: "Adventure & nature",
};

/** Callback time windows, in India time (IST). */
export const CALLBACK_SLOTS = ["morning", "afternoon", "evening"] as const;
export type CallbackSlot = (typeof CALLBACK_SLOTS)[number];
export const CALLBACK_SLOT_LABELS: Record<CallbackSlot, string> = {
  morning: "Morning (9 AM – 12 PM IST)",
  afternoon: "Afternoon (12 PM – 4 PM IST)",
  evening: "Evening (4 PM – 8 PM IST)",
};

/** How far ahead a callback can be requested, in days (inclusive of today). */
export const CALLBACK_MAX_DAYS_AHEAD = 30;
export const MAX_TRIP_DAYS = 30;

export interface TripRequestDetails {
  kind: TripRequestKind;
  destinations: string;
  days?: number;
  budget?: Budget;
  interests: Interest[];
  callbackDate?: string;
  callbackSlot?: CallbackSlot;
  notes: string;
}

/** The enquiry `message` the admin sees: one labelled line per filled-in field, then the notes. */
export function tripRequestMessage(d: TripRequestDetails): string {
  const lines = [d.kind === "callback" ? "Callback request" : "Trip plan request"];
  if (d.destinations) lines.push(`Destinations: ${d.destinations}`);
  if (d.days) lines.push(`Duration: ${d.days} day${d.days === 1 ? "" : "s"}`);
  if (d.budget) lines.push(`Budget: ${BUDGET_LABELS[d.budget]}`);
  if (d.interests.length) lines.push(`Interests: ${d.interests.map((i) => INTEREST_LABELS[i]).join(", ")}`);
  if (d.callbackDate && d.callbackSlot) lines.push(`Call back: ${d.callbackDate}, ${CALLBACK_SLOT_LABELS[d.callbackSlot]}`);
  if (d.notes) lines.push("", d.notes);
  return lines.join("\n");
}
