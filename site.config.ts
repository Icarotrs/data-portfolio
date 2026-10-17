/**
 * site.config.ts — personal info and links. Interface texts per language
 * live in src/i18n/dictionaries.ts.
 */

export type ProjectKind = "integration" | "automation" | "ai" | "extraction" | "dashboard";
/** Folders of the project explorer (labels are per language). */
export type FolderId = "automation" | "internal-systems" | "data" | "experiments";
/** Animated shapes (src/components/ui/Glyph.tsx). */
export type Shape = "nodes" | "torus" | "cube";
export const site = {
  // ── Identity ────────────────────────────────────────────────
  // Interface texts (headline, intro, services…) are per language in
  // src/i18n/dictionaries.ts.
  name: "Icaro Torres",
  /** Production URL, used for Open Graph and sitemap. No trailing slash. */
  url: "https://icaro-data-portfolio.vercel.app",

  // ── Links ───────────────────────────────────────────────────
  links: {
    email: "icaro.trs@gmail.com",
    /** Hidden on the site for now; kept for the Upwork exports. */
    upwork: "https://www.upwork.com/freelancers/~01840d98e344af4b2d",
    linkedin: "https://www.linkedin.com/in/icarotrss/",
    github: "https://github.com/Icarotrs",
  },

  /** Allowed values for "kind" in project.json (labels are per language). */
  projectKinds: ["integration", "automation", "ai", "extraction", "dashboard"] as ProjectKind[],

  /** Folders of the project explorer, in order. Each project.json sets its "folder". */
  folders: ["automation", "internal-systems", "data", "experiments"] as FolderId[],

  // ── Shapes ──────────────────────────────────────────────────
  /** The composition on the home page: connected nodes, torus and cube. */
  homeShapes: ["nodes", "torus", "cube"] as Shape[],
};

export type SiteConfig = typeof site;
