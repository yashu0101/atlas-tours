"use client";

import React, { useState } from "react";
import {
  BUDGETS,
  CALLBACK_SLOTS,
  INTERESTS,
  MAX_TRIP_DAYS,
  type Budget,
  type CallbackSlot,
  type Interest,
  type TripRequestKind,
} from "@/lib/trip-request";
import { formatISTDate } from "@/app/blog/_lib/format-date";
import { useT } from "@/lib/i18n/use-t";
import {
  Honeypot,
  PublicFormCss,
  errorStyle,
  fieldsetStyle,
  fullStyle,
  gridStyle,
  hintStyle,
  inputStyle,
  labelStyle,
  legendStyle,
  serverError,
  submitStyle,
  successStyle,
} from "./public-form-ui";

interface Values {
  name: string;
  phone: string;
  email: string;
  travelers: string;
  travelDate: string;
  destinations: string;
  days: string;
  budget: Budget | "";
  interests: Interest[];
  callbackDate: string;
  callbackSlot: CallbackSlot | "";
  message: string;
  website: string;
}

const EMPTY: Values = {
  name: "",
  phone: "",
  email: "",
  travelers: "",
  travelDate: "",
  destinations: "",
  days: "",
  budget: "",
  interests: [],
  callbackDate: "",
  callbackSlot: "",
  message: "",
  website: "",
};

interface Props {
  initialMode: TripRequestKind;
  /** Today and today + CALLBACK_MAX_DAYS_AHEAD as IST "YYYY-MM-DD", computed on the server. */
  minDate: string;
  maxDate: string;
}

/** The exact body sent to POST /api/trip-request for `mode` (only that mode's fields). */
function buildPayload(mode: TripRequestKind, v: Values) {
  const common = {
    kind: mode,
    name: v.name.trim(),
    phone: v.phone.trim(),
    message: v.message.trim(),
    website: v.website,
  };
  if (mode === "callback") {
    return { ...common, callbackDate: v.callbackDate, callbackSlot: v.callbackSlot };
  }
  return {
    ...common,
    email: v.email.trim(),
    travelers: v.travelers ? Number(v.travelers) : undefined,
    travelDate: v.travelDate,
    destinations: v.destinations.trim(),
    days: v.days ? Number(v.days) : undefined,
    budget: v.budget || undefined,
    interests: v.interests,
    // A slot without a date means nothing to the server, so only send the pair.
    ...(v.callbackDate ? { callbackDate: v.callbackDate, callbackSlot: v.callbackSlot } : {}),
  };
}

/**
 * N-6: "Plan my trip" / "Request a callback" (POST /api/trip-request). The mode switch is a
 * native radio group styled as two pills (arrow keys switch; focus ring on the pill).
 */
export default function TripRequestForm({ initialMode, minDate, maxDate }: Props) {
  const t = useT();
  const [mode, setMode] = useState<TripRequestKind>(initialMode);
  const [v, setV] = useState<Values>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const set = <K extends keyof Values>(key: K, value: Values[K]) => setV((prev) => ({ ...prev, [key]: value }));
  const toggleInterest = (i: Interest) =>
    setV((prev) => ({
      ...prev,
      interests: prev.interests.includes(i) ? prev.interests.filter((x) => x !== i) : [...prev.interests, i],
    }));

  const switchMode = (m: TripRequestKind) => {
    setMode(m);
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (mode === "trip-plan" && !v.destinations.trim() && !v.message.trim()) return setError(t("tripRequest.errorDestinations"));
    if (mode === "callback" && !v.callbackDate) return setError(t("tripRequest.errorDate"));
    if ((mode === "callback" || v.callbackDate) && !v.callbackSlot) return setError(t("tripRequest.errorSlot"));

    setBusy(true);
    try {
      const res = await fetch("/api/trip-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(mode, v)),
      });
      const body: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = serverError(body);
        if (res.status === 429) setError(t("tripRequest.errorTooMany"));
        else if (res.status === 400 && msg) setError(t("tripRequest.errorCheckDetails", { message: msg }));
        else setError(t("tripRequest.errorGeneric"));
        return;
      }
      setSuccess(
        mode === "callback" && v.callbackSlot
          ? t("tripRequest.successCallback", {
              date: formatISTDate(v.callbackDate),
              slot: t(`tripRequest.slots.${v.callbackSlot}`),
            })
          : t("tripRequest.successPlan"),
      );
      setV(EMPTY);
    } catch {
      setError(t("tripRequest.errorGeneric"));
    } finally {
      setBusy(false);
    }
  };

  const styles: Record<string, React.CSSProperties> = {
    modeGroup: { display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 26 },
    hidden: { position: "absolute", opacity: 0, width: 1, height: 1, margin: 0 },
    choices: { display: "flex", flexWrap: "wrap", gap: "8px 18px" },
    choice: { display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--text)", cursor: "pointer" },
    intro: { ...hintStyle, fontSize: 14, marginTop: 0, marginBottom: 16 },
  };

  const pill = (active: boolean): React.CSSProperties => ({
    display: "inline-block",
    padding: "10px 22px",
    borderRadius: 25,
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    border: active ? "2px solid transparent" : "2px solid var(--input-border)",
    background: active ? "linear-gradient(135deg, #e67e22, #f39c12)" : "transparent",
    color: active ? "var(--on-accent)" : "var(--text)",
    transition: "all 0.3s",
  });

  const slotRadios = (required: boolean) => (
    <fieldset style={fieldsetStyle}>
      <legend style={legendStyle}>{required ? t("tripRequest.callbackSlotRequired") : t("tripRequest.callbackSlot")}</legend>
      <div style={styles.choices}>
        {CALLBACK_SLOTS.map((s) => (
          <label key={s} style={styles.choice}>
            <input type="radio" name="callbackSlot" value={s} className="pf-choice"
              checked={v.callbackSlot === s} onChange={() => set("callbackSlot", s)} />
            {t(`tripRequest.slots.${s}`)}
          </label>
        ))}
      </div>
    </fieldset>
  );

  const dateInput = (required: boolean) => (
    <div>
      <label htmlFor="trip-callback-date" style={labelStyle}>
        {required ? t("tripRequest.callbackDateRequired") : t("tripRequest.callbackDate")}
      </label>
      <input id="trip-callback-date" name="callbackDate" type="date" required={required} min={minDate} max={maxDate}
        className="pf-input" style={inputStyle} value={v.callbackDate} onChange={(e) => set("callbackDate", e.target.value)} />
    </div>
  );

  const isPlan = mode === "trip-plan";

  return (
    <div>
      <PublicFormCss />
      <style>{`
        .trip-mode-input:focus-visible + .trip-mode-pill { outline: 3px solid var(--orange); outline-offset: 2px; }
      `}</style>

      <fieldset style={fieldsetStyle}>
        <legend style={legendStyle}>{t("tripRequest.modeAria")}</legend>
        <div style={styles.modeGroup}>
          {(["trip-plan", "callback"] as const).map((m) => (
            <span key={m} style={{ position: "relative" }}>
              <input id={`trip-mode-${m}`} className="trip-mode-input" type="radio" name="mode" value={m}
                checked={mode === m} onChange={() => switchMode(m)} style={styles.hidden} />
              <label htmlFor={`trip-mode-${m}`} className="trip-mode-pill" style={pill(mode === m)}>
                {m === "trip-plan" ? t("tripRequest.modePlan") : t("tripRequest.modeCallback")}
              </label>
            </span>
          ))}
        </div>
      </fieldset>

      <form onSubmit={handleSubmit} aria-label={isPlan ? t("tripRequest.formAriaPlan") : t("tripRequest.formAriaCallback")}>
        <Honeypot id="trip-website" label={t("common.honeypotLabel")} value={v.website} onChange={(x) => set("website", x)} />
        {!isPlan && <p style={styles.intro}>{t("tripRequest.callbackIntro")}</p>}

        <div className="pf-grid" style={gridStyle}>
          <div>
            <label htmlFor="trip-name" style={labelStyle}>{t("common.fullNameRequired")}</label>
            <input id="trip-name" name="name" type="text" required maxLength={100} autoComplete="name"
              className="pf-input" style={inputStyle} value={v.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div>
            <label htmlFor="trip-phone" style={labelStyle}>{t("common.phoneRequired")}</label>
            <input id="trip-phone" name="phone" type="tel" required maxLength={20} autoComplete="tel"
              className="pf-input" style={inputStyle} value={v.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>

          {isPlan ? (
            <>
              <div>
                <label htmlFor="trip-email" style={labelStyle}>{t("common.email")}</label>
                <input id="trip-email" name="email" type="email" maxLength={200} autoComplete="email"
                  className="pf-input" style={inputStyle} value={v.email} onChange={(e) => set("email", e.target.value)} />
              </div>
              <div>
                <label htmlFor="trip-travelers" style={labelStyle}>{t("tripRequest.travelers")}</label>
                <input id="trip-travelers" name="travelers" type="number" min={1} max={100} step={1}
                  className="pf-input" style={inputStyle} value={v.travelers} onChange={(e) => set("travelers", e.target.value)} />
              </div>
              <div style={fullStyle}>
                <label htmlFor="trip-destinations" style={labelStyle}>{t("tripRequest.destinations")}</label>
                <input id="trip-destinations" name="destinations" type="text" maxLength={300}
                  placeholder={t("tripRequest.destinationsPlaceholder")}
                  className="pf-input" style={inputStyle} value={v.destinations} onChange={(e) => set("destinations", e.target.value)} />
              </div>
              <div>
                <label htmlFor="trip-date" style={labelStyle}>{t("common.travelDate")}</label>
                <input id="trip-date" name="travelDate" type="date" min={minDate}
                  className="pf-input" style={inputStyle} value={v.travelDate} onChange={(e) => set("travelDate", e.target.value)} />
              </div>
              <div>
                <label htmlFor="trip-days" style={labelStyle}>{t("tripRequest.days")}</label>
                <input id="trip-days" name="days" type="number" min={1} max={MAX_TRIP_DAYS} step={1}
                  className="pf-input" style={inputStyle} value={v.days} onChange={(e) => set("days", e.target.value)} />
              </div>
              <div style={fullStyle}>
                <label htmlFor="trip-budget" style={labelStyle}>{t("tripRequest.budget")}</label>
                <select id="trip-budget" name="budget" className="pf-input" style={inputStyle}
                  value={v.budget} onChange={(e) => set("budget", e.target.value as Budget | "")}>
                  <option value="">{t("tripRequest.budgetAny")}</option>
                  {BUDGETS.map((b) => (
                    <option key={b} value={b}>{t(`tripRequest.budgets.${b}`)}</option>
                  ))}
                </select>
              </div>
              <fieldset style={{ ...fieldsetStyle, ...fullStyle }}>
                <legend style={legendStyle}>{t("tripRequest.interests")}</legend>
                <div style={styles.choices}>
                  {INTERESTS.map((i) => (
                    <label key={i} style={styles.choice}>
                      <input type="checkbox" name="interests" value={i} className="pf-choice"
                        checked={v.interests.includes(i)} onChange={() => toggleInterest(i)} />
                      {t(`tripRequest.interestOptions.${i}`)}
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset style={{ ...fieldsetStyle, ...fullStyle }}>
                <legend style={{ ...legendStyle, marginBottom: 12 }}>{t("tripRequest.preferredCallback")}</legend>
                <div className="pf-grid" style={gridStyle}>
                  {dateInput(false)}
                  {slotRadios(false)}
                </div>
              </fieldset>
            </>
          ) : (
            <>
              {dateInput(true)}
              {slotRadios(true)}
            </>
          )}

          <div style={fullStyle}>
            <label htmlFor="trip-message" style={labelStyle}>{t("tripRequest.message")}</label>
            <textarea id="trip-message" name="message" rows={4} maxLength={2000}
              placeholder={t("tripRequest.messagePlaceholder")}
              className="pf-input" style={{ ...inputStyle, resize: "vertical" }}
              value={v.message} onChange={(e) => set("message", e.target.value)} />
          </div>
        </div>

        <button type="submit" className="pf-submit" style={submitStyle(busy)} disabled={busy}>
          {busy ? t("common.sending") : isPlan ? t("tripRequest.submitPlan") : t("tripRequest.submitCallback")}
        </button>
        <div role="status">{success && <div style={successStyle}>{success}</div>}</div>
        <div role="alert">{error && <div style={errorStyle}>{error}</div>}</div>
      </form>
    </div>
  );
}
