"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SITE_CONFIG, PHONE_DISPLAY, SOCIAL_LINKS } from "@/lib/config";
import { SOCIAL_ICONS } from "@/components/social-icons";
import HotelPartnerLogo from "@/components/HotelPartnerLogo";
import { useT } from "@/lib/i18n/use-t";

const exploreLinks = [
  { label: "header.nav.home", href: "#home" },
  { label: "footer.aboutUs", href: "#about" },
  { label: "header.nav.packages", href: "#packages" },
  { label: "header.nav.gallery", href: "#gallery" },
  { label: "header.nav.blog", href: "#blog" },
  { label: "header.nav.faq", href: "#faq" },
  { label: "header.nav.contact", href: "#contact" },
] as const;

// Category links land on the /packages listing with that chip selected; a category with no
// visible packages falls back to "All" there, so these never show an empty page.
const tourLinks = [
  { label: "footer.serviceSpiritual", href: "/packages?category=spiritual" },
  { label: "footer.serviceCultural", href: "/packages?category=cultural" },
  { label: "footer.serviceHeritage", href: "/packages?category=heritage" },
  { label: "footer.serviceAdventure", href: "/packages?category=adventure" },
  { label: "footer.serviceGroup", href: "/plan-trip" },
  { label: "footer.serviceCustom", href: "/plan-trip" },
  { label: "footer.serviceHotel", href: "#contact" },
  { label: "footer.allPackages", href: "/packages" },
] as const;

// N-4…N-7 pages.
const tripLinks = [
  { label: "footer.planTrip", href: "/plan-trip" },
  { label: "footer.trackBooking", href: "/track" },
  { label: "footer.wishlist", href: "/wishlist" },
  { label: "footer.writeReview", href: "/reviews/new" },
] as const;

/* ---------- Ghat skyline: the one decorative element, drawn once at module load. ---------- */

const SKY_W = 1440;
const SKY_H = 214;
const STEP_Y = 160; // top of the ghat steps; buildings stand on this line
const RIVER_Y = STEP_Y + 16; // where the steps meet the Ganga
const WATERLINE = RIVER_Y + 20; // the boat floats on this line

/** A curvilinear temple spire (shikhara) with a kalash on top. */
function shikhara(cx: number, w: number, h: number, base = STEP_Y) {
  const top = base - h;
  const l = cx - w / 2;
  const r = cx + w / 2;
  const neck = top + 14; // where the spire narrows under the amalaka (ribbed stone disc)
  const plinth = base - h * 0.2;
  return (
    // plinth and curved spire
    `M${l},${base} L${l},${plinth} L${l + w * 0.1},${plinth} ` +
    `C${l + w * 0.1},${base - h * 0.6} ${cx - w * 0.13},${top + h * 0.24} ${cx - w * 0.08},${neck} ` +
    `L${cx + w * 0.08},${neck} ` +
    `C${cx + w * 0.13},${top + h * 0.24} ${r - w * 0.1},${base - h * 0.6} ${r - w * 0.1},${plinth} ` +
    `L${r},${plinth} L${r},${base} Z ` +
    // amalaka, then the kalash pot and its finial
    `M${cx - w * 0.15},${neck + 1} Q${cx},${neck - 9} ${cx + w * 0.15},${neck + 1} Z ` +
    `M${cx - 3},${neck - 5} Q${cx},${neck - 13} ${cx + 3},${neck - 5} Z ` +
    `M${cx - 0.8},${neck - 10} V${top - 2} H${cx + 0.8} V${neck - 10} Z`
  );
}

/** A flat-roofed ghat house, optionally with a small domed pavilion (chhatri) on the roof. */
function house(x: number, w: number, h: number, chhatri?: number) {
  const top = STEP_Y - h;
  let d = `M${x},${STEP_Y} V${top} H${x + w} V${STEP_Y} Z`;
  if (chhatri !== undefined) {
    const cx = x + chhatri;
    d += ` M${cx - 9},${top} V${top - 9} H${cx + 9} V${top} Z M${cx - 11},${top - 9} Q${cx},${top - 26} ${cx + 11},${top - 9} Z`;
  }
  return d;
}

const SKYLINE_PATH = [
  // the ghat steps, two treads deep, down to the river
  `M0,${RIVER_Y} V${STEP_Y} H${SKY_W} V${RIVER_Y} Z`,

  house(0, 70, 34),
  house(70, 54, 52, 27),
  shikhara(160, 52, 74),
  house(186, 80, 40),
  house(266, 46, 62, 23),
  house(312, 96, 30),
  shikhara(445, 70, 96),
  house(480, 62, 46, 31),
  house(542, 88, 36),
  house(630, 40, 58),
  // centre temple: the tallest spire, with two smaller ones flanking it
  shikhara(696, 46, 70),
  shikhara(744, 84, 122),
  shikhara(792, 46, 70),
  house(815, 70, 44, 35),
  house(885, 100, 32),
  house(985, 50, 64, 25),
  shikhara(1075, 60, 86),
  house(1105, 80, 38),
  house(1185, 56, 54, 28),
  house(1241, 90, 30),
  shikhara(1360, 50, 70),
  house(1385, 55, 46),
].join(" ");

// Lit windows (x, y) and the diyas (oil lamps) along the steps, in viewBox units.
const WINDOWS: [number, number][] = [
  [92, 90], [212, 100], [282, 80], [500, 96], [566, 104], [644, 82], [838, 98],
  [910, 108], [1000, 78], [1128, 102], [1200, 88], [1262, 110], [1402, 98],
].map(([x, y]) => [x, y + (STEP_Y - 128)]); // drawn against the original 128 step line
// Flock members: offset (x, y) inside the flock and size.
const BIRDS: [number, number, number][] = [
  [0, 0, 1.1], [26, -10, 0.9], [50, 4, 1], [78, -6, 0.8], [34, 14, 0.85], [104, 2, 0.7],
];
const DIYAS = [60, 130, 236, 330, 395, 520, 605, 744, 860, 950, 1040, 1150, 1230, 1310, 1420];

function GhatSkyline() {
  return (
    <svg
      className="ft-skyline"
      viewBox={`0 0 ${SKY_W} ${SKY_H}`}
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="ft-river" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1b3d70" />
          <stop offset="1" style={{ stopColor: "var(--ft-bg)" }} />
        </linearGradient>
      </defs>

      {/* plane with a dotted trail, flying behind the temples (drawn first) */}
      <g className="ft-plane">
        <path d="M-240,0 H-20" stroke="var(--ft-gold)" strokeWidth={2} strokeDasharray="2 8" strokeLinecap="round" opacity={0.8} />
        <g transform="translate(-20,-19) scale(1.6) rotate(90 12 12)">
          <path
            d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"
            fill="var(--ft-gold)"
          />
        </g>
      </g>

      {/* a small flock of birds drifting the other way, flapping */}
      <g className="ft-flock">
        {BIRDS.map(([x, y, s], i) => (
          <g key={i} transform={`translate(${x},${y}) scale(${s})`}>
            <path
              className="ft-wing"
              style={{ animationDelay: `${i * 0.17}s` }}
              d="M-9,-1 Q-4.5,-6 0,0 Q4.5,-6 9,-1"
              fill="none"
              stroke="var(--ft-ink)"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        ))}
      </g>

      <path d={SKYLINE_PATH} fill="var(--ft-bg)" />
      {/* saffron flag on the centre spire */}
      <path d={`M745,${STEP_Y - 124} l16,4 l-16,4 Z`} fill="var(--ft-gold)" />
      {/* edges of the ghat steps */}
      <path
        d={`M0,${STEP_Y + 7.5} H${SKY_W}`}
        stroke="rgba(255,255,255,0.07)"
        strokeWidth={1}
      />

      {/* the Ganga, with ripples and the lamps' reflections */}
      <rect x={0} y={RIVER_Y} width={SKY_W} height={SKY_H - RIVER_Y + 1} fill="url(#ft-river)" />
      <path
        d={`M40,${RIVER_Y + 9} h60 M260,${RIVER_Y + 14} h90 M520,${RIVER_Y + 8} h50 M880,${RIVER_Y + 13} h80 M1120,${RIVER_Y + 9} h60 M1300,${RIVER_Y + 15} h70`}
        stroke="rgba(255,255,255,0.12)"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      {DIYAS.map((x, i) => (
        // the flicker animates the group's opacity, so the dimming sits on the rect
        <g key={`r-${x}`} className="ft-diya" style={{ animationDelay: `${(i % 5) * 0.7 + 0.3}s` }}>
          <rect x={x - 1} y={RIVER_Y + 3} width={2} height={12} rx={1} fill="var(--ft-gold)" opacity={0.35} />
        </g>
      ))}

      {/* a wooden boat with a boatman rowing along the river */}
      <g className="ft-boat">
        <g className="ft-bob"><g transform="scale(1.25)">
          <path d="M0,-7 Q4,4 15,6 H57 Q68,4 74,-10 L67,-4 H6 Z" fill="var(--ft-boat)" />
          <path d="M17,-4 V-19 h1.8 V-4 Z M49,-4 V-19 h1.8 V-4 Z M13,-19 Q34,-28 55,-19 Z" fill="var(--ft-boat)" />
          <circle cx={34} cy={-11} r={6} fill="var(--ft-gold)" opacity={0.2} />
          <circle cx={34} cy={-11} r={2.2} fill="var(--ft-gold)" />
          <circle cx={7} cy={-22} r={3} fill="var(--ft-boat)" />
          <path d="M4,-4 L5.5,-18 H9 L10.5,-4 Z" fill="var(--ft-boat)" />
          <path d="M9,-14 L-6,7" stroke="var(--ft-boat)" strokeWidth={1.6} strokeLinecap="round" />
        </g>
        </g>
      </g>
      {WINDOWS.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={5} height={7} rx={1} fill="var(--ft-gold)" opacity={0.55} />
      ))}
      {DIYAS.map((x, i) => (
        <g key={x} className="ft-diya" style={{ animationDelay: `${(i % 5) * 0.7}s` }}>
          <circle cx={x} cy={STEP_Y + 4} r={6} fill="var(--ft-gold)" opacity={0.18} />
          <circle cx={x} cy={STEP_Y + 4} r={2.2} fill="var(--ft-gold)" />
        </g>
      ))}
    </svg>
  );
}

const IST_YEAR = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", year: "numeric" });

const Footer: React.FC = () => {
  const t = useT();
  const year = IST_YEAR.format(new Date());
  // Section links are bare hashes on the home page; on sub-routes they point back to "/".
  const onHome = usePathname() === "/";
  const sectionHref = (hash: string) => (onHome ? hash : `/${hash}`);
  const waHref = `https://wa.me/${SITE_CONFIG.whatsapp}?text=${encodeURIComponent(t("whatsapp.defaultMessage"))}`;
  const mapHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${SITE_CONFIG.name}, ${SITE_CONFIG.address}`)}`;

  return (
    <footer className="ft">
      <style>{`
        .ft {
          --ft-bg: #0f2548;
          --ft-bg-deep: #081429;
          --ft-gold: #f6b144;
          --ft-text: rgba(255,255,255,0.74);
          --ft-line: rgba(255,255,255,0.1);
          --ft-boat: #050d1c;
          --ft-ink: #1a3a6b; /* birds, drawn against the page background above the footer */
          position: relative;
          color: #fff;
          font-family: 'Poppins', sans-serif;
          margin-top: 40px;
        }
        /* Height follows the width (viewBox 1440x214), so wide screens never crop the sky off the top. */
        .ft-skyline { display: block; width: 100%; height: clamp(160px, 14.86vw, 420px); margin-bottom: -1px; }
        [data-theme="dark"] .ft { --ft-ink: rgba(226,232,240,0.8); }
        .ft-body { background: linear-gradient(180deg, var(--ft-bg) 0%, var(--ft-bg-deep) 100%); padding: 0 24px; }
        .ft-inner { max-width: 1200px; margin: 0 auto; }

        .ft-cta {
          display: flex; align-items: center; justify-content: space-between; gap: 32px;
          padding: 28px 0 48px; border-bottom: 1px solid var(--ft-line);
        }
        .ft-cta h2 { font-size: clamp(24px, 3vw, 34px); font-weight: 700; line-height: 1.2; margin: 0 0 10px; letter-spacing: -0.01em; max-width: 22em; }
        .ft-cta p { margin: 0; font-size: 15px; line-height: 1.7; color: var(--ft-text); max-width: 40em; }
        .ft-cta-actions { display: flex; gap: 12px; flex-shrink: 0; flex-wrap: wrap; }
        .ft-btn {
          display: inline-flex; align-items: center; gap: 10px; padding: 14px 24px; border-radius: 999px;
          font-size: 15px; font-weight: 600; text-decoration: none; transition: transform .2s, background-color .2s, border-color .2s;
        }
        .ft-btn svg { width: 18px; height: 18px; flex-shrink: 0; }
        .ft-btn-primary { background: linear-gradient(135deg, var(--orange), var(--gold)); color: var(--on-accent); }
        .ft-btn-ghost { color: #fff; border: 1.5px solid rgba(255,255,255,0.35); }
        .ft-btn:hover { transform: translateY(-2px); }
        .ft-btn-ghost:hover { border-color: var(--ft-gold); background: rgba(246,177,68,0.08); }

        .ft-grid {
          display: grid; grid-template-columns: 1.7fr 1fr 1fr 1fr 1.4fr; gap: 40px;
          padding: 52px 0 48px;
        }
        .ft-brand { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; text-decoration: none; color: #fff; }
        .ft-brand img { border-radius: 50%; border: 2px solid var(--ft-gold); }
        .ft-brand span { font-size: 24px; font-weight: 800; }
        .ft-brand b { color: var(--gold); font-weight: 800; }
        .ft-desc { font-size: 14px; line-height: 1.8; color: var(--ft-text); margin: 0 0 18px; max-width: 30em; }
        .ft-partner p { margin: 0 0 10px; font-size: 13px; line-height: 1.6; color: var(--ft-gold); font-weight: 500; }

        .ft h3 { font-size: 15px; font-weight: 600; color: var(--ft-gold); margin: 6px 0 18px; }
        .ft ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 11px; }
        .ft-link {
          color: var(--ft-text); text-decoration: none; font-size: 14px; line-height: 1.4;
          text-decoration-line: underline; text-decoration-color: transparent; text-underline-offset: 5px;
          text-decoration-thickness: 1.5px; transition: color .2s, text-decoration-color .2s;
        }
        .ft-link:hover { color: #fff; text-decoration-color: var(--ft-gold); }

        .ft-contact { display: flex; flex-direction: column; gap: 14px; }
        .ft-contact a { display: flex; gap: 12px; align-items: flex-start; }
        .ft-contact svg { width: 18px; height: 18px; flex-shrink: 0; margin-top: 1px; color: var(--ft-gold); }
        .ft-socials { display: flex; gap: 10px; margin-top: 22px; }
        .ft-social {
          width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
          color: #fff; border: 1px solid rgba(255,255,255,0.22); transition: background-color .2s, border-color .2s, color .2s;
        }
        .ft-social svg { width: 18px; height: 18px; }
        .ft-social:hover { background: var(--ft-gold); border-color: var(--ft-gold); color: var(--on-accent); }

        .ft-bottom {
          display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px 24px;
          padding: 22px 0 26px; border-top: 1px solid var(--ft-line); font-size: 13px; color: var(--ft-text);
        }
        .ft-bottom p { margin: 0; }
        .ft-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }

        .ft-diya { animation: ft-flicker 3.2s ease-in-out infinite; }
        @keyframes ft-flicker { 0%, 100% { opacity: 1; } 45% { opacity: .55; } 60% { opacity: .9; } }
        .ft-plane { transform: translate(980px, 30px); animation: ft-fly 24s linear -4s infinite; }
        @keyframes ft-fly {
          0% { transform: translate(-60px, 48px); }
          40% { transform: translate(700px, 22px); }
          88% { transform: translate(1700px, 38px); }
          100% { transform: translate(1700px, 38px); }
        }
        .ft-boat { transform: translate(560px, ${WATERLINE}px); animation: ft-row 75s linear -30s infinite; }
        @keyframes ft-row { from { transform: translate(-90px, ${WATERLINE}px); } to { transform: translate(1530px, ${WATERLINE}px); } }
        .ft-flock { transform: translate(380px, 62px); animation: ft-flock 42s linear -12s infinite; }
        @keyframes ft-flock {
          0% { transform: translate(1520px, 76px); }
          50% { transform: translate(720px, 58px); }
          100% { transform: translate(-160px, 70px); }
        }
        .ft-wing { transform-box: fill-box; transform-origin: center bottom; animation: ft-flap .7s ease-in-out infinite alternate; }
        @keyframes ft-flap { from { transform: scaleY(1); } to { transform: scaleY(-0.5); } }
        .ft-bob { animation: ft-bob 3.4s ease-in-out infinite alternate; }
        @keyframes ft-bob { from { transform: translateY(0) rotate(0deg); } to { transform: translateY(1.5px) rotate(-1deg); } }
        @media (prefers-reduced-motion: reduce) {
          .ft-diya, .ft-plane, .ft-boat, .ft-bob, .ft-flock, .ft-wing { animation: none; }
          .ft-btn:hover { transform: none; }
        }

        /* Keep the copyright line clear of the fixed WhatsApp / back-to-top buttons (bottom-right),
           which overlap the content column below ~1280px. */
        @media (max-width: 1280px) {
          .ft-bottom { padding-right: 80px; }
        }
        @media (max-width: 1024px) {
          .ft-grid { grid-template-columns: repeat(3, 1fr); }
          .ft-about { grid-column: 1 / -1; }
          .ft-contact-col { grid-column: span 3; }
        }
        @media (max-width: 860px) {
          .ft-cta { flex-direction: column; align-items: flex-start; gap: 24px; }
        }
        @media (max-width: 640px) {
          /* only the middle third of the scene fits, so the travellers pass through it more often */
          .ft-plane { animation-duration: 13s; }
          .ft-flock { animation-duration: 24s; }
          .ft-boat { animation-duration: 45s; }
          .ft-body { padding: 0 20px; }
          .ft-cta { padding: 20px 0 36px; }
          .ft-cta-actions, .ft-btn { width: 100%; justify-content: center; }
          .ft-grid { grid-template-columns: 1fr 1fr; gap: 36px 24px; padding: 40px 0 36px; }
          .ft-contact-col { grid-column: 1 / -1; }
          .ft-bottom { flex-direction: column; align-items: flex-start; padding-bottom: 96px; }
        }
      `}</style>

      <GhatSkyline />

      {/* Only the navy body is dark: the skyline's sky is the light page background. */}
      <div className="ft-body" data-header-tone="dark">
        <div className="ft-inner">
          <div className="ft-cta">
            <div>
              <h2>{t("footer.ctaTitle")}</h2>
              <p>{t("footer.ctaText")}</p>
            </div>
            <div className="ft-cta-actions">
              <Link href="/plan-trip" className="ft-btn ft-btn-primary">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 4L3 6.5v13.5l6-2.5 6 2.5 6-2.5V4l-6 2.5zM9 4v13.5M15 6.5V20" />
                </svg>
                {t("footer.ctaPlan")}
              </Link>
              <a href={waHref} className="ft-btn ft-btn-ghost" target="_blank" rel="noopener noreferrer" aria-label={t("footer.whatsappAria")}>
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm0 18.2a8.2 8.2 0 01-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1112 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 01-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 00-.7.3 2.9 2.9 0 00-.9 2.2 5.1 5.1 0 001 2.7 11.7 11.7 0 004.5 4c1.7.7 2.3.8 3.2.7a2.7 2.7 0 001.8-1.3 2.2 2.2 0 00.2-1.3c-.1-.1-.3-.2-.5-.3z" />
                </svg>
                {t("footer.ctaWhatsApp")}
              </a>
            </div>
          </div>

          <div className="ft-grid">
            <div className="ft-about">
              <a href={sectionHref("#home")} className="ft-brand">
                <Image src="/images/atlas-logo.jpeg" alt="" width={40} height={40} />
                <span>Atlas<b>Tours</b></span>
              </a>
              <p className="ft-desc">{t("footer.description")}</p>
              <div className="ft-partner">
                <p>{t("footer.partner")}</p>
                <HotelPartnerLogo ariaLabel={t("footer.partnerAria")} />
              </div>
            </div>

            <nav aria-labelledby="ft-explore">
              <h3 id="ft-explore">{t("footer.quickLinks")}</h3>
              <ul>
                {exploreLinks.map((l) => (
                  <li key={l.href}>
                    <a href={sectionHref(l.href)} className="ft-link">{t(l.label)}</a>
                  </li>
                ))}
              </ul>
            </nav>

            <nav aria-labelledby="ft-tours">
              <h3 id="ft-tours">{t("footer.services")}</h3>
              <ul>
                {tourLinks.map((l) => (
                  <li key={l.label}>
                    {l.href.startsWith("#") ? (
                      <a href={sectionHref(l.href)} className="ft-link">{t(l.label)}</a>
                    ) : (
                      <Link href={l.href} className="ft-link">{t(l.label)}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>

            <nav aria-labelledby="ft-trip">
              <h3 id="ft-trip">{t("footer.yourTrip")}</h3>
              <ul>
                {tripLinks.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="ft-link">{t(l.label)}</Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="ft-contact-col">
              <h3>{t("footer.contactInfo")}</h3>
              <div className="ft-contact">
                <a href={`tel:${SITE_CONFIG.phone}`} className="ft-link">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .4 1.9.7 2.8a2 2 0 01-.5 2.1L8.1 9.9a16 16 0 006 6l1.3-1.3a2 2 0 012.1-.4c.9.3 1.9.6 2.8.7a2 2 0 011.7 2z" />
                  </svg>
                  <span><span className="ft-sr">{t("common.phone")}: </span>{PHONE_DISPLAY}</span>
                </a>
                <a href={`mailto:${SITE_CONFIG.email}`} className="ft-link">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M22 6l-10 7L2 6" />
                  </svg>
                  <span><span className="ft-sr">{t("common.email")}: </span>{SITE_CONFIG.email}</span>
                </a>
                <a href={mapHref} className="ft-link" target="_blank" rel="noopener noreferrer" aria-label={t("footer.mapAria", { address: SITE_CONFIG.address })}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span>{SITE_CONFIG.address}</span>
                </a>
              </div>
              {SOCIAL_LINKS.length > 0 && (
                <div className="ft-socials">
                  {SOCIAL_LINKS.map((s) => (
                    <a
                      key={s.name}
                      href={s.href}
                      className="ft-social"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={t("footer.socialAria", { name: s.name })}
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">{SOCIAL_ICONS[s.name]}</svg>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="ft-bottom">
            <p>{t("footer.copyright", { year })}</p>
            <p>{t("footer.tagline")}</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
