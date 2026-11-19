"use client";

import React, { useState } from "react";
import UpiPayCard from "@/components/UpiPayCard";
import { normalizeUtr } from "@/lib/upi";
import { useT } from "@/lib/i18n/use-t";
import { errorStyle, hintStyle, inputStyle, labelStyle, submitStyle } from "./public-form-ui";

/** Server messages of `POST /api/payment-claim` 409 responses (src/app/api/payment-claim/route.ts). */
const NOT_PAYABLE_MESSAGE = "This booking is not awaiting payment.";
const UTR_USED_MESSAGE = "This transaction ID has already been submitted.";

/**
 * N-13: pay a confirmed booking by UPI (per-booking QR) and submit the 12-digit transaction ID
 * for the owner to verify. Rendered on /track only while the booking is confirmed and unpaid.
 */
export default function PaymentPanel({
  reference,
  phone,
  amount,
  onSubmitted,
}: {
  reference: string;
  phone: string;
  amount: number;
  onSubmitted: () => void;
}) {
  const t = useT();
  const [utr, setUtr] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const normalized = normalizeUtr(utr);
    if (!normalized) return setError(t("pay.errorInvalid"));
    setBusy(true);
    try {
      const res = await fetch("/api/payment-claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference, phone, utr: normalized, website: "" }),
      });
      if (res.ok) return onSubmitted(); // parent unmounts this panel and moves focus to the payment status
      const body: unknown = await res.json().catch(() => null);
      const message = body && typeof body === "object" && "error" in body ? (body as { error: unknown }).error : "";
      if (res.status === 409 && message === NOT_PAYABLE_MESSAGE) return setError(t("pay.notPayable"));
      if (res.status === 409 && message === UTR_USED_MESSAGE) return setError(t("pay.utrUsed"));
      if (res.status === 429) return setError(t("pay.errorTooMany"));
      setError(t("pay.errorGeneric"));
    } catch {
      setError(t("pay.errorGeneric"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ marginTop: 18 }}>
      <UpiPayCard compact amount={amount} reference={reference} />
      <form onSubmit={handleSubmit} style={{ marginTop: 14 }} noValidate>
        <label htmlFor="pay-utr" style={labelStyle}>{t("pay.utrLabel")}</label>
        <input
          id="pay-utr"
          name="utr"
          type="text"
          inputMode="numeric"
          maxLength={20}
          autoComplete="off"
          spellCheck={false}
          aria-describedby="pay-utr-hint"
          className="pf-input"
          style={inputStyle}
          value={utr}
          onChange={(e) => setUtr(e.target.value)}
        />
        <p id="pay-utr-hint" style={hintStyle}>{t("pay.utrHint")}</p>
        <button type="submit" className="pf-submit" style={{ ...submitStyle(busy), marginTop: 12 }} disabled={busy}>
          {busy ? t("pay.submitting") : t("pay.submit")}
        </button>
        <div role="alert">{error && <div style={{ ...errorStyle, marginTop: 12 }}>{error}</div>}</div>
      </form>
    </div>
  );
}
