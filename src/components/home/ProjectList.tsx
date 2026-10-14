import Link from "next/link";
import { site } from "@site";
import type { Project } from "@/lib/content";
import { ArrowUpRight } from "@/components/ui/icons";

/** All projects in one card: a grid of thumbnails, each an obvious link. */
export function ProjectList({ projects }: { projects: Project[] }) {
  return (
    <div className="glass flex h-full flex-col overflow-y-auto p-5 sm:p-6">
      <div className="flex items-baseline justify-between px-1 pb-4 pt-1">
        <h2 className="label text-accent">Selected projects</h2>
        <span className="label text-faint">{String(projects.length).padStart(2, "0")}</span>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {projects.map((p) => (
          <li key={p.slug}>
            <ProjectTile project={p} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProjectTile({ project: p }: { project: Project }) {
  const thumb = p.media.screenshots.find((s) => s.src);
  return (
    <Link
      href={`/projects/${p.slug}/`}
      className="group flex h-full flex-col overflow-hidden rounded-[8px] border border-line transition-colors hover:border-accent focus-visible:border-accent"
    >
      <div className="relative aspect-[16/10] overflow-hidden border-b border-line bg-[color-mix(in_srgb,var(--fg)_6%,transparent)]">
        {thumb && (
          // eslint-disable-next-line @next/next/no-img-element -- static export, pre-sized WebP
          <img
            src={thumb.src}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover object-left-top transition-transform duration-300 group-hover:scale-[1.03]"
          />
        )}
        <span className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-cta text-cta-fg opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
        <p className="label text-[10px] text-faint">
          <span className="text-accent">{p.number}</span> · {site.kindLabels[p.kind]}
        </p>
        <h3 className="text-[15px] leading-snug tracking-tight transition-colors group-hover:text-accent">{p.title}</h3>
        <p className="mt-auto flex items-baseline justify-between gap-2 pt-1.5">
          <span className="label text-[10px] text-muted">
            <span className="text-accent">{p.metric.value}</span>
          </span>
          <span className="label text-[10px] text-fg transition-colors group-hover:text-accent">Case study →</span>
        </p>
      </div>
    </Link>
  );
}
