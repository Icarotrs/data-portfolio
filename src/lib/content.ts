import "server-only";
import fs from "node:fs";
import path from "node:path";
import { site, type ProjectKind } from "@site";
import type { Locale } from "@/i18n/config";

/**
 * Projects live in content/projects/<slug>/:
 *   project.json   — metadata in English, plus "i18n": { pt: {…}, es: {…} }
 *                    with translated title, summary, result, metricLabel,
 *                    note, screenshot alts and flow labels (validated; the
 *                    build fails on bad data)
 *   story.<lang>.mdx — "The scenario" and "What I built" (status "built") or
 *                    "How I'd build it" (status "in-progress"), one file per language
 *                    (story.en.mdx is required; others fall back to English)
 */

export const UPWORK_BLURB_MAX = 600;

export interface Media {
  src: string;
  alt: string;
}

export interface Project {
  slug: string;
  order: number;
  number: string;
  title: string;
  kind: ProjectKind;
  /** "built": the deliverable exists in this repo. "in-progress": planned build, described in the future tense. */
  status: ProjectStatus;
  summary: string;
  stack: string[];
  result: string;
  /**
   * The headline number. `basis` says where it comes from: "estimated"
   * (the label must state the assumption), "simulated" (computed on
   * simulated data), "setting" (a design rule of the build) or "public"
   * (a fact about a public dataset). Measured numbers have no basis.
   */
  metric: { value: string; label: string; basis?: MetricBasis };
  /** Optional step-by-step flow, drawn as a diagram on the project page. */
  flow?: FlowStep[];
  note?: string;
  links: { github?: string; demo?: string };
  media: {
    screenshots: Media[];
    video?: { src: string; poster?: string };
  };
  upworkBlurb: string;
  /** Translations by locale (English is the base). */
  i18n: Partial<Record<Locale, Translation>>;
}

export type MetricBasis = "estimated" | "simulated" | "setting" | "public";
export type ProjectStatus = "built" | "in-progress";
export const METRIC_BASES: MetricBasis[] = ["estimated", "simulated", "setting", "public"];
export const PROJECT_STATUSES: ProjectStatus[] = ["built", "in-progress"];
export interface FlowStep {
  tool: string;
  label: string;
}

interface Translation {
  title?: string;
  summary?: string;
  result?: string;
  metricValue?: string;
  metricLabel?: string;
  note?: string;
  alts?: string[];
  flow?: string[];
}

const PROJECTS_DIR = path.join(process.cwd(), "content", "projects");
const KINDS = site.projectKinds;

function fail(slug: string, message: string): never {
  throw new Error(`content/projects/${slug}/project.json: ${message}`);
}

function requireString(slug: string, value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    fail(slug, `"${field}" must be a non-empty string`);
  }
  return value;
}

function validate(slug: string, raw: Record<string, unknown>): Project {
  const kind = raw.kind as ProjectKind;
  if (!KINDS.includes(kind)) {
    fail(slug, `"kind" must be one of ${KINDS.join(", ")} (got "${raw.kind}")`);
  }
  if (typeof raw.order !== "number") fail(slug, `"order" must be a number`);
  if (!Array.isArray(raw.stack) || raw.stack.length === 0) {
    fail(slug, `"stack" must be a non-empty array`);
  }

  const blurb = requireString(slug, raw.upworkBlurb, "upworkBlurb");
  if (blurb.length > UPWORK_BLURB_MAX) {
    fail(
      slug,
      `"upworkBlurb" is ${blurb.length} characters; Upwork allows ${UPWORK_BLURB_MAX}. Shorten it.`,
    );
  }

  const metric = (raw.metric ?? {}) as Record<string, unknown>;
  if (metric.basis !== undefined && !METRIC_BASES.includes(metric.basis as MetricBasis)) {
    fail(slug, `"metric.basis" must be one of ${METRIC_BASES.join(", ")}`);
  }
  if (!PROJECT_STATUSES.includes(raw.status as ProjectStatus)) {
    fail(slug, `"status" must be one of ${PROJECT_STATUSES.join(", ")} (got "${raw.status}")`);
  }
  const flow = raw.flow as FlowStep[] | undefined;
  if (flow !== undefined && (!Array.isArray(flow) || flow.some((f) => !f?.tool || !f?.label))) {
    fail(slug, `"flow" must be a list of { "tool", "label" }`);
  }
  const links = (raw.links ?? {}) as Record<string, string>;
  const media = (raw.media ?? {}) as Record<string, unknown>;
  const video = media.video as { src?: string; poster?: string } | undefined;

  return {
    slug,
    order: raw.order as number,
    number: requireString(slug, raw.number, "number"),
    title: requireString(slug, raw.title, "title"),
    kind,
    status: raw.status as ProjectStatus,
    summary: requireString(slug, raw.summary, "summary"),
    stack: raw.stack as string[],
    result: requireString(slug, raw.result, "result"),
    metric: {
      value: requireString(slug, metric.value, "metric.value"),
      label: requireString(slug, metric.label, "metric.label"),
      basis: metric.basis as MetricBasis | undefined,
    },
    flow,
    note: typeof raw.note === "string" && raw.note ? raw.note : undefined,
    links: {
      github: links.github || undefined,
      demo: links.demo || undefined,
    },
    media: {
      screenshots: ((media.screenshots as Media[]) ?? []).map((s) => ({
        src: s.src ?? "",
        alt: requireString(slug, s.alt, "media.screenshots[].alt"),
      })),
      video: video?.src ? { src: video.src, poster: video.poster || undefined } : undefined,
    },
    upworkBlurb: blurb,
    i18n: (raw.i18n as Project["i18n"]) ?? {},
  };
}

/** Every screenshot, video and poster must exist in public/, or the build fails. */
function checkMedia(p: Project) {
  const files = [...p.media.screenshots.map((s) => s.src), p.media.video?.src, p.media.video?.poster];
  for (const src of files) {
    if (src && !fs.existsSync(path.join(process.cwd(), "public", src))) {
      fail(p.slug, `media file "${src}" does not exist in public/`);
    }
  }
}

/**
 * A project only says "What I built" when it is built; an in-progress one
 * says "How I'd build it". Checked in every story file, or the build fails.
 */
const BUILT_HEADINGS = ["## What I built", "## O que eu construí", "## Lo que construí"];
const PLANNED_HEADINGS = ["## How I'd build it", "## Como eu construiria", "## Cómo lo construiría"];

function checkStoryMatchesStatus(p: Project) {
  const dir = path.join(PROJECTS_DIR, p.slug);
  const [must, mustNot] = p.status === "built" ? [BUILT_HEADINGS, PLANNED_HEADINGS] : [PLANNED_HEADINGS, BUILT_HEADINGS];
  for (const file of fs.readdirSync(dir).filter((f) => /^story\.\w+\.mdx$/.test(f))) {
    const text = fs.readFileSync(path.join(dir, file), "utf8");
    if (mustNot.some((h) => text.includes(h)) || !must.some((h) => text.includes(h))) {
      throw new Error(
        `content/projects/${p.slug}/${file}: status is "${p.status}", so the second section must be "${must.join('" / "')}".`,
      );
    }
  }
}

let cache: Project[] | null = null;

export function getProjects(): Project[] {
  if (cache) return cache;
  const slugs = fs
    .readdirSync(PROJECTS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  cache = slugs
    .map((slug) => {
      const file = path.join(PROJECTS_DIR, slug, "project.json");
      if (!fs.existsSync(file)) fail(slug, "file is missing");
      if (!fs.existsSync(path.join(PROJECTS_DIR, slug, "story.en.mdx"))) {
        throw new Error(`content/projects/${slug}/story.en.mdx is missing`);
      }
      const project = validate(slug, JSON.parse(fs.readFileSync(file, "utf8")));
      checkMedia(project);
      checkStoryMatchesStatus(project);
      return project;
    })
    .sort((a, b) => a.order - b.order);
  return cache;
}

export function getProject(slug: string): Project | undefined {
  return getProjects().find((p) => p.slug === slug);
}

/** A project with its texts in the given language (English fallback). */
export function localize(p: Project, locale: Locale): Project {
  const t = p.i18n[locale];
  if (!t) return p;
  return {
    ...p,
    title: t.title ?? p.title,
    summary: t.summary ?? p.summary,
    result: t.result ?? p.result,
    metric: { ...p.metric, value: t.metricValue ?? p.metric.value, label: t.metricLabel ?? p.metric.label },
    note: t.note ?? p.note,
    flow: p.flow?.map((f, i) => ({ ...f, label: t.flow?.[i] ?? f.label })),
    media: {
      ...p.media,
      screenshots: p.media.screenshots.map((s, i) => ({ ...s, alt: t.alts?.[i] ?? s.alt })),
    },
  };
}

export const getLocalizedProjects = (locale: Locale) => getProjects().map((p) => localize(p, locale));

/** Which story file to import for a project in a language. */
export function storyLocale(slug: string, locale: Locale): Locale {
  return fs.existsSync(path.join(PROJECTS_DIR, slug, `story.${locale}.mdx`)) ? locale : "en";
}
