import Link from "next/link";
import { site } from "@site";
import { ThemeSwitch } from "@/components/ui/ThemeSwitch";
import { Clock } from "./Clock";
import { NavList } from "./NavList";
import { OnHome } from "./OnHome";

/**
 * The quiet frame around the content: brand top-left, section menu and
 * corner texts on the home page, clock and theme switch top-right. Fixed
 * on large screens; on small screens only the top row shows and it
 * scrolls away with the page.
 */
export function SiteFrame() {
  const year = new Date().getFullYear();
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-30 h-dvh lg:fixed lg:inset-0 lg:h-auto">
      <Link
        href="/"
        className="pointer-events-auto absolute left-5 top-5 inline-flex items-center gap-2.5 text-on-bg sm:left-6 sm:top-6"
        aria-label={`${site.name} — home`}
      >
        <BrandMark className="h-6 w-6" />
        <span className="text-[15px] font-medium tracking-tight">{site.name}</span>
      </Link>

      <OnHome>
        <div className="pointer-events-auto absolute left-6 top-24 hidden lg:block">
          <NavList />
        </div>
        <p className="label absolute bottom-6 left-6 hidden max-w-[190px] text-on-bg-muted lg:block">
          Profit dashboards &amp; automations for e-commerce. Power BI, Sheets, Apps Script, SQL, Python.
        </p>
        <div className="label pointer-events-auto absolute bottom-6 right-6 hidden text-right text-on-bg-muted lg:block">
          <p>
            © {year} {site.name}
          </p>
          <p className="mt-1">
            <a href={site.links.upwork} target="_blank" rel="noopener noreferrer" className="hover:text-accent">
              Upwork
            </a>
            {" / "}
            <a href={site.links.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-accent">
              LinkedIn
            </a>
            {" / "}
            <a href={site.links.github} target="_blank" rel="noopener noreferrer" className="hover:text-accent">
              GitHub
            </a>
          </p>
        </div>
      </OnHome>

      <div className="pointer-events-auto absolute right-5 top-5 flex flex-col items-end gap-3 sm:right-6 sm:top-6">
        <div className="hidden sm:block">
          <Clock />
        </div>
        <ThemeSwitch />
      </div>
    </div>
  );
}

/** Square with three rising bars (one in the accent colour). */
export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" className={className} aria-hidden="true">
      <rect x="0.75" y="0.75" width="26.5" height="26.5" rx="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <rect x="7" y="15" width="3" height="6" fill="currentColor" />
      <rect x="12.5" y="11" width="3" height="10" fill="currentColor" />
      <rect x="18" y="7" width="3" height="14" fill="var(--accent)" />
    </svg>
  );
}
