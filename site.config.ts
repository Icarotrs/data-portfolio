/**
 * site.config.ts — personal info and links. Interface texts per language
 * live in src/i18n/dictionaries.ts.
 */

export type ProjectKind = "integration" | "automation" | "ai" | "extraction" | "dashboard";
/** Animated shapes (src/components/ui/Glyph.tsx). */
export type Shape = "nodes" | "torus" | "clusters" | "grid" | "bars" | "cube";
export const site = {
  // ── Identity ────────────────────────────────────────────────
  // Interface texts (headline, intro, services…) are per language in
  // src/i18n/dictionaries.ts.
  name: "Icaro Torres",
  /** Production URL, used for Open Graph and sitemap. No trailing slash. */
  url: "https://icaro-data-portfolio.vercel.app",

  // ── Links (all contact goes through Upwork) ─────────────────
  links: {
    upwork: "https://www.upwork.com/freelancers/~YOUR_PROFILE_ID",
    linkedin: "https://www.linkedin.com/in/YOUR_PROFILE",
    github: "https://github.com/Icarotrs",
  },

  /** Allowed values for "kind" in project.json (labels are per language). */
  projectKinds: ["integration", "automation", "ai", "extraction", "dashboard"] as ProjectKind[],

  // ── Shapes ──────────────────────────────────────────────────
  /** Which animated shape stands for each project type. */
  kindShapes: {
    integration: "nodes", // small nodes joined by lines, pulses along the links
    automation: "torus", // spinning torus
    ai: "clusters", // particles gathering into groups
    extraction: "grid", // scattered particles lining up into a grid
    dashboard: "bars", // 3D bars
  } as Record<ProjectKind, Shape>,
  /** The composition on the home page: connected nodes, torus and cube. */
  homeShapes: ["nodes", "torus", "cube"] as Shape[],
};

export type SiteConfig = typeof site;
