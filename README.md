# Icaro Torres — Business Automation & AI Integration

**Business Automation & AI Integration | Google Sheets, n8n, Apps Script**

Freelance portfolio for small businesses and e-commerce stores in the US: connecting the tools a business already uses, automating manual work and adding AI where it saves time, plus dashboards to see the results. It is built to be linked from an Upwork profile: every call to action goes to Upwork (no email, phone or contact form), and the repo also produces the cover images and description texts for the Upwork portfolio section.

Projects, in order: Shopify → Sheets → AI → Alerts (n8n) · Form → Sheet Automation · Low-Stock Alerts · AI Review Classifier · Messy Data Extractor · E-commerce Profit & ROAS Dashboard.

- **Next.js 16** (App Router), fully static export (`out/`)
- **Tailwind CSS v4**, Geist + Geist Mono, light/dark theme with no flash
- Animated "lava lamp" background (`src/components/layout/LavaBackground.tsx`): a tiny canvas (~240px wide) draws the blurred orange band from `public/bg/*.webp` (made by `scripts/render-bg.mjs`) plus soft blobs that drift and merge, stretched to fill the screen; it updates at ~20 fps, pauses while scrolling and in hidden tabs, and stays still for reduced motion. A fine frosted-glass texture (`public/bg/grain.png`) sits on top. Cards are a translucent fill with square corners and accent corner ticks; no live `backdrop-filter` blur (it made scrolling stutter)
- Home page composition: connected nodes with pulses, a spinning torus and a wireframe cube (`site.config.ts → homeShapes`, drawn by `src/components/ui/Glyph.tsx` in SVG/CSS, no canvas). Project cards and pages have no animated shapes
- Scroll-driven animations in pure CSS (`animation-timeline: view()`): sections rise in, project cards stack on top of each other while you scroll, screenshots zoom in. Browsers without support (or with reduced motion) show everything static
- The hero title types itself like a command prompt (CSS only)
- Three languages: English, Portuguese and Spanish (`/en/`, `/pt/`, `/es/`)

## Configuration

`site.config.ts` holds the name, site URL, links (Upwork, LinkedIn, GitHub), the project kinds and the home shapes. Never add email or phone: contact goes through Upwork.

## Languages

- Interface texts: `src/i18n/dictionaries.ts` (one object per language, typed by the `Dictionary` interface, so a missing key fails the build).
- Locales and helpers: `src/i18n/config.ts`.
- `/` picks a language (saved choice, then browser language, then English) and redirects to `/en/`, `/pt/` or `/es/`.
- The EN · PT · ES switch in the header keeps the current page and saves the choice.

- **Language by region.** On Vercel, `vercel.json` redirects `/` on the edge: a saved choice (cookie `lang`, set by the language switch) wins; otherwise the visitor's country (`x-vercel-ip-country`) picks `/pt/` or `/es/` for Portuguese- or Spanish-speaking countries and `/en/` for everyone else. Country and time-zone lists are in `src/i18n/regions.json`; after editing it run `node scripts/gen-vercel-json.mjs`. Elsewhere (local runs, other hosts) the `/` page falls back to the device's time zone.
- **Translated screens and videos.** `npm run shots` and `npm run videos` also render Portuguese and Spanish versions (`<file>.pt.webp`, `demo.es.mp4`, …) by translating the mock-ups with `scripts/shots/i18n.mjs`; each language page uses its own files and falls back to English when one is missing.

## Projects

Each project is a folder in `content/projects/<slug>/`:

- `project.json` — metadata in English (validated at build time):
   - `order`, `number`, `title`, `kind` (`integration`, `automation`, `ai`, `extraction`, `dashboard`), `summary`
   - `status`: `built` or `in-progress` (internal only, not shown on the site; it decides whether the story says "What I built" or "How I'd build it")
   - `folder`: where the project is filed in the explorer (`automation`, `internal-systems`, `data`, `experiments`; order and list in `site.config.ts → folders`)
   - `stack` (array), `result` (one sentence), `metric` (`value` + `label`, and `basis` when the number is not measured: `estimated` — the label must state the assumption and the math —, `simulated`, `setting` for a design rule, or `public` for a fact about a public dataset; the card, page and cover show the seal)
   - optional `flow` (`[{ tool, label }]`), drawn as a step diagram on the project page
   - `media.screenshots` (`src` + `alt`), `media.video`, optional `note`, `links`
   - `upworkBlurb` (≤ 600 characters, English, for Upwork)
   - `i18n.pt` / `i18n.es` — translated `title`, `summary`, `result`, `metricValue`, `metricLabel`, `note`, `alts`, `flow`
- `story.en.mdx` (required), `story.pt.mdx`, `story.es.mdx` — "The scenario" (a typical situation, in the present tense, never a client) and then "What I built" for `built` projects or "How I'd build it" (future tense) for `in-progress` ones. The build fails if the heading doesn't match the status. Missing languages fall back to English.

A project page reads: the scenario → what I built / how I'd build it → demo (flow diagram, video, screens) → tools → result with a number.

Rule for numbers: a number only goes on the site if it was measured, or calculated from an assumption written next to it. Never invent one.

## Project code

Each project's deliverable lives in `integrations/`, with its own README (setup steps) and tests. Fictitious or public data only.

| # | Project | Folder | Status | Tests |
| --- | --- | --- | --- | --- |
| 01 | Shopify → Sheets → AI → Alerts | `integrations/n8n/shopify-ai-order-alerts/` | built | imported and run end to end in n8n (Claude call mocked) |
| 02 | Form-to-Sheet Automation | `integrations/apps-script/form-to-sheet-automation/` | code ready, in progress until run in a Google account | `node --test tests/*.test.mjs` |
| 03 | Low-Stock Alerts | `integrations/apps-script/low-stock-alerts/` | code ready, in progress until run in a Google account | `node --test tests/*.test.mjs` |
| 04 | AI Review Classifier | `integrations/apps-script/ai-review-classifier/` | code ready, in progress until run with an API key and hand-checked | `node --test tests/*.test.mjs` |
| 05 | Messy Data Extractor | `integrations/python/messy-data-extractor/` | code ready, in progress until confirmed | `python -m pytest -q` |
| 06 | E-commerce Profit & ROAS | `integrations/powerbi/ecommerce-profit-roas/` | kit ready; the report is built in Power BI Desktop | `python -m pytest -q` |

When a project is confirmed to run, set `"status": "built"` in its `project.json` and change "How I'd build it" to "What I built" (past tense, only what was implemented) in its three story files. The build fails if the heading and the status don't match.

## Project screenshots

The screenshots on project pages are rendered from HTML mock-ups of the real deliverables (n8n, Power BI, Google Sheets, Apps Script, Slack, Gmail, PDF reports, terminal runs) with fictitious, deterministic data:

```bash
npm run shots                                   # all projects
npm run shots -- --only=marketing-roas-dashboard
```

Definitions live in `scripts/shots/projects.mjs` (one function per project) and the building blocks (app frames and SVG charts) in `scripts/shots/kit.mjs`. Output: `public/projects/<slug>/<name>.webp`, referenced from each `project.json`. When a real client project is delivered, replace a mock-up with a real (anonymised) screenshot at the same path.

## Demo videos

Each project has a short walkthrough video (cursor, typing, rows arriving, charts growing, captions) built from the same mock-ups:

```bash
npm run videos                                  # all projects (needs ffmpeg on PATH)
npm run videos -- --only=form-to-sheet-automation
```

Scripts live in `scripts/shots/videos.mjs`; output is `public/projects/<slug>/demo.mp4` (1280×800, H.264) plus `demo.webm` (VP9), referenced from `media.video` in each `project.json`.

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

Options: `--theme=light` (default `dark`), `--only=covers,og,upwork`. The script uses `playwright-core` with a local Chromium; set `CHROME_PATH` if it cannot find one. It screenshots internal pages under `/render/` (not linked, `noindex`, disallowed in `robots.txt`).

Commit the regenerated `public/og` files so they deploy.

## Project structure

```
site.config.ts                 name, URL, links, project kinds, home shapes
content/projects/<slug>/       project.json + story.<lang>.mdx
integrations/n8n/              importable n8n workflow for project 01
scripts/shots/                 HTML mock-ups for screenshots and demo videos
scripts/render-shots.mjs       screenshots → public/projects/<slug>/*.webp
scripts/render-videos.mjs      demo videos → public/projects/<slug>/demo.mp4/.webm
scripts/render-bg.mjs          page background → public/bg/*.webp
scripts/render-assets.mjs      covers, OG images, Upwork texts
src/app/[lang]/                home and project pages (en, pt, es)
src/app/(root)/                / → language redirect
src/app/render/                internal pages for asset screenshots
src/components/                home, layout, project and ui components
src/i18n/                      locales and dictionaries
src/lib/content.ts             loads, validates and localizes projects
```

## Deploy

See [DEPLOY.md](./DEPLOY.md).
