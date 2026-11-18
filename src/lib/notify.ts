import { after } from "next/server";
import { formatISTDate } from "@/app/blog/_lib/format-date";
import { formatPrice } from "@/app/packages/package-utils";
import { bookingReference } from "./booking-ref";
import { consume } from "./rate-limit";
import { PHONE_DISPLAY, SITE_CONFIG } from "./config";
import { getT, type MessageKey } from "./i18n";
import { SITE_URL } from "./seo";
import { CALLBACK_SLOT_LABELS, type CallbackSlot } from "./trip-request";
import type { Booking, Enquiry, Review } from "./types";

/**
 * G-02 / N-10: email notifications for the public forms, sent through Resend's REST API with
 * plain `fetch` (no SDK dependency).
 *
 * - Owner alerts (to NOTIFY_EMAIL) for every new booking, enquiry, trip-plan/callback request
 *   and customer review. The owner is trusted, so these include every submitted field.
 * - Customer confirmations for bookings, enquiries and trip-plan/callback requests, only when
 *   the customer gave an email address. They NEVER echo the free-text message/notes, so the
 *   forms can't be used to relay arbitrary content to third-party inboxes. Not even the
 *   customer's name is included (a name like "Claim your refund at evil.example" would be a
 *   lure sent from our verified domain): only fixed copy and structured values (reference,
 *   package, dates, counts). Abuse with a stranger's address is bounded by the public-form
 *   rate limit (5/min/IP), the honeypot, and a per-recipient cap (CUSTOMER_MAIL_LIMIT).
 *
 * Env (all optional; everything stays off unless RESEND_API_KEY and NOTIFY_FROM are set):
 * - RESEND_API_KEY — Resend API key.
 * - NOTIFY_FROM    — verified sender, e.g. "Atlas Tours <bookings@example.com>".
 * - NOTIFY_EMAIL   — owner address(es), comma-separated; owner alerts need it.
 *
 * Nothing here ever throws into the request: failures are logged (status / error name only —
 * no API key, no addresses, no customer data) and swallowed.
 */

export const RESEND_ENDPOINT = "https://api.resend.com/emails";
export const SEND_TIMEOUT_MS = 5000;
/** Resend accepts at most 50 recipients per email. */
const MAX_RECIPIENTS = 50;

export type NotifyEvent =
  | { type: "booking"; booking: Booking }
  /** Contact, trip-plan and callback enquiries. `packageName` resolves `enquiry.packageId` for the owner. */
  | { type: "enquiry"; enquiry: Enquiry; packageName?: string; callback?: { date: string; slot: CallbackSlot } }
  | { type: "review"; review: Review };

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

interface NotifyConfig {
  apiKey: string;
  from: string;
  owners: string[];
}

const t = getT("en");

// ------------------------------------------------------------
// Config
// ------------------------------------------------------------

const loggedOnce = new Set<string>();
function logOnce(key: string, msg: string): void {
  if (loggedOnce.has(key)) return;
  loggedOnce.add(key);
  console.info(`[notify] ${msg}`);
}

/** Read lazily (per call) so tests and deployments can change env without a restart of this module. */
export function notifyConfig(): NotifyConfig | null {
  const apiKey = (process.env.RESEND_API_KEY ?? "").trim();
  const from = (process.env.NOTIFY_FROM ?? "").trim();
  if (!apiKey || !from) {
    logOnce("disabled", "Email notifications are off (set RESEND_API_KEY and NOTIFY_FROM to enable).");
    return null;
  }
  const owners = (process.env.NOTIFY_EMAIL ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, MAX_RECIPIENTS);
  if (!owners.length) logOnce("no-owner", "Owner alerts are off (NOTIFY_EMAIL is not set); customer emails still go out.");
  return { apiKey, from: stripLineBreaks(from), owners };
}

// ------------------------------------------------------------
// Escaping helpers
// ------------------------------------------------------------

const HTML_ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);
}

/** CR, LF, NEL, LINE SEPARATOR, PARAGRAPH SEPARATOR (built from char codes to keep the source ASCII). */
const LINE_BREAKS = new RegExp(`[${[0x0d, 0x0a, 0x85, 0x2028, 0x2029].map((c) => String.fromCharCode(c)).join("")}]+`, "g");

/** Removes CR/LF (and other line separators) so a value can't inject extra mail headers. */
export function stripLineBreaks(s: string): string {
  return s.replace(LINE_BREAKS, " ").trim();
}

/** Subjects: single line, bounded length. */
export function safeSubject(s: string): string {
  const one = stripLineBreaks(s).replace(/\s+/g, " ");
  return one.length > 200 ? `${one.slice(0, 199)}…` : one;
}

// ------------------------------------------------------------
// Templates
// ------------------------------------------------------------

type Row = [label: string, value: string, opts?: { multiline?: boolean }];

const SITE = SITE_CONFIG.name;
const trackUrl = (ref: string) => `${SITE_URL}/track?ref=${encodeURIComponent(ref)}`;
const ADMIN_URL = `${SITE_URL}/admin`;

const orNotSet = (v: string | undefined | null) => (v && v.trim() ? v : t("email.notSet"));
const dateOrNotSet = (d: string | undefined) => orNotSet(d ? formatISTDate(d) || d : "");

function rowsHtml(rows: Row[]): string {
  const cells = rows
    .map(([label, value, opts]) => {
      const v = escapeHtml(value);
      const style = opts?.multiline ? "white-space:pre-wrap;" : "";
      return (
        `<tr><td style="padding:6px 12px 6px 0;color:#6b5a4a;vertical-align:top;white-space:nowrap;">${escapeHtml(label)}</td>` +
        `<td style="padding:6px 0;color:#2b2118;${style}">${v}</td></tr>`
      );
    })
    .join("");
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:16px 0;font-size:14px;">${cells}</table>`;
}

function rowsText(rows: Row[]): string {
  return rows
    .map(([label, value, opts]) => (opts?.multiline && value.includes("\n") ? `${label}:\n${value}` : `${label}: ${value}`))
    .join("\n");
}

function button(href: string, label: string): string {
  return (
    `<p style="margin:20px 0;"><a href="${escapeHtml(href)}" style="display:inline-block;background:#e8772e;color:#ffffff;` +
    `text-decoration:none;padding:10px 18px;border-radius:6px;font-weight:600;">${escapeHtml(label)}</a></p>`
  );
}

function layout(heading: string, inner: string, footer: string): string {
  return (
    `<!doctype html><html><body style="margin:0;padding:0;background:#f7f2ec;">` +
    `<div style="max-width:600px;margin:0 auto;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#2b2118;line-height:1.5;">` +
    `<div style="background:#ffffff;border-radius:8px;padding:24px;">` +
    `<p style="margin:0 0 4px;color:#b8561b;font-weight:700;">${escapeHtml(SITE)}</p>` +
    `<h1 style="margin:0 0 16px;font-size:20px;">${escapeHtml(heading)}</h1>` +
    inner +
    `</div><p style="font-size:12px;color:#6b5a4a;margin:16px 0 0;">${escapeHtml(footer)}</p></div></body></html>`
  );
}

interface CustomerParts {
  subject: string;
  heading: string;
  intro: string;
  rows: Row[];
  extraHtml?: string;
  extraText?: string[];
}

function customerEmail(p: CustomerParts): EmailContent {
  const greeting = t("email.greeting");
  const contact = t("email.contactLine", { phone: PHONE_DISPLAY, email: SITE_CONFIG.email });
  const signoff = [t("email.signoff"), t("email.team", { site: SITE })];
  const footer = t("email.automated", { site: SITE });
  const html = layout(
    p.heading,
    `<p>${escapeHtml(greeting)}</p><p>${escapeHtml(p.intro)}</p>` +
      (p.rows.length ? rowsHtml(p.rows) : "") +
      (p.extraHtml ?? "") +
      `<p>${escapeHtml(contact)}</p><p>${signoff.map(escapeHtml).join("<br>")}</p>`,
    footer,
  );
  const text = [
    greeting,
    "",
    p.intro,
    ...(p.rows.length ? ["", rowsText(p.rows)] : []),
    ...(p.extraText?.length ? ["", ...p.extraText] : []),
    "",
    contact,
    "",
    ...signoff,
    "",
    "--",
    footer,
  ].join("\n");
  return { subject: safeSubject(p.subject), html, text };
}

function ownerEmail(subject: string, heading: string, intro: string, rows: Row[]): EmailContent {
  const footer = t("email.ownerFooter", { site: SITE });
  const html = layout(heading, `<p>${escapeHtml(intro)}</p>${rowsHtml(rows)}${button(ADMIN_URL, t("email.adminCta"))}`, footer);
  const text = [intro, "", rowsText(rows), "", `${t("email.adminCta")}: ${ADMIN_URL}`, "", "--", footer].join("\n");
  return { subject: safeSubject(subject), html, text };
}

type EnquiryKindKey = "enquiry" | "tripPlan" | "callback";
const enquiryKey = (e: Enquiry): EnquiryKindKey =>
  e.kind === "trip-plan" ? "tripPlan" : e.kind === "callback" ? "callback" : "enquiry";
const kindLabel: Record<EnquiryKindKey, MessageKey> = {
  enquiry: "email.kinds.contact",
  tripPlan: "email.kinds.tripPlan",
  callback: "email.kinds.callback",
};

/** The owner alert for a submission (always built; sent only when NOTIFY_EMAIL is set). */
export function buildOwnerEmail(event: NotifyEvent): EmailContent {
  switch (event.type) {
    case "booking": {
      const b = event.booking;
      const ref = bookingReference(b.id);
      return ownerEmail(
        t("email.booking.ownerSubject", { ref, package: b.packageName, name: b.name }),
        t("email.booking.ownerHeading"),
        t("email.booking.ownerIntro"),
        [
          [t("email.labels.reference"), ref],
          [t("email.labels.package"), b.packageName],
          [t("email.labels.travelDate"), dateOrNotSet(b.travelDate)],
          [t("email.labels.travelers"), String(b.travelers)],
          [t("email.labels.estimatedAmount"), t("email.booking.amountValue", { amount: formatPrice(b.amount) })],
          [t("email.labels.name"), b.name],
          [t("email.labels.phone"), b.phone],
          [t("email.labels.email"), orNotSet(b.email)],
          [t("email.labels.city"), orNotSet(b.city)],
          [t("email.labels.submitted"), dateOrNotSet(b.createdAt)],
        ],
      );
    }
    case "enquiry": {
      const e = event.enquiry;
      const key = enquiryKey(e);
      const rows: Row[] = [
        [t("email.labels.requestType"), t(kindLabel[key])],
        [t("email.labels.name"), e.name],
        [t("email.labels.phone"), e.phone],
        [t("email.labels.email"), orNotSet(e.email)],
        [t("email.labels.travelers"), String(e.travelers)],
        [t("email.labels.travelDate"), dateOrNotSet(e.travelDate)],
      ];
      if (event.packageName) rows.push([t("email.labels.package"), event.packageName]);
      rows.push([t("email.labels.message"), orNotSet(e.message), { multiline: true }]);
      rows.push([t("email.labels.submitted"), dateOrNotSet(e.createdAt)]);
      return ownerEmail(
        t(`email.${key}.ownerSubject`, { name: e.name }),
        t(`email.${key}.ownerHeading`),
        t(`email.${key}.ownerIntro`),
        rows,
      );
    }
    case "review": {
      const r = event.review;
      const rows: Row[] = [
        [t("email.labels.name"), r.name],
        [t("email.labels.city"), orNotSet(r.city)],
        [t("email.labels.rating"), t("email.review.ratingValue", { rating: r.rating })],
      ];
      if (r.packageName) rows.push([t("email.labels.package"), r.packageName]);
      rows.push([t("email.labels.review"), r.text, { multiline: true }]);
      rows.push([t("email.labels.submitted"), dateOrNotSet(r.createdAt)]);
      return ownerEmail(
        t("email.review.ownerSubject", { rating: r.rating, name: r.name }),
        t("email.review.ownerHeading"),
        t("email.review.ownerIntro"),
        rows,
      );
    }
  }
}

/**
 * The customer confirmation, or null when there is none (no email given, or a review).
 * Deliberately built only from fixed copy and structured fields — never the name or the free-text message.
 */
export function buildCustomerEmail(event: NotifyEvent): EmailContent | null {
  switch (event.type) {
    case "booking": {
      const b = event.booking;
      if (!b.email) return null;
      const ref = bookingReference(b.id);
      const url = trackUrl(ref);
      const price = b.travelers > 0 ? Math.round(b.amount / b.travelers) : b.amount;
      return customerEmail({
        subject: t("email.booking.customerSubject", { ref }),
        heading: t("email.booking.customerHeading"),
        intro: t("email.booking.customerIntro", { site: SITE }),
        rows: [
          [t("email.labels.reference"), ref],
          [t("email.labels.package"), b.packageName],
          [t("email.labels.travelDate"), dateOrNotSet(b.travelDate)],
          [t("email.labels.travelers"), String(b.travelers)],
          [t("email.labels.estimatedAmount"), t("email.booking.amountValue", { amount: formatPrice(b.amount) })],
        ],
        extraHtml:
          `<p style="font-size:13px;color:#6b5a4a;">${escapeHtml(
            t("email.booking.estimateNote", { price: formatPrice(price), travelers: b.travelers }),
          )}</p>` + button(url, t("email.booking.trackCta")),
        extraText: [
          t("email.booking.estimateNote", { price: formatPrice(price), travelers: b.travelers }),
          "",
          t("email.booking.trackText", { url }),
        ],
      });
    }
    case "enquiry": {
      const e = event.enquiry;
      if (!e.email) return null;
      const key = enquiryKey(e);
      const rows: Row[] = [];
      if (key === "callback" && event.callback) {
        rows.push([
          t("email.labels.callbackTime"),
          `${dateOrNotSet(event.callback.date)}, ${CALLBACK_SLOT_LABELS[event.callback.slot]}`,
        ]);
      }
      return customerEmail({
        subject: t(`email.${key}.customerSubject`),
        heading: t(`email.${key}.customerHeading`),
        intro: t(`email.${key}.customerIntro`),
        rows,
      });
    }
    case "review":
      return null; // the review form collects no email
  }
}

// ------------------------------------------------------------
// Sending
// ------------------------------------------------------------

interface SendOptions {
  to: string[];
  replyTo?: string;
  /** Resend de-duplicates requests with the same key for 24 h. */
  idempotencyKey?: string;
  /** For logs only, e.g. "booking/owner". Never contains personal data. */
  tag: string;
}

/** POSTs one email to Resend. Resolves true on 2xx; never throws, never retries. */
export async function sendEmail(cfg: NotifyConfig, content: EmailContent, opts: SendOptions): Promise<boolean> {
  try {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${cfg.apiKey}`,
      "Content-Type": "application/json",
    };
    if (opts.idempotencyKey) headers["Idempotency-Key"] = opts.idempotencyKey;
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify({
        from: cfg.from,
        to: opts.to,
        subject: safeSubject(content.subject),
        html: content.html,
        text: content.text,
        ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });
    if (!res.ok) {
      // Resend error bodies are { statusCode, name, message }; log only the error name, since
      // the message can quote addresses.
      let name = "";
      try {
        const body = (await res.json()) as { name?: unknown };
        if (typeof body?.name === "string") name = ` (${body.name.slice(0, 60)})`;
      } catch {
        /* non-JSON error body */
      }
      console.error(`[notify] ${opts.tag} email failed: HTTP ${res.status}${name}`);
      return false;
    }
    return true;
  } catch (err) {
    const name = err instanceof Error ? err.name : "unknown error";
    console.error(`[notify] ${opts.tag} email failed: ${name === "TimeoutError" ? `timed out after ${SEND_TIMEOUT_MS} ms` : name}`);
    return false;
  }
}

function recordId(event: NotifyEvent): string {
  return event.type === "booking" ? event.booking.id : event.type === "enquiry" ? event.enquiry.id : event.review.id;
}

function customerAddress(event: NotifyEvent): string | undefined {
  const email = event.type === "booking" ? event.booking.email : event.type === "enquiry" ? event.enquiry.email : "";
  const clean = stripLineBreaks(email ?? "");
  return clean || undefined;
}

/**
 * Sends the owner alert and the customer confirmation for a saved submission, in parallel.
 * Never throws. A no-op when notifications are not configured.
 */
/** Customer emails per recipient address per 24 h (shared via Upstash when configured). */
export const CUSTOMER_MAIL_LIMIT = 5;
const CUSTOMER_MAIL_WINDOW_MS = 24 * 60 * 60 * 1000;

export async function notifySubmission(event: NotifyEvent): Promise<void> {
  try {
    const cfg = notifyConfig();
    if (!cfg) return;
    const id = recordId(event);
    const customer = customerAddress(event);
    const jobs: Promise<boolean>[] = [];
    if (cfg.owners.length) {
      jobs.push(
        sendEmail(cfg, buildOwnerEmail(event), {
          to: cfg.owners,
          replyTo: customer,
          idempotencyKey: `${event.type}-${id}-owner`,
          tag: `${event.type}/owner`,
        }),
      );
    }
    const mail = customer ? buildCustomerEmail(event) : null;
    // Per-recipient cap, so a stranger's address entered from many IPs can't be flooded.
    if (customer && mail && (await consume(`notify:to:${customer.toLowerCase()}`, CUSTOMER_MAIL_LIMIT, CUSTOMER_MAIL_WINDOW_MS))) {
      logOnce("recipient-cap", `Customer email skipped: recipient reached ${CUSTOMER_MAIL_LIMIT} emails in 24 h (logged once per process).`);
    } else if (customer && mail) {
      jobs.push(
        sendEmail(cfg, mail, { to: [customer], idempotencyKey: `${event.type}-${id}-customer`, tag: `${event.type}/customer` }),
      );
    }
    await Promise.all(jobs);
  } catch (err) {
    console.error(`[notify] ${event.type} notification failed: ${err instanceof Error ? err.name : "unknown error"}`);
  }
}

/**
 * Called by the public form routes once the record is saved. Schedules the emails with
 * `after()` so they run after the response has been sent (the platform keeps the function
 * alive until they finish; on Vercel this uses waitUntil). Never throws and never delays the
 * response.
 *
 * Outside a request scope (`after()` throws there, e.g. when a handler is called directly in
 * a script) it falls back to a fire-and-forget promise; on serverless that promise may be cut
 * off when the instance freezes, which is acceptable for a best-effort notification.
 */
export function notifyAfterResponse(event: NotifyEvent): void {
  if (!notifyConfig()) return;
  const task = () => notifySubmission(event);
  try {
    after(task);
  } catch {
    void task();
  }
}
