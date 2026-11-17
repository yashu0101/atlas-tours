import type { PartialMessages } from "./index";

/**
 * Hindi UI copy (G-08). Partial on purpose: any key left out falls back to English.
 *
 * Only strings the site already had in Hindi are here. The client has not supplied the rest yet —
 * docs/hindi-strings-needed.md lists every missing key with its English text. Do not machine-translate.
 * Escapes keep the exact code points the old inline ternaries used (readable form in the comments).
 */
export const hi: PartialMessages = {
  header: {
    nav: {
      home: "होम", // होम
      about: "हमारे बारे में", // हमारे बारे में
      packages: "पैकेज", // पैकेज
      gallery: "गैलरी", // गैलरी
      blog: "ब्लॉग", // ब्लॉग
      faq: "सवाल", // सवाल
      contact: "संपर्क", // संपर्क
    },
    // The switch names the language you switch TO, so in Hindi mode it reads "EN".
    langToggle: "EN",
    callNow: "कॉल करें", // कॉल करें
  },
};
