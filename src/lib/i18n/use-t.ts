"use client";

import { useCallback } from "react";
import { useApp } from "@/lib/context";
import { translate, type MessageKey, type MessageVars, type TFunction } from "./index";

/**
 * Client-side translator for the current `lang` (G-08). The first render is always English
 * (AppProvider reads the stored language in an effect), so server and client markup match.
 */
export function useT(): TFunction {
  const { lang } = useApp();
  return useCallback((key: MessageKey, vars?: MessageVars) => translate(lang, key, vars), [lang]);
}
