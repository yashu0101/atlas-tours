"use client";

import React, { useState, useEffect, useRef } from "react";

interface FAQItem {
  _id: string;
  question: string;
  answer: string;
}

const FAQAccordionItem: React.FC<{
  faq: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
}> = ({ faq, isOpen, onToggle }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(isOpen ? contentRef.current.scrollHeight : 0);
    }
  }, [isOpen]);

  const styles: Record<string, React.CSSProperties> = {
    item: {
      background: "#fff",
      borderRadius: 14,
      marginBottom: 14,
      boxShadow: isOpen
        ? "0 8px 30px rgba(230,126,34,0.12)"
        : "0 2px 10px rgba(0,0,0,0.04)",
      border: isOpen ? "1px solid rgba(230,126,34,0.3)" : "1px solid #eee",
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
      color: isOpen ? "#e67e22" : "#1a3a6b",
      transition: "color 0.3s",
      flex: 1,
    },
    icon: {
      width: 32,
      height: 32,
      borderRadius: "50%",
      background: isOpen
        ? "linear-gradient(135deg, #e67e22, #f39c12)"
        : "rgba(26,58,107,0.08)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 20,
      color: isOpen ? "#fff" : "#1a3a6b",
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
      color: "#666",
    },
  };

  return (
    <div style={styles.item}>
      <button style={styles.header} onClick={onToggle}>
        <span style={styles.question}>{faq.question}</span>
        <span style={styles.icon}>{isOpen ? "\u2212" : "+"}</span>
      </button>
      <div style={styles.contentWrap}>
        <div ref={contentRef}>
          <p style={styles.answer}>{faq.answer}</p>
        </div>
      </div>
    </div>
  );
};

const FAQ: React.FC = () => {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  useEffect(() => {
    fetch("/api/faqs")
      .then((r) => r.json())
      .then((data) => {
        setFaqs(Array.isArray(data) ? data : data.faqs || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const styles: Record<string, React.CSSProperties> = {
    section: {
      padding: "100px 24px",
      fontFamily: "'Poppins', sans-serif",
      background: "#f8f9fa",
    },
    header: {
      textAlign: "center",
      marginBottom: 50,
    },
    badge: {
      display: "inline-block",
      background: "rgba(230,126,34,0.1)",
      color: "#e67e22",
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
      color: "#1a3a6b",
      marginBottom: 12,
    },
    subheading: {
      fontSize: 16,
      color: "#777",
      maxWidth: 500,
      margin: "0 auto",
    },
    list: {
      maxWidth: 750,
      margin: "0 auto",
    },
    loader: {
      textAlign: "center",
      padding: 60,
      fontSize: 16,
      color: "#888",
    },
  };

  return (
    <section id="faq" style={styles.section}>
      <div style={styles.header}>
        <span style={styles.badge}>FAQ</span>
        <h2 style={styles.heading}>Frequently Asked Questions</h2>
        <p style={styles.subheading}>
          Find answers to common questions about our tours and services.
        </p>
      </div>

      {loading ? (
        <div style={styles.loader}>Loading FAQs...</div>
      ) : (
        <div style={styles.list}>
          {faqs.map((faq, i) => (
            <FAQAccordionItem
              key={faq._id}
              faq={faq}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default FAQ;
