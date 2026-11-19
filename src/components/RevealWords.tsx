import React from "react";

/**
 * Word-by-word scroll reveal for a heading. Each word is an inline-block span with its
 * index in `--i` (drives the stagger in globals.css); RevealObserver adds `active` to the
 * wrapper. Real spaces stay between the words, so the text reads normally to screen
 * readers and copy/paste. No hooks: works in server and client components.
 *
 * Do not use inside `.gradient-text` (background-clip: text does not paint transformed children).
 */
export default function RevealWords({ text, start = 0 }: { text: string; start?: number }) {
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <span className="reveal-words">
      {words.map((w, i) => (
        <React.Fragment key={i}>
          {i > 0 && " "}
          <span className="rw" style={{ "--i": start + i } as React.CSSProperties}>{w}</span>
        </React.Fragment>
      ))}
    </span>
  );
}
