import { site } from "@site";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Project } from "@/lib/content";
import { ProjectExplorer, type ExplorerItem } from "./ProjectExplorer";
import { SectionHeading } from "./SectionHeading";

/** The projects section: heading, then every project filed in the explorer. */
export function ProjectList({ projects, lang, dict }: { projects: Project[]; lang: Locale; dict: Dictionary }) {
  const items: ExplorerItem[] = projects.map((p) => {
    const shot = p.media.screenshots.find((s) => s.src);
    return {
      slug: p.slug,
      number: p.number,
      title: p.title,
      folder: p.folder,
      kind: dict.kinds[p.kind],
      summary: p.summary,
      stack: p.stack,
      href: `/${lang}/projects/${p.slug}/`,
      github: p.links.github,
      thumb: shot?.src,
      thumbAlt: shot?.alt,
      metric: { value: p.metric.value, label: p.metric.label, basis: p.metric.basis && dict.project.basis[p.metric.basis] },
    };
  });
  return (
    <section id="projects" aria-labelledby="projects-title" className="mx-auto w-full max-w-[1120px] scroll-mt-24">
      <SectionHeading
        id="projects-title"
        eyebrow={`${dict.projects.eyebrow} · ${String(projects.length).padStart(2, "0")}`}
        title={dict.projects.title}
        intro={dict.projects.intro}
      />
      <div className="mt-12">
        <ProjectExplorer
          items={items}
          folders={site.folders}
          labels={{ ...dict.explorer, viewCase: dict.projects.viewCase, code: dict.project.code, mockNote: dict.project.shotsNote }}
        />
      </div>
    </section>
  );
}
