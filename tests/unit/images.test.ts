import { describe, expect, it } from "vitest";
import { isOptimizableImage, shouldAutoplayVideo } from "@/lib/images";
import nextConfig from "../../next.config";

describe("isOptimizableImage (N-9)", () => {
  it("accepts local paths", () => {
    expect(isOptimizableImage("/images/placeholder.jpg")).toBe(true);
    expect(isOptimizableImage("/images/hero-fallback.jpg")).toBe(true);
  });

  it("accepts https images.unsplash.com, including its query parameters", () => {
    expect(isOptimizableImage("https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=800&q=75")).toBe(true);
    expect(isOptimizableImage("https://IMAGES.unsplash.com/photo-1")).toBe(true);
  });

  it("rejects every other host", () => {
    expect(isOptimizableImage("https://example.com/a.jpg")).toBe(false);
    expect(isOptimizableImage("https://unsplash.com/photo.jpg")).toBe(false);
    expect(isOptimizableImage("https://images.unsplash.com.evil.com/a.jpg")).toBe(false);
    expect(isOptimizableImage("https://evil.com/images.unsplash.com/a.jpg")).toBe(false);
    expect(isOptimizableImage("https://plus.unsplash.com/a.jpg")).toBe(false);
  });

  it("rejects non-https, credentials, ports and protocol-relative URLs", () => {
    expect(isOptimizableImage("http://images.unsplash.com/a.jpg")).toBe(false);
    expect(isOptimizableImage("https://user:pw@images.unsplash.com/a.jpg")).toBe(false);
    expect(isOptimizableImage("https://images.unsplash.com:8443/a.jpg")).toBe(false);
    expect(isOptimizableImage("//images.unsplash.com/a.jpg")).toBe(false);
    expect(isOptimizableImage("/\\evil.com/a.jpg")).toBe(false);
    expect(isOptimizableImage("data:image/png;base64,AAAA")).toBe(false);
    expect(isOptimizableImage("javascript:alert(1)")).toBe(false);
  });

  it("rejects local paths the optimiser can't serve", () => {
    expect(isOptimizableImage("/images/a.jpg?v=2")).toBe(false);
    expect(isOptimizableImage("/images/logo.svg")).toBe(false);
    expect(isOptimizableImage("https://images.unsplash.com/logo.SVG")).toBe(false);
    expect(isOptimizableImage("/_next/image?url=%2Fa.jpg&w=640&q=75")).toBe(false);
  });

  it("rejects empty and non-string input", () => {
    expect(isOptimizableImage("")).toBe(false);
    expect(isOptimizableImage(" /images/a.jpg")).toBe(false);
    expect(isOptimizableImage(undefined)).toBe(false);
    expect(isOptimizableImage(null)).toBe(false);
  });
});

describe("next.config images", () => {
  it("only allows images.unsplash.com over https as a remote pattern (no open proxy)", () => {
    const images = nextConfig.images ?? {};
    expect(images.unoptimized).not.toBe(true);
    const patterns = (images.remotePatterns ?? []).map((p) => (p instanceof URL ? { protocol: p.protocol, hostname: p.hostname } : p));
    expect(patterns).toHaveLength(1);
    expect(patterns[0]).toMatchObject({ protocol: "https", hostname: "images.unsplash.com" });
    expect(images.domains ?? []).toHaveLength(0);
  });
});

describe("shouldAutoplayVideo (N-9 hero video)", () => {
  const desktop = { viewportWidth: 1440, reducedMotion: false };

  it("autoplays on a desktop viewport with unknown or fast connection", () => {
    expect(shouldAutoplayVideo(desktop)).toBe(true);
    expect(shouldAutoplayVideo({ ...desktop, effectiveType: "4g", saveData: false })).toBe(true);
    expect(shouldAutoplayVideo({ ...desktop, viewportWidth: 768 })).toBe(true);
  });

  it("does not autoplay below 768px", () => {
    expect(shouldAutoplayVideo({ ...desktop, viewportWidth: 767 })).toBe(false);
    expect(shouldAutoplayVideo({ ...desktop, viewportWidth: 375 })).toBe(false);
  });

  it("does not autoplay with Data Saver or a slow connection", () => {
    expect(shouldAutoplayVideo({ ...desktop, saveData: true })).toBe(false);
    for (const effectiveType of ["slow-2g", "2g", "3g"]) {
      expect(shouldAutoplayVideo({ ...desktop, effectiveType })).toBe(false);
    }
  });

  it("does not autoplay with reduced motion", () => {
    expect(shouldAutoplayVideo({ ...desktop, reducedMotion: true })).toBe(false);
  });
});
