"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { TourPackage } from "@/lib/types";
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
  textLinkStyle,
} from "./public-form-ui";

type PackageOption = Pick<TourPackage, "id" | "name">;

const EMPTY = { name: "", city: "", rating: 0, packageId: "", text: "", website: "" };
const STARS = [1, 2, 3, 4, 5] as const;

/**
 * N-5: public review form (POST /api/review). Saved hidden until an admin approves it.
 * The star rating is a native radio group (arrow keys move and select; visible focus ring
 * on the focused star's label), with the radios visually hidden behind star glyphs.
 */
export default function ReviewSubmitForm({ packages, minLength, maxLength }: {
  packages: PackageOption[];
  /** minLength / maxLength, passed from the server page (public-form.ts is server-only). */
  minLength: number;
  maxLength: number;
}) {
  const t = useT();
  const [form, setForm] = useState(EMPTY);
  const [hover, setHover] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const set = <K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) => setForm((f) => ({ ...f, [key]: value }));
  const textLength = form.text.trim().length;
  const shown = hover || form.rating;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.rating < 1) return setError(t("reviewForm.ratingRequired"));
    if (textLength < minLength) return setError(t("reviewForm.textTooShort", { min: minLength }));
    setBusy(true);
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          city: form.city.trim(),
          rating: form.rating,
          text: form.text.trim(),
          ...(form.packageId ? { packageId: form.packageId } : {}),
          website: form.website,
        }),
      });
      const body: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = serverError(body);
        if (res.status === 429) setError(t("reviewForm.errorTooMany"));
        else if (res.status === 400 && msg) setError(t("reviewForm.errorCheckDetails", { message: msg }));
        else setError(t("reviewForm.errorGeneric"));
        return;
      }
      setDone(true);
      setForm(EMPTY);
    } catch {
      setError(t("reviewForm.errorGeneric"));
    } finally {
      setBusy(false);
    }
  };

  const styles: Record<string, React.CSSProperties> = {
    stars: { display: "flex", gap: 4 },
    starInput: { position: "absolute", opacity: 0, width: 1, height: 1, margin: 0 },
    srOnly: { position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" },
    count: { ...hintStyle, textAlign: "right" },
  };

  return (
    <div>
      <div role="status">
        {done && (
          <>
            <div style={successStyle}>{t("reviewForm.success")}</div>
            <p style={{ textAlign: "center", marginTop: 20 }}>
              <Link href="/#reviews" style={textLinkStyle}>{t("reviewForm.backHome")}</Link>
            </p>
          </>
        )}
      </div>
      {!done && (
        <form onSubmit={handleSubmit} aria-label={t("reviewForm.formAria")}>
          <PublicFormCss />
          <style>{`
            .rf-star-label { cursor: pointer; border-radius: 8px; padding: 2px 4px; font-size: 32px; line-height: 1; transition: transform 0.15s; }
            .rf-star-label:hover { transform: scale(1.1); }
            .rf-star-input:focus-visible + .rf-star-label { outline: 3px solid var(--orange); outline-offset: 2px; }
          `}</style>
          <Honeypot id="review-website" label={t("common.honeypotLabel")} value={form.website} onChange={(v) => set("website", v)} />

          <div className="pf-grid" style={gridStyle}>
            <div>
              <label htmlFor="review-name" style={labelStyle}>{t("common.fullNameRequired")}</label>
              <input id="review-name" name="name" type="text" required maxLength={100} autoComplete="name"
                className="pf-input" style={inputStyle} value={form.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div>
              <label htmlFor="review-city" style={labelStyle}>{t("reviewForm.city")}</label>
              <input id="review-city" name="city" type="text" maxLength={100} autoComplete="address-level2"
                className="pf-input" style={inputStyle} value={form.city} onChange={(e) => set("city", e.target.value)} />
            </div>

            <fieldset style={{ ...fieldsetStyle, ...fullStyle }}>
              <legend style={legendStyle}>{t("reviewForm.rating")}</legend>
              <div style={styles.stars} onMouseLeave={() => setHover(0)}>
                {STARS.map((n) => (
                  <span key={n} style={{ position: "relative" }}>
                    <input
                      id={`review-star-${n}`}
                      className="rf-star-input"
                      type="radio"
                      name="rating"
                      value={n}
                      checked={form.rating === n}
                      onChange={() => set("rating", n)}
                      style={styles.starInput}
                    />
                    <label
                      htmlFor={`review-star-${n}`}
                      className="rf-star-label"
                      onMouseEnter={() => setHover(n)}
                      style={{ display: "inline-block", color: n <= shown ? "#f39c12" : "var(--input-border)" }}
                    >
                      <span aria-hidden="true">&#9733;</span>
                      <span style={styles.srOnly}>{n === 1 ? t("reviewForm.starOne") : t("reviewForm.starMany", { n })}</span>
                    </label>
                  </span>
                ))}
              </div>
            </fieldset>

            <div style={fullStyle}>
              <label htmlFor="review-package" style={labelStyle}>{t("reviewForm.package")}</label>
              <select id="review-package" name="packageId" className="pf-input" style={inputStyle}
                value={form.packageId} onChange={(e) => set("packageId", e.target.value)}>
                <option value="">{t("reviewForm.packageNone")}</option>
                {packages.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div style={fullStyle}>
              <label htmlFor="review-text" style={labelStyle}>{t("reviewForm.text")}</label>
              <textarea id="review-text" name="text" required rows={6} maxLength={maxLength}
                aria-describedby="review-text-count"
                className="pf-input" style={{ ...inputStyle, resize: "vertical" }}
                placeholder={t("reviewForm.textPlaceholder")}
                value={form.text} onChange={(e) => set("text", e.target.value)} />
              <p id="review-text-count" style={{ ...styles.count, color: textLength > 0 && textLength < minLength ? "var(--orange-text)" : "var(--text2)" }}>
                {textLength < minLength
                  ? t("reviewForm.charCountMin", { count: textLength, max: maxLength, min: minLength })
                  : t("reviewForm.charCount", { count: textLength, max: maxLength })}
              </p>
            </div>
          </div>

          <button type="submit" className="pf-submit" style={submitStyle(busy)} disabled={busy}>
            {busy ? t("common.sending") : t("reviewForm.submit")}
          </button>
          <div role="alert">{error && <div style={errorStyle}>{error}</div>}</div>
        </form>
      )}
    </div>
  );
}
