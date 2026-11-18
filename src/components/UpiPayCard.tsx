"use client";

import React, { useEffect, useRef, useState } from "react";
import SmartImage from "@/components/SmartImage";
import { UPI_CONFIG, UPI_PAY_LINK } from "@/lib/config";
import { useT } from "@/lib/i18n/use-t";

/**
 * UPI payment details (QR, UPI ID, deep link). Used in the Contact section and,
 * `compact`, under the booking-request success message. Details live in UPI_CONFIG.
 */
const UpiPayCard: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(UPI_CONFIG.id);
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (insecure context / permissions): the ID stays visible to copy by hand.
    }
  };

  const qrWidth = compact ? 150 : 190;

  const styles: Record<string, React.CSSProperties> = {
    card: {
      display: "flex",
      gap: compact ? 16 : 22,
      alignItems: "center",
      flexWrap: "wrap",
      padding: compact ? 16 : "22px 24px",
      background: compact ? "var(--card-bg)" : "var(--bg2)",
      border: compact ? "1px solid var(--input-border)" : "1px solid transparent",
      borderRadius: 14,
      fontFamily: "'Poppins', sans-serif",
      textAlign: "left",
    },
    qrLink: {
      display: "block",
      flexShrink: 0,
      borderRadius: 10,
      overflow: "hidden",
      lineHeight: 0,
      boxShadow: "0 4px 14px rgba(0,0,0,0.12)",
    },
    info: {
      flex: "1 1 180px",
      minWidth: 0,
    },
    heading: {
      fontSize: compact ? 16 : 18,
      fontWeight: 700,
      color: "var(--primary)",
      marginBottom: 6,
    },
    text: {
      fontSize: 13,
      lineHeight: 1.6,
      color: "var(--text2)",
      marginBottom: 10,
    },
    label: {
      fontSize: 12,
      color: "var(--text2)",
      fontWeight: 500,
    },
    idRow: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      flexWrap: "wrap",
      marginBottom: 6,
    },
    idValue: {
      fontSize: 15,
      fontWeight: 600,
      color: "var(--text)",
      wordBreak: "break-all",
    },
    copyBtn: {
      background: "transparent",
      border: "1px solid var(--input-border)",
      borderRadius: 8,
      padding: "3px 10px",
      fontSize: 12,
      fontWeight: 600,
      color: "var(--orange-text)",
      cursor: "pointer",
      fontFamily: "inherit",
    },
    payBtn: {
      display: "inline-block",
      marginTop: 6,
      background: "linear-gradient(135deg, #e67e22, #f39c12)",
      color: "var(--on-accent)",
      borderRadius: 24,
      padding: "8px 20px",
      fontSize: 13,
      fontWeight: 600,
      textDecoration: "none",
    },
    note: {
      fontSize: 12,
      lineHeight: 1.6,
      color: "var(--text2)",
      marginTop: 10,
    },
  };

  return (
    <div style={styles.card}>
      <a
        href={UPI_CONFIG.qrImage}
        target="_blank"
        rel="noopener noreferrer"
        style={styles.qrLink}
        aria-label={t("upi.viewFull")}
      >
        <SmartImage
          src={UPI_CONFIG.qrImage}
          alt={t("upi.qrAlt", { payee: UPI_CONFIG.payee, id: UPI_CONFIG.id })}
          width={qrWidth}
          height={Math.round((qrWidth * 1478) / 1064)}
          sizes={`${qrWidth}px`}
          style={{ display: "block", width: qrWidth, height: "auto" }}
        />
      </a>
      <div style={styles.info}>
        <div style={styles.heading}>{t("upi.heading")}</div>
        <p style={styles.text}>{t("upi.scanText")}</p>
        <div style={styles.label}>{t("upi.idLabel")}</div>
        <div style={styles.idRow}>
          <span style={styles.idValue}>{UPI_CONFIG.id}</span>
          <button type="button" onClick={copyId} style={styles.copyBtn}>
            {copied ? t("upi.copied") : t("upi.copy")}
          </button>
          <span role="status" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" }}>{copied ? t("upi.copied") : ""}</span>
        </div>
        <div style={styles.label}>
          {t("upi.payeeLabel")}: <span style={{ color: "var(--text)", fontWeight: 600 }}>{UPI_CONFIG.payee}</span>
        </div>
        <a href={UPI_PAY_LINK} style={styles.payBtn}>{t("upi.openApp")}</a>
        <p style={styles.note}>{t("upi.note")}</p>
      </div>
    </div>
  );
};

export default UpiPayCard;
