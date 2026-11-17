import React from "react";

/**
 * Shared look of the public form pages (N-4 track, N-5 review, N-6 trip request). Same input,
 * label, button and message styles as BookingForm / the Contact form. Focus styling lives in
 * classes (see <PublicFormCss/>), never in an inline `outline`, so the global :focus-visible
 * outline keeps working.
 */
export const inputStyle: React.CSSProperties = {
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

export const labelStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: "var(--text)",
  marginBottom: 6,
  display: "block",
};

export const hintStyle: React.CSSProperties = { fontSize: 12, color: "var(--text2)", marginTop: 6, lineHeight: 1.5 };

export const gridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 };
export const fullStyle: React.CSSProperties = { gridColumn: "1 / -1" };

export const fieldsetStyle: React.CSSProperties = { border: "none", padding: 0, margin: 0, minWidth: 0 };
export const legendStyle: React.CSSProperties = { ...labelStyle, padding: 0 };

export const submitStyle = (busy: boolean): React.CSSProperties => ({
  width: "100%",
  padding: "14px 0",
  background: "linear-gradient(135deg, #e67e22, #f39c12)",
  color: "var(--on-accent)",
  border: "none",
  borderRadius: 12,
  fontSize: 16,
  fontWeight: 700,
  cursor: busy ? "wait" : "pointer",
  opacity: busy ? 0.75 : 1,
  fontFamily: "'Poppins', sans-serif",
  boxShadow: "0 6px 20px rgba(230,126,34,0.35)",
  transition: "all 0.3s",
  marginTop: 22,
});

export const successStyle: React.CSSProperties = {
  textAlign: "center",
  padding: "12px 20px",
  background: "rgba(39,174,96,0.1)",
  color: "var(--success-text)",
  borderRadius: 10,
  fontSize: 14,
  fontWeight: 600,
  marginTop: 14,
  lineHeight: 1.6,
};

export const errorStyle: React.CSSProperties = {
  textAlign: "center",
  padding: "12px 20px",
  background: "rgba(192,57,43,0.08)",
  color: "var(--error-text)",
  border: "1px solid rgba(192,57,43,0.3)",
  borderRadius: 10,
  fontSize: 14,
  fontWeight: 600,
  marginTop: 14,
};

export const textLinkStyle: React.CSSProperties = {
  color: "var(--orange-text)",
  fontWeight: 600,
  textDecoration: "underline",
  textUnderlineOffset: 3,
};

/** Focus/hover rules for the classes above (inline styles can't express :focus or :hover). */
export function PublicFormCss() {
  return (
    <style>{`
      .pf-input { outline: none; }
      .pf-input:focus { border-color: #e67e22 !important; box-shadow: 0 0 0 3px rgba(230,126,34,0.1) !important; }
      .pf-submit:not(:disabled):hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(230,126,34,0.45) !important; }
      .pf-choice { accent-color: #e67e22; }
      @media (max-width: 560px) {
        .pf-grid { grid-template-columns: 1fr !important; }
      }
    `}</style>
  );
}

/** Off-screen honeypot (see src/lib/public-form.ts): skipped by keyboard and AT; humans leave it empty. */
export function Honeypot({ id, label, value, onChange }: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div aria-hidden="true" style={{ position: "absolute", left: -9999, top: "auto", width: 1, height: 1, overflow: "hidden" }}>
      <label htmlFor={id}>{label}</label>
      <input id={id} name="website" type="text" tabIndex={-1} autoComplete="off" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

/** The `error` string of an `{ error }` API response body, or "". */
export function serverError(body: unknown): string {
  return body && typeof body === "object" && typeof (body as { error?: unknown }).error === "string"
    ? (body as { error: string }).error
    : "";
}
