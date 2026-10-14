import "server-only";
import fs from "node:fs";
import path from "node:path";
import { site, type ProjectKind } from "@site";

/**
 * Projects live in content/projects/<slug>/:
 *   project.json — metadata (validated below; the build fails on bad data)
 *   story.mdx    — "Problem" and "What I built" sections
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
  summary: string;
  stack: string[];
  result: string;
  metric: { value: string; label: string };
  note?: string;
  links: { github?: string; demo?: string };
  media: {
    screenshots: Media[];
    video?: { src: string; poster?: string };
  };
  upworkBlurb: string;
}

const PROJECTS_DIR = path.join(process.cwd(), "content", "projects");
const KINDS = Object.keys(site.kindLabels) as ProjectKind[];

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
  const links = (raw.links ?? {}) as Record<string, string>;
  const media = (raw.media ?? {}) as Record<string, unknown>;
  const video = media.video as { src?: string; poster?: string } | undefined;

  return {
    slug,
    order: raw.order as number,
    number: requireString(slug, raw.number, "number"),
    title: requireString(slug, raw.title, "title"),
    kind,
    summary: requireString(slug, raw.summary, "summary"),
    stack: raw.stack as string[],
    result: requireString(slug, raw.result, "result"),
    metric: {
      value: requireString(slug, metric.value, "metric.value"),
      label: requireString(slug, metric.label, "metric.label"),
    },
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
  };
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
      if (!fs.existsSync(path.join(PROJECTS_DIR, slug, "story.mdx"))) {
        throw new Error(`content/projects/${slug}/story.mdx is missing`);
      }
      return validate(slug, JSON.parse(fs.readFileSync(file, "utf8")));
    })
    .sort((a, b) => a.order - b.order);
  return cache;
}

export function getProject(slug: string): Project | undefined {
  return getProjects().find((p) => p.slug === slug);
}
