/**
 * site.config.ts — the ONE file to edit for personal info, links,
 * background shapes and filter boxes.
 */


export type ProjectKind = "dashboard" | "automation" | "cleaning";
export type ShapeId = "cube" | "pyramid" | "icosahedron";
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
  /** Short headline for the hero card. */
  headline: "Profit dashboards and automations for e-commerce, built in Power BI & Google Sheets.",
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

  // ── Background: three simple wireframe solids on a slow carousel ──
  // One shape per project kind, orbiting the center of the screen.
  shapes: {
    dashboard: "cube",
    automation: "pyramid",
    cleaning: "icosahedron",
  } satisfies Record<ProjectKind, ShapeId>,

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
    // >= 1024px — hugging the central column
    desktop: [
      { filter: "dither", x: 20, y: 14, w: 15, h: 24 },
      { filter: "ascii", x: 63, y: 9, w: 17, h: 22 },
      { filter: "halftone", x: 66, y: 38, w: 15, h: 28 },
      { filter: "frost", x: 23, y: 48, w: 17, h: 20 },
      { filter: "pixelate", x: 58, y: 72, w: 14, h: 17 },
      { filter: "noise", x: 20, y: 74, w: 12, h: 15 },
    ],
    // 640–1023px
    tablet: [
      { filter: "dither", x: 8, y: 14, w: 24, h: 18 },
      { filter: "ascii", x: 62, y: 20, w: 30, h: 16 },
      { filter: "halftone", x: 12, y: 56, w: 26, h: 18 },
      { filter: "frost", x: 58, y: 62, w: 32, h: 16 },
      { filter: "pixelate", x: 40, y: 40, w: 18, h: 12 },
    ],
    // < 640px
    mobile: [
      { filter: "dither", x: 8, y: 14, w: 36, h: 15 },
      { filter: "halftone", x: 54, y: 34, w: 38, h: 17 },
      { filter: "frost", x: 10, y: 60, w: 44, h: 15 },
      { filter: "ascii", x: 56, y: 78, w: 34, h: 12 },
    ],
  } satisfies Record<"desktop" | "tablet" | "mobile", FilterBox[]>,
};

export type SiteConfig = typeof site;
