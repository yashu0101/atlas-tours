"use client";

import { useEffect, useRef } from "react";

/**
 * Top-of-page scroll progress bar. Updates the bar's width directly through a
 * ref inside a rAF-throttled passive scroll listener, so scrolling never
 * triggers a React re-render.
 */
export default function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const bar = barRef.current;
      if (!bar) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? (window.scrollY / max) * 100 : 0;
      bar.style.width = `${p}%`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return <div ref={barRef} className="scroll-progress" style={{ width: "0%" }} />;
}
