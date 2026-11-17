"use client";
import { useEffect } from "react";

/**
 * Scroll-reveal driver for the home page (moved out of page.tsx in F-02 so the
 * page itself can be a server component). Adds `visible`/`active` to any
 * reveal-class element once it scrolls into view. Renders nothing.
 */
export default function RevealObserver() {
  useEffect(() => {
    // Scroll reveal observer
    const REVEAL_SELECTOR = ".fade-in, .reveal, .reveal-left, .reveal-right, .reveal-scale";
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("visible", "active");
        }
      }),
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    const observed = new WeakSet<Element>();
    const observeReveal = (el: Element) => {
      if (observed.has(el) || el.classList.contains("visible")) return;
      observed.add(el);
      observer.observe(el);
    };
    document.querySelectorAll(REVEAL_SELECTOR).forEach(observeReveal);

    // Elements mounted after this effect (e.g. modals, or sections whose data
    // changes client-side) are observed as they are added.
    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((m) => m.addedNodes.forEach((node) => {
        if (!(node instanceof Element)) return;
        if (node.matches(REVEAL_SELECTOR)) observeReveal(node);
        node.querySelectorAll(REVEAL_SELECTOR).forEach(observeReveal);
      }));
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  return null;
}
