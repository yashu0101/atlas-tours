"use client";
import { useEffect } from "react";

const REVEAL_SELECTOR =
  ".fade-in, .reveal, .reveal-left, .reveal-right, .reveal-scale, .reveal-blur, .reveal-wipe, .reveal-words";
/** Elements whose look follows the scroll position (CSS reads the variables written below). */
const SCROLL_SELECTOR = "[data-parallax], .scroll-zoom, .heading-line";

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

/**
 * Scroll animation driver (moved out of page.tsx in F-02 so the page itself can be a
 * server component). Renders nothing.
 *
 * 1. Reveal: adds `visible`/`active` to any reveal-class element once it scrolls into view.
 * 2. Scroll-linked effects, written as CSS variables on the element (one passive scroll
 *    listener, at most one rAF per frame, only for elements near the viewport):
 *    - `[data-parallax="0.3"]`: `--py` = how far its parent has scrolled past the viewport
 *      top × speed (so a hero at the top of the page starts at 0), and `--out` 0…1 = how much
 *      of the parent has scrolled out. The element must be inside an `overflow: hidden` parent
 *      and be tall enough to cover the gap it leaves.
 *    - `.scroll-zoom` / `.heading-line`: `--sp` 0…1, the progress of the element's top from
 *      the viewport bottom to 55% (zoom) / 70% (heading underline) of the viewport height.
 *    With reduced motion none of this runs and the CSS fallbacks (final state) apply.
 */
export default function RevealObserver() {
  useEffect(() => {
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

    // --- Scroll-linked effects ---
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const near = new Set<HTMLElement>();
    const tracked = new WeakSet<Element>();
    let frame = 0;

    const update = () => {
      frame = 0;
      const vh = window.innerHeight;
      near.forEach((el) => {
        if (el.hasAttribute("data-parallax")) {
          const speed = parseFloat(el.dataset.parallax ?? "") || 0;
          const parent = el.parentElement;
          if (!parent) return;
          const r = parent.getBoundingClientRect();
          el.style.setProperty("--py", `${(-r.top * speed).toFixed(1)}px`);
          el.style.setProperty("--out", clamp01(-r.top / Math.max(r.height, 1)).toFixed(3));
        } else {
          const end = el.classList.contains("scroll-zoom") ? 0.55 : 0.7;
          const top = el.getBoundingClientRect().top;
          el.style.setProperty("--sp", clamp01((vh - top) / (vh * (1 - end))).toFixed(3));
        }
      });
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    const nearObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const el = e.target as HTMLElement;
          if (e.isIntersecting) near.add(el);
          else near.delete(el);
        });
        schedule();
      },
      // Start a little before the element enters, so it is in its start state when it appears.
      { rootMargin: "25% 0px 25% 0px" }
    );
    const trackScroll = (el: Element) => {
      if (reduceMotion || tracked.has(el)) return;
      tracked.add(el);
      nearObserver.observe(el);
    };
    document.querySelectorAll(SCROLL_SELECTOR).forEach(trackScroll);
    if (!reduceMotion) {
      window.addEventListener("scroll", schedule, { passive: true });
      window.addEventListener("resize", schedule, { passive: true });
    }

    // Elements mounted after this effect (e.g. modals, or sections whose data
    // changes client-side) are observed as they are added.
    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((m) => m.addedNodes.forEach((node) => {
        if (!(node instanceof Element)) return;
        if (node.matches(REVEAL_SELECTOR)) observeReveal(node);
        node.querySelectorAll(REVEAL_SELECTOR).forEach(observeReveal);
        if (node.matches(SCROLL_SELECTOR)) trackScroll(node);
        node.querySelectorAll(SCROLL_SELECTOR).forEach(trackScroll);
      }));
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      nearObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
