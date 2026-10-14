import type { CSSProperties } from "react";
import { site } from "@site";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { LinkButton } from "@/components/ui/LinkButton";

const tools = ["Power BI", "Google Sheets", "Apps Script", "SQL", "Python"];

/** Intro: the title types itself like a command prompt; two project screenshots on the right. */
export function Hero({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const title = dict.hero.title;
  return (
    <section aria-labelledby="hero-title" className="mx-auto grid max-w-[1120px] items-center gap-12 lg:min-h-[calc(100dvh-12rem)] lg:grid-cols-[1.05fr_1fr]">
      <div>
        <p className="label rise text-accent" style={{ "--i": 0 } as CSSProperties}>
          {dict.hero.eyebrow} · {dict.role}
        </p>
        <h1 id="hero-title" className="mt-5 font-mono text-[34px] leading-[1.1] tracking-normal sm:text-[52px]">
          <span aria-hidden="true" className="text-accent">&gt;&nbsp;</span>
          <span className="type" style={{ "--n": title.length } as CSSProperties}>
            {title}
          </span>
          <span aria-hidden="true" className="caret" />
        </h1>
        <p className="rise mt-6 max-w-[54ch] text-pretty text-[17px] leading-relaxed text-muted" style={{ "--i": 14 } as CSSProperties}>
          {dict.hero.intro}
        </p>
        <div className="rise mt-8 flex flex-wrap gap-3" style={{ "--i": 15 } as CSSProperties}>
          <LinkButton href={site.links.upwork} external>
            {dict.hero.cta}
          </LinkButton>
          <LinkButton href={`/${lang}/#projects`} variant="ghost">
            {dict.hero.seeProjects}
          </LinkButton>
        </div>
        <p className="label rise mt-10 text-faint" style={{ "--i": 16 } as CSSProperties}>
          {tools.join(" · ")}
        </p>
      </div>

      <div aria-hidden="true" className="relative hidden h-[480px] sm:block">
        <div className="card rise absolute right-0 top-0 w-[86%] rotate-[2.5deg] overflow-hidden p-0" style={{ "--i": 3 } as CSSProperties}>
          {/* eslint-disable-next-line @next/next/no-img-element -- static export, pre-sized WebP */}
          <img src="/projects/form-to-sheet-automation/sheet.webp" alt="" width={1600} height={1000} className="block h-auto w-full" />
        </div>
        <div className="card rise absolute bottom-0 left-0 w-[88%] -rotate-[2deg] overflow-hidden p-0" style={{ "--i": 5 } as CSSProperties}>
          {/* eslint-disable-next-line @next/next/no-img-element -- static export, pre-sized WebP */}
          <img
            src="/projects/ecommerce-profit-dashboard/overview.webp"
            alt=""
            width={1600}
            height={1000}
            fetchPriority="high"
            className="block h-auto w-full"
          />
        </div>
      </div>
    </section>
  );
}
