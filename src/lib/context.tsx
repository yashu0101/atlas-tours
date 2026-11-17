"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Lang = "en" | "hi";
type Theme = "dark" | "light";

interface AppContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const AppContext = createContext<AppContextType>({
  lang: "en", setLang: () => {},
  theme: "light", setTheme: () => {},
});

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  const [theme, setTheme] = useState<Theme>("light");
  // Persistence effects wait until stored prefs are loaded; otherwise the first commit would
  // briefly write the "light" default over the pre-paint theme set in layout.tsx (D-05).
  const [loaded, setLoaded] = useState(false);

  // Hydrate-from-localStorage must run after mount (server render has no storage), so the
  // setState-in-effect here is intentional.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const sl = localStorage.getItem("atlas-lang") as Lang;
      const st = localStorage.getItem("atlas-theme") as Theme;
      if (sl === "en" || sl === "hi") setLang(sl);
      if (st === "light" || st === "dark") setTheme(st);
    } catch {}
    setLoaded(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!loaded) return;
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem("atlas-theme", theme); } catch {}
  }, [theme, loaded]);

  // <html lang> intentionally stays "en" (set in layout.tsx) regardless of the toggle: only the
  // header is translated, so ~95% of the page is English. G-08: once content is translated,
  // restore `document.documentElement.setAttribute("lang", lang)` here.
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem("atlas-lang", lang); } catch {}
  }, [lang, loaded]);

  return <AppContext.Provider value={{ lang, setLang, theme, setTheme }}>{children}</AppContext.Provider>;
}

export function useApp() { return useContext(AppContext); }
export type { Lang, Theme };
