import React from "react";
import { HOTEL_PARTNER } from "@/lib/config";

/**
 * Hotel Ganga Imperial wordmark, as on the hotel's own site (it has no image logo):
 * small letter-spaced "HOTEL" in brass above "Ganga Imperial" in Marcellus, cream on the
 * hotel's night navy. Fixed brand colours on purpose: the badge looks the same in both
 * themes, like a logo. Always a link to the hotel website (new tab).
 */
const HotelPartnerLogo: React.FC<{ ariaLabel: string; size?: "sm" | "md" }> = ({ ariaLabel, size = "md" }) => (
  <a
    href={HOTEL_PARTNER.url}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={ariaLabel}
    className={`hotel-logo hotel-logo-${size}`}
  >
    <style>{`
      .hotel-logo {
        display: inline-flex; align-items: center; gap: 12px;
        background: #121827; border: 1px solid rgba(201,161,91,0.55); border-radius: 12px;
        padding: 10px 16px; text-decoration: none; line-height: 1.1;
        font-family: var(--font-marcellus), 'Marcellus', Georgia, serif; font-weight: 400;
        box-shadow: 0 6px 18px rgba(18,24,39,0.25);
        transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
      }
      .hotel-logo:hover { border-color: #e2c68e; transform: translateY(-2px); box-shadow: 0 10px 24px rgba(18,24,39,0.35); }
      .hotel-logo .hl-text { display: flex; flex-direction: column; }
      .hotel-logo .hl-small { color: #c9a15b; letter-spacing: 0.42em; font-size: 10px; margin-bottom: 3px; }
      .hotel-logo .hl-name { color: #f4e6c6; letter-spacing: 0.14em; font-size: 18px; text-shadow: 0 0 18px rgba(226,198,142,0.35); white-space: nowrap; }
      .hotel-logo .hl-icon { color: #c9a15b; flex-shrink: 0; width: 30px; height: 30px; padding-right: 12px; border-right: 1px solid rgba(201,161,91,0.4); box-sizing: content-box; }
      .hotel-logo-sm { padding: 8px 12px; gap: 10px; }
      .hotel-logo-sm .hl-icon { width: 24px; height: 24px; padding-right: 10px; }
      .hotel-logo-sm .hl-small { font-size: 9px; }
      .hotel-logo-sm .hl-name { font-size: 15px; }
    `}</style>
    {/* Hotel building: tower with windows, arched entrance and a pennant on the roof. */}
    <svg className="hl-icon" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 2v4" />
      <path d="M16 2.5l4 1.3-4 1.3" fill="currentColor" />
      <path d="M7 30V8.5L16 6l9 2.5V30" />
      <path d="M3 30h26" />
      <path d="M11 12h2.5M18.5 12H21M11 16.5h2.5M18.5 16.5H21M11 21h2.5M18.5 21H21" />
      <path d="M13.5 30v-4.5a2.5 2.5 0 015 0V30" />
    </svg>
    <span className="hl-text" aria-hidden="true">
      <span className="hl-small">HOTEL</span>
      <span className="hl-name">Ganga Imperial</span>
    </span>
  </a>
);

export default HotelPartnerLogo;
