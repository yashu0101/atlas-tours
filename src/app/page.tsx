"use client";
import { useEffect } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Packages from "@/components/Packages";
import Gallery from "@/components/Gallery";
import Counter from "@/components/Counter";
import Reviews from "@/components/Reviews";
import Blog from "@/components/Blog";
import FAQ from "@/components/FAQ";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import WhatsApp from "@/components/WhatsApp";
import BackToTop from "@/components/BackToTop";
import ScrollProgress from "@/components/ScrollProgress";

export default function HomePage() {
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

    // Sections that fetch data client-side (Packages, Gallery, Blog, Reviews)
    // mount their reveal elements later — observe those as they are added.
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

  return (
    <>
      <ScrollProgress />
      <Header />
      <Hero />
      <WaveDivider fill="var(--bg2)" />
      <About />
      <WaveDivider fill="var(--bg)" />
      <Packages />
      <WaveDivider fill="var(--bg2)" />
      <Gallery />
      <Counter />
      <WaveDivider fill="var(--bg)" />
      <Reviews />
      <WaveDivider fill="var(--bg2)" />
      <Blog />
      <WaveDivider fill="var(--bg)" />
      <FAQ />
      <Contact />
      <Footer />
      <WhatsApp />
      <BackToTop />
    </>
  );
}

function WaveDivider({ fill }: { fill: string }) {
  return (
    <div className="wave-divider">
      <svg viewBox="0 0 1440 120" preserveAspectRatio="none">
        <path d="M0,60 C240,120 480,0 720,60 C960,120 1200,0 1440,60 L1440,120 L0,120Z" fill={fill} />
      </svg>
    </div>
  );
}
