/**
 * site.config.ts — personal info and links. Interface texts per language
 * live in src/i18n/dictionaries.ts.
 */

export type ProjectKind = "dashboard" | "automation" | "cleaning";
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
  projectKinds: ["dashboard", "automation", "cleaning"] as ProjectKind[],
};

export type SiteConfig = typeof site;
