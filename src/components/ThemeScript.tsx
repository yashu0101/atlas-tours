"use client";

// Runs before first paint so dark-theme users don't see a light flash (D-05).
// Key/values must match src/lib/context.tsx ("atlas-theme": "light" | "dark").
const themeScript = `try{var t=localStorage.getItem("atlas-theme");if(t==="dark"||t==="light")document.documentElement.dataset.theme=t}catch(e){}`;

/**
 * The script only has to run from the server HTML. When React renders the root layout on the
 * client (e.g. a notFound() page), a client-created <script> never executes and React logs
 * "Encountered a script tag while rendering React component" — so on the client it is rendered
 * as an inert data block instead. suppressHydrationWarning covers the type mismatch on hydration.
 */
export default function ThemeScript() {
  return (
    <script
      type={typeof window === "undefined" ? undefined : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: themeScript }}
    />
  );
}
