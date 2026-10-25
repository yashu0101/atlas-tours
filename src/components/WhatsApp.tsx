"use client";

import React, { useState } from "react";

const WhatsApp: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const phoneNumber = "916388360881";

  const sendMessage = () => {
    const text = encodeURIComponent(
      message || "Hello! I am interested in your tour packages."
    );
    window.open(`https://wa.me/${phoneNumber}?text=${text}`, "_blank");
    setMessage("");
    setOpen(false);
  };

  const styles: Record<string, React.CSSProperties> = {
    wrapper: {
      position: "fixed",
      bottom: 24,
      right: 24,
      zIndex: 900,
      fontFamily: "'Poppins', sans-serif",
    },
    fab: {
      width: 60,
      height: 60,
      borderRadius: "50%",
      background: "#25D366",
      border: "none",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 6px 25px rgba(37,211,102,0.45)",
      transition: "all 0.3s",
      position: "relative" as const,
    },
    pulse: {
      position: "absolute" as const,
      width: "100%",
      height: "100%",
      borderRadius: "50%",
      border: "2px solid #25D366",
      top: 0,
      left: 0,
      animation: "wa-pulse 2s infinite",
      pointerEvents: "none" as const,
    },
    popup: {
      position: "absolute" as const,
      bottom: 72,
      right: 0,
      width: 320,
      borderRadius: 16,
      overflow: "hidden",
      boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
      transform: open ? "scale(1)" : "scale(0)",
      transformOrigin: "bottom right",
      opacity: open ? 1 : 0,
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    },
    popupHeader: {
      background: "#075E54",
      padding: "18px 20px",
      display: "flex",
      alignItems: "center",
      gap: 12,
    },
    headerAvatar: {
      width: 42,
      height: 42,
      borderRadius: "50%",
      background: "#25D366",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    headerInfo: {
      flex: 1,
    },
    headerName: {
      color: "#fff",
      fontSize: 15,
      fontWeight: 600,
    },
    headerStatus: {
      color: "rgba(255,255,255,0.7)",
      fontSize: 12,
    },
    closeBtn: {
      background: "none",
      border: "none",
      color: "rgba(255,255,255,0.7)",
      fontSize: 20,
      cursor: "pointer",
      padding: 4,
    },
    popupBody: {
      background: "#e5ddd5",
      padding: 20,
      minHeight: 100,
    },
    bubble: {
      background: "#fff",
      borderRadius: "12px 12px 12px 0",
      padding: "12px 16px",
      fontSize: 14,
      color: "#333",
      lineHeight: 1.5,
      maxWidth: "85%",
      boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
    },
    bubbleTime: {
      fontSize: 11,
      color: "#999",
      marginTop: 4,
      textAlign: "right" as const,
    },
    popupFooter: {
      background: "#fff",
      padding: "12px 16px",
      display: "flex",
      gap: 10,
      alignItems: "center",
    },
    input: {
      flex: 1,
      padding: "10px 16px",
      borderRadius: 24,
      border: "1px solid #e0e0e0",
      fontSize: 14,
      fontFamily: "'Poppins', sans-serif",
      outline: "none",
    },
    sendBtn: {
      width: 40,
      height: 40,
      borderRadius: "50%",
      background: "#25D366",
      border: "none",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    notifDot: {
      position: "absolute" as const,
      top: -2,
      right: -2,
      width: 18,
      height: 18,
      borderRadius: "50%",
      background: "#e74c3c",
      fontSize: 10,
      fontWeight: 700,
      color: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      border: "2px solid #fff",
    },
  };

  return (
    <div style={styles.wrapper}>
      <style>{`
        @keyframes wa-pulse {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .wa-fab:hover { transform: scale(1.1); }
      `}</style>

      {/* Popup */}
      <div style={styles.popup}>
        <div style={styles.popupHeader}>
          <div style={styles.headerAvatar}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
            </svg>
          </div>
          <div style={styles.headerInfo}>
            <div style={styles.headerName}>Atlas Tours</div>
            <div style={styles.headerStatus}>Typically replies instantly</div>
          </div>
          <button style={styles.closeBtn} onClick={() => setOpen(false)}>
            &#10005;
          </button>
        </div>
        <div style={styles.popupBody}>
          <div style={styles.bubble}>
            Hello! Welcome to Atlas Tours. How can we help you plan your trip?
            <div style={styles.bubbleTime}>Now</div>
          </div>
        </div>
        <div style={styles.popupFooter}>
          <input
            style={styles.input}
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button style={styles.sendBtn} onClick={sendMessage}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* FAB */}
      <button
        className="wa-fab"
        style={styles.fab}
        onClick={() => setOpen(!open)}
        aria-label="Chat on WhatsApp"
      >
        {!open && <div style={styles.pulse} />}
        {!open && <span style={styles.notifDot}>1</span>}
        <svg width="30" height="30" viewBox="0 0 24 24" fill="#fff">
          {open ? (
            <path d="M18 6L6 18M6 6l12 12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          ) : (
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" />
          )}
        </svg>
      </button>
    </div>
  );
};

export default WhatsApp;
