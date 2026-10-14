import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { site } from "@site";
import { getProject, getProjects } from "@/lib/content";
import { MediaGallery } from "@/components/project/MediaGallery";
import { ResultMetric } from "@/components/project/ResultMetric";
import { LinkButton } from "@/components/ui/LinkButton";
import { ArrowLeft, ArrowRight, ArrowUpRight, GitHubIcon } from "@/components/ui/icons";

export const dynamicParams = false;

export function generateStaticParams() {
  return getProjects().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  const url = `/projects/${slug}/`;
  const image = { url: `/og/${slug}.png`, width: 1200, height: 630, alt: project.title };
  return {
    title: project.title,
    description: project.summary,
    alternates: { canonical: url },
    openGraph: { type: "article", url, title: project.title, description: project.summary, images: [image] },
    twitter: { card: "summary_large_image", title: project.title, description: project.summary, images: [image.url] },
  };
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
    <article className="flex flex-col gap-4">
      <Link href="/#projects" className="label mb-2 inline-flex w-fit items-center gap-2 text-on-bg hover:opacity-80">
        <ArrowLeft className="h-3.5 w-3.5" />
        All projects
      </Link>

      <header data-icon-theme={project.kind} className="glass p-7 sm:p-9">
        <p className="label text-faint">
          Project {project.number} · {site.kindLabels[project.kind]}
        </p>
        <h1 className="mt-4 text-balance text-[28px] leading-[1.15] tracking-tight sm:text-[32px]">{project.title}</h1>
        <p className="mt-3 text-pretty text-[15px] leading-relaxed text-muted">{project.summary}</p>
      </header>

      <div data-icon-theme="code" className="flex flex-col gap-4">
        <div className="glass reveal prose-story p-7 sm:p-9">
          <Story />
        </div>
        <ResultMetric project={project} />
        <div className="glass reveal p-7 sm:p-8">
          <h2 className="label text-faint">Stack</h2>
          <p className="mt-3 text-[15px] leading-relaxed">{project.stack.join(" · ")}</p>
          {(project.links.github || project.links.demo) && (
            <div className="mt-5 flex flex-wrap gap-3 border-t border-line pt-4">
              {project.links.github && (
                <LinkButton href={project.links.github} external variant="ghost">
                  <GitHubIcon className="h-3.5 w-3.5" />
                  Code
                </LinkButton>
              )}
              {project.links.demo && (
                <LinkButton href={project.links.demo} external variant="ghost">
                  Live demo
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </LinkButton>
              )}
            </div>
          )}
          {project.note && <p className="mt-5 border-t border-line pt-4 text-xs leading-relaxed text-muted">{project.note}</p>}
        </div>
      </div>

      <div data-icon-theme="projects">
        <MediaGallery project={project} />
      </div>

      {next.slug !== project.slug && (
        <Link href={`/projects/${next.slug}/`} className="glass reveal group flex items-center justify-between gap-4 p-7 sm:p-8">
          <span>
            <span className="label block text-faint">Next project</span>
            <span className="mt-2 block text-[20px] leading-tight tracking-tight">{next.title}</span>
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-fg" />
        </Link>
      )}
    </article>
  );
}
