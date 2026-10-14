import { site } from "@site";
import { getProject, getProjects } from "@/lib/content";
import { Background } from "@/components/background/Background";
import { ShapeScope } from "@/components/background/ShapeScope";
import { RENDER_STILL_TIME } from "../../still";

export const dynamicParams = false;

export function generateStaticParams() {
  return [{ slug: "home" }, ...getProjects().map((p) => ({ slug: p.slug }))];
}

/** 1200×630 Open Graph card → public/og/<slug>.png */
export default async function RenderOg({ params }: PageProps<"/render/og/[slug]">) {
  const { slug } = await params;
  const project = getProject(slug);
  const shape = project ? site.shapes[project.kind] : "home";

  return (
    <div className="relative h-dvh w-full overflow-hidden">
      <ShapeScope shape={shape} />
      <Background stillTime={RENDER_STILL_TIME} />
      <div className="relative z-10 flex h-full items-end p-14">
        <div className="glass-strong w-[760px] rounded-3xl p-10">
          <p className="font-mono text-sm uppercase tracking-[0.2em] text-faint">
            {project
              ? `Project ${project.number} · ${site.kindLabels[project.kind]}`
              : `${site.name} · ${site.role}`}
          </p>
          <h1 className="mt-4 text-balance text-5xl font-semibold leading-[1.05] tracking-tight">
            {project ? project.title : site.title}
          </h1>
          <p className="mt-5 text-xl leading-snug text-muted">
            {project ? (
              <>
                <span className="font-mono font-semibold text-fg">{project.metric.value}</span>{" "}
                {project.metric.label}
              </>
            ) : (
              "Power BI · Google Sheets · Apps Script · SQL · Python"
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
