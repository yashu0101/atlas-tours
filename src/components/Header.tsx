"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useApp } from "@/lib/context";
import { useT } from "@/lib/i18n/use-t";
import { SITE_CONFIG } from "@/lib/config";

const SECTION_IDS = ["home", "about", "packages", "gallery", "blog", "faq", "contact"] as const;

const SunIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </svg>
);

const MoonIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
  </svg>
);

const PhoneIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0122 16.92z" />
  </svg>
);

const Header: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState("#home");
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const { theme, setTheme } = useApp();
  const t = useT();
  // Section links are bare hashes on the home page; on sub-routes (e.g. /packages/[id]) they point back to "/".
  const onHome = usePathname() === "/";
  const sectionHref = (hash: string) => (onHome ? hash : `/${hash}`);
  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  // E-06: Escape closes the open mobile menu and returns focus to the hamburger.
  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        hamburgerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  useEffect(() => {
    let last: boolean | null = null;
    const onScroll = () => {
      const next = window.scrollY > 60;
      if (next !== last) {
        last = next;
        setScrolled(next);
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Highlights the link of the section in the middle of the viewport (home page only).
  // IntersectionObserver instead of a scroll listener, so there is no setState per scroll event.
  useEffect(() => {
    if (!onHome) return;
    // Every section is observed, so one that is not in the nav (stats, reviews, team, offers)
    // clears the highlight instead of leaving the previous link lit.
    const els = Array.from(document.querySelectorAll<HTMLElement>("#main-content section"));
    if (els.length === 0) return;
    const navIds: readonly string[] = SECTION_IDS;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(navIds.includes(e.target.id) ? `#${e.target.id}` : "");
        }
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [onHome]);

  const navLinks = [
    { hash: "#home", label: t("header.nav.home") },
    { hash: "#about", label: t("header.nav.about") },
    { hash: "#packages", label: t("header.nav.packages") },
    { hash: "#gallery", label: t("header.nav.gallery") },
    { hash: "#blog", label: t("header.nav.blog") },
    { hash: "#faq", label: t("header.nav.faq") },
    { hash: "#contact", label: t("header.nav.contact") },
  ];
  const isActive = (hash: string) => onHome && active === hash;

  const styles: Record<string, React.CSSProperties> = {
    header: {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      zIndex: 1000,
      transition: "background-color 0.4s ease, box-shadow 0.4s ease, border-color 0.4s ease",
      backgroundColor: scrolled ? "rgba(15, 37, 72, 0.92)" : "transparent",
      backdropFilter: scrolled ? "blur(14px) saturate(140%)" : "none",
      WebkitBackdropFilter: scrolled ? "blur(14px) saturate(140%)" : "none",
      boxShadow: scrolled ? "0 8px 32px rgba(0,0,0,0.18)" : "none",
      borderBottom: `1px solid ${scrolled ? "rgba(243,156,18,0.35)" : "transparent"}`,
      fontFamily: "'Poppins', sans-serif",
    },
    container: {
      width: "100%",
      margin: 0,
      padding: "0 clamp(16px, 3vw, 48px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 24,
      height: scrolled ? 68 : 84,
      transition: "height 0.3s ease",
    },
    logoWrap: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      textDecoration: "none",
      flexShrink: 0,
    },
    logoImg: {
      borderRadius: "50%",
      border: "2px solid #f39c12",
      boxShadow: "0 0 0 4px rgba(243,156,18,0.15)",
    },
    logoText: {
      fontSize: 22,
      fontWeight: 700,
      color: "#fff",
      letterSpacing: 0.5,
    },
    logoAccent: {
      color: "#f39c12",
    },
    nav: {
      display: "flex",
      alignItems: "center",
      gap: 2,
      listStyle: "none",
      margin: 0,
      padding: 5,
      background: "rgba(255,255,255,0.07)",
      border: "1px solid rgba(255,255,255,0.12)",
      borderRadius: 999,
    },
    actions: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      flexShrink: 0,
    },
    iconBtn: {
      width: 40,
      height: 40,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(255,255,255,0.08)",
      border: "1px solid rgba(255,255,255,0.18)",
      borderRadius: "50%",
      color: "#fff",
      cursor: "pointer",
      transition: "background 0.3s, transform 0.3s",
    },
    callBtn: {
      background: "linear-gradient(135deg, #e67e22, #f39c12)",
      border: "none",
      borderRadius: 999,
      padding: "10px 20px",
      color: "var(--on-accent)",
      fontSize: 14,
      fontWeight: 600,
      cursor: "pointer",
      textDecoration: "none",
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      fontFamily: "'Poppins', sans-serif",
      boxShadow: "0 6px 18px rgba(230,126,34,0.35)",
      transition: "transform 0.3s, box-shadow 0.3s",
      whiteSpace: "nowrap",
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
      padding: "100px 24px 32px",
      display: "flex",
      flexDirection: "column" as const,
      gap: 4,
      overflowY: "auto" as const,
      transform: menuOpen ? "translateX(0)" : "translateX(100%)",
      transition: "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
      zIndex: 1050,
      boxShadow: menuOpen ? "-8px 0 30px rgba(0,0,0,0.3)" : "none",
    },
    mobileThemeBtn: {
      marginTop: 16,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      background: "rgba(255,255,255,0.08)",
      border: "1px solid rgba(255,255,255,0.18)",
      borderRadius: 999,
      padding: "10px 16px",
      color: "#fff",
      fontSize: 14,
      fontWeight: 600,
      cursor: "pointer",
      fontFamily: "'Poppins', sans-serif",
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
        .nav-link-header {
          display: block;
          color: rgba(255,255,255,0.85);
          text-decoration: none;
          font-size: 14.5px;
          font-weight: 500;
          padding: 8px 15px;
          border-radius: 999px;
          transition: color 0.25s, background 0.25s;
          white-space: nowrap;
        }
        .nav-link-header:hover { color: #fff; background: rgba(255,255,255,0.1); }
        .nav-link-header.is-active { color: #f39c12; background: rgba(243,156,18,0.16); }
        .icon-btn-h:hover { background: rgba(255,255,255,0.18) !important; transform: rotate(15deg); }
        .call-btn-h:hover { transform: translateY(-2px); box-shadow: 0 10px 24px rgba(230,126,34,0.45) !important; }
        .mobile-link-h {
          color: #fff;
          text-decoration: none;
          font-size: 17px;
          font-weight: 500;
          padding: 13px 16px;
          border-radius: 12px;
          border-left: 3px solid transparent;
          transition: background 0.3s;
        }
        .mobile-link-h:hover { background: rgba(243,156,18,0.12); }
        .mobile-link-h.is-active { background: rgba(243,156,18,0.16); border-left-color: #f39c12; color: #f39c12; }
        @media (max-width: 1100px) {
          .desktop-nav { display: none !important; }
          .desktop-actions { display: none !important; }
          .hamburger-btn { display: flex !important; }
        }
      `}</style>

      <header style={styles.header}>
        <div style={styles.container}>
          <a href={sectionHref("#home")} style={styles.logoWrap}>
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
                <li key={link.hash}>
                  <a
                    href={sectionHref(link.hash)}
                    className={`nav-link-header${isActive(link.hash) ? " is-active" : ""}`}
                    aria-current={isActive(link.hash) ? "location" : undefined}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="desktop-actions" style={styles.actions}>
            <button
              className="icon-btn-h"
              style={styles.iconBtn}
              onClick={toggleTheme}
              aria-label={t("header.themeToggleAria")}
              title={theme === "dark" ? t("header.themeLight") : t("header.themeDark")}
            >
              {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            </button>
            <a href={`tel:${SITE_CONFIG.phone}`} className="call-btn-h" style={styles.callBtn}>
              <PhoneIcon />
              {t("header.callNow")}
            </a>
          </div>

          <button
            className="hamburger-btn"
            style={styles.hamburger}
            onClick={() => setMenuOpen(!menuOpen)}
            ref={hamburgerRef}
            aria-label={t("header.menuAria")}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
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
      <div style={styles.overlay} onClick={() => setMenuOpen(false)} aria-hidden="true" />

      {/* Mobile menu: inert while closed so the off-canvas links are neither focusable nor exposed to AT (E-06) */}
      <div id="mobile-menu" inert={!menuOpen} style={styles.mobileMenu}>
        {navLinks.map((link) => (
          <a
            key={link.hash}
            href={sectionHref(link.hash)}
            className={`mobile-link-h${isActive(link.hash) ? " is-active" : ""}`}
            aria-current={isActive(link.hash) ? "location" : undefined}
            onClick={() => setMenuOpen(false)}
          >
            {link.label}
          </a>
        ))}
        <button style={styles.mobileThemeBtn} onClick={toggleTheme}>
          {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          {theme === "dark" ? t("header.themeLight") : t("header.themeDark")}
        </button>
        <a href={`tel:${SITE_CONFIG.phone}`} style={{ ...styles.callBtn, marginTop: 10, justifyContent: "center" }}>
          <PhoneIcon />
          {t("header.callNow")}
        </a>
      </div>
    </>
  );
};

export default Header;
