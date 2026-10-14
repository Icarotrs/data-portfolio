import Link from "next/link";
import { site } from "@site";

/** Square mark with three rising bars — a tiny bar chart. */
export function BrandMark() {
  return (
    <Link href="/" className="group inline-flex items-center gap-2.5" aria-label={`${site.name} — home`}>
      <svg viewBox="0 0 28 28" className="h-7 w-7 text-fg" aria-hidden="true">
        <rect x="0.75" y="0.75" width="26.5" height="26.5" rx="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <rect x="7" y="15" width="3" height="6" fill="currentColor" />
        <rect x="12.5" y="11" width="3" height="10" fill="currentColor" />
        <rect x="18" y="7" width="3" height="14" fill="currentColor" className="transition-transform group-hover:-translate-y-0.5" />
      </svg>
      <span className="text-sm font-semibold tracking-tight">{site.name}</span>
      <span className="hidden font-mono text-[11px] uppercase tracking-wider text-faint sm:inline">
        / data &amp; automation
      </span>
    </Link>
  );
}
