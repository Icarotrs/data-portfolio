# Data & Automation Portfolio

Personal portfolio for a freelance data & automation specialist (Power BI, Google Sheets, Apps Script, SQL, Python). It is built to be linked from an Upwork profile: every call to action goes to Upwork, and the repo also produces the cover images and description texts for the Upwork portfolio section.

- **Next.js 16** (App Router), fully static export (`out/`)
- **Tailwind CSS v4**, Geist + Geist Mono, light/dark theme with no flash
- **WebGL2** background (no 3D library): small line icons orbit the page and are rendered through "filter boxes" (dither, ASCII, pixelate, noise, frost, halftone) by a single post-processing shader
- Frosted **glassmorphism** cards and CSS scroll-driven reveals
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
| `iconThemes` | Which icons orbit the page in each section |
| `kindLabels` | Labels for project kinds |
| `filterBoxes` | Filter box positions per breakpoint |

The site intentionally has no email, phone or contact form — all contact goes through Upwork.

## Add a project

1. Create `content/projects/<slug>/` (the slug becomes the URL: `/projects/<slug>/`).
2. Add `project.json` (copy an existing one). Fields:
   - `order` (sort order), `number` (`"04"`), `title`, `summary`
   - `kind`: `dashboard`, `automation` or `cleaning` — picks the icon theme on its page
   - `stack` (array), `result` (one sentence), `metric` (`value` + `label`)
   - `note` (optional, e.g. "Demo uses fictitious data")
   - `links.github`, `links.demo` (optional; empty strings are hidden)
   - `media.screenshots` (`src` + `alt`; an empty `src` shows a placeholder), `media.video` (optional)
   - `upworkBlurb`: the Upwork project description, **max 600 characters** — the build fails if it is longer
3. Add `story.mdx` with `## Problem` and `## What I built` sections.
4. Put screenshots in `public/projects/<slug>/` and reference them as `/projects/<slug>/file.png`.
5. Run `npm run build && npm run assets` to create the cover, OG image and Upwork text.

## Change the background

**Icons.** Small line icons (coffee cup, keyboard keys, `{ }`, `</>`, clock, frog, star, charts…) travel clockwise around two rounded-square rings inside the viewport. Scrolling pushes them along the loop. Every page section has a `data-icon-theme` attribute; when a new section reaches the middle of the screen, each icon plays a short "typing" animation (caret, then flickering code characters) and turns into a random icon from that theme.

Edit the lists in `site.config.ts → iconThemes`. Available names are in `src/lib/icons/names.ts`; the drawings (Canvas 2D line art) are in `src/lib/icons/atlas.ts`. Ring sizes, counts and speeds are in `ringsFor()` in `src/lib/webgl/engine.ts`.

**Filter boxes.** `site.config.ts → filterBoxes` has one list per breakpoint (`desktop` ≥ 1024px, `tablet` 640–1023px, `mobile` < 640px). Each box is `{ filter, x, y, w, h }` in % of the viewport, with `filter` one of `dither`, `ascii`, `pixelate`, `noise`, `frost`, `halftone`. Up to 8 boxes per breakpoint.

The boxes are real DOM elements (`src/components/background/FilterBoxLayer.tsx`); the WebGL engine reads their on-screen rectangles and passes them to the shader (`src/lib/webgl/post.ts`), so what you see outlined is exactly where the filter applies.

## Performance and accessibility

- The WebGL engine (plain WebGL2, ~15 KB) loads only after the page has loaded and the browser is idle (or on first interaction).
- Icons are one instanced draw call; the drawing buffer is capped (1.5× pixel ratio, 2.4 MP); the loop drops to 30 fps when nothing is scrolling or animating.
- Pixel ratio capped at 1.5; rendering pauses when the tab is hidden.
- `prefers-reduced-motion`: a static frame, redrawn only when something changes.
- No WebGL2 → a pre-rendered background image. Software-only WebGL (no GPU) → the lightweight CSS background. Add `?forcegl` to the URL to force WebGL anyway (testing).
- Glass cards are opaque enough to keep text at WCAG AA contrast over any background pixel.

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
site.config.ts                 personal info, links, icon themes, filter boxes
content/projects/<slug>/       project.json + story.mdx
scripts/render-assets.mjs      covers, OG images, fallback, Upwork texts
src/app/(site)/                home and project pages
src/app/render/                internal pages for asset screenshots
src/components/background/     background, canvas loader, filter boxes
src/components/chrome/         decorative viewport details
src/lib/content.ts             loads and validates projects
src/lib/scene-store.ts         section theme in view (React + engine)
src/lib/icons/                 icon names and atlas drawings
src/lib/webgl/                 engine and shaders
```

## Deploy

See [DEPLOY.md](./DEPLOY.md).
