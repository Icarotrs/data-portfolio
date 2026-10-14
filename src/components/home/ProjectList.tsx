import Link from "next/link";
import { site } from "@site";
import type { Project } from "@/lib/content";
import { ArrowUpRight } from "@/components/ui/icons";

export function ProjectList({ projects }: { projects: Project[] }) {
  return (
    <section id="projects" data-icon-theme="projects" aria-labelledby="projects-title" className="scroll-mt-24">
      <h2 id="projects-title" className="label mb-4 text-on-bg">
        Selected projects · {String(projects.length).padStart(2, "0")}
      </h2>
      <ul className="flex flex-col gap-4">
        {projects.map((p) => (
          <li key={p.slug}>
            <ProjectCard project={p} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function ProjectCard({ project: p }: { project: Project }) {
  return (
    <Link href={`/projects/${p.slug}/`} className="glass reveal group block p-7 transition-colors sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <p className="label text-faint">
          {p.number} · {site.kindLabels[p.kind]}
        </p>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-faint transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-fg" />
      </div>
      <h3 className="mt-5 text-[22px] leading-tight tracking-tight">{p.title}</h3>
      <p className="mt-2 text-pretty text-[15px] leading-relaxed text-muted">{p.summary}</p>
      <p className="label mt-5 text-faint">{p.stack.join(" · ")}</p>
      <p className="mt-5 flex gap-3 border-t border-line pt-4 text-sm">
        <span className="shrink-0 font-mono font-medium">{p.metric.value}</span>
        <span className="text-muted">{p.result}</span>
      </p>
    </Link>
  );
}
