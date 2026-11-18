"use client";

import React, { useState } from "react";
import type { Booking } from "@/lib/types";
import { formatPrice } from "@/app/packages/package-utils";
import { formatISTDate } from "@/app/blog/_lib/format-date";
import { parseBookingReference } from "@/lib/booking-ref";
import { PHONE_DISPLAY } from "@/lib/config";
import { useT } from "@/lib/i18n/use-t";
import {
  Honeypot,
  PublicFormCss,
  errorStyle,
  fullStyle,
  gridStyle,
  hintStyle,
  inputStyle,
  labelStyle,
  submitStyle,
} from "./public-form-ui";

/** What `POST /api/booking-status` returns (src/app/api/booking-status/route.ts). */
interface BookingStatusResult {
  reference: string;
  firstName: string;
  packageName: string;
  travelDate: string;
  travelers: number;
  amount: number;
  bookingStatus: Booking["bookingStatus"];
  paymentStatus: Booking["paymentStatus"];
  createdAt: string;
}

type Tone = "good" | "warn" | "bad" | "neutral";

const BOOKING_TONE: Record<Booking["bookingStatus"], Tone> = {
  pending: "warn",
  confirmed: "good",
  completed: "good",
  cancelled: "bad",
};
const PAYMENT_TONE: Record<Booking["paymentStatus"], Tone> = {
  pending: "warn",
  verifying: "warn",
  paid: "good",
  failed: "bad",
  refunded: "neutral",
};
const TONE_COLOR: Record<Tone, string> = {
  good: "var(--success-text)",
  warn: "var(--orange-text)",
  bad: "var(--error-text)",
  neutral: "var(--text2)",
};

const isBookingStatus = (s: unknown): s is Booking["bookingStatus"] =>
  typeof s === "string" && s in BOOKING_TONE;
const isPaymentStatus = (s: unknown): s is Booking["paymentStatus"] =>
  typeof s === "string" && s in PAYMENT_TONE;

/**
 * N-4: booking-status lookup (reference + phone) for the /track page. The phone number is
 * POSTed, never put in the URL. `initialReference` comes from `?ref=` (the booking form's
 * "Track this booking" link).
 */
export default function TrackBookingForm({ initialReference = "" }: { initialReference?: string }) {
  const t = useT();
  const [reference, setReference] = useState(initialReference);
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<BookingStatusResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);
    if (!parseBookingReference(reference)) {
      setError(t("track.invalidReference"));
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/booking-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: reference.trim(), phone: phone.trim(), website }),
      });
      const body: unknown = await res.json().catch(() => null);
      if (res.status === 404) return setError(t("track.notFound"));
      if (res.status === 429) return setError(t("track.errorTooMany"));
      if (res.status === 400) return setError(t("track.notFound"));
      if (!res.ok || !body || typeof body !== "object") return setError(t("track.errorGeneric"));
      setResult(body as BookingStatusResult);
    } catch {
      setError(t("track.errorGeneric"));
    } finally {
      setBusy(false);
    }
  };

  const styles: Record<string, React.CSSProperties> = {
    result: {
      marginTop: 28,
      paddingTop: 24,
      borderTop: "1px solid var(--bg3)",
    },
    resultHeading: { fontSize: 20, fontWeight: 800, color: "var(--primary)", marginBottom: 6 },
    greeting: { fontSize: 14, color: "var(--text2)", marginBottom: 18 },
    details: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "14px 24px",
      margin: 0,
    },
    term: { fontSize: 12, fontWeight: 600, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 1 },
    value: { fontSize: 15, fontWeight: 600, color: "var(--text)", margin: "2px 0 0" },
    statusBox: {
      marginTop: 18,
      padding: "14px 16px",
      borderRadius: 12,
      background: "var(--bg2)",
      border: "1px solid var(--bg3)",
    },
    statusRow: { display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "4px 10px", fontSize: 14, color: "var(--text2)" },
    help: { fontSize: 13, color: "var(--text2)", marginTop: 6, lineHeight: 1.6 },
    footnote: { fontSize: 13, color: "var(--text2)", marginTop: 20, textAlign: "center" },
  };

  const statusBlock = (label: string, value: string, tone: Tone, help: string) => (
    <div style={styles.statusBox}>
      <div style={styles.statusRow}>
        <span>{label}:</span>
        <strong style={{ fontSize: 16, color: TONE_COLOR[tone] }}>{value}</strong>
      </div>
      <p style={styles.help}>{help}</p>
    </div>
  );

  return (
    <div>
      <PublicFormCss />
      <form onSubmit={handleSubmit} aria-label={t("track.formAria")}>
        <Honeypot id="track-website" label={t("common.honeypotLabel")} value={website} onChange={setWebsite} />
        <div className="pf-grid" style={gridStyle}>
          <div>
            <label htmlFor="track-reference" style={labelStyle}>{t("track.reference")}</label>
            <input
              id="track-reference"
              name="reference"
              type="text"
              required
              maxLength={60}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              aria-describedby="track-reference-hint"
              className="pf-input"
              style={{ ...inputStyle, textTransform: "uppercase", letterSpacing: 1 }}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
            <p id="track-reference-hint" style={hintStyle}>{t("track.referenceHint")}</p>
          </div>
          <div>
            <label htmlFor="track-phone" style={labelStyle}>{t("common.phoneRequired")}</label>
            <input
              id="track-phone"
              name="phone"
              type="tel"
              required
              maxLength={20}
              autoComplete="tel"
              className="pf-input"
              style={inputStyle}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div style={fullStyle}>
            <button type="submit" className="pf-submit" style={{ ...submitStyle(busy), marginTop: 4 }} disabled={busy}>
              {busy ? t("track.checking") : t("track.submit")}
            </button>
          </div>
        </div>
        <div role="alert">{error && <div style={errorStyle}>{error}</div>}</div>
      </form>

      <div role="status">
        {result && (
          <section style={styles.result} aria-labelledby="track-result-heading">
            <h2 id="track-result-heading" style={styles.resultHeading}>
              {t("track.resultHeading", { reference: result.reference })}
            </h2>
            {result.firstName && <p style={styles.greeting}>{t("track.greeting", { name: result.firstName })}</p>}
            <dl className="pf-grid" style={styles.details}>
              <div style={fullStyle}>
                <dt style={styles.term}>{t("track.package")}</dt>
                <dd style={styles.value}>{result.packageName}</dd>
              </div>
              <div>
                <dt style={styles.term}>{t("track.travelDate")}</dt>
                <dd style={styles.value}>{(result.travelDate && formatISTDate(result.travelDate)) || t("track.notSet")}</dd>
              </div>
              <div>
                <dt style={styles.term}>{t("track.travelers")}</dt>
                <dd style={styles.value}>{result.travelers}</dd>
              </div>
              <div>
                <dt style={styles.term}>{t("track.amount")}</dt>
                <dd style={styles.value}>&#8377;{formatPrice(result.amount)}</dd>
              </div>
              <div>
                <dt style={styles.term}>{t("track.bookedOn")}</dt>
                <dd style={styles.value}>{formatISTDate(result.createdAt)}</dd>
              </div>
            </dl>
            {isBookingStatus(result.bookingStatus) &&
              statusBlock(
                t("track.bookingStatusLabel"),
                t(`track.bookingStatus.${result.bookingStatus}`),
                BOOKING_TONE[result.bookingStatus],
                t(`track.bookingStatusHelp.${result.bookingStatus}`),
              )}
            {isPaymentStatus(result.paymentStatus) &&
              statusBlock(
                t("track.paymentStatusLabel"),
                t(`track.paymentStatus.${result.paymentStatus}`),
                PAYMENT_TONE[result.paymentStatus],
                t(`track.paymentStatusHelp.${result.paymentStatus}`),
              )}
          </section>
        )}
      </div>

      <p style={styles.footnote}>{t("track.help", { phone: PHONE_DISPLAY })}</p>
    </div>
  );
}
