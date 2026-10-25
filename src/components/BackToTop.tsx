"use client";

import React, { useState, useEffect } from "react";

const BackToTop: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 500);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const styles: Record<string, React.CSSProperties> = {
    button: {
      position: "fixed",
      bottom: 96,
      right: 28,
      zIndex: 899,
      width: 48,
      height: 48,
      borderRadius: "50%",
      background: "linear-gradient(135deg, #1a3a6b, #2a5ba8)",
      color: "#fff",
      border: "none",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 4px 20px rgba(26,58,107,0.35)",
      opacity: visible ? 1 : 0,
      visibility: visible ? "visible" : "hidden",
      transform: visible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.8)",
      transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
      fontFamily: "'Poppins', sans-serif",
    },
  };

  return (
    <>
      <style>{`
        .back-to-top-btn:hover {
          transform: translateY(-4px) scale(1.1) !important;
          box-shadow: 0 8px 30px rgba(26,58,107,0.5) !important;
          background: linear-gradient(135deg, #e67e22, #f39c12) !important;
        }
      `}</style>
      <button
        className="back-to-top-btn"
        style={styles.button}
        onClick={scrollToTop}
        aria-label="Back to top"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 15l-6-6-6 6" />
        </svg>
      </button>
    </>
  );
};

export default BackToTop;
