"use client";
import RevealWords from "@/components/RevealWords";

import React from "react";
import SmartImage from "@/components/SmartImage";
import PartnerNote from "@/components/PartnerNote";
import { useT } from "@/lib/i18n/use-t";
import { SITE_CONFIG } from "@/lib/config";

/**
 * About section. One focal element — the "Since 1983" plaque over the Varanasi photo —
 * and a quiet text column: lead line, one paragraph, a light 2×2 list (no boxed cards)
 * and the two CTAs. People (founder, GM, MD) live in Our Team and Contact, not here.
 */
const features = [
  { icon: "shield", title: "about.trustedTitle", desc: "about.trustedDesc" },
  { icon: "tag", title: "about.pricesTitle", desc: "about.pricesDesc" },
  { icon: "users", title: "about.guidesTitle", desc: "about.guidesDesc" },
  { icon: "headphones", title: "about.supportTitle", desc: "about.supportDesc" },
] as const;

const iconPaths: Record<string, string> = {
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  tag: "M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01",
  users: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
  headphones: "M3 18v-6a9 9 0 0118 0v6M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z",
};

const About: React.FC = () => {
  const t = useT();
  const s: Record<string, React.CSSProperties> = {
    section: {
      padding: "var(--section-pad) 24px calc(var(--section-pad) + 10px)",
      fontFamily: "'Poppins', sans-serif",
      background: "var(--bg2)",
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
      marginBottom: 16,
    },
    heading: {
      fontSize: "clamp(28px, 4vw, 40px)",
      fontWeight: 800,
      color: "var(--primary)",
      lineHeight: 1.25,
      marginBottom: 22,
    },
    accent: { color: "var(--orange-text)" },
    lead: {
      fontSize: "clamp(17px, 1.6vw, 19px)",
      lineHeight: 1.65,
      fontWeight: 500,
      color: "var(--text)",
      margin: "0 0 14px",
      maxWidth: "34em",
    },
    body: {
      fontSize: 15.5,
      lineHeight: 1.85,
      color: "var(--text2)",
      margin: "0 0 34px",
      maxWidth: "38em",
    },
    featureTitle: {
      fontSize: 15,
      fontWeight: 700,
      color: "var(--primary)",
      margin: "0 0 4px",
    },
    featureDesc: {
      fontSize: 13.5,
      color: "var(--text2)",
      lineHeight: 1.6,
      margin: 0,
    },
    btnPrimary: {
      background: "linear-gradient(135deg, #e67e22, #f39c12)",
      color: "var(--on-accent)",
      borderRadius: 28,
      padding: "12px 32px",
      fontSize: 15,
      fontWeight: 600,
      textDecoration: "none",
      boxShadow: "0 6px 20px rgba(230,126,34,0.35)",
    },
    btnOutline: {
      color: "var(--primary)",
      border: "2px solid var(--primary)",
      borderRadius: 28,
      padding: "10px 30px",
      fontSize: 15,
      fontWeight: 600,
      textDecoration: "none",
    },
  };

  return (
    <section id="about" style={s.section}>
      <style>{`
        #about .ab-wrap {
          max-width: 1180px; margin: 0 auto;
          display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
          gap: clamp(48px, 6vw, 88px); align-items: center;
        }
        #about .ab-media { position: relative; padding: 0 0 56px 0; }
        #about .ab-photo {
          border-radius: 22px; overflow: hidden; aspect-ratio: 4 / 5;
          box-shadow: 0 24px 60px rgba(26,58,107,0.18); position: relative;
        }
        #about .ab-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
        /* The one bold element: founding-year plaque overlapping the photo. */
        #about .ab-plaque {
          position: absolute; right: -28px; bottom: 0;
          width: min(260px, 70%);
          background: linear-gradient(155deg, #1a3a6b 0%, #0f2547 100%);
          color: #fff; border-radius: 18px; padding: 22px 24px 22px;
          box-shadow: 0 20px 44px rgba(10,22,40,0.35);
          border-left: 4px solid #e67e22;
        }
        #about .ab-plaque-since { font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.78); margin: 0; }
        #about .ab-plaque-year {
          font-size: clamp(52px, 6vw, 68px); font-weight: 800; line-height: 1;
          letter-spacing: -0.03em; color: var(--gold-text); margin: 2px 0 10px;
        }
        #about .ab-plaque-note { font-size: 13.5px; line-height: 1.5; color: rgba(255,255,255,0.88); margin: 0; }
        #about .ab-features {
          display: grid; grid-template-columns: 1fr 1fr; column-gap: 32px;
          margin: 0 0 38px; padding: 0; list-style: none;
        }
        #about .ab-feature {
          display: flex; gap: 14px; align-items: flex-start;
          padding: 18px 0; border-top: 1px solid rgba(101,112,113,0.22);
        }
        #about .ab-icon {
          width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          background: rgba(230,126,34,0.12); color: #e67e22;
        }
        #about .ab-ctas { display: flex; gap: 14px; flex-wrap: wrap; align-items: center; }
        #about .ab-ctas a { transition: transform 0.2s, box-shadow 0.2s; }
        #about .ab-ctas a:hover { transform: translateY(-2px); }
        [data-theme="dark"] #about .ab-icon { background: rgba(243,156,18,0.14); color: #f6b144; }
        [data-theme="dark"] #about .ab-feature { border-top-color: rgba(148,163,184,0.2); }
        @media (max-width: 920px) {
          #about .ab-wrap { grid-template-columns: 1fr; }
          #about .ab-media { max-width: 460px; margin: 0 auto; width: 100%; }
          #about .ab-plaque { right: -8px; }
        }
        @media (max-width: 560px) {
          #about .ab-features { grid-template-columns: 1fr; }
          #about .ab-photo { aspect-ratio: 4 / 4.4; }
          #about .ab-plaque { right: 12px; width: min(240px, 78%); padding: 18px 20px; }
        }
      `}</style>

      <div className="ab-wrap">
        <div className="ab-media reveal-left">
          <div className="ab-photo img-zoom about-img-3d">
            <SmartImage
              src="https://images.unsplash.com/photo-1561359313-0639aad49ca6?w=900&q=75"
              alt={t("about.imageAlt")}
              width={900}
              height={1125}
              sizes="(max-width: 920px) 460px, 520px"
            />
          </div>
          <div className="ab-plaque">
            <p className="ab-plaque-since">{t("about.plaqueSince")}</p>
            <p className="ab-plaque-year">{SITE_CONFIG.established}</p>
            <p className="ab-plaque-note">{t("about.plaqueNote")}</p>
          </div>
        </div>

        <div className="reveal-right">
          <span style={s.badge}>{t("about.badge")}</span>
          <h2 className="heading-line line-left" style={s.heading}>
            <RevealWords text={t("about.heading")} />{" "}
            <span style={s.accent}>
              <RevealWords text={t("about.headingAccent")} start={t("about.heading").split(/\s+/).length} />
            </span>
          </h2>
          <p style={s.lead}>{t("about.lead")}</p>
          <p style={s.body}>{t("about.body")}</p>

          <ul className="ab-features">
            {features.map((f) => (
              <li key={f.title} className="ab-feature">
                <span className="ab-icon" aria-hidden="true">
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={iconPaths[f.icon]} />
                  </svg>
                </span>
                <div>
                  <h3 style={s.featureTitle}>{t(f.title)}</h3>
                  <p style={s.featureDesc}>{t(f.desc)}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="ab-ctas">
            <a href="#packages" style={s.btnPrimary}>{t("about.explorePackages")}</a>
            <a href="#contact" style={s.btnOutline}>{t("about.getInTouch")}</a>
          </div>
          <PartnerNote label={t("partner.about")} newTabLabel={t("partner.newTab")} style={{ marginTop: 24 }} />
        </div>
      </div>
    </section>
  );
};

export default About;
