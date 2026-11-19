"use client";
import RevealWords from "@/components/RevealWords";

import React, { useState, useEffect, useRef } from "react";
import type { FAQ as FAQItem } from "@/lib/types";
import { useApp } from "@/lib/context";
import { useT } from "@/lib/i18n/use-t";

const FAQAccordionItem: React.FC<{
  faq: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
}> = ({ faq, isOpen, onToggle }) => {
  const { lang } = useApp();
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  // C-06: show Hindi when selected and present, else English. `lang` starts as "en" on both the
  // server and the first client render (AppProvider reads localStorage in an effect), so no hydration mismatch.
  const useHindi = lang === "hi";
  const question = (useHindi && faq.questionHi?.trim()) || faq.question;
  const answer = (useHindi && faq.answerHi?.trim()) || faq.answer;

  // Re-measure when the answer text changes (language switch) so an open panel isn't clipped.
  useEffect(() => {
    if (contentRef.current) {
      setHeight(isOpen ? contentRef.current.scrollHeight : 0);
    }
  }, [isOpen, answer]);

  const styles: Record<string, React.CSSProperties> = {
    item: {
      background: "var(--card-bg)",
      borderRadius: 14,
      marginBottom: 14,
      boxShadow: isOpen
        ? "0 8px 30px rgba(230,126,34,0.12)"
        : "0 2px 10px rgba(0,0,0,0.04)",
      border: isOpen ? "1px solid rgba(230,126,34,0.3)" : "1px solid var(--bg3)",
      transition: "all 0.3s ease",
      overflow: "hidden",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "20px 24px",
      cursor: "pointer",
      gap: 16,
      background: "none",
      border: "none",
      width: "100%",
      textAlign: "left",
      fontFamily: "'Poppins', sans-serif",
    },
    question: {
      fontSize: 16,
      fontWeight: 600,
      color: isOpen ? "var(--orange-text)" : "var(--text)",
      transition: "color 0.3s",
      flex: 1,
    },
    icon: {
      width: 32,
      height: 32,
      borderRadius: "50%",
      background: isOpen
        ? "linear-gradient(135deg, #e67e22, #f39c12)"
        : "var(--faq-icon-bg, rgba(26,58,107,0.08))",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 20,
      color: isOpen ? "var(--on-accent)" : "var(--primary)",
      fontWeight: 300,
      flexShrink: 0,
      transition: "all 0.3s",
    },
    contentWrap: {
      height,
      overflow: "hidden",
      transition: "height 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
    },
    answer: {
      padding: "0 24px 20px",
      fontSize: 15,
      lineHeight: 1.8,
      color: "var(--text2)",
    },
  };

  return (
    <div style={styles.item}>
      <button
        style={styles.header}
        onClick={onToggle}
        id={`faq-button-${faq.id}`}
        aria-expanded={isOpen}
        aria-controls={`faq-panel-${faq.id}`}
      >
        <span style={styles.question} lang={useHindi && question !== faq.question ? "hi" : undefined}>{question}</span>
        <span style={styles.icon} aria-hidden="true">{isOpen ? "\u2212" : "+"}</span>
      </button>
      <div
        style={styles.contentWrap}
        id={`faq-panel-${faq.id}`}
        role="region"
        aria-labelledby={`faq-button-${faq.id}`}
      >
        <div ref={contentRef}>
          <p style={styles.answer} lang={useHindi && answer !== faq.answer ? "hi" : undefined}>{answer}</p>
        </div>
      </div>
    </div>
  );
};

/** FAQs are loaded on the server (F-02) and passed in already filtered for public visibility. */
const FAQ: React.FC<{ initialFaqs: FAQItem[] }> = ({ initialFaqs }) => {
  const faqs = initialFaqs;
  const t = useT();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const styles: Record<string, React.CSSProperties> = {
    section: {
      padding: "var(--section-pad) 24px",
      fontFamily: "'Poppins', sans-serif",
      background: "var(--bg2)",
    },
    header: {
      textAlign: "center",
      marginBottom: 50,
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
    subheading: {
      fontSize: 16,
      color: "var(--text2)",
      maxWidth: 500,
      margin: "0 auto",
    },
    list: {
      maxWidth: 750,
      margin: "0 auto",
    },
  };

  return (
    <section id="faq" style={styles.section}>
      <style>{`
        /* E-02: dark-mode override. Light mode uses the inline fallback (colour unchanged). */
        [data-theme="dark"] #faq { --faq-icon-bg: rgba(91,143,217,0.15); }
      `}</style>
      <div className="reveal" style={styles.header}>
        <span style={styles.badge}>{t("faq.badge")}</span>
        <h2 className="heading-line" style={styles.heading}><RevealWords text={t("faq.heading")} /></h2>
        <p style={styles.subheading}>
          {t("faq.subheading")}
        </p>
      </div>

      <div style={styles.list}>
        {faqs.map((faq, i) => (
          <div key={faq.id} className={`reveal stagger-${Math.min(i + 1, 5)}`}>
            <FAQAccordionItem
              faq={faq}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          </div>
        ))}
      </div>
    </section>
  );
};

export default FAQ;
