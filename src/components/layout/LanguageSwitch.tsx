"use client";

import { usePathname } from "next/navigation";
import { LOCALES, LOCALE_LABELS, LOCALE_STORAGE_KEY, type Locale } from "@/i18n/config";

/**
 * EN · PT · ES — same page in another language; remembers the choice.
 * Plain <a> on purpose: a language change swaps the whole document
 * (<html lang>), and a full load lets the theme script run again so the
 * chosen theme is kept.
 */
export function LanguageSwitch({ lang, label }: { lang: Locale; label: string }) {
  const pathname = usePathname() ?? `/${lang}/`;
  const rest = pathname.replace(/^\/(en|pt|es)(?=\/|$)/, "");
  return (
    <nav aria-label={label} className="flex items-center gap-1">
      {LOCALES.map((l, i) => (
        <span key={l} className="flex items-center gap-1">
          {i > 0 && <span aria-hidden="true" className="text-faint">·</span>}
          <a
            href={`/${l}${rest || "/"}`}
            hrefLang={LOCALE_LABELS[l].htmlLang}
            lang={LOCALE_LABELS[l].htmlLang}
            aria-current={l === lang ? "true" : undefined}
            aria-label={LOCALE_LABELS[l].name}
            onClick={() => {
              try {
                localStorage.setItem(LOCALE_STORAGE_KEY, l);
              } catch {}
            }}
            className={`label px-0.5 transition-colors hover:text-accent ${l === lang ? "text-accent" : "text-faint"}`}
          >
            {LOCALE_LABELS[l].short}
          </a>
        </span>
      ))}
    </nav>
  );
}
