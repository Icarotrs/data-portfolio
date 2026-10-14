import { getDictionary } from "@/i18n/dictionaries";
import { getProject, getProjects } from "@/lib/content";

const en = getDictionary("en");

export const dynamicParams = false;

export function generateStaticParams() {
  return getProjects().map((p) => ({ slug: p.slug }));
}

/** 1600×1200 (4:3) Upwork portfolio cover → exports/covers/<slug>.png */
export default async function RenderCover({ params }: PageProps<"/render/cover/[slug]">) {
  const { slug } = await params;
  const project = getProject(slug)!;

  return (
    <div className="relative h-dvh w-full overflow-hidden">
      <div className="page-bg absolute inset-0" />
      {/* eslint-disable-next-line @next/next/no-img-element -- static export */}
      <img
        src={project?.media.screenshots[0]?.src ?? "/projects/shopify-ai-order-alerts/n8n-workflow.webp"}
        alt=""
        className="card absolute -right-24 top-16 w-[68%] -rotate-[3deg] p-0"
      />
      <div className="relative z-10 flex h-full flex-col justify-end gap-6 p-20">
        <div className="card w-[1040px] p-14">
          <div className="flex items-baseline gap-6">
            <span className="font-mono text-7xl font-light text-accent">{project.number}</span>
            <p className="font-mono text-lg uppercase tracking-[0.2em] text-faint">
              {en.kinds[project.kind]}
            </p>
          </div>
          <h1 className="mt-6 text-balance text-7xl font-normal leading-[1.02] tracking-tight">
            {project.title}
          </h1>
          <p className="mt-6 text-pretty text-2xl leading-snug text-muted">{project.summary}</p>
          <ul className="mt-8 flex flex-wrap gap-2.5">
            {project.stack.map((s) => (
              <li key={s} className="rounded-[3px] border border-line-strong px-3 py-1 font-mono text-base text-muted">
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="card flex w-[1040px] items-center gap-8 px-14 py-8">
          <span className="shrink-0 font-mono text-6xl font-light text-accent">{project.metric.value}</span>
          <span className="text-xl leading-snug text-muted">
            {project.metric.label}
            {project.metric.basis && <span className="ml-3 font-mono text-base uppercase tracking-[0.15em] text-faint">{project.metric.basis}</span>}
          </span>
        </div>
      </div>
    </div>
  );
}
