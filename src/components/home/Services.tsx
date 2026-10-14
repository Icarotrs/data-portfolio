import type { Dictionary } from "@/i18n/dictionaries";
import { SectionHeading } from "./SectionHeading";

export function Services({ dict }: { dict: Dictionary }) {
  const t = dict.services;
  return (
    <section id="services" aria-labelledby="services-title" className="mx-auto max-w-[1120px] scroll-mt-24">
      <SectionHeading id="services-title" eyebrow={t.eyebrow} title={t.title} />
      <ul className="mt-12 grid gap-4 sm:grid-cols-2">
        {t.items.map((s, i) => (
          <li key={s.title} className="card reveal p-7 sm:p-8">
            <p className="label text-faint">
              <span className="text-accent">S{i + 1}</span> · {s.tools}
            </p>
            <h3 className="mt-4 text-[21px] leading-snug tracking-tight">{s.title}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">{s.body}</p>
          </li>
        ))}
      </ul>
      <div className="card reveal mt-4 p-7 sm:p-8">
        <p className="label text-accent">{t.howTitle}</p>
        <p className="mt-3 max-w-[80ch] text-[15px] leading-relaxed text-muted">{t.how}</p>
      </div>
    </section>
  );
}
