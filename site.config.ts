/**
 * site.config.ts — the ONE file to edit for personal info, links,
 * background shapes and filter boxes.
 */

export type ProjectKind = "dashboard" | "automation" | "cleaning";
export type ShapeId = "cube-bars" | "torus" | "particle-sphere" | "home";
export type FilterType =
  | "dither"
  | "ascii"
  | "pixelate"
  | "noise"
  | "frost"
  | "halftone";

export interface FilterBox {
  filter: FilterType;
  /** Label shown in the box corner. Defaults to the filter name. */
  label?: string;
  /** Position and size in % of the viewport (0–100). */
  x: number;
  y: number;
  w: number;
  h: number;
}

export const site = {
  // ── Identity ────────────────────────────────────────────────
  name: "Icaro",
  role: "Data & Automation Freelancer",
  title: "E-commerce Profit Dashboards | Power BI & Google Sheets",
  valueProp:
    "I turn messy store data into dashboards and automations that show your real profit per product and per order — and keep updating themselves.",
  /** Production URL, used for Open Graph and sitemap. No trailing slash. */
  url: "https://icaro-data-portfolio.vercel.app",
  description:
    "Freelance data & automation for e-commerce and small businesses: Power BI and Google Sheets profit dashboards, Apps Script automation, data cleaning and automated reports.",

  // ── Links (all contact goes through Upwork) ─────────────────
  links: {
    upwork: "https://www.upwork.com/freelancers/~YOUR_PROFILE_ID",
    linkedin: "https://www.linkedin.com/in/YOUR_PROFILE",
    github: "https://github.com/Icarotrs",
  },

  // ── Background: project kind → 3D shape ─────────────────────
  shapes: {
    home: "home",
    dashboard: "cube-bars",
    automation: "torus",
    cleaning: "particle-sphere",
  } satisfies Record<ProjectKind | "home", ShapeId>,

  /** Human labels for project kinds. */
  kindLabels: {
    dashboard: "Dashboard / BI",
    automation: "Automation / Apps Script",
    cleaning: "Data cleaning / import",
  } satisfies Record<ProjectKind, string>,

  // ── Background: filter boxes per breakpoint ─────────────────
  // Boxes are fixed in the viewport; shapes drift behind them and are
  // rendered through each box's filter. x/y/w/h are % of the viewport.
  filterBoxes: {
    // >= 1024px
    desktop: [
      { filter: "dither", x: 6, y: 16, w: 17, h: 26 },
      { filter: "ascii", x: 56, y: 9, w: 19, h: 24 },
      { filter: "halftone", x: 77, y: 38, w: 17, h: 30 },
      { filter: "frost", x: 30, y: 54, w: 24, h: 22 },
      { filter: "pixelate", x: 61, y: 74, w: 14, h: 18 },
      { filter: "noise", x: 9, y: 70, w: 13, h: 17 },
    ],
    // 640–1023px
    tablet: [
      { filter: "dither", x: 6, y: 12, w: 26, h: 20 },
      { filter: "ascii", x: 58, y: 22, w: 34, h: 18 },
      { filter: "halftone", x: 10, y: 58, w: 30, h: 20 },
      { filter: "frost", x: 55, y: 66, w: 36, h: 18 },
      { filter: "pixelate", x: 40, y: 42, w: 18, h: 12 },
    ],
    // < 640px
    mobile: [
      { filter: "dither", x: 6, y: 12, w: 38, h: 16 },
      { filter: "halftone", x: 54, y: 34, w: 40, h: 18 },
      { filter: "frost", x: 8, y: 62, w: 46, h: 16 },
      { filter: "ascii", x: 58, y: 80, w: 36, h: 12 },
    ],
  } satisfies Record<"desktop" | "tablet" | "mobile", FilterBox[]>,
};

export type SiteConfig = typeof site;
