import { en } from "./en";
import { hi } from "./hi";

/**
 * Message catalog (G-08). Server- and client-safe: no React, no DOM.
 * Client components use `useT()` from `./use-t`; server components call `translate("en", …)`
 * or `getT("en")` (server pages render English — `lang` lives in localStorage, client-side only).
 */

export type Lang = "en" | "hi";

type Widen<T> = { readonly [K in keyof T]: T[K] extends string ? string : Widen<T[K]> };
type DeepPartial<T> = { readonly [K in keyof T]?: T[K] extends string ? string : DeepPartial<T[K]> };

/** Full catalog shape (English is complete). */
export type Messages = Widen<typeof en>;
/** A translation may leave any key out; missing keys fall back to English. */
export type PartialMessages = DeepPartial<Messages>;

type Paths<T, P extends string = ""> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Paths<T[K], `${P}${K}.`>;
}[keyof T & string];

/** Every valid dot-path key, e.g. "header.nav.home". */
export type MessageKey = Paths<Messages>;
export type MessageVars = Record<string, string | number>;
export type TFunction = (key: MessageKey, vars?: MessageVars) => string;

const catalogs: Record<Lang, PartialMessages> = { en, hi };

function lookup(messages: unknown, key: string): string | undefined {
  let node: unknown = messages;
  for (const part of key.split(".")) {
    if (!node || typeof node !== "object") return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === "string" ? node : undefined;
}

/** Replaces `{name}` placeholders; unknown placeholders are left as-is. */
export function interpolate(template: string, vars?: MessageVars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match
  );
}

/** The string for `key` in `lang`, falling back to English (and to the key itself if it is unknown). */
export function translate(lang: Lang, key: MessageKey, vars?: MessageVars): string {
  const template = (lang !== "en" ? lookup(catalogs[lang], key) : undefined) ?? lookup(en, key) ?? key;
  return interpolate(template, vars);
}

/** A `t()` bound to one language — for server components (`getT("en")`). */
export function getT(lang: Lang): TFunction {
  return (key, vars) => translate(lang, key, vars);
}

type Tree = { readonly [key: string]: string | Tree };

function mergeDeep(base: Tree, override: Tree | undefined): Tree {
  if (!override) return base;
  const out: Record<string, string | Tree> = {};
  for (const [k, v] of Object.entries(base)) {
    const o = override[k];
    if (typeof v === "string") out[k] = typeof o === "string" ? o : v;
    else out[k] = mergeDeep(v, typeof o === "object" ? o : undefined);
  }
  return out;
}

/** The complete catalog for `lang`, with English filling every key the translation lacks. */
export function getMessages(lang: Lang): Messages {
  return lang === "en" ? en : (mergeDeep(en, catalogs[lang] as Tree) as unknown as Messages);
}

/** All dot-path keys present in a (possibly partial) catalog, in declaration order. */
export function catalogKeys(messages: unknown, prefix = ""): string[] {
  if (!messages || typeof messages !== "object") return [];
  return Object.entries(messages as Record<string, unknown>).flatMap(([k, v]) =>
    typeof v === "string" ? [`${prefix}${k}`] : catalogKeys(v, `${prefix}${k}.`)
  );
}

/** English keys with no translation in `lang`. */
export function missingKeys(lang: Lang): MessageKey[] {
  const have = new Set(catalogKeys(catalogs[lang]));
  return catalogKeys(en).filter((k) => !have.has(k)) as MessageKey[];
}

export { en, hi };
