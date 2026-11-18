import type { Booking, Enquiry } from "@/lib/types";

// PATCH body: any subset of fields, where an optional field may also be `null` to clear it
// (an omitted/undefined field is left unchanged by the API).
type OptionalKeys<T> = { [K in keyof T]-?: undefined extends T[K] ? K : never }[keyof T];
export type Patch<T> = { [K in keyof T]?: K extends OptionalKeys<T> ? T[K] | null : T[K] };

// Option values for the status <select>s; `satisfies` keeps them in step with the unions in types.ts.
export const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded"] as const satisfies readonly Booking["paymentStatus"][];
export const BOOKING_STATUSES = ["pending", "confirmed", "completed", "cancelled"] as const satisfies readonly Booking["bookingStatus"][];
export const ENQUIRY_STATUSES = ["new", "contacted", "confirmed", "cancelled"] as const satisfies readonly Enquiry["status"][];
export const isOneOf = <T extends string>(list: readonly T[], value: string): value is T => list.some(v => v === value);

// Initial list load: never throws; `data` is the parsed array on success, else the API's error message (or null).
export type LoadResult = { label: string; status: number; data: unknown };
export const loadList = async (url: string, label: string): Promise<LoadResult> => {
  try {
    const res = await fetch(url);
    const data = await res.json().catch(() => null);
    return { label, status: res.status, data: res.ok ? data : (data as { error?: string } | null)?.error ?? null };
  } catch (err) {
    return { label, status: 0, data: err instanceof Error ? err.message : String(err) };
  }
};

// Shared request helpers: API routes take the id in the JSON body and return the bare entity.
const jsonHeaders = { "Content-Type": "application/json" };
export const reportFailure = async (action: string, res: Response) => {
  const body = await res.json().catch(() => null);
  console.error(`${action} failed (${res.status})`, body);
  // Session expired or logged out in another tab: say so and go to the login page.
  if (res.status === 401) {
    alert("Your session has expired. Log in again to continue.");
    // A full load (not router.push) on purpose: drops all admin state held in memory.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/login";
    return;
  }
  alert(`${action} failed${body?.error ? `: ${body.error}` : ""}`);
};
// fetch() only rejects when the request never reached the server (offline, DNS, …).
const request = async (url: string, init: RequestInit, action: string): Promise<Response | null> => {
  try {
    return await fetch(url, init);
  } catch (err) {
    console.error(`${action} failed (network)`, err);
    alert(`${action} failed: could not reach the server. Check your internet connection and try again.`);
    return null;
  }
};
export const deleteById = async (url: string, id: string, label: string) => {
  const action = `Delete ${label}`;
  const res = await request(url, { method: "DELETE", headers: jsonHeaders, body: JSON.stringify({ id }) }, action);
  if (!res) return false;
  if (!res.ok) { await reportFailure(action, res); return false; }
  return true;
};
export const sendEntity = async <T,>(url: string, method: "POST" | "PATCH", payload: unknown, label: string): Promise<T | null> => {
  const action = `${method === "POST" ? "Create" : "Update"} ${label}`;
  const res = await request(url, { method, headers: jsonHeaders, body: JSON.stringify(payload) }, action);
  if (!res) return null;
  if (!res.ok) { await reportFailure(action, res); return null; }
  return (await res.json()) as T;
};
