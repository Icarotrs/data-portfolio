import { site } from "@site";
import { BrandMark } from "@/components/layout/SiteFrame";
import { LinkButton } from "@/components/ui/LinkButton";
import { DeckLink } from "./DeckLink";

const tools = ["Power BI", "Google Sheets", "Apps Script", "SQL", "Python"];

export function Hero() {
  return (
    <div className="glass flex h-full flex-col justify-between gap-10 overflow-y-auto p-7 sm:p-9">
      <div>
        <BrandMark className="h-9 w-9 text-fg" />
        <p className="label mt-8 text-accent">
          {site.name} · {site.role}
        </p>
        <h1 className="mt-3 text-balance text-[26px] leading-[1.2] tracking-tight sm:text-[30px]">{site.headline}</h1>
      </div>
      <div>
        <p className="max-w-[44ch] text-pretty text-[15px] leading-relaxed text-muted">{site.valueProp}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <LinkButton href={site.links.upwork} external>
            Hire me on Upwork
          </LinkButton>
          <DeckLink
            to="projects"
            className="label inline-flex h-9 items-center justify-center gap-2 rounded-[4px] border border-line-strong px-3.5 text-fg transition hover:bg-fg hover:text-bg"
          >
            See projects
          </DeckLink>
        </div>
        <p className="label mt-8 text-faint">{tools.join(" · ")}</p>
      </div>
    </div>
  );
}
