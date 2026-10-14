import Link from "next/link";
import { site } from "@site";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { ThemeSwitch } from "@/components/ui/ThemeSwitch";
import { LanguageSwitch } from "./LanguageSwitch";

/** Sticky, frosted top bar with a thin scroll-progress line. */
export function Header({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const nav = [
    { label: dict.nav.projects, href: `/${lang}/#projects` },
    { label: dict.nav.services, href: `/${lang}/#services` },
    { label: dict.nav.contact, href: `/${lang}/#contact` },
  ];
  return (
    <header className="glass sticky top-0 z-40 border-b border-line">
      <div className="mx-auto flex h-16 max-w-[1120px] items-center justify-between gap-4 px-4 sm:px-6">
        <Link href={`/${lang}/`} className="inline-flex items-center gap-2.5" aria-label={`${site.name} — home`}>
          {/* Full name; just the initials on very small screens. */}
          <span className="text-[15px] font-medium tracking-tight">
            <span className="hidden min-[400px]:inline">{site.name}</span>
            <span className="min-[400px]:hidden">IT</span>
          </span>
          <span className="label hidden text-faint lg:inline">/ {dict.role}</span>
        </Link>
        <div className="flex items-center gap-4 sm:gap-5">
          <nav aria-label="Main" className="hidden items-center gap-5 md:flex">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="label text-muted transition-colors hover:text-accent">
                {n.label}
              </Link>
            ))}
          </nav>
          <LanguageSwitch lang={lang} label={dict.nav.language} />
          <ThemeSwitch labels={dict.theme} />
          <a
            href={site.links.upwork}
            target="_blank"
            rel="noopener noreferrer"
            className="label hidden h-9 items-center rounded-[3px] bg-cta px-3.5 text-cta-fg transition hover:opacity-90 sm:inline-flex"
          >
            {dict.nav.hire}
          </a>
        </div>
      </div>
      <div aria-hidden="true" className="scroll-progress absolute inset-x-0 bottom-[-1px] h-[2px] bg-accent" />
    </header>
  );
}
