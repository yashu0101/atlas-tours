"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useApp } from "@/lib/context";
import { useT } from "@/lib/i18n/use-t";
import { SITE_CONFIG, PHONE_DISPLAY, MD_NAME, SOCIAL_LINKS } from "@/lib/config";
import { SOCIAL_ICONS } from "@/components/social-icons";
// "Mrs. Bushra Ashfaque" → "BA" (skips the title).
import { teamInitials } from "@/lib/team";

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

const svgProps = {
  width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
  strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true,
} as const;

const CloseIcon = () => (
  <svg {...svgProps} width={20} height={20}><path d="M18 6L6 18M6 6l12 12" /></svg>
);
const ChevronIcon = () => (
  <svg {...svgProps}><path d="M9 6l6 6-6 6" /></svg>
);
const MailIcon = () => (
  <svg {...svgProps}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>
);
const PinIcon = () => (
  <svg {...svgProps}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
);
const CompassIcon = () => (
  <svg {...svgProps}><circle cx="12" cy="12" r="10" /><path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36z" /></svg>
);
const TicketIcon = () => (
  <svg {...svgProps}><path d="M3 9V6a1 1 0 011-1h16a1 1 0 011 1v3a3 3 0 000 6v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3a3 3 0 000-6z" /><path d="M13 5v2M13 11v2M13 17v2" /></svg>
);
const WhatsAppIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.1 4.9 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.6-.1 1.7-.7 1.9-1.4.2-.7.2-1.2.2-1.4-.1-.1-.3-.2-.6-.3zM12 21.8c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4C2.7 15.6 2.2 13.8 2.2 12 2.2 6.6 6.6 2.2 12 2.2c2.6 0 5.1 1 6.9 2.9 1.8 1.8 2.9 4.3 2.9 6.9 0 5.4-4.4 9.8-9.8 9.8zM20.5 3.5C18.2 1.2 15.2 0 12 0 5.4 0 0 5.4 0 12c0 2.1.6 4.2 1.6 6L0 24l6.2-1.6c1.8 1 3.8 1.5 5.8 1.5 6.6 0 12-5.4 12-12 0-3.2-1.2-6.2-3.5-8.4z" />
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
  const closeRef = useRef<HTMLButtonElement>(null);
  const { theme, setTheme } = useApp();
  const t = useT();
  // Section links are bare hashes on the home page; on sub-routes (e.g. /packages/[id]) they point back to "/".
  const pathname = usePathname();
  const onHome = pathname === "/";
  const sectionHref = (hash: string) => (onHome ? hash : `/${hash}`);
  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");
  const closeMenu = () => setMenuOpen(false);
  const waHref = `https://wa.me/${SITE_CONFIG.whatsapp}?text=${encodeURIComponent(t("whatsapp.defaultMessage"))}`;
  const mapHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${SITE_CONFIG.name}, ${SITE_CONFIG.address}`)}`;

  // While the drawer is open: lock page scroll and move focus into it (the close button).
  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

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
        /* ---------- Mobile menu drawer ---------- */
        .mm-overlay {
          position: fixed; inset: 0; z-index: 1090;
          background: rgba(6, 16, 32, 0.55);
          -webkit-backdrop-filter: blur(3px); backdrop-filter: blur(3px);
          opacity: 0; pointer-events: none; transition: opacity 0.3s ease;
        }
        .mm-overlay[data-open="true"] { opacity: 1; pointer-events: auto; }
        .mm {
          position: fixed; top: 0; right: 0; bottom: 0; z-index: 1100;
          width: min(400px, 100vw);
          display: flex; flex-direction: column;
          color: #fff; font-family: 'Poppins', sans-serif;
          background:
            radial-gradient(120% 60% at 100% 0%, rgba(243, 156, 18, 0.16), transparent 60%),
            linear-gradient(180deg, #16335f 0%, #0f2548 55%, #0a1a33 100%);
          box-shadow: -16px 0 48px rgba(0, 0, 0, 0.35);
          transform: translateX(100%); visibility: hidden;
          transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), visibility 0s linear 0.4s;
        }
        .mm[data-open="true"] {
          transform: none; visibility: visible;
          transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), visibility 0s;
        }
        .mm-top {
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          padding: 14px 16px 14px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        .mm-brand { display: flex; align-items: center; gap: 10px; color: #fff; text-decoration: none; font-size: 19px; font-weight: 700; }
        .mm-brand-accent { color: #f39c12; }
        .mm-close {
          width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0;
          display: inline-flex; align-items: center; justify-content: center;
          background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.16);
          color: #fff; cursor: pointer; transition: background 0.25s, transform 0.3s;
        }
        .mm-close:hover { background: rgba(255, 255, 255, 0.16); transform: rotate(90deg); }
        .mm-body {
          flex: 1; overflow-y: auto; overscroll-behavior: contain; padding: 8px 20px 24px;
          scrollbar-width: none; /* still scrolls by touch, wheel and keyboard */
        }
        .mm-body::-webkit-scrollbar { display: none; }
        .mm-nav { list-style: none; margin: 0; padding: 0; }
        .mm-nav li {
          border-bottom: 1px solid rgba(255, 255, 255, 0.07);
          opacity: 0; transform: translateX(18px);
          transition: opacity 0.35s ease, transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .mm[data-open="true"] .mm-nav li {
          opacity: 1; transform: none;
          transition-delay: calc(0.08s + var(--i) * 0.035s);
        }
        .mm-link {
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          padding: 12px 4px; color: rgba(255, 255, 255, 0.9); text-decoration: none;
          font-size: 20px; font-weight: 600; letter-spacing: -0.01em;
          transition: color 0.2s, padding 0.25s;
        }
        .mm-link svg { color: rgba(255, 255, 255, 0.3); transition: color 0.2s, transform 0.25s; }
        .mm-link:hover { color: #fff; padding-left: 8px; }
        .mm-link:hover svg { color: #f39c12; transform: translateX(3px); }
        .mm-link.is-active { color: #f6b04a; }
        .mm-link.is-active span::before {
          content: ""; display: inline-block; width: 7px; height: 7px; border-radius: 50%;
          background: #f39c12; box-shadow: 0 0 0 4px rgba(243, 156, 18, 0.2);
          margin-right: 12px; vertical-align: middle; position: relative; top: -2px;
        }
        .mm-link.is-active svg { color: #f39c12; }
        .mm-quick { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 20px 0; }
        .mm-chip {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 12px 10px; border-radius: 14px; text-decoration: none;
          color: #fff; font-size: 14px; font-weight: 600;
          background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.12);
          transition: background 0.25s, border-color 0.25s;
        }
        .mm-chip svg { color: #f39c12; flex-shrink: 0; }
        .mm-chip:hover { background: rgba(243, 156, 18, 0.12); border-color: rgba(243, 156, 18, 0.4); }
        .mm-card {
          border-radius: 18px; padding: 16px;
          background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .mm-heading { margin: 0 0 12px; font-size: 13px; font-weight: 600; color: rgba(255, 255, 255, 0.6); letter-spacing: 0.02em; }
        .mm-person { display: flex; align-items: center; gap: 12px; padding-bottom: 14px; margin-bottom: 6px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); }
        .mm-avatar {
          width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0;
          display: inline-flex; align-items: center; justify-content: center;
          background: linear-gradient(135deg, #e67e22, #f39c12); color: var(--on-accent);
          font-weight: 700; font-size: 15px;
        }
        .mm-person strong { display: block; font-size: 15.5px; font-weight: 600; line-height: 1.3; }
        .mm-person small { display: block; font-size: 12.5px; color: rgba(255, 255, 255, 0.62); }
        .mm-contact {
          display: flex; align-items: center; gap: 12px; padding: 10px 6px; margin: 0 -6px;
          border-radius: 12px; color: #fff; text-decoration: none; font-size: 14.5px; font-weight: 500;
          overflow-wrap: anywhere; transition: background 0.2s;
        }
        .mm-contact:hover { background: rgba(255, 255, 255, 0.06); }
        .mm-contact small { display: block; font-size: 11.5px; font-weight: 500; color: rgba(255, 255, 255, 0.55); }
        .mm-ic {
          width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
          display: inline-flex; align-items: center; justify-content: center;
          background: rgba(243, 156, 18, 0.14); color: #f6b04a;
        }
        .mm-foot { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-top: 22px; }
        .mm-foot .mm-heading { margin-bottom: 10px; }
        .mm-socials { display: flex; gap: 8px; }
        .mm-social {
          width: 40px; height: 40px; border-radius: 50%;
          display: inline-flex; align-items: center; justify-content: center;
          color: #fff; background: rgba(255, 255, 255, 0.07); border: 1px solid rgba(255, 255, 255, 0.12);
          transition: background 0.25s, color 0.25s, border-color 0.25s;
        }
        .mm-social:hover { background: #f39c12; border-color: #f39c12; color: #1a1205; }
        .mm-theme {
          display: inline-flex; align-items: center; gap: 8px; height: 40px; padding: 0 16px;
          border-radius: 999px; cursor: pointer; font-family: inherit; font-size: 13.5px; font-weight: 600;
          color: #fff; background: rgba(255, 255, 255, 0.07); border: 1px solid rgba(255, 255, 255, 0.14);
          transition: background 0.25s;
        }
        .mm-theme:hover { background: rgba(255, 255, 255, 0.14); }
        .mm-cta {
          display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
          padding: 14px 20px calc(14px + env(safe-area-inset-bottom));
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(8, 20, 40, 0.6);
        }
        .mm-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          height: 50px; border-radius: 14px; text-decoration: none;
          font-size: 15px; font-weight: 600; white-space: nowrap;
          transition: transform 0.2s, box-shadow 0.2s, background 0.2s;
        }
        .mm-btn:active { transform: scale(0.97); }
        .mm-btn-call { background: linear-gradient(135deg, #e67e22, #f39c12); color: var(--on-accent); box-shadow: 0 8px 22px rgba(230, 126, 34, 0.35); }
        .mm-btn-wa { background: #0e7a3e; color: #fff; box-shadow: 0 8px 22px rgba(14, 122, 62, 0.3); }
        .mm-btn-wa:hover { background: #0b6a35; }
        @media (min-width: 1101px) { .mm, .mm-overlay { display: none; } }
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

      <div className="mm-overlay" data-open={menuOpen} onClick={closeMenu} aria-hidden="true" />

      {/* Mobile menu: a modal drawer above the header (it has its own close button). Inert while
          closed so the off-canvas links are neither focusable nor exposed to AT (E-06). */}
      <div
        id="mobile-menu"
        className="mm"
        data-open={menuOpen}
        role="dialog"
        aria-modal="true"
        aria-label={t("header.menuLabel")}
        inert={!menuOpen}
      >
        <div className="mm-top">
          <a href={sectionHref("#home")} className="mm-brand" onClick={closeMenu}>
            <Image src="/images/atlas-logo.jpeg" alt="" width={38} height={38} style={styles.logoImg} />
            <span>
              Atlas<span className="mm-brand-accent">Tours</span>
            </span>
          </a>
          <button type="button" className="mm-close" ref={closeRef} onClick={() => { closeMenu(); hamburgerRef.current?.focus(); }} aria-label={t("header.menuClose")}>
            <CloseIcon />
          </button>
        </div>

        <div className="mm-body">
          <nav aria-label={t("header.menuLabel")}>
            <ul className="mm-nav">
              {navLinks.map((link, i) => (
                <li key={link.hash} style={{ "--i": i } as React.CSSProperties}>
                  <a
                    href={sectionHref(link.hash)}
                    className={`mm-link${isActive(link.hash) ? " is-active" : ""}`}
                    aria-current={isActive(link.hash) ? "location" : undefined}
                    onClick={closeMenu}
                  >
                    <span>{link.label}</span>
                    <ChevronIcon />
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mm-quick">
            <a href="/plan-trip" className="mm-chip" onClick={closeMenu}>
              <CompassIcon />
              {t("footer.planTrip")}
            </a>
            <a href="/track" className="mm-chip" onClick={closeMenu}>
              <TicketIcon />
              {t("footer.trackBooking")}
            </a>
          </div>

          <section className="mm-card" aria-labelledby="mm-talk">
            <h2 id="mm-talk" className="mm-heading">{t("header.menuTalk")}</h2>
            <div className="mm-person">
              <span className="mm-avatar" aria-hidden="true">{teamInitials(MD_NAME)}</span>
              <span>
                <strong>{MD_NAME}</strong>
                <small>{t("contact.mdLabel")}</small>
              </span>
            </div>
            <a href={`tel:${SITE_CONFIG.phone}`} className="mm-contact">
              <span className="mm-ic"><PhoneIcon /></span>
              <span><small>{t("common.phone")}</small>{PHONE_DISPLAY}</span>
            </a>
            <a href={`mailto:${SITE_CONFIG.email}`} className="mm-contact">
              <span className="mm-ic"><MailIcon /></span>
              <span><small>{t("common.email")}</small>{SITE_CONFIG.email}</span>
            </a>
            <a href={mapHref} className="mm-contact" target="_blank" rel="noopener noreferrer" aria-label={t("footer.mapAria", { address: SITE_CONFIG.address })}>
              <span className="mm-ic"><PinIcon /></span>
              <span><small>{t("common.address")}</small>{SITE_CONFIG.address}</span>
            </a>
          </section>

          <div className="mm-foot">
            {SOCIAL_LINKS.length > 0 && (
              <div>
                <h2 className="mm-heading">{t("header.menuFollow")}</h2>
                <div className="mm-socials">
                  {SOCIAL_LINKS.map((s) => (
                    <a
                      key={s.name}
                      href={s.href}
                      className="mm-social"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={t("footer.socialAria", { name: s.name })}
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">{SOCIAL_ICONS[s.name]}</svg>
                    </a>
                  ))}
                </div>
              </div>
            )}
            <button type="button" className="mm-theme" onClick={toggleTheme}>
              {theme === "dark" ? <SunIcon /> : <MoonIcon />}
              {theme === "dark" ? t("header.themeLight") : t("header.themeDark")}
            </button>
          </div>
        </div>

        <div className="mm-cta">
          <a href={`tel:${SITE_CONFIG.phone}`} className="mm-btn mm-btn-call">
            <PhoneIcon />
            {t("header.callNow")}
          </a>
          <a href={waHref} className="mm-btn mm-btn-wa" target="_blank" rel="noopener noreferrer" aria-label={t("footer.whatsappAria")}>
            <WhatsAppIcon />
            {t("common.whatsapp")}
          </a>
        </div>
      </div>
    </>
  );
};

export default Header;
