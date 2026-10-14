import Link from "next/link";
import { site } from "@site";
import { ThemeSwitch } from "@/components/ui/ThemeSwitch";
import { Clock } from "./Clock";
import { NavList } from "./NavList";

/**
 * The quiet frame around the content column: brand and section menu on
 * the left, clock and theme switch top-right, tagline bottom-left, links
 * bottom-right. Fixed on large screens; on small screens only the top row
 * shows and it scrolls away with the page.
 */
export function SiteFrame() {
  const year = new Date().getFullYear();
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-30 h-dvh lg:fixed lg:inset-0 lg:h-auto">
      <Link
        href="/"
        className="pointer-events-auto absolute left-5 top-5 inline-flex items-center gap-2 text-on-bg sm:left-6 sm:top-6"
        aria-label={`${site.name} — home`}
      >
        <BrandGlyph className="h-5 w-5" />
        <span className="text-[15px] font-medium tracking-tight">{site.name}</span>
      </Link>

      <div className="pointer-events-auto absolute left-6 top-24 hidden lg:block">
        <NavList />
      </div>

      <div className="pointer-events-auto absolute right-5 top-5 flex flex-col items-end gap-3 sm:right-6 sm:top-6">
        <div className="hidden sm:block">
          <Clock />
        </div>
        <ThemeSwitch />
      </div>

      <p className="label absolute bottom-6 left-6 hidden max-w-[190px] text-on-bg-muted lg:block">
        Profit dashboards &amp; automations for e-commerce. Power BI, Sheets, Apps Script, SQL, Python.
      </p>

      <div className="label pointer-events-auto absolute bottom-6 right-6 hidden text-right text-on-bg-muted lg:block">
        <p>
          © {year} {site.name}
        </p>
        <p className="mt-1">
          <a href={site.links.upwork} target="_blank" rel="noopener noreferrer" className="hover:text-on-bg">
            Upwork
          </a>
          {" / "}
          <a href={site.links.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-on-bg">
            LinkedIn
          </a>
          {" / "}
          <a href={site.links.github} target="_blank" rel="noopener noreferrer" className="hover:text-on-bg">
            GitHub
          </a>
        </p>
      </div>
    </div>
  );
}

/** Six-spoke asterisk, a nod to a data point / spark. */
export function BrandGlyph({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <path d="M12 2v20M3.34 7l17.32 10M3.34 17 20.66 7" strokeLinecap="round" />
    </svg>
  );
}
