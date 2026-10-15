import type { CSSProperties } from "react";
import { site } from "@site";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { LinkButton } from "@/components/ui/LinkButton";
import { Glyph } from "@/components/ui/Glyph";

const tools = ["Google Sheets", "Apps Script", "n8n", "Make", "Claude & OpenAI APIs", "Power BI"];

/**
 * Intro: the title types itself like a command prompt; on the right, the
 * home composition (site.config.ts → homeShapes): connected nodes, a torus
 * and a cube, linked by lines with pulses running along them.
 */
export function Hero({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const title = dict.hero.title;
  return (
    <section aria-labelledby="hero-title" className="mx-auto grid max-w-[1120px] items-center gap-6 lg:min-h-[calc(100dvh-12rem)] lg:grid-cols-[1.1fr_1fr]">
      <div className="card rise p-7 sm:p-10" style={{ "--i": 0 } as CSSProperties}>
        <p className="label text-accent">
          {dict.hero.eyebrow} · {dict.role}
        </p>
        <h1 id="hero-title" className="mt-5 font-mono text-[28px] leading-[1.1] tracking-normal min-[420px]:text-[34px] sm:text-[52px]">
          <span aria-hidden="true" className="text-accent">&gt;&nbsp;</span>
          <span className="type" style={{ "--n": title.length } as CSSProperties}>
            {title}
          </span>
          <span aria-hidden="true" className="caret" />
        </h1>
        <p className="rise mt-6 max-w-[52ch] text-pretty text-[17px] leading-relaxed text-muted" style={{ "--i": 14 } as CSSProperties}>
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

      <Composition steps={dict.hero.steps} />
    </section>
  );
}

// Positions in % of the panel: nodes top-left, torus centre-right, cube bottom-left.
const SPOTS = [
  { x: 26, y: 26 },
  { x: 72, y: 46 },
  { x: 32, y: 78 },
];

function Composition({ steps }: { steps: [string, string, string] }) {
  return (
    <div aria-hidden="true" className="card rise relative hidden h-[480px] overflow-hidden [container-type:size] sm:block" style={{ "--i": 3 } as CSSProperties}>
      {/* Static dashed links; the pulses are HTML dots moved by CSS transforms (GPU). */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {SPOTS.slice(1).map((b, i) => {
          const a = SPOTS[i];
          return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--line-strong)" strokeWidth="1" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />;
        })}
      </svg>
      {SPOTS.slice(1).map((b, i) => {
        const a = SPOTS[i];
        return (
          <span
            key={i}
            className="glyph-pulse glyph-pulse-wide"
            style={{ left: `${a.x}%`, top: `${a.y}%`, "--dx": b.x - a.x, "--dy": b.y - a.y, animationDuration: "2.6s", animationDelay: `-${i * 1.3}s` } as CSSProperties}
          />
        );
      })}
      {site.homeShapes.map((shape, i) => (
        <div
          key={shape}
          className="absolute flex w-[38%] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2"
          style={{ left: `${SPOTS[i].x}%`, top: `${SPOTS[i].y}%` }}
        >
          <Glyph shape={shape} className="aspect-square w-full max-w-[150px]" />
          <span className="label text-faint">
            <span className="text-accent">0{i + 1}</span> {steps[i]}
          </span>
        </div>
      ))}
    </div>
  );
}
