import Link from "next/link";
import { site } from "@site";
import type { Project } from "@/lib/content";
import { ArrowUpRight } from "@/components/ui/icons";

/** All projects in one card; each row is a big, obviously clickable link. */
export function ProjectList({ projects }: { projects: Project[] }) {
  return (
    <div className="glass flex h-full flex-col overflow-y-auto p-5 sm:p-6">
      <div className="flex items-baseline justify-between px-2 pb-4 pt-1">
        <h2 className="label text-accent">Selected projects</h2>
        <span className="label text-faint">{String(projects.length).padStart(2, "0")}</span>
      </div>
      <ul className="flex flex-1 flex-col gap-3">
        {projects.map((p) => (
          <li key={p.slug} className="flex-1">
            <ProjectRow project={p} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProjectRow({ project: p }: { project: Project }) {
  return (
    <Link
      href={`/projects/${p.slug}/`}
      className="group flex h-full flex-col justify-between gap-3 rounded-[8px] border border-line p-5 transition-colors hover:border-accent hover:bg-[color-mix(in_srgb,var(--accent)_7%,transparent)] focus-visible:border-accent"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="label text-faint">
            <span className="text-accent">{p.number}</span> · {site.kindLabels[p.kind]}
          </p>
          <h3 className="mt-2 text-[19px] leading-tight tracking-tight transition-colors group-hover:text-accent">{p.title}</h3>
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">{p.summary}</p>
        </div>
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line-strong transition-colors group-hover:border-accent group-hover:bg-accent group-hover:text-accent-fg">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-line pt-3">
        <span className="label text-muted">
          <span className="text-accent">{p.metric.value}</span> · {p.stack.slice(0, 3).join(" · ")}
        </span>
        <span className="label shrink-0 text-fg transition-colors group-hover:text-accent">Case study →</span>
      </div>
    </Link>
  );
}
