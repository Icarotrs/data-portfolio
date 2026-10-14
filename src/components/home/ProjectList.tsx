import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Project } from "@/lib/content";
import { site } from "@site";
import { ArrowRight } from "@/components/ui/icons";
import { Glyph } from "@/components/ui/Glyph";
import { SectionHeading } from "./SectionHeading";

/**
 * Projects as large cards that stack while you scroll (each card sticks a
 * little lower than the previous one, so the next slides over it).
 * Stacking is for large screens; small screens get a plain list.
 */
export function ProjectList({ projects, lang, dict }: { projects: Project[]; lang: Locale; dict: Dictionary }) {
  return (
    <section id="projects" aria-labelledby="projects-title" className="mx-auto max-w-[1120px] scroll-mt-24">
      <SectionHeading
        id="projects-title"
        eyebrow={`${dict.projects.eyebrow} · ${String(projects.length).padStart(2, "0")}`}
        title={dict.projects.title}
        intro={dict.projects.intro}
      />
      <ol className="mt-12 flex flex-col gap-8">
        {projects.map((p, i) => (
          <li key={p.slug} className="lg:sticky" style={{ top: `calc(6rem + ${i * 16}px)` }}>
            <ProjectCard project={p} lang={lang} dict={dict} />
          </li>
        ))}
      </ol>
    </section>
  );
}

function ProjectCard({ project: p, lang, dict }: { project: Project; lang: Locale; dict: Dictionary }) {
  const shot = p.media.screenshots.find((s) => s.src);
  return (
    <Link
      href={`/${lang}/projects/${p.slug}/`}
      className="card card-strong stack-in group grid overflow-hidden transition-colors hover:border-accent focus-visible:border-accent lg:min-h-[480px] lg:grid-cols-[1fr_1.2fr]"
    >
      <div className="flex flex-col p-7 sm:p-9">
        <div className="flex items-center gap-4">
          <span className="font-mono text-[44px] font-light leading-none text-accent">{p.number}</span>
          <span className="label text-faint">{dict.kinds[p.kind]}</span>
          <Glyph shape={site.kindShapes[p.kind]} className="ml-auto h-14 w-14" />
        </div>
        <h3 className="mt-6 text-[26px] leading-tight tracking-tight transition-colors group-hover:text-accent sm:text-[30px]">
          {p.title}
        </h3>
        <p className="mt-3 text-pretty text-[16px] leading-relaxed text-muted">{p.summary}</p>
        <div className="mt-6 flex items-baseline gap-3 border-t border-line pt-5">
          <span className="font-mono text-[28px] font-light leading-none text-accent">{p.metric.value}</span>
          <span className="text-sm text-muted">{p.metric.label}</span>
        </div>
        <p className="label mt-5 text-faint">{p.stack.join(" · ")}</p>
        <span className="label mt-8 inline-flex h-10 w-fit items-center gap-2 rounded-[3px] border border-line-strong px-4 text-fg transition-colors group-hover:border-accent group-hover:bg-accent group-hover:text-accent-fg lg:mt-auto">
          {dict.projects.viewCase}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
      <div className="relative min-h-[220px] overflow-hidden border-t border-line lg:border-l lg:border-t-0">
        {shot && (
          // eslint-disable-next-line @next/next/no-img-element -- static export, pre-sized WebP
          <img
            src={shot.src}
            alt={shot.alt}
            width={1600}
            height={1000}
            loading="lazy"
            decoding="async"
            className="zoom-in absolute inset-0 h-full w-full object-cover object-left-top transition-transform duration-500 group-hover:scale-[1.03]"
          />
        )}
      </div>
    </Link>
  );
}
