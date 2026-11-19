"use client";
import RevealWords from "@/components/RevealWords";

import React from "react";
import SmartImage from "@/components/SmartImage";
import { TEAM_MEMBERS } from "@/lib/team";
import { useT } from "@/lib/i18n/use-t";

/**
 * "Our Team" section. Members are fixed in src/lib/team.ts (not admin-editable).
 * One row per person: photo on one side, text beside it, alternating sides on wide
 * screens; photo above text on phones. Photos keep their own aspect ratio (no crop) and
 * sit on the offset orange frame used in About.
 */
const Team: React.FC = () => {
  const t = useT();

  const styles: Record<string, React.CSSProperties> = {
    section: {
      padding: "100px 24px",
      fontFamily: "'Poppins', sans-serif",
      background: "var(--bg2)",
    },
    header: {
      textAlign: "center",
      marginBottom: 80,
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
      marginBottom: 12,
    },
    heading: {
      fontSize: "clamp(28px, 4vw, 40px)",
      fontWeight: 800,
      color: "var(--primary)",
      marginBottom: 12,
    },
    accent: {
      color: "var(--orange-text)",
    },
    subheading: {
      fontSize: 16,
      color: "var(--text2)",
      maxWidth: 520,
      margin: "0 auto",
    },
    list: {
      maxWidth: 1000,
      margin: "0 auto",
      display: "flex",
      flexDirection: "column",
    },
    figure: {
      position: "relative",
      margin: 0,
      width: "100%",
    },
    photo: {
      position: "relative",
      zIndex: 1,
      borderRadius: 20,
      overflow: "hidden",
      lineHeight: 0,
    },
    frame: {
      position: "absolute",
      inset: 0,
      border: "4px solid #e67e22",
      borderRadius: 20,
      zIndex: 0,
    },
    name: {
      fontSize: "clamp(26px, 3.2vw, 34px)",
      fontWeight: 800,
      color: "var(--primary)",
      lineHeight: 1.2,
      margin: 0,
    },
    role: {
      fontSize: 17,
      fontWeight: 600,
      color: "var(--orange-text)",
      margin: "8px 0 0",
    },
    org: {
      fontSize: 15,
      fontWeight: 500,
      color: "var(--orange-text)",
      margin: "6px 0 0",
    },
    desc: {
      fontSize: 16,
      lineHeight: 1.8,
      color: "var(--text2)",
      margin: "20px 0 0",
      maxWidth: "42ch",
    },
  };

  return (
    <section id="team" style={styles.section}>
      <style>{`
        #team .team-row {
          display: grid;
          grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
          align-items: center;
          column-gap: 72px;
        }
        #team .team-row + .team-row { margin-top: 110px; }
        #team .team-row.flip { grid-template-columns: minmax(0, 6fr) minmax(0, 5fr); }
        #team .team-row.flip .team-figure { order: 2; }
        /* Frame offset away from the text column. */
        #team .team-frame { transform: translate(-20px, 20px); }
        #team .team-row.flip .team-frame { transform: translate(20px, 20px); }
        #team .team-row.flip .team-text { justify-self: end; }
        @media (max-width: 768px) {
          #team .team-row, #team .team-row.flip { grid-template-columns: 1fr; row-gap: 36px; }
          #team .team-row + .team-row { margin-top: 72px; }
          #team .team-row.flip .team-figure { order: 0; }
          #team .team-row.flip .team-text { justify-self: start; }
          #team .team-figure { max-width: 420px; justify-self: center; }
          #team .team-frame, #team .team-row.flip .team-frame { transform: translate(12px, 12px); }
        }
      `}</style>

      <div className="reveal" style={styles.header}>
        <span style={styles.badge}>{t("team.badge")}</span>
        <h2 className="heading-line" style={styles.heading}>
          <RevealWords text={t("team.heading")} />{" "}
          <span style={styles.accent}>
            <RevealWords text={t("team.headingAccent")} start={t("team.heading").split(/\s+/).length} />
          </span>
        </h2>
        <p style={styles.subheading}>{t("team.subheading")}</p>
      </div>

      <div style={styles.list}>
        {TEAM_MEMBERS.map((m, i) => {
          const flip = i % 2 === 1;
          return (
            <article key={m.id} className={`team-row${flip ? " flip" : ""}`}>
              <figure className={`team-figure ${flip ? "reveal-right" : "reveal-left"}`} style={styles.figure}>
                <div className="team-frame" style={styles.frame} aria-hidden="true" />
                <div style={styles.photo}>
                  <SmartImage
                    src={m.image}
                    alt={t(m.alt)}
                    width={m.width}
                    height={m.height}
                    sizes="(max-width: 768px) min(420px, 100vw), 460px"
                    style={{ width: "100%", height: "auto", display: "block" }}
                  />
                </div>
              </figure>
              <div className={`team-text ${flip ? "reveal-left" : "reveal-right"}`}>
                {m.name ? (
                  <>
                    <h3 style={styles.name}>{m.name}</h3>
                    <p style={styles.role}>{t(m.role)}</p>
                  </>
                ) : (
                  <h3 style={styles.name}>{t(m.role)}</h3>
                )}
                {m.org && <p style={styles.org}>{t(m.org)}</p>}
                <p style={styles.desc}>{t(m.description)}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default Team;
