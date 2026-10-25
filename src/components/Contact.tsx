"use client";

import React, { useState, useEffect } from "react";

interface PackageOption {
  _id: string;
  name: string;
}

const contactCards = [
  { icon: "phone", label: "Phone", value: "+91 6388360881", href: "tel:+916388360881" },
  { icon: "mail", label: "Email", value: "info@atlastours.in", href: "mailto:info@atlastours.in" },
  { icon: "whatsapp", label: "WhatsApp", value: "+91 6388360881", href: "https://wa.me/916388360881" },
  { icon: "map", label: "Address", value: "Varanasi, Uttar Pradesh, India", href: "#" },
];

const Contact: React.FC = () => {
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    travelers: "",
    travelDate: "",
    message: "",
    package: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch("/api/packages")
      .then((r) => r.json())
      .then((data) => {
        const pkgs = Array.isArray(data) ? data : data.packages || [];
        setPackages(pkgs.map((p: PackageOption) => ({ _id: p._id, name: p.name })));
      })
      .catch(() => {});
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      setSubmitted(true);
      setFormData({ name: "", phone: "", email: "", travelers: "", travelDate: "", message: "", package: "" });
      setTimeout(() => setSubmitted(false), 5000);
    } catch {
      alert("Something went wrong. Please try again.");
    }
    setSubmitting(false);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "14px 18px",
    borderRadius: 12,
    border: "1px solid #e0e0e0",
    fontSize: 15,
    fontFamily: "'Poppins', sans-serif",
    background: "#f9f9f9",
    outline: "none",
    transition: "border-color 0.3s, box-shadow 0.3s",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
    color: "#1a3a6b",
    marginBottom: 6,
    display: "block",
  };

  const styles: Record<string, React.CSSProperties> = {
    section: {
      padding: "100px 24px",
      fontFamily: "'Poppins', sans-serif",
      background: "#fff",
    },
    header: {
      textAlign: "center",
      marginBottom: 50,
    },
    badge: {
      display: "inline-block",
      background: "rgba(230,126,34,0.1)",
      color: "#e67e22",
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
      color: "#1a3a6b",
      marginBottom: 12,
    },
    subheading: {
      fontSize: 16,
      color: "#777",
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
      background: "#fff",
      borderRadius: 20,
      padding: 36,
      boxShadow: "0 8px 40px rgba(0,0,0,0.07)",
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
      color: "#fff",
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
      color: "#27ae60",
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
      background: "#f8f9fa",
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
      color: "#888",
      fontWeight: 500,
      marginBottom: 4,
    },
    cardValue: {
      fontSize: 15,
      fontWeight: 600,
      color: "#1a3a6b",
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
    whatsapp: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z",
    map: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 13a3 3 0 100-6 3 3 0 000 6z",
  };

  return (
    <section id="contact" style={styles.section}>
      <style>{`
        .contact-input:focus { border-color: #e67e22 !important; box-shadow: 0 0 0 3px rgba(230,126,34,0.1) !important; }
        .contact-card-h:hover { border-color: rgba(230,126,34,0.3) !important; box-shadow: 0 4px 15px rgba(0,0,0,0.06) !important; }
        .submit-btn-h:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(230,126,34,0.45) !important; }
        @media (max-width: 868px) {
          .contact-container { grid-template-columns: 1fr !important; }
          .contact-form-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={styles.header}>
        <span style={styles.badge}>Contact</span>
        <h2 style={styles.heading}>Get In Touch</h2>
        <p style={styles.subheading}>
          Plan your dream trip with us. We would love to hear from you.
        </p>
      </div>

      <div className="contact-container" style={styles.container}>
        <form style={styles.form} onSubmit={handleSubmit}>
          <div className="contact-form-grid" style={styles.formGrid}>
            <div>
              <label style={labelStyle}>Full Name *</label>
              <input
                className="contact-input"
                style={inputStyle}
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Your name"
              />
            </div>
            <div>
              <label style={labelStyle}>Phone *</label>
              <input
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
              <label style={labelStyle}>Email</label>
              <input
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
              <label style={labelStyle}>No. of Travelers</label>
              <input
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
              <label style={labelStyle}>Travel Date</label>
              <input
                className="contact-input"
                style={inputStyle}
                name="travelDate"
                type="date"
                value={formData.travelDate}
                onChange={handleChange}
              />
            </div>
            <div>
              <label style={labelStyle}>Select Package</label>
              <select
                className="contact-input"
                style={inputStyle}
                name="package"
                value={formData.package}
                onChange={handleChange}
              >
                <option value="">Choose a package</option>
                {packages.map((p) => (
                  <option key={p._id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div style={styles.fullWidth}>
              <label style={labelStyle}>Message</label>
              <textarea
                className="contact-input"
                style={{ ...inputStyle, minHeight: 120, resize: "vertical" }}
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Tell us about your travel plans..."
              />
            </div>
            <div style={styles.fullWidth}>
              <button
                className="submit-btn-h"
                type="submit"
                style={styles.submitBtn}
                disabled={submitting}
              >
                {submitting ? "Sending..." : "Send Enquiry"}
              </button>
            </div>
          </div>
          {submitted && (
            <div style={styles.successMsg}>
              Thank you! Your enquiry has been sent successfully. We will get back to you soon.
            </div>
          )}
        </form>

        <div style={styles.infoSide}>
          {contactCards.map((card) => (
            <a
              key={card.label}
              href={card.href}
              className="contact-card-h"
              style={styles.contactCard}
              target={card.icon === "whatsapp" ? "_blank" : undefined}
              rel={card.icon === "whatsapp" ? "noopener noreferrer" : undefined}
            >
              <div style={styles.cardIcon}>
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill={card.icon === "whatsapp" ? "#fff" : "none"}
                  stroke={card.icon === "whatsapp" ? "none" : "#fff"}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={iconSvgs[card.icon]} />
                </svg>
              </div>
              <div>
                <div style={styles.cardLabel}>{card.label}</div>
                <div style={styles.cardValue}>{card.value}</div>
              </div>
            </a>
          ))}

          <div style={styles.mapWrap}>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d115014.18196498498!2d82.91005864999999!3d25.3176452!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x398e2db76febcf4d%3A0x68131710853ff0b5!2sVaranasi%2C%20Uttar%20Pradesh!5e0!3m2!1sen!2sin!4v1700000000000"
              width="100%"
              height="250"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Atlas Tours Location"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
