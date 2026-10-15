import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { site } from "@site";
import { LOCALES, LOCALE_LABELS, isLocale, languageAlternates } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getProject, getProjects, localize, storyLocale } from "@/lib/content";
import { ContactCard } from "@/components/layout/ContactCard";
import { FlowDiagram } from "@/components/project/FlowDiagram";
import { MediaGallery } from "@/components/project/MediaGallery";
import { LinkButton } from "@/components/ui/LinkButton";
import { ArrowLeft, ArrowRight, ArrowUpRight, GitHubIcon } from "@/components/ui/icons";

export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.flatMap((lang) => getProjects().map((p) => ({ lang, slug: p.slug })));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/projects/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  const base = getProject(slug);
  if (!base || !isLocale(lang)) return {};
  const project = localize(base, lang);
  const url = `/${lang}/projects/${slug}/`;
  const image = { url: `/og/${slug}.png`, width: 1200, height: 630, alt: project.title };
  return {
    title: project.title,
    description: project.summary,
    alternates: { canonical: url, languages: languageAlternates(`/projects/${slug}/`) },
    openGraph: {
      type: "article",
      url,
      locale: LOCALE_LABELS[lang].og,
      title: project.title,
      description: project.summary,
      images: [image],
    },
    twitter: { card: "summary_large_image", title: project.title, description: project.summary, images: [image.url] },
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Case-study layout, in the order a client reads it:
 *   header (what it is) → 01 the scenario → 02 what I built (or, while
 *   in progress, how I'd build it) → 03 demo
 *   (flow diagram, video, screens) → 04 tools → 05 result with a number
 *   (marked when estimated or simulated) → next project, call to action.
 */
export default async function ProjectPage({ params }: PageProps<"/[lang]/projects/[slug]">) {
  const { lang, slug } = await params;
  const base = getProject(slug);
  if (!base || !isLocale(lang)) notFound();
  const project = localize(base, lang);
  const dict = getDictionary(lang);
  const t = dict.project;

  const storyLang = storyLocale(slug, lang);
  const { default: Story } = await import(`@content/projects/${slug}/story.${storyLang}.mdx`);

  const all = getProjects().map((p) => localize(p, lang));
  const index = all.findIndex((p) => p.slug === slug);
  const next = all[(index + 1) % all.length];
  const basis = project.metric.basis;

  return (
    <article className="mx-auto flex max-w-[1040px] flex-col gap-5">
      <nav aria-label="Breadcrumb" className="card flex items-center justify-between gap-4 px-5 py-3">
        <Link href={`/${lang}/#projects`} className="label inline-flex items-center gap-2 text-fg hover:text-accent">
          <ArrowLeft className="h-3.5 w-3.5" />
          {t.allProjects}
        </Link>
        <span className="label text-faint">
          {t.project} {pad(index + 1)} / {pad(all.length)}
        </span>
      </nav>

      {/* Header: what it is */}
      <header className="card p-7 sm:p-10">
        <div>
          <p className="flex flex-wrap items-center gap-3">
            <span className="label text-accent">
              {project.number} · {dict.kinds[project.kind]}
            </span>
          </p>
          <h1 className="mt-4 text-balance text-[34px] leading-[1.08] tracking-tight sm:text-[46px]">{project.title}</h1>
          <p className="mt-5 max-w-[60ch] text-pretty text-[17px] leading-relaxed text-muted">{project.summary}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <LinkButton href={site.links.upwork} external>
              {t.hireForThis}
            </LinkButton>
            {project.links.github && (
              <LinkButton href={project.links.github} external variant="ghost">
                <GitHubIcon className="h-3.5 w-3.5" />
                {t.code}
              </LinkButton>
            )}
            {project.links.demo && (
              <LinkButton href={project.links.demo} external variant="ghost">
                {t.demo}
                <ArrowUpRight className="h-3.5 w-3.5" />
              </LinkButton>
            )}
          </div>
        </div>
      </header>

      {/* 01 The scenario · 02 What I built / How I'd build it */}
      <div className="card prose-story p-7 sm:p-10">
        <Story />
      </div>

      {/* 03 Demo */}
      <section aria-label={t.sections.demo} className="flex flex-col gap-5">
        <h2 className="card label w-fit px-4 py-2 text-accent">{t.sections.demo}</h2>
        {project.flow && <FlowDiagram steps={project.flow} title={t.flow} />}
        <MediaGallery project={project} labels={{ title: t.screenshots, comingSoon: t.comingSoon, note: t.shotsNote }} />
      </section>

      {/* 04 Tools · 05 Result */}
      <div className="grid gap-5 md:grid-cols-2">
        <section className="card p-7 sm:p-9">
          <h2 className="label text-accent">{t.sections.tools}</h2>
          <ul className="mt-5 flex flex-wrap gap-2">
            {project.stack.map((s) => (
              <li key={s} className="rounded-[3px] border border-line-strong px-3 py-1.5 text-[14px]">
                {s}
              </li>
            ))}
          </ul>
          <dl className="mt-6 grid gap-3 border-t border-line pt-5 text-[14px]">
            <div className="flex gap-3">
              <dt className="label w-16 shrink-0 pt-0.5 text-faint">{t.type}</dt>
              <dd>{dict.kinds[project.kind]}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="label w-16 shrink-0 pt-0.5 text-faint">{t.data}</dt>
              <dd className="text-muted">{project.note ?? t.clientData}</dd>
            </div>
          </dl>
        </section>
        <section className="card flex flex-col p-7 sm:p-9">
          <h2 className="label text-accent">{t.sections.result}</h2>
          <p className="mt-5 flex flex-wrap items-baseline gap-x-4 gap-y-2">
            <span className="font-mono text-[52px] font-light leading-none tracking-tight text-accent">{project.metric.value}</span>
            {basis && <span className="label rounded-[3px] border border-line-strong px-2 py-0.5 text-faint">{t.basis[basis]}</span>}
          </p>
          <p className="mt-3 text-[15px] text-muted">{project.metric.label}</p>
          <p className="mt-6 border-t border-line pt-5 text-pretty text-[16px] leading-relaxed">{project.result}</p>
          <div className="mt-6 md:mt-auto md:pt-6">
            <LinkButton href={site.links.upwork} external>
              {t.hire}
            </LinkButton>
          </div>
        </section>
      </div>

      {next.slug !== project.slug && (
        <Link
          href={`/${lang}/projects/${next.slug}/`}
          className="card group flex items-center justify-between gap-6 p-7 transition-[border-color,transform] hover:-translate-y-1 hover:border-accent sm:p-10"
        >
          <span>
            <span className="label block text-faint">{t.nextProject} · {next.number}</span>
            <span className="mt-2 block text-[24px] leading-tight tracking-tight transition-colors group-hover:text-accent sm:text-[30px]">
              {next.title}
            </span>
            <span className="mt-2 block text-[15px] text-muted">{next.summary}</span>
          </span>
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[3px] border border-line-strong transition-colors group-hover:border-accent group-hover:bg-accent group-hover:text-accent-fg">
            <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      )}

      <div className="mt-11">
        <ContactCard dict={dict} />
      </div>
    </article>
  );
}
