# Data & Automation Portfolio

Personal portfolio for a freelance data & automation specialist (Power BI, Google Sheets, Apps Script, SQL, Python). It is built to be linked from an Upwork profile: every call to action goes to Upwork, and the repo also produces the cover images and description texts for the Upwork portfolio section.

- **Next.js 16** (App Router), fully static export (`out/`)
- **Tailwind CSS v4**, Geist + Geist Mono, light/dark theme with no flash
- **WebGL2** background (no 3D library): three simple wireframe solids on a slow carousel, rendered through movable "filter panels" (dither, ASCII, pixelate, noise, frost, halftone) by a single post-processing shader
- One-screen home: the side menu (or the pager / ← → keys) switches a single central panel — Home, Projects, Services, Contact — with no page scroll. Links like `/#projects` open a panel directly
- Dark greys with orange highlights (light stone variant), a smooth background, opaque frosted cards with fine grain, mono corner details (menu, clock, theme switch, links)
- **Add-image card**: a small movable card on the home page; visitors drop their own images into the background and drag them (and the panels) under the effects — images never leave the browser
- Case-study pages in an editorial layout: outcome first, fact strip, story with a sticky summary, large screenshots
- Content in **JSON + MDX**, validated at build time

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static site in out/
npm run lint
```

## Edit your details

Everything personal lives in **`site.config.ts`**:

| Field | What it does |
| --- | --- |
| `name`, `role`, `title`, `valueProp`, `description` | Hero text, page titles, SEO |
| `url` | Production URL (Open Graph, sitemap). No trailing slash |
| `links.upwork`, `links.linkedin`, `links.github` | The only contact links on the site |
| `shapes` | Which shape represents each project kind |
| `kindLabels` | Labels for project kinds |
| `filterBoxes` | Filter box positions per breakpoint |

The site intentionally has no email, phone or contact form — all contact goes through Upwork.

## Add a project

1. Create `content/projects/<slug>/` (the slug becomes the URL: `/projects/<slug>/`).
2. Add `project.json` (copy an existing one). Fields:
   - `order` (sort order), `number` (`"04"`), `title`, `summary`
   - `kind`: `dashboard`, `automation` or `cleaning`
   - `stack` (array), `result` (one sentence), `metric` (`value` + `label`)
   - `note` (optional, e.g. "Demo uses fictitious data")
   - `links.github`, `links.demo` (optional; empty strings are hidden)
   - `media.screenshots` (`src` + `alt`; an empty `src` shows a placeholder), `media.video` (optional)
   - `upworkBlurb`: the Upwork project description, **max 600 characters** — the build fails if it is longer
3. Add `story.mdx` with `## Problem` and `## What I built` sections.
4. Put screenshots in `public/projects/<slug>/` and reference them as `/projects/<slug>/file.png`.
5. Run `npm run build && npm run assets` to create the cover, OG image and Upwork text.

## Change the background

**Shapes.** Three simple wireframe solids (a cube, a square pyramid and an icosahedron) with orange vertices orbit the centre of the screen on a slow 3D carousel. They are plain vertex lists in `src/lib/webgl/shapes.ts`; orbit radius, size and speed are in `buildShapes()` in `src/lib/webgl/engine.ts`.

**Filter boxes.** `site.config.ts → filterBoxes` has one list per breakpoint (`desktop` ≥ 1024px, `tablet` 640–1023px, `mobile` < 640px). Each box is `{ filter, x, y, w, h }` in % of the viewport, with `filter` one of `dither`, `ascii`, `pixelate`, `noise`, `frost`, `halftone`. Up to 8 boxes per breakpoint. On the home page visitors can drag the panels (mouse anywhere on a panel, touch on its label tab, or Tab + arrow keys); their positions are saved in `localStorage` and the add-image card has a *Reset* button.

**Add-image card.** On the home page (large screens) a small card next to the menu accepts dropped or chosen images (up to 4). Each becomes a movable frame; the engine draws the image into the background at the frame's rectangle, so the filter panels process it. Images are object URLs in the browser and are never uploaded. The card's *Reset* puts the panels back. Code: `src/components/background/UserImageLayer.tsx`.

The boxes are real DOM elements (`src/components/background/FilterBoxLayer.tsx`); the WebGL engine reads their on-screen rectangles and passes them to the shader (`src/lib/webgl/post.ts`), so what you see outlined is exactly where the filter applies.

## Performance and accessibility

- The WebGL engine (plain WebGL2, ~20 KB) loads only after the page has loaded and the browser is idle (or on first interaction).
- Shapes are two draw calls (lines, points); the drawing buffer is capped (1.5× pixel ratio, 2.4 MP); the loop runs at 30 fps, 60 while something is dragged.
- Pixel ratio capped at 1.5; rendering pauses when the tab is hidden.
- `prefers-reduced-motion`: a static frame, redrawn only when something changes.
- No WebGL2 → a pre-rendered background image. Software-only WebGL (no GPU) → the lightweight CSS background. Add `?forcegl` to the URL to force WebGL anyway (testing).
- Cards are opaque enough to keep text at WCAG AA contrast over any part of the background.

## Project screenshots

The screenshots on project pages are rendered from HTML mock-ups of the real deliverables (Power BI reports, Google Sheets, emails, PDF reports, terminal runs) with fictitious, deterministic data:

```bash
npm run shots                                   # all projects
npm run shots -- --only=marketing-roas-dashboard
```

Definitions live in `scripts/shots/projects.mjs` (one function per project) and the building blocks (app frames and SVG charts) in `scripts/shots/kit.mjs`. Output: `public/projects/<slug>/<name>.webp`, referenced from each `project.json`. When a real client project is delivered, replace a mock-up with a real (anonymised) screenshot at the same path.

## Generated assets

```bash
npm run build
npm run assets            # everything below
npm run upwork            # only the Upwork texts (no browser needed)
```

| Output | Use |
| --- | --- |
| `exports/covers/<slug>.png` | 1600×1200 cover for the Upwork portfolio |
| `exports/upwork/<slug>.txt` | Title, description (≤ 600 chars), skills, result |
| `public/og/*.png` | 1200×630 social preview images |
| `public/fallback/bg-*.webp` | Background for browsers without WebGL2 |

Options: `--theme=light` (default `dark`), `--only=covers,og,fallback,upwork`. The script uses `playwright-core` with a local Chromium; set `CHROME_PATH` if it cannot find one. It screenshots internal pages under `/render/` (not linked, `noindex`, disallowed in `robots.txt`).

Commit the regenerated `public/og` and `public/fallback` files so they deploy.

## Project structure

```
site.config.ts                 personal info, links, shapes, filter boxes
content/projects/<slug>/       project.json + story.mdx
scripts/render-assets.mjs      covers, OG images, fallback, Upwork texts
src/app/(site)/                home and project pages
src/app/render/                internal pages for asset screenshots
src/components/background/     background, canvas loader, filter boxes
src/components/chrome/         decorative viewport details
src/lib/content.ts             loads and validates projects
src/lib/deck-store.ts          which home panel is showing (URL hash)
src/lib/lab-store.ts           dragged panel positions + visitor images
src/lib/use-draggable.ts       mouse / touch / keyboard dragging
src/lib/webgl/                 engine, shapes and shaders
```

## Deploy

See [DEPLOY.md](./DEPLOY.md).
