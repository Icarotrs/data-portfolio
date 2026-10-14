# Changes: new positioning (October 2026)

Review list before deploying. Branch `main-1tqb61`.

## 1. Visual
- Blurred orange background, as in the reference image: a static image (`public/bg/dark.webp`, `light.webp`, about 15 KB each) fixed behind the page, with nothing animated in the background.
- Frosted glass cards with 3px corners and orange corner marks. The header and footer are frosted too.
- Hero text and section titles sit on cards, so they stay readable over the bright part of the band.
- The IT logo was removed. The header shows "Icaro Torres" ("IT" only on very small screens). The browser-tab icon is plain "IT" letters.

## 2. Positioning (all texts in EN, with PT and ES translations)
- Title: "Business Automation & AI Integration | Google Sheets, n8n, Apps Script".
- Hero: typed `> My portfolio` + "I connect the tools your business already uses, automate the manual work and add AI where it actually saves time. Plus clear dashboards to see the results."
- Services, in order:
  1. Process automation
  2. AI integration (Claude & OpenAI APIs)
  3. Data extraction & cleanup
  4. Dashboards & reporting
- Metadata, Open Graph and the README use the new positioning.
- Contact is still Upwork only: no email, phone or form.

## 3. Type → shape map (`site.config.ts → kindShapes`)
These are light SVG/CSS animations, no WebGL, drawn by `src/components/ui/Glyph.tsx`.

| Type | Shape |
| --- | --- |
| integration | connected nodes with pulses running along the links |
| automation | spinning torus |
| ai | particle cloud that gathers into clusters |
| extraction | scattered particles that line up into a grid |
| dashboard | 3D bars |
| home page | nodes + torus + cube, joined by lines with pulses ("Connect · Automate · See results") |

## 4. Projects (new order)

| # | Project | Type | Result shown |
| --- | --- | --- | --- |
| 01 | Shopify → Sheets → AI → Alerts *(new)* | integration | ~5h/week of order checks saved (estimated) |
| 02 | Form → Sheet Automation | automation | ~3h/week of copy-paste saved (estimated) |
| 03 | Low-Stock Alerts *(renamed)* | automation | 1–3 weeks of warning before a stock-out (simulated) |
| 04 | AI Review Classifier *(reframed)* | ai | 5,214 reviews in 3 min, about 2 days by hand (estimated) |
| 05 | Messy Data Extractor *(renamed)* | extraction | ~4h/week of retyping saved (estimated) |
| 06 | E-commerce Profit & ROAS Dashboard *(merged)* | dashboard | 312 products selling at a loss (simulated cost) |

- The separate ROAS project was removed. Its screens became the "Marketing" and "Marketing trend" tabs of the profit dashboard, in R$, with ad spend marked as simulated.
- The project page now follows this order: problem → what I built → demo (flow diagram, video, screens) → tools → result with a number. An "Estimated" or "Simulated" label appears when the number is not measured.
- New screens: the n8n canvas, the orders sheet with the AI columns, a Slack alert, and the Apps Script editor that calls the Claude API.
- All six videos were re-rendered (MP4 + WebM, 15–24 s each).
- Project URLs changed:
  - `shopify-ai-order-alerts` (new)
  - `low-stock-alerts`
  - `ai-review-classifier`
  - `messy-data-extractor`
  - `ecommerce-profit-roas-dashboard`

## 5. n8n workflow (project 01)
`integrations/n8n/shopify-ai-order-alerts/` contains:
- `workflow.json`, ready to import: webhook → clean-up → Claude API (JSON with a schema) → read the answer → Google Sheets → "needs a person?" → Slack + Gmail;
- three test orders and `send-test-orders.mjs`;
- a README with the setup steps and the flow diagram.

## 6. Upwork
- Covers (1600×1200): `exports/covers/<slug>.png`.
- Texts (title, description up to 600 characters, skills, result): `exports/upwork/<slug>.txt`.

## Still to do on your side
- The Upwork and LinkedIn URLs in `site.config.ts` are still placeholders.
- Final site URL (`site.url`), once the Vercel deploy is done.
- Credentials for the n8n workflow (Anthropic, Google Sheets, Slack, Gmail) when it runs for real.
