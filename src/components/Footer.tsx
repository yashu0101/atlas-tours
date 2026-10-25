"use client";

import React from "react";
import Image from "next/image";

const quickLinks = [
  { label: "Home", href: "#home" },
  { label: "About Us", href: "#about" },
  { label: "Packages", href: "#packages" },
  { label: "Gallery", href: "#gallery" },
  { label: "Blog", href: "#blog" },
  { label: "FAQ", href: "#faq" },
  { label: "Contact", href: "#contact" },
];

const socialLinks = [
  { name: "Facebook", href: "https://facebook.com/atlastours", icon: "M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" },
  { name: "Instagram", href: "https://instagram.com/atlastours", icon: "M16 4H8a4 4 0 00-4 4v8a4 4 0 004 4h8a4 4 0 004-4V8a4 4 0 00-4-4zM12 15a3 3 0 110-6 3 3 0 010 6zM17.5 7.5a.5.5 0 110-1 .5.5 0 010 1z" },
  { name: "YouTube", href: "https://youtube.com/atlastours", icon: "M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.43zM9.75 15.02V8.48l5.75 3.27-5.75 3.27z" },
  { name: "Twitter", href: "https://twitter.com/atlastours", icon: "M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" },
];

const Footer: React.FC = () => {
  const year = new Date().getFullYear();

  const styles: Record<string, React.CSSProperties> = {
    footer: {
      background: "linear-gradient(180deg, #0f2548 0%, #091a36 100%)",
      color: "#fff",
      fontFamily: "'Poppins', sans-serif",
      padding: "80px 24px 0",
    },
    container: {
      maxWidth: 1200,
      margin: "0 auto",
      display: "grid",
      gridTemplateColumns: "2fr 1fr 1fr 1.5fr",
      gap: 40,
    },
    logo: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      marginBottom: 18,
    },
    logoText: {
      fontSize: 24,
      fontWeight: 800,
    },
    logoAccent: {
      color: "#f39c12",
    },
    desc: {
      fontSize: 14,
      lineHeight: 1.8,
      color: "rgba(255,255,255,0.6)",
      marginBottom: 18,
    },
    partner: {
      fontSize: 13,
      color: "#f39c12",
      fontWeight: 600,
      padding: "10px 16px",
      background: "rgba(243,156,18,0.1)",
      borderRadius: 10,
      border: "1px solid rgba(243,156,18,0.2)",
      display: "inline-block",
    },
    colTitle: {
      fontSize: 17,
      fontWeight: 700,
      marginBottom: 20,
      color: "#fff",
      position: "relative" as const,
      paddingBottom: 12,
    },
    colTitleBar: {
      position: "absolute" as const,
      bottom: 0,
      left: 0,
      width: 40,
      height: 3,
      background: "linear-gradient(90deg, #e67e22, #f39c12)",
      borderRadius: 2,
    },
    linkList: {
      listStyle: "none",
      padding: 0,
      margin: 0,
      display: "flex",
      flexDirection: "column" as const,
      gap: 10,
    },
    link: {
      color: "rgba(255,255,255,0.6)",
      textDecoration: "none",
      fontSize: 14,
      transition: "color 0.3s, padding-left 0.3s",
      cursor: "pointer",
      display: "block",
    },
    contactItem: {
      display: "flex",
      gap: 12,
      alignItems: "flex-start",
      marginBottom: 16,
    },
    contactIcon: {
      width: 36,
      height: 36,
      borderRadius: 8,
      background: "rgba(243,156,18,0.15)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    contactText: {
      fontSize: 14,
      color: "rgba(255,255,255,0.6)",
      lineHeight: 1.5,
    },
    contactLabel: {
      fontSize: 12,
      color: "rgba(255,255,255,0.4)",
      marginBottom: 2,
    },
    socials: {
      display: "flex",
      gap: 12,
      marginTop: 20,
    },
    socialLink: {
      width: 40,
      height: 40,
      borderRadius: 10,
      background: "rgba(255,255,255,0.08)",
      border: "1px solid rgba(255,255,255,0.1)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "all 0.3s",
      cursor: "pointer",
      textDecoration: "none",
    },
    bottom: {
      borderTop: "1px solid rgba(255,255,255,0.08)",
      marginTop: 60,
      padding: "24px 0",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 12,
      maxWidth: 1200,
      margin: "60px auto 0",
    },
    copyright: {
      fontSize: 13,
      color: "rgba(255,255,255,0.4)",
    },
  };

  return (
    <footer style={styles.footer}>
      <style>{`
        .footer-link:hover { color: #f39c12 !important; padding-left: 6px !important; }
        .footer-social:hover { background: linear-gradient(135deg, #e67e22, #f39c12) !important; border-color: transparent !important; }
        @media (max-width: 868px) {
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 560px) {
          .footer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div className="footer-grid" style={styles.container}>
        {/* Column 1: About */}
        <div>
          <div style={styles.logo}>
            <Image
              src="/images/atlas-logo.jpeg"
              alt="Atlas Tours"
              width={40}
              height={40}
              style={{ borderRadius: "50%", border: "2px solid #f39c12" }}
            />
            <span style={styles.logoText}>
              Atlas<span style={styles.logoAccent}>Tours</span>
            </span>
          </div>
          <p style={styles.desc}>
            Your trusted partner for spiritual and cultural tours across India.
            We create memorable journeys with expert guidance and premium service.
          </p>
          <div style={styles.partner}>
            In Partnership with Hotel Ganga Imperial
          </div>
        </div>

        {/* Column 2: Quick Links */}
        <div>
          <h3 style={styles.colTitle}>
            Quick Links
            <span style={styles.colTitleBar} />
          </h3>
          <ul style={styles.linkList}>
            {quickLinks.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="footer-link" style={styles.link}>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 3: Services */}
        <div>
          <h3 style={styles.colTitle}>
            Services
            <span style={styles.colTitleBar} />
          </h3>
          <ul style={styles.linkList}>
            {["Spiritual Tours", "Cultural Trips", "Adventure Tours", "Group Packages", "Custom Itineraries", "Hotel Booking"].map((s) => (
              <li key={s}>
                <a href="#packages" className="footer-link" style={styles.link}>
                  {s}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 4: Contact Info */}
        <div>
          <h3 style={styles.colTitle}>
            Contact Info
            <span style={styles.colTitleBar} />
          </h3>
          <div style={styles.contactItem}>
            <div style={styles.contactIcon}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f39c12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
              </svg>
            </div>
            <div>
              <div style={styles.contactLabel}>Phone</div>
              <div style={styles.contactText}>+91 6388360881</div>
            </div>
          </div>
          <div style={styles.contactItem}>
            <div style={styles.contactIcon}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f39c12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <path d="M22 6l-10 7L2 6" />
              </svg>
            </div>
            <div>
              <div style={styles.contactLabel}>Email</div>
              <div style={styles.contactText}>info@atlastours.in</div>
            </div>
          </div>
          <div style={styles.contactItem}>
            <div style={styles.contactIcon}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f39c12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <div>
              <div style={styles.contactLabel}>Address</div>
              <div style={styles.contactText}>Varanasi, Uttar Pradesh, India</div>
            </div>
          </div>

          <div style={styles.socials}>
            {socialLinks.map((s) => (
              <a
                key={s.name}
                href={s.href}
                className="footer-social"
                style={styles.socialLink}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.name}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={s.icon} />
                </svg>
              </a>
            ))}
          </div>
        </div>
      </div>

      <div style={styles.bottom}>
        <p style={styles.copyright}>
          &copy; {year} Atlas Tours. All rights reserved.
        </p>
        <p style={{ ...styles.copyright, color: "rgba(255,255,255,0.3)" }}>
          Crafted with care for unforgettable journeys.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
