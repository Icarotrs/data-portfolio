import { site } from "@site";
import { LinkButton } from "@/components/ui/LinkButton";
import { UpworkIcon } from "@/components/ui/icons";
import { SectionHeading } from "./SectionHeading";

const services = [
  {
    code: "S1",
    title: "Profit dashboards",
    tools: "Power BI · Google Sheets · Looker Studio",
    body: "Real margin per product and per order after fees, shipping and ads — not just revenue. Built on your Shopify, Amazon, WooCommerce or marketplace exports.",
  },
  {
    code: "S2",
    title: "Google Sheets & Apps Script automation",
    tools: "Apps Script · Sheets · Forms · Gmail",
    body: "Forms that write into formatted sheets, scheduled imports, email and PDF reports, custom menus — the repetitive work runs itself.",
  },
  {
    code: "S3",
    title: "Data cleaning & import",
    tools: "Python (pandas) · SQL · Power Query",
    body: "Messy CSV, Excel or PDF exports turned into one consistent table, with a log of every fix so you can trust the numbers.",
  },
  {
    code: "S4",
    title: "Automated reports",
    tools: "SQL · Python · Apps Script",
    body: "Weekly or monthly KPI reports that build and send themselves, so you stop rebuilding the same spreadsheet every Friday.",
  },
];

export function Services() {
  return (
    <section id="services" data-icon-theme="services" aria-labelledby="services-title" className="scroll-mt-24">
      <SectionHeading id="services-title" eyebrow="Services · 04" title="What I can build for you" />
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {services.map((s) => (
          <li key={s.code} className="glass reveal flex flex-col p-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">{s.code}</p>
            <h3 className="text-silver mt-2 text-lg font-semibold tracking-tight">{s.title}</h3>
            <p className="mt-1 font-mono text-[11px] text-faint">{s.tools}</p>
            <p className="mt-3 text-pretty text-sm leading-relaxed text-muted">{s.body}</p>
          </li>
        ))}
      </ul>
      <div className="glass reveal mt-4 flex flex-col items-start justify-between gap-4 rounded-2xl p-6 sm:flex-row sm:items-center">
        <p className="text-pretty text-muted">
          Have a spreadsheet or report that eats your week? Send the details on Upwork.
        </p>
        <LinkButton href={site.links.upwork} external className="shrink-0">
          <UpworkIcon className="h-4 w-4" />
          Hire me on Upwork
        </LinkButton>
      </div>
    </section>
  );
}
