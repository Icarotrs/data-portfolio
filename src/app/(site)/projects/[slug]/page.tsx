import Link from "next/link";
import { notFound } from "next/navigation";
import { site } from "@site";
import { getProject, getProjects } from "@/lib/content";
import { ShapeScope } from "@/components/background/ShapeScope";
import { MediaGallery } from "@/components/project/MediaGallery";
import { ResultMetric } from "@/components/project/ResultMetric";
import { LinkButton } from "@/components/ui/LinkButton";
import { ArrowLeft, ArrowRight, ArrowUpRight, GitHubIcon, UpworkIcon } from "@/components/ui/icons";

export const dynamicParams = false;

export function generateStaticParams() {
  return getProjects().map((p) => ({ slug: p.slug }));
}

export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const { default: Story } = await import(`@content/projects/${slug}/story.mdx`);

  const all = getProjects();
  const index = all.findIndex((p) => p.slug === slug);
  const next = all[(index + 1) % all.length];

  return (
    <article className="flex flex-col gap-6 pt-8 sm:pt-14">
      <ShapeScope shape={site.shapes[project.kind]} />

      <Link
        href="/#projects"
        className="glass inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm text-muted transition-colors hover:text-fg"
      >
        <ArrowLeft className="h-4 w-4" />
        All projects
      </Link>

      <header className="glass rounded-3xl p-6 sm:p-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
          Project {project.number} · {site.kindLabels[project.kind]}
        </p>
        <h1 className="mt-3 text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
          {project.title}
        </h1>
        <p className="mt-4 max-w-2xl text-pretty text-lg text-muted">{project.summary}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="glass prose-story rounded-2xl p-6 sm:p-8">
          <Story />
        </div>
        <aside className="flex flex-col gap-6">
          <ResultMetric project={project} />
          <div className="glass rounded-2xl p-6">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">Stack</h2>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {project.stack.map((s) => (
                <li
                  key={s}
                  className="rounded-full border border-line-strong px-2.5 py-0.5 font-mono text-[11px] text-muted"
                >
                  {s}
                </li>
              ))}
            </ul>
            {(project.links.github || project.links.demo) && (
              <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
                {project.links.github && (
                  <LinkButton href={project.links.github} external variant="ghost" className="h-9 text-xs">
                    <GitHubIcon className="h-4 w-4" />
                    Code
                  </LinkButton>
                )}
                {project.links.demo && (
                  <LinkButton href={project.links.demo} external variant="ghost" className="h-9 text-xs">
                    Live demo
                    <ArrowUpRight className="h-4 w-4" />
                  </LinkButton>
                )}
              </div>
            )}
          </div>
          {project.note && (
            <p className="glass rounded-2xl p-5 text-xs leading-relaxed text-muted">
              <span className="font-mono uppercase tracking-wider text-faint">Note · </span>
              {project.note}
            </p>
          )}
        </aside>
      </div>

      <MediaGallery project={project} />

      <div className="glass flex flex-col gap-4 rounded-2xl p-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-pretty text-muted">Need something like this for your business?</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <LinkButton href={site.links.upwork} external>
            <UpworkIcon className="h-4 w-4" />
            Hire me on Upwork
          </LinkButton>
          {next.slug !== project.slug && (
            <LinkButton href={`/projects/${next.slug}/`} variant="ghost">
              Next: {next.title}
              <ArrowRight className="h-4 w-4" />
            </LinkButton>
          )}
        </div>
      </div>
    </article>
  );
}
