import Link from "next/link";
import { site } from "@site";
import type { Project } from "@/lib/content";
import { ShapeHover } from "@/components/background/ShapeHover";
import { ArrowUpRight } from "@/components/ui/icons";
import { SectionHeading } from "./SectionHeading";

export function ProjectList({ projects }: { projects: Project[] }) {
  return (
    <section id="projects" aria-labelledby="projects-title" className="scroll-mt-24">
      <SectionHeading
        id="projects-title"
        eyebrow={`Projects · ${String(projects.length).padStart(2, "0")}`}
        title="Selected work"
      />
      <ul className="mt-6 grid gap-4">
        {projects.map((p, i) => (
          <li key={p.slug}>
            <ShapeHover shape={site.shapes[p.kind]} index={i + 1}>
              <ProjectCard project={p} />
            </ShapeHover>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ProjectCard({ project: p }: { project: Project }) {
  return (
    <Link
      href={`/projects/${p.slug}/`}
      className="glass group grid gap-5 rounded-2xl p-5 transition-[border-color,transform] hover:-translate-y-0.5 hover:border-line-strong sm:grid-cols-[4.5rem_1fr_auto] sm:p-7"
    >
      <span className="font-mono text-3xl font-light tracking-tight text-faint sm:text-4xl">
        {p.number}
      </span>
      <div className="min-w-0">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
          {site.kindLabels[p.kind]}
        </p>
        <h3 className="mt-1.5 text-xl font-semibold tracking-tight sm:text-2xl">{p.title}</h3>
        <p className="mt-2 text-pretty text-muted">{p.summary}</p>
        <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Stack">
          {p.stack.map((s) => (
            <li
              key={s}
              className="rounded-full border border-line-strong px-2.5 py-0.5 font-mono text-[11px] text-muted"
            >
              {s}
            </li>
          ))}
        </ul>
        <p className="mt-4 flex gap-3 border-t border-line pt-4 text-sm">
          <span className="shrink-0 font-mono font-semibold text-fg">{p.metric.value}</span>
          <span className="text-muted">{p.result}</span>
        </p>
      </div>
      <span className="hidden h-10 w-10 items-center justify-center rounded-full border border-line-strong transition-colors group-hover:bg-fg group-hover:text-bg sm:inline-flex">
        <ArrowUpRight className="h-4 w-4" />
        <span className="sr-only">Open project</span>
      </span>
    </Link>
  );
}
