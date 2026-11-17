/**
 * Which image URLs may go through the Next.js image optimiser (`/_next/image`, N-9).
 *
 * Admins can paste any https: image URL (package/gallery/blog images), so the optimiser is
 * only enabled for local files and `images.unsplash.com` (see `images.remotePatterns` in
 * next.config.ts). Allowing every host would turn `/_next/image` into an open image proxy.
 * Every other source must be rendered with `unoptimized` — `SmartImage` does that using this
 * function. Keep `OPTIMIZABLE_REMOTE_HOSTS` and next.config.ts in sync.
 *
 * Pure and server/client-safe.
 */

export const OPTIMIZABLE_REMOTE_HOSTS: readonly string[] = ["images.unsplash.com"];

export function isOptimizableImage(src: string | null | undefined): boolean {
  if (typeof src !== "string") return false;
  const s = src.trim();
  if (!s || s !== src) return false;

  // Site-relative path ("/images/x.jpg"), not protocol-relative ("//host/x.jpg") or "/\host".
  if (s.startsWith("/")) {
    if (s.startsWith("//") || s.startsWith("/\\")) return false;
    // Next 16 needs `images.localPatterns` for local images with a query string; none are configured.
    if (s.includes("?") || s.includes("#")) return false;
    // The optimiser does not rasterise SVG (dangerouslyAllowSVG is off).
    if (/\.svg$/i.test(s)) return false;
    // Already an optimiser URL: never wrap it again.
    if (s.startsWith("/_next/image")) return false;
    return true;
  }

  let url: URL;
  try {
    url = new URL(s);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  if (url.username || url.password || url.port) return false;
  if (/\.svg$/i.test(url.pathname)) return false;
  return OPTIMIZABLE_REMOTE_HOSTS.includes(url.hostname.toLowerCase());
}

/** Network/viewport facts used to decide whether the hero video may autoplay (N-9). */
export interface AutoplayContext {
  viewportWidth: number;
  reducedMotion: boolean;
  /** `navigator.connection.saveData` (Chromium only; undefined elsewhere). */
  saveData?: boolean;
  /** `navigator.connection.effectiveType`: "slow-2g" | "2g" | "3g" | "4g" (Chromium only). */
  effectiveType?: string;
}

export const AUTOPLAY_MIN_WIDTH = 768;
const SLOW_CONNECTIONS = new Set(["slow-2g", "2g", "3g"]);

/**
 * Autoplay the background video only on viewports ≥ 768px, without reduced motion, without
 * Data Saver and not on a 2g/3g-class connection. Unknown connection info counts as fast
 * (Safari/Firefox don't expose it), so desktop keeps today's behaviour.
 */
export function shouldAutoplayVideo(ctx: AutoplayContext): boolean {
  if (ctx.reducedMotion) return false;
  if (!(ctx.viewportWidth >= AUTOPLAY_MIN_WIDTH)) return false;
  if (ctx.saveData === true) return false;
  if (ctx.effectiveType && SLOW_CONNECTIONS.has(ctx.effectiveType)) return false;
  return true;
}
