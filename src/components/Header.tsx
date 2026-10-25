"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useApp } from "@/lib/context";

const Header: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, setTheme, lang, setLang } = useApp();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { label: lang === "en" ? "Home" : "\u0939\u094B\u092E", href: "#home" },
    { label: lang === "en" ? "About" : "\u0939\u092E\u093E\u0930\u0947 \u092C\u093E\u0930\u0947 \u092E\u0947\u0902", href: "#about" },
    { label: lang === "en" ? "Packages" : "\u092A\u0948\u0915\u0947\u091C", href: "#packages" },
    { label: lang === "en" ? "Gallery" : "\u0917\u0948\u0932\u0930\u0940", href: "#gallery" },
    { label: lang === "en" ? "Blog" : "\u092C\u094D\u0932\u0949\u0917", href: "#blog" },
    { label: lang === "en" ? "FAQ" : "\u0938\u0935\u093E\u0932", href: "#faq" },
    { label: lang === "en" ? "Contact" : "\u0938\u0902\u092A\u0930\u094D\u0915", href: "#contact" },
  ];

  const styles: Record<string, React.CSSProperties> = {
    header: {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      zIndex: 1000,
      transition: "all 0.4s ease",
      backgroundColor: scrolled ? "rgba(26, 58, 107, 0.97)" : "transparent",
      backdropFilter: scrolled ? "blur(12px)" : "none",
      boxShadow: scrolled ? "0 4px 30px rgba(0,0,0,0.15)" : "none",
      fontFamily: "'Poppins', sans-serif",
    },
    container: {
      maxWidth: 1280,
      margin: "0 auto",
      padding: "0 24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      height: scrolled ? 64 : 80,
      transition: "height 0.3s ease",
    },
    logoWrap: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      textDecoration: "none",
      cursor: "pointer",
    },
    logoImg: {
      borderRadius: "50%",
      border: "2px solid #f39c12",
    },
    logoText: {
      fontSize: 22,
      fontWeight: 700,
      color: "#fff",
      letterSpacing: 1,
    },
    logoAccent: {
      color: "#f39c12",
    },
    nav: {
      display: "flex",
      alignItems: "center",
      gap: 28,
      listStyle: "none",
      margin: 0,
      padding: 0,
    },
    navLink: {
      color: "#fff",
      textDecoration: "none",
      fontSize: 15,
      fontWeight: 500,
      transition: "color 0.3s",
      cursor: "pointer",
      position: "relative" as const,
      paddingBottom: 4,
    },
    actions: {
      display: "flex",
      alignItems: "center",
      gap: 12,
    },
    toggleBtn: {
      background: "rgba(255,255,255,0.15)",
      border: "1px solid rgba(255,255,255,0.25)",
      borderRadius: 20,
      padding: "6px 14px",
      color: "#fff",
      fontSize: 13,
      fontWeight: 600,
      cursor: "pointer",
      transition: "all 0.3s",
      fontFamily: "'Poppins', sans-serif",
    },
    callBtn: {
      background: "linear-gradient(135deg, #e67e22, #f39c12)",
      border: "none",
      borderRadius: 24,
      padding: "8px 20px",
      color: "#fff",
      fontSize: 14,
      fontWeight: 600,
      cursor: "pointer",
      textDecoration: "none",
      display: "flex",
      alignItems: "center",
      gap: 6,
      fontFamily: "'Poppins', sans-serif",
      boxShadow: "0 4px 15px rgba(230,126,34,0.4)",
    },
    hamburger: {
      display: "none",
      flexDirection: "column" as const,
      gap: 5,
      cursor: "pointer",
      background: "none",
      border: "none",
      padding: 8,
      zIndex: 1100,
    },
    hamburgerLine: {
      width: 26,
      height: 3,
      backgroundColor: "#fff",
      borderRadius: 2,
      transition: "all 0.3s",
    },
    mobileMenu: {
      position: "fixed" as const,
      top: 0,
      right: 0,
      width: "min(320px, 85vw)",
      height: "100vh",
      background: "linear-gradient(180deg, #1a3a6b 0%, #0f2548 100%)",
      padding: "100px 32px 32px",
      display: "flex",
      flexDirection: "column" as const,
      gap: 8,
      transform: menuOpen ? "translateX(0)" : "translateX(100%)",
      transition: "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
      zIndex: 1050,
      boxShadow: menuOpen ? "-8px 0 30px rgba(0,0,0,0.3)" : "none",
    },
    mobileLink: {
      color: "#fff",
      textDecoration: "none",
      fontSize: 18,
      fontWeight: 500,
      padding: "14px 16px",
      borderRadius: 10,
      transition: "background 0.3s",
      cursor: "pointer",
    },
    overlay: {
      position: "fixed" as const,
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(0,0,0,0.5)",
      zIndex: 1040,
      opacity: menuOpen ? 1 : 0,
      pointerEvents: menuOpen ? "auto" as const : "none" as const,
      transition: "opacity 0.3s",
    },
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&display=swap');
        .nav-link-header:hover { color: #f39c12 !important; }
        .nav-link-header::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 2px;
          background: #f39c12;
          transition: width 0.3s;
        }
        .nav-link-header:hover::after { width: 100%; }
        .mobile-link-h:hover { background: rgba(243,156,18,0.15) !important; }
        .toggle-btn-h:hover { background: rgba(255,255,255,0.3) !important; }
        @media (max-width: 968px) {
          .desktop-nav { display: none !important; }
          .desktop-actions { display: none !important; }
          .hamburger-btn { display: flex !important; }
        }
      `}</style>

      <header style={styles.header}>
        <div style={styles.container}>
          <a href="#home" style={styles.logoWrap}>
            <Image
              src="/images/atlas-logo.jpeg"
              alt="Atlas Tours"
              width={44}
              height={44}
              style={styles.logoImg}
            />
            <span style={styles.logoText}>
              Atlas<span style={styles.logoAccent}>Tours</span>
            </span>
          </a>

          <nav className="desktop-nav" style={{ display: "flex" }}>
            <ul style={styles.nav}>
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="nav-link-header"
                    style={styles.navLink}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="desktop-actions" style={styles.actions}>
            <button
              className="toggle-btn-h"
              style={styles.toggleBtn}
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle dark mode"
            >
              {theme === "dark" ? "\u2600\uFE0F Light" : "\uD83C\uDF19 Dark"}
            </button>
            <button
              className="toggle-btn-h"
              style={styles.toggleBtn}
              onClick={() => setLang(lang === "en" ? "hi" : "en")}
            >
              {lang === "en" ? "\u0939\u093F\u0902\u0926\u0940" : "EN"}
            </button>
            <a href="tel:+916388360881" style={styles.callBtn}>
              {lang === "en" ? "Call Now" : "\u0915\u0949\u0932 \u0915\u0930\u0947\u0902"}
            </a>
          </div>

          <button
            className="hamburger-btn"
            style={styles.hamburger}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            <span
              style={{
                ...styles.hamburgerLine,
                transform: menuOpen ? "rotate(45deg) translate(5px, 6px)" : "none",
              }}
            />
            <span
              style={{
                ...styles.hamburgerLine,
                opacity: menuOpen ? 0 : 1,
              }}
            />
            <span
              style={{
                ...styles.hamburgerLine,
                transform: menuOpen ? "rotate(-45deg) translate(5px, -6px)" : "none",
              }}
            />
          </button>
        </div>
      </header>

      {/* Mobile overlay */}
      <div style={styles.overlay} onClick={() => setMenuOpen(false)} />

      {/* Mobile menu */}
      <div style={styles.mobileMenu}>
        {navLinks.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="mobile-link-h"
            style={styles.mobileLink}
            onClick={() => setMenuOpen(false)}
          >
            {link.label}
          </a>
        ))}
        <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
          <button
            className="toggle-btn-h"
            style={styles.toggleBtn}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? "\u2600\uFE0F Light" : "\uD83C\uDF19 Dark"}
          </button>
          <button
            className="toggle-btn-h"
            style={styles.toggleBtn}
            onClick={() => setLang(lang === "en" ? "hi" : "en")}
          >
            {lang === "en" ? "\u0939\u093F\u0902\u0926\u0940" : "EN"}
          </button>
        </div>
        <a href="tel:+916388360881" style={{ ...styles.callBtn, marginTop: 12, justifyContent: "center" }}>
          {lang === "en" ? "Call Now" : "\u0915\u0949\u0932 \u0915\u0930\u0947\u0902"}
        </a>
      </div>
    </>
  );
};

export default Header;
