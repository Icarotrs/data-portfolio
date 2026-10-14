import { site } from "@site";
import { LinkButton } from "@/components/ui/LinkButton";
import { ArrowRight, UpworkIcon } from "@/components/ui/icons";

const tools = ["Power BI", "Google Sheets", "Apps Script", "SQL", "Python"];

export function Hero() {
  return (
    <section data-icon-theme="intro" aria-labelledby="hero-title" className="pt-10 sm:pt-20">
      <div className="glass max-w-3xl rounded-3xl p-6 sm:p-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
          {site.role} · Available on Upwork
        </p>
        <h1
          id="hero-title"
          className="text-silver mt-4 text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl"
        >
          {site.title}
        </h1>
        <p className="mt-5 max-w-2xl text-pretty text-base leading-relaxed text-muted sm:text-lg">
          {site.valueProp}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <LinkButton href={site.links.upwork} external>
            <UpworkIcon className="h-4 w-4" />
            Hire me on Upwork
          </LinkButton>
          <LinkButton href="#projects" variant="ghost">
            See projects
            <ArrowRight className="h-4 w-4" />
          </LinkButton>
        </div>
        <ul className="mt-8 flex flex-wrap gap-x-4 gap-y-2 border-t border-line pt-5 font-mono text-[11px] uppercase tracking-wider text-faint">
          {tools.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
