import { site } from "@site";
import { getDictionary } from "@/i18n/dictionaries";
import { getProject, getProjects } from "@/lib/content";

const en = getDictionary("en");

export const dynamicParams = false;

export function generateStaticParams() {
  return [{ slug: "home" }, ...getProjects().map((p) => ({ slug: p.slug }))];
}

/** 1200×630 Open Graph card → public/og/<slug>.png */
export default async function RenderOg({ params }: PageProps<"/render/og/[slug]">) {
  const { slug } = await params;
  const project = getProject(slug);

  return (
    <div className="relative h-dvh w-full overflow-hidden">
      <div className="page-bg absolute inset-0" />
      {/* eslint-disable-next-line @next/next/no-img-element -- static export */}
      <img
        src={project?.media.screenshots[0]?.src ?? "/projects/shopify-ai-order-alerts/n8n-workflow.webp"}
        alt=""
        className="card absolute -right-24 top-16 w-[68%] -rotate-[3deg] p-0"
      />
      <div className="relative z-10 flex h-full items-end p-14">
        <div className="card w-[760px] p-10">
          <p className="font-mono text-sm uppercase tracking-[0.2em] text-faint">
            {project
              ? `Project ${project.number} · ${en.kinds[project.kind]}`
              : `${site.name} · ${en.role}`}
          </p>
          <h1 className="mt-4 text-balance text-5xl font-normal leading-[1.05] tracking-tight">
            {project ? project.title : en.meta.title}
          </h1>
          <p className="mt-5 text-xl leading-snug text-muted">
            {project ? (
              <>
                <span className="font-mono font-normal text-fg">{project.metric.value}</span>{" "}
                {project.metric.label}
                {project.metric.basis && ` (${project.metric.basis})`}
              </>
            ) : (
              "Connect your tools, automate the manual work, add AI where it saves time."
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
