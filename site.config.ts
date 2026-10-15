/**
 * site.config.ts — personal info and links. Interface texts per language
 * live in src/i18n/dictionaries.ts.
 */

export type ProjectKind = "integration" | "automation" | "ai" | "extraction" | "dashboard";
/** Animated shapes (src/components/ui/Glyph.tsx). */
export type Shape = "nodes" | "torus" | "cube";
export const site = {
  // ── Identity ────────────────────────────────────────────────
  // Interface texts (headline, intro, services…) are per language in
  // src/i18n/dictionaries.ts.
  name: "Icaro Torres",
  /** Production URL, used for Open Graph and sitemap. No trailing slash. */
  url: "https://icaro-data-portfolio.vercel.app",

  // ── Links (all contact goes through Upwork) ─────────────────
  links: {
    upwork: "https://www.upwork.com/freelancers/~01840d98e344af4b2d",
    linkedin: "https://www.linkedin.com/in/icarotrss/",
    github: "https://github.com/Icarotrs",
  },

  /** Allowed values for "kind" in project.json (labels are per language). */
  projectKinds: ["integration", "automation", "ai", "extraction", "dashboard"] as ProjectKind[],

  // ── Shapes ──────────────────────────────────────────────────
  /** The composition on the home page: connected nodes, torus and cube. */
  homeShapes: ["nodes", "torus", "cube"] as Shape[],
};

export type SiteConfig = typeof site;
