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

  useEffect(() => {
    const sl = localStorage.getItem("atlas-lang") as Lang;
    const st = localStorage.getItem("atlas-theme") as Theme;
    if (sl === "en" || sl === "hi") setLang(sl);
    if (st === "light" || st === "dark") setTheme(st);
  }, []);

  useEffect(() => { document.documentElement.setAttribute("data-theme", theme); localStorage.setItem("atlas-theme", theme); }, [theme]);
  useEffect(() => { document.documentElement.setAttribute("lang", lang); localStorage.setItem("atlas-lang", lang); }, [lang]);

  return <AppContext.Provider value={{ lang, setLang, theme, setTheme }}>{children}</AppContext.Provider>;
}

export function useApp() { return useContext(AppContext); }
export type { Lang, Theme };
