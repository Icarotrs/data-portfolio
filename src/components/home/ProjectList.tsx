import Link from "next/link";
import { site } from "@site";
import type { Project } from "@/lib/content";
import { ArrowRight, ArrowUpRight } from "@/components/ui/icons";

export function ProjectList({ projects }: { projects: Project[] }) {
  return (
    <section id="projects" data-section="projects" aria-labelledby="projects-title" className="scroll-mt-24">
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

/** The whole card is one link; hover/focus make that obvious. */
function ProjectCard({ project: p }: { project: Project }) {
  return (
    <Link
      href={`/projects/${p.slug}/`}
      className="glass group block p-7 transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-1 hover:border-accent focus-visible:border-accent sm:p-8"
    >
      <div className="flex items-start justify-between gap-4">
        <p className="label text-faint">
          <span className="text-accent">{p.number}</span> · {site.kindLabels[p.kind]}
        </p>
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line-strong text-fg transition-colors group-hover:border-accent group-hover:bg-accent group-hover:text-accent-fg">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>
      <h3 className="mt-4 text-[22px] leading-tight tracking-tight transition-colors group-hover:text-accent">{p.title}</h3>
      <p className="mt-2 text-pretty text-[15px] leading-relaxed text-muted">{p.summary}</p>
      <p className="label mt-5 text-faint">{p.stack.join(" · ")}</p>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-t border-line pt-4">
        <p className="flex max-w-[34ch] gap-3 text-sm">
          <span className="shrink-0 font-mono font-medium text-accent">{p.metric.value}</span>
          <span className="text-muted">{p.result}</span>
        </p>
        <span className="label inline-flex h-8 items-center gap-2 rounded-[4px] border border-line-strong px-3 text-fg transition-colors group-hover:border-accent group-hover:bg-accent group-hover:text-accent-fg">
          View case study
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
