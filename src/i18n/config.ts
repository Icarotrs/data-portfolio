export const LOCALES = ["en", "pt", "es"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_LABELS: Record<Locale, { short: string; name: string; htmlLang: string; og: string }> = {
  en: { short: "EN", name: "English", htmlLang: "en", og: "en_US" },
  pt: { short: "PT", name: "Português", htmlLang: "pt-BR", og: "pt_BR" },
  es: { short: "ES", name: "Español", htmlLang: "es", og: "es_ES" },
};

export const isLocale = (value: string): value is Locale => (LOCALES as readonly string[]).includes(value);

/** localStorage key remembering the visitor's language choice. */
export const LOCALE_STORAGE_KEY = "lang";

/** hreflang alternates for a path that exists in every language. */
export function languageAlternates(path: string) {
  return {
    ...Object.fromEntries(LOCALES.map((l) => [LOCALE_LABELS[l].htmlLang, `/${l}${path}`])),
    "x-default": `/en${path}`,
  };
}
