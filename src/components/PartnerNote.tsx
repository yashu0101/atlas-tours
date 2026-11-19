import React from "react";
import { HOTEL_PARTNER } from "@/lib/config";
import { HotelIcon } from "@/components/HotelPartnerLogo";

const srOnly: React.CSSProperties = {
  position: "absolute", width: 1, height: 1, padding: 0, margin: -1,
  overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap", border: 0,
};

/**
 * Hotel Ganga Imperial partner card: hotel icon, a short caption, and the hotel name in its
 * Marcellus face. The whole card links to the hotel website (new tab).
 * - `light` (default): sits on the site's light/dark-theme sections. Card surface with a brass
 *   left edge, echoing the About "since 1983" plaque; colours come from the theme variables.
 * - `glass`: for the hero photo, matching the hero's glass stat cards.
 * The navy wordmark badge (HotelPartnerLogo) stays for the dark footer and the Team card.
 * Takes plain strings so server and client components can both render it.
 */
const PartnerNote: React.FC<{
  label: string;
  newTabLabel: string;
  tone?: "light" | "glass";
  className?: string;
  style?: React.CSSProperties;
}> = ({ label, newTabLabel, tone = "light", className, style }) => (
  <a
    href={HOTEL_PARTNER.url}
    target="_blank"
    rel="noopener noreferrer"
    className={`partner-note partner-note-${tone}${className ? ` ${className}` : ""}`}
    data-testid="partner-note"
    style={style}
  >
    <style>{`
      .partner-note {
        --pn-brass: #9a7535; --pn-brass-soft: rgba(201,161,91,0.16); --pn-edge: #c9a15b;
        display: inline-flex; align-items: center; gap: 14px; max-width: 100%;
        padding: 12px 18px 12px 14px; border-radius: 14px; text-decoration: none; text-align: left;
        transition: border-color 0.2s, box-shadow 0.2s, background-color 0.2s;
      }
      .partner-note-light {
        background: var(--card-bg); border: 1px solid rgba(201,161,91,0.35);
        border-left: 3px solid var(--pn-edge); box-shadow: var(--shadow);
      }
      .partner-note-light:hover { border-color: var(--pn-edge); box-shadow: var(--shadow2); }
      [data-theme="dark"] .partner-note-light { --pn-brass: #e2c68e; --pn-brass-soft: rgba(226,198,142,0.12); }
      .partner-note-glass {
        --pn-brass: #e2c68e; --pn-brass-soft: rgba(226,198,142,0.14);
        background: rgba(255,255,255,0.08); border: 1px solid rgba(226,198,142,0.4);
        backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
      }
      .partner-note-glass:hover { background: rgba(255,255,255,0.14); border-color: #e2c68e; }
      .partner-note .pn-icon {
        flex-shrink: 0; width: 42px; height: 42px; border-radius: 50%;
        display: grid; place-items: center; background: var(--pn-brass-soft); color: var(--pn-brass);
      }
      .partner-note .pn-icon svg { width: 22px; height: 22px; }
      .partner-note .pn-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
      .partner-note .pn-label { font-size: 12.5px; line-height: 1.35; font-weight: 500; }
      .partner-note .pn-name {
        display: inline-flex; align-items: center; gap: 8px;
        font-family: var(--font-marcellus), 'Marcellus', Georgia, serif; font-weight: 400;
        font-size: 18px; letter-spacing: 0.05em; line-height: 1.2;
      }
      .partner-note .pn-ext { width: 13px; height: 13px; flex-shrink: 0; opacity: 0.7; }
      .partner-note-light .pn-label { color: var(--text2); }
      .partner-note-light .pn-name { color: var(--primary); }
      .partner-note-light .pn-ext { color: var(--pn-brass); }
      .partner-note-glass .pn-label { color: rgba(255,255,255,0.82); }
      .partner-note-glass .pn-name { color: #f4e6c6; }
      .partner-note-glass .pn-ext { color: #e2c68e; }
      @media (max-width: 400px) { .partner-note .pn-name { font-size: 16px; } }
    `}</style>
    <span className="pn-icon" aria-hidden="true"><HotelIcon /></span>
    <span className="pn-text">
      <span className="pn-label">{label}</span>
      <span className="pn-name">
        {HOTEL_PARTNER.name}
        <svg className="pn-ext" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5" />
        </svg>
      </span>
    </span>
    <span style={srOnly}> {newTabLabel}</span>
  </a>
);

export default PartnerNote;
