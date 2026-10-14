import { site } from "@site";
import { BrandGlyph } from "@/components/layout/SiteFrame";
import { LinkButton } from "@/components/ui/LinkButton";

const tools = ["Power BI", "Google Sheets", "Apps Script", "SQL", "Python"];

export function Hero() {
  return (
    <section id="top" data-icon-theme="intro" aria-labelledby="hero-title" className="scroll-mt-24">
      <div className="glass flex min-h-[min(70vh,560px)] flex-col justify-between gap-12 p-7 sm:p-9">
        <div>
          <BrandGlyph className="h-8 w-8 text-fg" />
          <p className="label mt-8 text-faint">
            {site.name} · {site.role}
          </p>
          <h1 id="hero-title" className="mt-3 text-balance text-[26px] leading-[1.2] tracking-tight sm:text-[30px]">
            {site.headline}
          </h1>
        </div>
        <div>
          <p className="max-w-[44ch] text-pretty text-[15px] leading-relaxed text-muted">{site.valueProp}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <LinkButton href={site.links.upwork} external>
              Hire me on Upwork
            </LinkButton>
            <LinkButton href="#projects" variant="ghost">
              See projects
            </LinkButton>
          </div>
          <p className="label mt-8 text-faint">{tools.join(" · ")}</p>
        </div>
      </div>
    </section>
  );
}
