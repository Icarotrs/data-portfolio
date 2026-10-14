import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { site } from "@site";
import { LOCALES, LOCALE_LABELS, isLocale, languageAlternates } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getProject, getProjects, localize, storyLocale } from "@/lib/content";
import { ContactCard } from "@/components/layout/ContactCard";
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
 * Case-study layout, built for scanning first and reading second:
 *   1. Header — what it is (title + one-line summary) beside the outcome
 *   2. Fact strip — type, tools, data at a glance
 *   3. Story — Problem / What I built, with a sticky summary panel
 *   4. Screenshots, then the next project and the call to action
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
  const dataNote = project.note?.split(". ")[0].replace(/\.$/, "");

  return (
    <article className="mx-auto flex max-w-[1040px] flex-col gap-5">
      <nav aria-label="Breadcrumb" className="flex items-center justify-between gap-4 pb-2">
        <Link href={`/${lang}/#projects`} className="label inline-flex items-center gap-2 text-fg hover:text-accent">
          <ArrowLeft className="h-3.5 w-3.5" />
          {t.allProjects}
        </Link>
        <span className="label text-faint">
          {t.project} {pad(index + 1)} / {pad(all.length)}
        </span>
      </nav>

      {/* 1. Header: what it is + the outcome */}
      <header className="card grid gap-8 p-7 sm:p-10 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:gap-12">
        <div className="flex flex-col">
          <p className="label text-accent">
            {project.number} · {dict.kinds[project.kind]}
          </p>
          <h1 className="mt-4 text-balance text-[34px] leading-[1.08] tracking-tight sm:text-[46px]">{project.title}</h1>
          <p className="mt-5 max-w-[52ch] text-pretty text-[17px] leading-relaxed text-muted">{project.summary}</p>
          <div className="mt-8 flex flex-wrap gap-3 lg:mt-auto lg:pt-8">
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
        <div className="flex flex-col justify-between rounded-[8px] border border-line p-6">
          <p className="label text-faint">{t.result}</p>
          <p className="mt-6 font-mono text-[52px] font-light leading-none tracking-tight text-accent">
            {project.metric.value}
          </p>
          <p className="mt-3 text-sm text-muted">{project.metric.label}</p>
          <p className="mt-6 border-t border-line pt-4 text-pretty text-[15px] leading-relaxed">{project.result}</p>
        </div>
      </header>

      {/* 2. Facts at a glance */}
      <dl className="card grid grid-cols-1 divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <Fact label={t.type} value={dict.kinds[project.kind]} />
        <Fact label={t.stack} value={project.stack.join(" · ")} />
        <Fact label={t.data} value={dataNote ?? t.clientData} />
      </dl>

      {/* 3. Story + sticky summary */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="card prose-story p-7 sm:p-10">
          <Story />
        </div>
        <aside aria-label={t.glance} className="lg:sticky lg:top-6 lg:self-start">
          <div className="card p-7">
            <p className="label text-faint">{t.glance}</p>
            <ul className="mt-4 flex flex-col gap-2.5">
              {project.stack.map((s) => (
                <li key={s} className="flex items-center gap-3 text-[15px]">
                  <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 bg-accent" />
                  {s}
                </li>
              ))}
            </ul>
            {project.note && <p className="mt-5 border-t border-line pt-4 text-xs leading-relaxed text-muted">{project.note}</p>}
            <div className="mt-5 border-t border-line pt-5">
              <LinkButton href={site.links.upwork} external className="w-full">
                {t.hire}
              </LinkButton>
            </div>
          </div>
        </aside>
      </div>

      {/* 4. Screenshots */}
      <MediaGallery project={project} labels={{ title: t.screenshots, comingSoon: t.comingSoon, note: t.shotsNote }} />

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
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line-strong transition-colors group-hover:border-accent group-hover:bg-accent group-hover:text-accent-fg">
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

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-7 py-5">
      <dt className="label text-faint">{label}</dt>
      <dd className="mt-1.5 text-[15px] leading-snug">{value}</dd>
    </div>
  );
}
