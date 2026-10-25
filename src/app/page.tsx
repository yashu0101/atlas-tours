"use client";
import { useEffect, useState } from "react";
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

export default function HomePage() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const p = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      setScrollProgress(p);
    };
    window.addEventListener("scroll", handleScroll);

    // Fade-in observer
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("visible"); }),
      { threshold: 0.1 }
    );
    document.querySelectorAll(".fade-in").forEach((el) => observer.observe(el));

    return () => {
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <div className="scroll-progress" style={{ width: `${scrollProgress}%` }} />
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
