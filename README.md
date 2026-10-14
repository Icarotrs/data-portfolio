# Icaro Torres — Business Automation & AI Integration

**Business Automation & AI Integration | Google Sheets, n8n, Apps Script**

Freelance portfolio for small businesses and e-commerce stores in the US: connecting the tools a business already uses, automating manual work and adding AI where it saves time, plus dashboards to see the results. It is built to be linked from an Upwork profile: every call to action goes to Upwork (no email, phone or contact form), and the repo also produces the cover images and description texts for the Upwork portfolio section.

Projects, in order: Shopify → Sheets → AI → Alerts (n8n) · Form → Sheet Automation · Low-Stock Alerts · AI Review Classifier · Messy Data Extractor · E-commerce Profit & ROAS Dashboard.

- **Next.js 16** (App Router), fully static export (`out/`)
- **Tailwind CSS v4**, Geist + Geist Mono, light/dark theme with no flash
- Blurred orange background (a static image, `public/bg/*.webp`, made by `scripts/render-bg.mjs`) with frosted-glass cards, square corners and accent corner ticks
- One animated shape per project type (`site.config.ts → kindShapes`, drawn by `src/components/ui/Glyph.tsx` in SVG/CSS, no canvas): integration → connected nodes with pulses, automation → spinning torus, ai → particles forming clusters, extraction → particles lining up into a grid, dashboard → 3D bars. The home page shows nodes, torus and cube together
- Scroll-driven animations in pure CSS (`animation-timeline: view()`): sections rise in, project cards stack on top of each other while you scroll, screenshots zoom in. Browsers without support (or with reduced motion) show everything static
- The hero title types itself like a command prompt (CSS only)
- Three languages: English, Portuguese and Spanish (`/en/`, `/pt/`, `/es/`)

## Configuration

`site.config.ts` holds the name, site URL, links (Upwork, LinkedIn, GitHub), the project kinds and the kind → shape map. Never add email or phone: contact goes through Upwork.

## Languages

- Interface texts: `src/i18n/dictionaries.ts` (one object per language, typed by the `Dictionary` interface, so a missing key fails the build).
- Locales and helpers: `src/i18n/config.ts`.
- `/` picks a language (saved choice, then browser language, then English) and redirects to `/en/`, `/pt/` or `/es/`.
- The EN · PT · ES switch in the header keeps the current page and saves the choice.

## Projects

Each project is a folder in `content/projects/<slug>/`:

- `project.json` — metadata in English (validated at build time):
   - `order`, `number`, `title`, `kind` (`integration`, `automation`, `ai`, `extraction`, `dashboard`), `summary`
   - `stack` (array), `result` (one sentence), `metric` (`value` + `label`, and `basis`: `estimated` or `simulated` when the number is not measured; the page shows the label)
   - optional `flow` (`[{ tool, label }]`), drawn as a step diagram on the project page
   - `media.screenshots` (`src` + `alt`), `media.video`, optional `note`, `links`
   - `upworkBlurb` (≤ 600 characters, English, for Upwork)
   - `i18n.pt` / `i18n.es` — translated `title`, `summary`, `result`, `metricLabel`, `note`, `alts`, `flow`
- `story.en.mdx` (required), `story.pt.mdx`, `story.es.mdx` — "Problem" and "What I built"; missing languages fall back to English.

A project page reads: problem → what I built → demo (flow diagram, video, screens) → tools → result with a number.

## n8n workflow

`integrations/n8n/shopify-ai-order-alerts/` holds the importable workflow of project 01 (`workflow.json`), sample Shopify orders, a script that sends them to the webhook and a README with the setup steps.

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
site.config.ts                 name, URL, links, project kinds, kind → shape map
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
