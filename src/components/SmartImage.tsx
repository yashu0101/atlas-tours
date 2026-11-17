import React from "react";
import Image, { type ImageProps } from "next/image";
import { isOptimizableImage } from "@/lib/images";

/**
 * `next/image` that only uses the optimiser for sources allowed by next.config.ts
 * (local files and images.unsplash.com, N-9). Any other host (an admin-pasted URL) is
 * rendered `unoptimized`, i.e. as a plain <img> pointing at the original URL — the same
 * behaviour the whole site had before. No hooks, so it works in server and client components.
 */
export default function SmartImage({ alt, unoptimized, src, ...rest }: ImageProps) {
  const optimizable = typeof src === "string" ? isOptimizableImage(src) : true; // static imports are local
  return <Image {...rest} src={src} alt={alt} unoptimized={unoptimized || !optimizable} />;
}
