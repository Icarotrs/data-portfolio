const services = [
  {
    title: "Profit dashboards",
    tools: "Power BI · Google Sheets · Looker Studio",
    body: "Real margin per product and per order after fees, shipping and ads, built on your Shopify, Amazon, WooCommerce or marketplace exports.",
  },
  {
    title: "Sheets & Apps Script automation",
    tools: "Apps Script · Sheets · Forms · Gmail",
    body: "Forms that write into formatted sheets, scheduled imports, email and PDF reports, custom menus. The repetitive work runs itself.",
  },
  {
    title: "Data cleaning & import",
    tools: "Python (pandas) · SQL · Power Query",
    body: "Messy CSV, Excel or PDF exports turned into one consistent table, with a log of every fix so you can trust the numbers.",
  },
  {
    title: "Automated reports",
    tools: "SQL · Python · Apps Script",
    body: "Weekly or monthly KPI reports that build and send themselves, so nobody rebuilds the same spreadsheet every Friday.",
  },
];

export function Services() {
  return (
    <section id="services" data-icon-theme="services" aria-labelledby="services-title" className="scroll-mt-24">
      <h2 id="services-title" className="label mb-4 text-on-bg">
        Services · {String(services.length).padStart(2, "0")}
      </h2>
      <ul className="flex flex-col gap-4">
        {services.map((s, i) => (
          <li key={s.title} className="glass reveal p-7 sm:p-8">
            <p className="label text-faint">S{i + 1}</p>
            <h3 className="mt-4 text-[20px] leading-tight tracking-tight">{s.title}</h3>
            <p className="mt-2 text-pretty text-[15px] leading-relaxed text-muted">{s.body}</p>
            <p className="label mt-4 text-faint">{s.tools}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
