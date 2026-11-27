"use client";
import RevealWords from "@/components/RevealWords";

import React, { useState, useEffect, useRef } from "react";
import type { TourPackage } from "@/lib/types";
import { SITE_CONFIG, PHONE_DISPLAY, MD_NAME, TEAM_PHONES, formatTeamPhone } from "@/lib/config";
import { useT } from "@/lib/i18n/use-t";
import { errorStyle } from "@/components/public-form-ui";
import PartnerNote from "@/components/PartnerNote";

type PackageOption = Pick<TourPackage, "id" | "name">;

const EMPTY_FORM = {
  name: "",
  phone: "",
  email: "",
  travelers: "",
  travelDate: "",
  message: "",
  packageId: "",
  // Honeypot: real users never see or fill this; the backend drops submissions where it is non-empty.
  website: "",
};

/** Phone and WhatsApp share one number, so they are one person card with two actions; these are the rest. */
const infoCards = [
  { icon: "mail", label: "common.email", value: SITE_CONFIG.email, href: `mailto:${SITE_CONFIG.email}` },
  { icon: "map", label: "common.address", value: SITE_CONFIG.address, href: undefined },
] as const;

const WHATSAPP_PATH =
  "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z";

/** Package options come from the server-rendered page (F-02), already filtered for public visibility. */
/** `minDate`: earliest selectable travel date (today in IST, "YYYY-MM-DD"), computed on the server. */
const Contact: React.FC<{ initialPackages: PackageOption[]; minDate: string }> = ({ initialPackages, minDate }) => {
  const packages = initialPackages;
  const t = useT();
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  // Timer that hides the success message; cleared on unmount and when a new submit starts (D-04).
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSuccessTimer = () => {
    if (successTimerRef.current !== null) {
      clearTimeout(successTimerRef.current);
      successTimerRef.current = null;
    }
  };

  useEffect(() => clearSuccessTimer, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearSuccessTimer();
    setSubmitting(true);
    setSubmitError(false);
    setSubmitted(false);
    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          travelers: Number(formData.travelers) || 1,
        }),
      });
      if (!res.ok) throw new Error(`Enquiry failed: ${res.status}`);
      setSubmitted(true);
      setFormData(EMPTY_FORM);
      successTimerRef.current = setTimeout(() => {
        successTimerRef.current = null;
        setSubmitted(false);
      }, 5000);
    } catch {
      // Keep formData so the user doesn't lose what they typed.
      setSubmitError(true);
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "14px 18px",
    borderRadius: 12,
    border: "1px solid var(--input-border)",
    fontSize: 15,
    fontFamily: "'Poppins', sans-serif",
    background: "var(--bg2)",
    color: "var(--text)",
    outline: "none",
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
    section: {
      padding: "var(--section-pad) 24px",
      fontFamily: "'Poppins', sans-serif",
      background: "var(--bg)",
    },
    header: {
      textAlign: "center",
      marginBottom: 50,
    },
    badge: {
      display: "inline-block",
      background: "rgba(230,126,34,0.1)",
      color: "var(--orange-text)",
      padding: "6px 18px",
      borderRadius: 20,
      fontSize: 13,
      fontWeight: 600,
      letterSpacing: 2,
      textTransform: "uppercase",
      marginBottom: 12,
    },
    heading: {
      fontSize: "clamp(28px, 4vw, 40px)",
      fontWeight: 800,
      color: "var(--primary)",
      marginBottom: 12,
    },
    subheading: {
      fontSize: 16,
      color: "var(--text2)",
      maxWidth: 500,
      margin: "0 auto",
    },
    container: {
      maxWidth: 1200,
      margin: "0 auto",
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 50,
      alignItems: "start",
    },
    form: {
      background: "var(--card-bg)",
      borderRadius: 20,
      padding: 36,
      boxShadow: "var(--shadow)",
    },
    formGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 18,
    },
    fullWidth: {
      gridColumn: "1 / -1",
    },
    submitBtn: {
      width: "100%",
      padding: "14px 0",
      background: "linear-gradient(135deg, #e67e22, #f39c12)",
      color: "var(--on-accent)",
      border: "none",
      borderRadius: 12,
      fontSize: 16,
      fontWeight: 700,
      cursor: "pointer",
      fontFamily: "'Poppins', sans-serif",
      boxShadow: "0 6px 20px rgba(230,126,34,0.35)",
      transition: "all 0.3s",
      marginTop: 8,
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
    infoSide: {
      display: "flex",
      flexDirection: "column",
      gap: 20,
    },
    contactCard: {
      display: "flex",
      alignItems: "center",
      gap: 18,
      padding: "20px 24px",
      background: "var(--bg2)",
      borderRadius: 14,
      textDecoration: "none",
      transition: "all 0.3s",
      border: "1px solid transparent",
    },
    cardIcon: {
      width: 50,
      height: 50,
      borderRadius: 12,
      background: "linear-gradient(135deg, #e67e22, #f39c12)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    cardLabel: {
      fontSize: 13,
      color: "var(--contact-muted, #6e6e6e)",
      fontWeight: 500,
      marginBottom: 4,
    },
    cardValue: {
      fontSize: 15,
      fontWeight: 600,
      color: "var(--text)",
    },
    person: {
      padding: "26px 26px 24px",
      background: "var(--card-bg)",
      borderRadius: 18,
      boxShadow: "var(--shadow)",
      borderTop: "4px solid #e67e22",
    },
    personTop: {
      display: "flex",
      alignItems: "center",
      gap: 16,
    },
    avatar: {
      width: 58,
      height: 58,
      borderRadius: "50%",
      background: "linear-gradient(135deg, #e67e22, #f39c12)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      boxShadow: "0 6px 16px rgba(230,126,34,0.3)",
    },
    personEyebrow: {
      fontSize: 12,
      fontWeight: 600,
      color: "var(--orange-text)",
      letterSpacing: 1.2,
      textTransform: "uppercase",
      margin: 0,
    },
    personName: {
      fontSize: 20,
      fontWeight: 700,
      color: "var(--primary)",
      margin: "2px 0 0",
      lineHeight: 1.3,
    },
    personRole: {
      fontSize: 14,
      color: "var(--contact-muted, #6e6e6e)",
      margin: "2px 0 0",
    },
    personPhone: {
      display: "block",
      fontSize: 24,
      fontWeight: 700,
      color: "var(--text)",
      letterSpacing: 0.5,
      textDecoration: "none",
      margin: "18px 0 16px",
    },
    actions: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 12,
    },
    actionBtn: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      padding: "12px 16px",
      borderRadius: 12,
      fontSize: 15,
      fontWeight: 600,
      textDecoration: "none",
      fontFamily: "'Poppins', sans-serif",
      transition: "transform 0.2s, box-shadow 0.2s",
    },
    infoGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 16,
    },
    mapWrap: {
      borderRadius: 14,
      overflow: "hidden",
      marginTop: 8,
      boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
    },
  };

  const iconSvgs: Record<string, string> = {
    phone: "M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z",
    mail: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6",
    map: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 13a3 3 0 100-6 3 3 0 000 6z",
    user: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z",
  };

  return (
    <section id="contact" style={styles.section}>
      <style>{`
        .contact-input:focus { border-color: #e67e22 !important; box-shadow: 0 0 0 3px rgba(230,126,34,0.1) !important; }
        .contact-card-h:hover { border-color: rgba(230,126,34,0.3) !important; box-shadow: 0 4px 15px rgba(0,0,0,0.06) !important; }
        .contact-action:hover { transform: translateY(-2px); }
        .contact-call { background: linear-gradient(135deg, #e67e22, #f39c12); color: var(--on-accent); box-shadow: 0 6px 18px rgba(230,126,34,0.3); }
        .contact-call:hover { box-shadow: 0 8px 24px rgba(230,126,34,0.42); }
        .contact-wa { background: transparent; color: var(--text); border: 2px solid #25d366; }
        .contact-wa:hover { background: rgba(37,211,102,0.1); }
        .contact-wa svg { color: #25d366; }
        @media (max-width: 480px) {
          .contact-info-grid { grid-template-columns: 1fr !important; }
        }
        /* Two columns side by side leave the info cards ~220px wide here: the email broke mid-word
           and the address wrapped one word per line. */
        @media (min-width: 869px) and (max-width: 1100px) {
          .contact-info-grid { grid-template-columns: 1fr !important; }
        }
        /* E-02: dark-mode override. Light mode uses the inline fallback (colour unchanged). */
        [data-theme="dark"] #contact { --contact-muted: var(--text2); }
        .submit-btn-h:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(230,126,34,0.45) !important; }
        @media (max-width: 868px) {
          .contact-container { grid-template-columns: 1fr !important; }
        }
        /* The form is full width once stacked, so pairs of fields still fit down to ~560px. */
        @media (max-width: 560px) {
          .contact-form-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div className="reveal" style={styles.header}>
        <span style={styles.badge}>{t("contact.badge")}</span>
        <h2 className="heading-line" style={styles.heading}><RevealWords text={t("contact.heading")} /></h2>
        <p style={styles.subheading}>
          {t("contact.subheading")}
        </p>
      </div>

      <div className="contact-container" style={styles.container}>
        <form className="reveal-left" style={styles.form} onSubmit={handleSubmit}>
          <div
            aria-hidden="true"
            style={{ position: "absolute", left: -9999, top: "auto", width: 1, height: 1, overflow: "hidden" }}
          >
            <label htmlFor="contact-website">{t("common.honeypotLabel")}</label>
            <input
              id="contact-website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={formData.website}
              onChange={handleChange}
            />
          </div>
          <div className="contact-form-grid" style={styles.formGrid}>
            <div>
              <label htmlFor="contact-name" style={labelStyle}>{t("common.fullNameRequired")}</label>
              <input
                id="contact-name"
                className="contact-input"
                style={inputStyle}
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder={t("contact.namePlaceholder")}
              />
            </div>
            <div>
              <label htmlFor="contact-phone" style={labelStyle}>{t("common.phoneRequired")}</label>
              <input
                id="contact-phone"
                className="contact-input"
                style={inputStyle}
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder="+91 XXXXX XXXXX"
              />
            </div>
            <div>
              <label htmlFor="contact-email" style={labelStyle}>{t("common.email")}</label>
              <input
                id="contact-email"
                className="contact-input"
                style={inputStyle}
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label htmlFor="contact-travelers" style={labelStyle}>{t("contact.travelers")}</label>
              <input
                id="contact-travelers"
                className="contact-input"
                style={inputStyle}
                name="travelers"
                type="number"
                min="1"
                value={formData.travelers}
                onChange={handleChange}
                placeholder="1"
              />
            </div>
            <div>
              <label htmlFor="contact-travel-date" style={labelStyle}>{t("common.travelDate")}</label>
              <input
                id="contact-travel-date"
                className="contact-input"
                style={inputStyle}
                name="travelDate"
                type="date"
                min={minDate}
                value={formData.travelDate}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="contact-package" style={labelStyle}>{t("contact.package")}</label>
              <select
                id="contact-package"
                className="contact-input"
                style={inputStyle}
                name="packageId"
                value={formData.packageId}
                onChange={handleChange}
              >
                <option value="">{t("contact.choosePackage")}</option>
                {packages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div style={styles.fullWidth}>
              <label htmlFor="contact-message" style={labelStyle}>{t("contact.message")}</label>
              <textarea
                id="contact-message"
                className="contact-input"
                style={{ ...inputStyle, minHeight: 120, resize: "vertical" }}
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder={t("contact.messagePlaceholder")}
              />
            </div>
            <div style={styles.fullWidth}>
              <button
                className="submit-btn-h"
                type="submit"
                style={styles.submitBtn}
                disabled={submitting}
              >
                {submitting ? t("common.sending") : t("contact.submit")}
              </button>
            </div>
          </div>
          {submitted && (
            <div role="status" style={styles.successMsg}>
              {t("contact.success")}
            </div>
          )}
          {/* Q-3: errors use the shared red error box (as on /track, /plan-trip and the booking form). */}
          {submitError && (
            <div role="alert" style={errorStyle}>
              {t("contact.error", { phone: PHONE_DISPLAY })}
            </div>
          )}
          {/* N-6: entry points to /plan-trip. */}
          <p style={{ textAlign: "center", marginTop: 16, fontSize: 14, color: "var(--text2)" }}>
            <a href="/plan-trip" style={{ color: "var(--orange-text)", fontWeight: 600 }}>{t("contact.planTripLink")}</a>
            <span aria-hidden="true"> &middot; </span>
            <a href="/plan-trip?mode=callback" style={{ color: "var(--orange-text)", fontWeight: 600 }}>{t("contact.callbackLink")}</a>
          </p>
        </form>

        <div className="reveal-right" style={styles.infoSide}>
          {/* One person, one number: name + role, the number once, then Call / WhatsApp. */}
          <div style={styles.person}>
            <div style={styles.personTop}>
              <div style={styles.avatar} aria-hidden="true">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={iconSvgs.user} />
                </svg>
              </div>
              <div>
                <p style={styles.personEyebrow}>{t("contact.personEyebrow")}</p>
                <h3 style={styles.personName}>{MD_NAME}</h3>
                <p style={styles.personRole}>{t("contact.mdLabel")}</p>
              </div>
            </div>
            <a href={`tel:${SITE_CONFIG.phone}`} style={styles.personPhone}>{PHONE_DISPLAY}</a>
            <div style={styles.actions}>
              <a
                href={`tel:${SITE_CONFIG.phone}`}
                className="contact-action contact-call"
                style={styles.actionBtn}
                aria-label={t("contact.callAria", { name: MD_NAME, phone: PHONE_DISPLAY })}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d={iconSvgs.phone} />
                </svg>
                {t("contact.call")}
              </a>
              <a
                href={`https://wa.me/${SITE_CONFIG.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="contact-action contact-wa"
                style={styles.actionBtn}
                aria-label={t("contact.whatsappAria", { name: MD_NAME })}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d={WHATSAPP_PATH} />
                </svg>
                {t("common.whatsapp")}
              </a>
            </div>
          </div>

          {/* Founder contact card */}
          <a href={`tel:${TEAM_PHONES.founder}`} className="contact-card-h" style={{ ...styles.contactCard, padding: "16px 18px", gap: 14, textDecoration: "none" }}>
            <div style={{ ...styles.cardIcon, width: 42, height: 42 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d={iconSvgs.phone} />
              </svg>
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={styles.cardLabel}>{t("contact.founderPhone")}</div>
              <div style={{ ...styles.cardValue, overflowWrap: "anywhere" }}>{formatTeamPhone(TEAM_PHONES.founder)}</div>
            </div>
          </a>

          <div className="contact-info-grid" style={styles.infoGrid}>
            {infoCards.map((card) => {
              const body = (
                <>
                  <div style={{ ...styles.cardIcon, width: 42, height: 42 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d={iconSvgs[card.icon]} />
                    </svg>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={styles.cardLabel}>{t(card.label)}</div>
                    <div style={{ ...styles.cardValue, overflowWrap: "anywhere" }}>{card.value}</div>
                  </div>
                </>
              );
              const cardStyle = { ...styles.contactCard, padding: "16px 18px", gap: 14 };
              return card.href ? (
                <a key={card.label} href={card.href} className="contact-card-h" style={cardStyle}>{body}</a>
              ) : (
                <div key={card.label} style={cardStyle}>{body}</div>
              );
            })}
          </div>

          <PartnerNote label={t("partner.contact")} newTabLabel={t("partner.newTab")} style={{ margin: "4px 0 16px" }} />

          <div style={styles.mapWrap}>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d115014.18196498498!2d82.91005864999999!3d25.3176452!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x398e2db76febcf4d%3A0x68131710853ff0b5!2sVaranasi%2C%20Uttar%20Pradesh!5e0!3m2!1sen!2sin!4v1700000000000"
              width="100%"
              height="250"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={t("contact.mapTitle")}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
