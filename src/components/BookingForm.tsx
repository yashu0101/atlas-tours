"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  EMPTY_BOOKING_FORM,
  MAX_TRAVELERS,
  bookingErrorMessage,
  buildBookingPayload,
  clampTravelers,
  estimateTotal,
  formatPrice,
  type BookingFormValues,
} from "@/app/packages/package-utils";
import { useApp } from "@/lib/context";
import { useT } from "@/lib/i18n/use-t";
import { bookingReference } from "@/lib/booking-ref";

interface BookingFormProps {
  packageId: string;
  packageName: string;
  /** Per-person price; the server computes the real amount as price × travelers. */
  price: number;
  /** Smallest group the package can be booked for (N-18); defaults to 1. */
  minTravelers?: number;
  /** Earliest selectable travel date (today in IST, "YYYY-MM-DD"), computed on the server. */
  minDate: string;
}

/** Empty form with the travelers field preset to the package minimum (N-18). */
const emptyForm = (minTravelers: number): BookingFormValues => ({ ...EMPTY_BOOKING_FORM, travelers: String(minTravelers) });

type Status = { kind: "idle" } | { kind: "success"; reference?: string } | { kind: "error"; message: string };

/**
 * Online booking request form (G-01) for the package detail page, posting to the
 * public `POST /api/book`. Styling follows the Contact form (inputs, labels, submit button).
 */
const BookingForm: React.FC<BookingFormProps> = ({ packageId, packageName, price, minDate, minTravelers = 1 }) => {
  const { lang } = useApp();
  const t = useT();
  const [form, setForm] = useState<BookingFormValues>(() => emptyForm(minTravelers));
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const travelers = clampTravelers(form.travelers);
  const total = estimateTotal(price, form.travelers);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatus({ kind: "idle" });
    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildBookingPayload(form, packageId)),
      });
      const body: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        // Keep what the user typed so they can fix it and resubmit.
        setStatus({ kind: "error", message: bookingErrorMessage(res.status, body, lang) });
        return;
      }
      const id = body && typeof body === "object" && typeof (body as { id?: unknown }).id === "string"
        ? (body as { id: string }).id
        : undefined;
      setStatus({ kind: "success", reference: id ? bookingReference(id) : undefined });
      setForm(emptyForm(minTravelers));
    } catch {
      setStatus({ kind: "error", message: bookingErrorMessage(0, null) });
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 16px",
    borderRadius: 12,
    border: "1px solid var(--input-border)",
    fontSize: 15,
    fontFamily: "'Poppins', sans-serif",
    background: "var(--bg2)",
    color: "var(--text)",
    transition: "border-color 0.3s, box-shadow 0.3s",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
    color: "var(--text)",
    marginBottom: 6,
    display: "block",
  };

  const styles: Record<string, React.CSSProperties> = {
    form: { display: "flex", flexDirection: "column", gap: 0 },
    // minmax(0, 1fr): the date input's intrinsic min width otherwise widens column 1 and squeezes Email.
    grid: { display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 16 },
    full: { gridColumn: "1 / -1" },
    estimate: {
      marginTop: 18,
      padding: "14px 16px",
      borderRadius: 12,
      background: "rgba(230,126,34,0.08)",
      border: "1px solid rgba(230,126,34,0.25)",
    },
    estimateRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      gap: 12,
      fontSize: 14,
      color: "var(--text2)",
    },
    estimateTotal: { fontSize: 20, fontWeight: 800, color: "var(--orange-text)" },
    estimateNote: { fontSize: 12, color: "var(--text2)", marginTop: 6, lineHeight: 1.5 },
    submitBtn: {
      width: "100%",
      padding: "14px 0",
      background: "linear-gradient(135deg, #e67e22, #f39c12)",
      color: "var(--on-accent)",
      border: "none",
      borderRadius: 12,
      fontSize: 16,
      fontWeight: 700,
      cursor: submitting ? "wait" : "pointer",
      opacity: submitting ? 0.75 : 1,
      fontFamily: "'Poppins', sans-serif",
      boxShadow: "0 6px 20px rgba(230,126,34,0.35)",
      transition: "all 0.3s",
      marginTop: 18,
    },
    successMsg: {
      textAlign: "center",
      padding: "12px 20px",
      background: "rgba(39,174,96,0.1)",
      color: "var(--success-text)",
      borderRadius: 10,
      fontSize: 14,
      fontWeight: 600,
      marginTop: 14,
    },
    // Deliberately not the green success style: red-ish, readable in both themes.
    errorMsg: {
      textAlign: "center",
      padding: "12px 20px",
      background: "var(--booking-error-bg, rgba(192,57,43,0.08))",
      color: "var(--booking-error, #c0392b)",
      border: "1px solid var(--booking-error-border, rgba(192,57,43,0.25))",
      borderRadius: 10,
      fontSize: 14,
      fontWeight: 600,
      marginTop: 14,
    },
  };

  return (
    <form className="booking-form" style={styles.form} onSubmit={handleSubmit} aria-label={t("booking.formAria", { name: packageName })}>
      <style>{`
        .booking-input { outline: none; }
        .booking-input:focus { border-color: #e67e22 !important; box-shadow: 0 0 0 3px rgba(230,126,34,0.1) !important; }
        .booking-submit:not(:disabled):hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(230,126,34,0.45) !important; }
        [data-theme="dark"] .booking-form {
          --booking-error: #f1948a;
          --booking-error-bg: rgba(241,148,138,0.1);
          --booking-error-border: rgba(241,148,138,0.3);
        }
        @media (max-width: 480px) {
          .booking-grid { grid-template-columns: 1fr !important; }
        }
        /* The form also sits in the narrow detail-page sidebar (about 290px wide at 1024px),
           so stack by the form's own width too, not only the viewport's. */
        .booking-form { container-type: inline-size; }
        @container (max-width: 340px) {
          .booking-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Honeypot (see src/lib/public-form.ts): off-screen, skipped by keyboard and AT. */}
      <div aria-hidden="true" style={{ position: "absolute", left: -9999, top: "auto", width: 1, height: 1, overflow: "hidden" }}>
        <label htmlFor="booking-website">{t("common.honeypotLabel")}</label>
        <input
          id="booking-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={form.website}
          onChange={handleChange}
        />
      </div>

      <div className="booking-grid" style={styles.grid}>
        <div style={styles.full}>
          <label htmlFor="booking-name" style={labelStyle}>{t("common.fullNameRequired")}</label>
          <input id="booking-name" name="name" type="text" required maxLength={100} autoComplete="name"
            className="booking-input" style={inputStyle} value={form.name} onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="booking-phone" style={labelStyle}>{t("common.phoneRequired")}</label>
          <input id="booking-phone" name="phone" type="tel" required maxLength={20} autoComplete="tel"
            className="booking-input" style={inputStyle} value={form.phone} onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="booking-email" style={labelStyle}>{t("common.email")}</label>
          <input id="booking-email" name="email" type="email" maxLength={200} autoComplete="email"
            className="booking-input" style={inputStyle} value={form.email} onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="booking-date" style={labelStyle}>{t("common.travelDate")}</label>
          <input id="booking-date" name="travelDate" type="date" min={minDate}
            className="booking-input" style={inputStyle} value={form.travelDate} onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="booking-travelers" style={labelStyle}>{t("booking.travelers")}</label>
          <input id="booking-travelers" name="travelers" type="number" required min={minTravelers} max={MAX_TRAVELERS} step={1}
            className="booking-input" style={inputStyle} value={form.travelers} onChange={handleChange} />
        </div>
        <div style={styles.full}>
          <label htmlFor="booking-city" style={labelStyle}>{t("booking.city")}</label>
          <input id="booking-city" name="city" type="text" maxLength={100} autoComplete="address-level2"
            className="booking-input" style={inputStyle} value={form.city} onChange={handleChange} />
        </div>
      </div>

      <div style={styles.estimate} aria-live="polite">
        <div style={styles.estimateRow}>
          <span>
            &#8377;{formatPrice(price)} &times; {travelers} {travelers === 1 ? t("booking.travelerOne") : t("booking.travelerMany")}
          </span>
          <span style={styles.estimateTotal}>&#8377;{formatPrice(total)}</span>
        </div>
        <p style={styles.estimateNote}>
          {t("booking.estimateNote")}
        </p>
      </div>

      <button type="submit" className="booking-submit" style={styles.submitBtn} disabled={submitting}>
        {submitting ? t("common.sending") : t("booking.submit")}
      </button>

      <div role="status">
        {status.kind === "success" && (
          <div style={styles.successMsg}>
            {t("booking.success", {
              reference: status.reference ? t("booking.successReference", { reference: status.reference }) : "",
            })}
            {status.reference && (
              <>
                {" "}
                <Link
                  href={`/track?ref=${encodeURIComponent(status.reference)}`}
                  style={{ color: "inherit", textDecoration: "underline", textUnderlineOffset: 3 }}
                >
                  {t("booking.trackLink")}
                </Link>
              </>
            )}
            <div style={{ marginTop: 8 }}>{t("booking.payAfterConfirm")}</div>
          </div>
        )}
      </div>
      <div role="alert">
        {status.kind === "error" && <div style={styles.errorMsg}>{status.message}</div>}
      </div>
    </form>
  );
};

export default BookingForm;
