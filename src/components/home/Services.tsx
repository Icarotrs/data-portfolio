const services = [
  {
    title: "Profit dashboards",
    tools: "Power BI · Sheets · Looker Studio",
    body: "Real margin per product and per order after fees, shipping and ads, from your Shopify, Amazon or WooCommerce exports.",
  },
  {
    title: "Sheets & Apps Script automation",
    tools: "Apps Script · Sheets · Forms · Gmail",
    body: "Forms into formatted sheets, scheduled imports, email and PDF reports. The repetitive work runs itself.",
  },
  {
    title: "Data cleaning & import",
    tools: "Python · SQL · Power Query",
    body: "Messy CSV, Excel or PDF exports turned into one consistent table, with a log of every fix.",
  },
  {
    title: "Automated reports",
    tools: "SQL · Python · Apps Script",
    body: "Weekly or monthly KPI reports that build and send themselves, so nobody rebuilds them every Friday.",
  },
];

export function Services() {
  return (
    <div className="glass flex h-full flex-col overflow-y-auto p-7 sm:p-9">
      <h2 className="label text-accent">Services</h2>
      <p className="mt-3 text-[22px] leading-tight tracking-tight">What I can build for you</p>
      <ul className="mt-6 grid content-start gap-x-6 gap-y-6 sm:grid-cols-2">
        {services.map((s, i) => (
          <li key={s.title} className="border-t border-line pt-4">
            <p className="label text-faint">
              <span className="text-accent">S{i + 1}</span> · {s.tools}
            </p>
            <h3 className="mt-2 text-[17px] leading-snug tracking-tight">{s.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
