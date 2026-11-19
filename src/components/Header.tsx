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

/**
 * The header adapts to the content under it:
 * - "dark": an element marked `data-header-tone="dark"` (hero photo, navy page bands, stats,
 *   Reviews, footer). Clear at the very top of the page, dark glass once scrolled.
 * - "light": anything else (the white sections). Frosted white glass with navy text.
 * The dark theme has no white sections, so it always uses the dark look.
 */
type Tone = "dark" | "light";

/** Tone of the page content directly under the middle of the header. */
function toneUnder(header: HTMLElement): Tone {
  const y = header.offsetHeight / 2;
  for (const el of document.elementsFromPoint(window.innerWidth / 2, y)) {
    if (header.contains(el)) continue;
    const marked = el.closest<HTMLElement>("[data-header-tone]");
    if (marked) return marked.dataset.headerTone === "light" ? "light" : "dark";
  }
  return "light";
}

const Header: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  // Every page starts with a dark band or photo, so "dark" matches the server render.
  const [tone, setTone] = useState<Tone>("dark");
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState("#home");
  const headerRef = useRef<HTMLElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const { theme, setTheme } = useApp();
  const t = useT();
  // Section links are bare hashes on the home page; on sub-routes (e.g. /packages/[id]) they point back to "/".
  const pathname = usePathname();
  const onHome = pathname === "/";
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

  // Scroll state and the tone under the header: at most one check per frame (rAF), and
  // React skips the re-render when neither value changed.
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setScrolled(window.scrollY > 60);
      if (headerRef.current) setTone(toneUnder(headerRef.current));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [pathname]);

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
  const look: Tone = theme === "dark" ? "dark" : tone;
  const surface = look === "light" ? "light" : scrolled ? "dark" : "clear";

  const styles: Record<string, React.CSSProperties> = {
    header: {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      zIndex: 1000,
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
      height: surface === "clear" ? 84 : 64,
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
      letterSpacing: 0.5,
    },
    nav: {
      display: "flex",
      alignItems: "center",
      gap: 2,
      listStyle: "none",
      margin: 0,
      padding: 5,
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
      borderRadius: "50%",
      cursor: "pointer",
      transition: "background 0.3s, color 0.3s, border-color 0.3s, transform 0.3s",
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
        /* The header strip itself is invisible and lets clicks through; the bar inside carries
           the surface. Clear: full width at the top of a dark hero (unchanged look).
           Dark / light glass: the bar floats, inset from the edges, rounded, with a shadow
           instead of a bottom line. */
        .site-header {
          pointer-events: none;
          padding: 0;
          transition: padding 0.35s ease;
        }
        .site-header[data-surface="dark"], .site-header[data-surface="light"] {
          padding: 10px clamp(10px, 2vw, 24px) 0;
        }
        .hdr-bar {
          pointer-events: auto;
          border: 1px solid transparent;
          border-radius: 0;
          transition: background-color 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease,
            border-radius 0.35s ease, height 0.3s ease, padding 0.35s ease,
            backdrop-filter 0.35s ease, -webkit-backdrop-filter 0.35s ease;
        }
        .site-header[data-surface="dark"] .hdr-bar, .site-header[data-surface="light"] .hdr-bar {
          border-radius: 20px;
          padding: 0 clamp(12px, 1.6vw, 22px) !important;
        }
        .site-header[data-surface="dark"] .hdr-bar {
          background-color: rgba(10, 22, 40, 0.5);
          -webkit-backdrop-filter: blur(16px) saturate(160%);
          backdrop-filter: blur(16px) saturate(160%);
          border-color: rgba(255, 255, 255, 0.08);
          box-shadow: 0 14px 40px rgba(0, 0, 0, 0.32), 0 2px 8px rgba(0, 0, 0, 0.18);
        }
        .site-header[data-surface="light"] .hdr-bar {
          background-color: rgba(255, 255, 255, 0.62);
          -webkit-backdrop-filter: blur(18px) saturate(180%);
          backdrop-filter: blur(18px) saturate(180%);
          border-color: rgba(255, 255, 255, 0.7);
          box-shadow: 0 14px 40px rgba(15, 37, 72, 0.13), 0 2px 8px rgba(15, 37, 72, 0.06);
        }
        /* Without backdrop-filter support the glass would be see-through: make it near-solid. */
        @supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
          .site-header[data-surface="dark"] .hdr-bar { background-color: rgba(15, 37, 72, 0.95); }
          .site-header[data-surface="light"] .hdr-bar { background-color: rgba(255, 255, 255, 0.96); }
        }

        /* Text and controls: white on the dark surfaces, navy on the light glass. */
        .hdr-logo-text { color: #fff; transition: color 0.3s; }
        .hdr-logo-accent { color: #f39c12; transition: color 0.3s; }
        .hdr-pill {
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.12);
          transition: background 0.3s, border-color 0.3s;
        }
        .icon-btn-h { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.18); color: #fff; }
        .hdr-line { background-color: #fff; }
        .site-header[data-tone="light"] .hdr-logo-text { color: #1a3a6b; }
        .site-header[data-tone="light"] .hdr-logo-accent { color: #e67e22; }
        .site-header[data-tone="light"] .hdr-pill { background: rgba(255,255,255,0.55); border-color: rgba(26,58,107,0.12); }
        .site-header[data-tone="light"] .icon-btn-h { background: rgba(26,58,107,0.06); border-color: rgba(26,58,107,0.16); color: #1a3a6b; }
        .site-header[data-tone="light"] .hdr-line { background-color: #1a3a6b; }

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
        .site-header[data-tone="light"] .nav-link-header { color: #1a3a6b; }
        .site-header[data-tone="light"] .nav-link-header:hover { color: #0f2548; background: rgba(26,58,107,0.07); }
        .site-header[data-tone="light"] .nav-link-header.is-active { color: #9c5212; background: rgba(230,126,34,0.14); }
        .icon-btn-h:hover { background: rgba(255,255,255,0.18); transform: rotate(15deg); }
        .site-header[data-tone="light"] .icon-btn-h:hover { background: rgba(26,58,107,0.12); }
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

      <header
        ref={headerRef}
        className="site-header"
        data-tone={look}
        data-surface={surface}
        style={styles.header}
      >
        <div className="hdr-bar" style={styles.container}>
          <a href={sectionHref("#home")} style={styles.logoWrap}>
            <Image
              src="/images/atlas-logo.jpeg"
              alt="Atlas Tours"
              width={44}
              height={44}
              style={styles.logoImg}
            />
            <span className="hdr-logo-text" style={styles.logoText}>
              Atlas<span className="hdr-logo-accent">Tours</span>
            </span>
          </a>

          <nav className="desktop-nav" style={{ display: "flex" }}>
            <ul className="hdr-pill" style={styles.nav}>
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
              className="hdr-line"
              style={{
                ...styles.hamburgerLine,
                transform: menuOpen ? "rotate(45deg) translate(5px, 6px)" : "none",
              }}
            />
            <span
              className="hdr-line"
              style={{
                ...styles.hamburgerLine,
                opacity: menuOpen ? 0 : 1,
              }}
            />
            <span
              className="hdr-line"
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
