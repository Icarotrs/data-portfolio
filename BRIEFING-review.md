# Briefing para revisão do portfólio (Icaro Torres)

**Para quem lê (Claude):** este é o texto completo do meu portfólio de freelancer, linkado no meu perfil do Upwork. Público: pequenas empresas e lojas de e-commerce dos EUA. Posicionamento: automação de processos e integração de IA (Google Sheets, Apps Script, n8n, Make, APIs de IA), com dashboards como apoio. Todo contato vai pelo botão "Hire me on Upwork" (sem e-mail, telefone ou formulário).

**Preciso que você avalie:**
1. Se o texto está honesto e adequado para o Upwork, ou se faz promessas ou afirmações que eu não consigo sustentar.
2. O que mudar: frases específicas e como reescrever cada uma.
3. Se o tom vende resultado sem exagerar.

**Contexto importante:**
- Não tenho clientes reais ainda. Todos os projetos são demonstrações que eu montei.
- As telas e os vídeos são simulações visuais (mock-ups) com dados fictícios. Só o projeto 01 tem uma entrega real no repositório: um workflow do n8n que importa e roda, testado com uma API simulada.
- O site também existe em PT e ES (traduções do mesmo texto). Abaixo está a versão EN.

## Pontos que eu mesmo já identifiquei (avalie)

- **Casos escritos como se fossem clientes reais.** A seção "Problem" é contada no passado, como uma loja real ("A Shopify store with about 40 orders a day had one person..."). Na prática são cenários inventados para a demo.
- **Números de resultado que nunca foram medidos:**
  - "~5h/week", "~3h/week" e "~4h/week" têm o selo "Estimated";
  - "1–3 wk" e "312 products" têm o selo "Simulated";
  - "3 min / about 2 days" tem o selo "Estimated";
  - "94% agreement with a 300-review hand check" (projeto 04) e "61% of ad spend returned under 3×" (projeto 06) aparecem como fato, sem selo, e essa conferência manual nunca foi feita.
- **Entregas descritas como prontas que não existem como código.** Nos projetos 02 a 06 há "What I built" (Apps Script, script Python, agendamentos, menus), mas no repositório só existem as imagens simulando a entrega.
- **Promessas no texto:** "risky orders reach the team before they ship", "so the store can run and change it without me", "Saves about X hours a week", "A person still checks what matters".
- **Projeto 06:** usa um dataset brasileiro real (Olist, em R$) para um público dos EUA. O custo dos produtos e o gasto com anúncios são simulados.
- **Menção ao Claude:** a API da Claude aparece como ferramenta nos serviços e nos projetos 01 e 04.

---

HOME
- Aba do navegador: "Business Automation & AI Integration | Google Sheets, n8n, Apps Script — Icaro Torres"
- Descrição (Google/compartilhamento): "Icaro Torres connects the tools small businesses and online stores already use, automates the manual work and adds AI where it saves time. Google Sheets, Apps Script, n8n, Make, Claude and OpenAI APIs, plus clear dashboards."
- Topo: "Icaro Torres / Business Automation & AI Integration" · menu: Projects, Services, Contact · botão "Hire me"
- Capa: "Icaro Torres · Business Automation & AI Integration" / título digitado "> My portfolio"
  "I connect the tools your business already uses, automate the manual work and add AI where it actually saves time. Plus clear dashboards to see the results."
  Botões: "Hire me on Upwork", "See projects" · ferramentas: Google Sheets · Apps Script · n8n · Make · Claude & OpenAI APIs · Power BI
  Animação ao lado: 01 Connect · 02 Automate · 03 See results
- Seção projetos: "Work" / "Projects" / "Workflows built for small businesses and online stores. Open one to see the problem, the build and the result." · cada card: número, tipo, título, resumo, número de resultado, ferramentas, botão "View case study"
- Seção serviços: "How I can help"
  1. Process automation (Google Sheets · Apps Script · n8n · Make): "Connect the tools you already use and stop copy-pasting. Orders, forms, stock and emails that update themselves."
  2. AI integration (Claude & OpenAI APIs · n8n · Apps Script): "AI inside the workflows you already have: classify requests, summarize text, draft replies. A person still checks what matters."
  3. Data extraction & cleanup (Python · SQL · Power Query): "CSV, Excel, PDF and web data turned into clean, usable tables."
  4. Dashboards & reporting (Power BI · Google Sheets · Looker Studio): "Clear reports that show what the automation saves and where the money goes."
- Contato: "Let's talk?" / "Tell me what you still do by hand. Send me a message on Upwork." / botão "Hire me on Upwork"
- Rodapé: "© 2026 Icaro Torres · Demo projects use public, simulated or fictitious data" · links Upwork, LinkedIn, GitHub

PÁGINA DE PROJETO (estrutura igual para todos)
Título + resumo + botão "Hire me for this" → 01 Problem → 02 What I built → 03 · Demo (diagrama "How it works", vídeo, telas; nota: "Screens and videos are mock-ups of the deliverable with fictitious or simulated data.") → 04 · Tools (ferramentas, tipo, dados) → 05 · Result (número + selo Estimated/Simulated + frase) → próximo projeto → contato.

PROJETO 01 — Shopify → Sheets → AI → Alerts (integration)
- Resumo: "Every new Shopify order is logged to Google Sheets, classified by AI for risk, priority and customer type, and flagged in Slack or by email when it needs a person."
- Texto do caso:
  ## Problem
  A Shopify store with about 40 orders a day had one person opening every order to check it by hand: does the address look wrong, is this a rush order, is it a repeat customer who deserves a note? It took about an hour a day, and risky orders still slipped through and shipped.
  ## What I built
  - An n8n workflow that receives every new order from a Shopify webhook and cleans it into a simple record: customer, items, totals, shipping, past orders.
  - An AI step (Claude API) that classifies each order for fraud risk, shipping priority and customer type (new, returning, VIP), with a one-line reason. The answer comes back as strict JSON, so nothing downstream breaks.
  - Every order and its classification logged as a new row in Google Sheets, the team's single place to look.
  - An alert to Slack and Gmail only when an order needs a person: high risk, rush shipping or a VIP. Everything else is just logged.
  - An importable n8n workflow file, test orders and a short setup guide, so the store can run and change it without me.
- Diagrama: Shopify: New order sent to a webhook → n8n: Order data cleaned up → Claude API: Risk, priority and customer type → Google Sheets: Order and AI result logged → Slack · Gmail: Team alerted when it matters
- Resultado: "~5h of manual order review saved per week" [selo: estimated] + "Each order is logged and classified within about a minute; risky, rush and VIP orders reach the team before they ship."
- Nota de dados: "Demo built with simulated Shopify test orders sent to an n8n webhook. Time saved is estimated for a store with about 40 orders a day."
- Texto para o Upwork: "n8n automation for a Shopify store: every new order hits a webhook, gets logged to Google Sheets and is classified by AI (Claude API) for fraud risk, shipping priority and customer type, with a one-line reason. Risky, rush and VIP orders trigger a Slack message and an email so the team acts before shipping. Saves about 5 hours a week of manual order checks (estimate). Demo uses simulated test orders; the importable n8n workflow JSON is included. Stack: n8n, Shopify, Google Sheets, Claude API, Slack, Gmail."

PROJETO 02 — Form-to-Sheet Automation (automation)
- Resumo: "Google Form responses land in a formatted sheet without breaking formulas, plus an automatic summary report."
- Texto do caso:
  ## Problem
  A small business collected order requests through a Google Form. The default "link to sheet" dumped responses into a raw tab, so someone copied rows by hand into the real sheet every day — and every paste risked overwriting formulas, dropdowns and formatting. The weekly summary was built manually on Friday afternoons.
  ## What I built
  - An Apps Script `onFormSubmit` trigger that reads each response, cleans it (trimmed text, normalized phone and date formats) and appends it to the formatted table — formulas, validation and conditional formatting stay intact.
  - A lock so two simultaneous submissions never write to the same row.
  - A summary tab driven by formulas (totals per week, per product, per status).
  - A time-driven trigger that exports the summary tab as a PDF every Monday at 8am and emails it to the owner.
  - A small "Settings" tab so the owner can change recipients and schedule without touching code.
- Diagrama: Google Forms: Customer sends an order → Apps Script: Answers cleaned and checked → Google Sheets: Written to the formatted table → Gmail: PDF summary every Monday
- Resultado: "~3h of copy-paste saved per week" [selo: estimated] + "Zero manual copy-paste: every response lands in the right row and a PDF summary goes out every Monday."
- Nota de dados: "Demo built with fictitious order-request data. Time saved is estimated for about 20 form responses a day."
- Texto para o Upwork: "Google Forms to Google Sheets automation with Apps Script: every response is cleaned and written into a formatted sheet without breaking formulas, dropdowns or formatting, the thing the default form link always breaks. A weekly summary is exported as a PDF and emailed every Monday. No add-ons or paid tools. Saves about 3 hours a week of copy-paste (estimate). Demo uses fictitious data. Stack: Google Forms, Google Sheets, Apps Script, Gmail."

PROJETO 03 — Low-Stock Alerts (automation)
- Resumo: "A Google Sheet that knows when each product will run out and emails purchasing before it happens."
- Texto do caso:
  ## Problem
  A small home-goods store found out a product was out of stock when customers complained. Stock lived in a spreadsheet updated by hand, nobody tracked how fast each product sold, and suppliers needed 7 to 21 days to deliver. Best sellers ran out every month.
  ## What I built
  - A daily import of the last 30 days of sales from the store's export into a Stock tab.
  - Per product: average daily sales, days of cover (how long current stock lasts), a reorder point from the supplier's lead time plus a safety week, and a suggested order that covers 45 days.
  - Colour-coded status for every SKU — *OK*, *Reorder soon*, *Reorder now* — with an icon and label, not colour alone.
  - An Apps Script trigger that runs every morning at 07:00 and emails purchasing the products to order today and this week.
  - A Reorder log tab that records every alert and order, and a Settings tab for thresholds and recipients.
- Diagrama: Shopify export: Daily sales imported → Google Sheets: Days of stock left per product → Apps Script: Daily check at 7am → Gmail: Purchasing gets what to reorder
- Resultado: "1–3 wk of warning before a product runs out" [selo: simulated] + "Stock-outs are caught 1 to 3 weeks early, with a suggested order quantity for every product."
- Nota de dados: "Demo built with fictitious store data; the warning time comes from the simulated sales and supplier lead times."
- Texto para o Upwork: "Low-stock alerts in Google Sheets + Apps Script for a small online store. Daily sales are imported, and every product gets days of stock left, a reorder point based on supplier lead time and a suggested order quantity. Every morning a script emails purchasing the products that will run out before a new order can arrive, 1 to 3 weeks ahead (simulated data). No paid apps; works with a Shopify or any store export. Stack: Google Sheets, Apps Script, Gmail."

PROJETO 04 — AI Review Classifier (ai)
- Resumo: "A Google Sheets workflow that sends new reviews to the Claude API and writes the topic, sentiment and a short summary straight back into the sheet."
- Texto do caso:
  ## Problem
  An online store had more than 5,000 reviews from Amazon and Shopify in a Google Sheet, and more arriving every week. Reading them by hand would take days, so nobody did, and the team couldn't say which problems came up most or what to fix first.
  ## What I built
  - An Apps Script workflow inside the same Google Sheet: a custom menu (*AI tagging → Tag new reviews*) plus a nightly trigger for new rows.
  - Reviews are sent to the Claude API in batches of 25 with a fixed prompt. Each one comes back as strict JSON: topic, sentiment, a one-line summary and a confidence score.
  - Results are written straight back into the sheet, next to each review. Rows under 80% confidence are flagged for a person to check.
  - A hand check of 300 random reviews before trusting the numbers: 94% agreement.
  - The tagged sheet feeds a small dashboard of sentiment by topic, so the team can see delivery time is the top complaint.
- Diagrama: Google Sheets: New reviews land in the sheet → Apps Script: Sent in batches of 25 → Claude API: Topic, sentiment and summary → Google Sheets: Written back; low confidence flagged
- Resultado: "3 min to tag 5,214 reviews, about 2 days of reading by hand" [selo: estimated] + "Runs from a menu in Google Sheets or on a schedule; 94% agreement with a 300-review hand check, and low-confidence rows go to a person."
- Nota de dados: "Demo built with fictitious reviews. The manual reading time is an estimate (about 30 seconds per review)."
- Texto para o Upwork: "AI integration inside Google Sheets: an Apps Script workflow sends new customer reviews to the Claude API in batches and writes the topic, sentiment and a one-line summary straight back into the sheet. It runs from a custom menu or on a schedule, and rows with low confidence are flagged for a person to check (94% agreement with a hand check). 5,214 reviews tagged in about 3 minutes instead of roughly 2 days of reading (estimate). Demo uses fictitious reviews. Stack: Google Sheets, Apps Script, Claude API, Power BI."

PROJETO 05 — Messy Data Extractor (extraction)
- Resumo: "Data extraction from messy CSV, Excel and PDF files: tables are pulled out, cleaned and merged into one consistent sheet."
- Texto do caso:
  ## Problem
  Every supplier sent their price and stock list in a different shape: a CSV with semicolons and European decimals, a PDF table, an Excel file with headers merged across two rows. Dates came as `03/04/24`, `2024-04-03` and `April 3`. Someone spent about four hours a week retyping and fixing these files before they could be compared.
  ## What I built
  - Data extraction for CSV, Excel and text-based PDF tables that detects delimiters, encodings and multi-row headers on its own.
  - A cleanup step: one date format, one currency format, trimmed and title-cased names, split and merged columns fixed, duplicates removed.
  - A column-mapping file, so a new supplier format is a few lines of configuration instead of new code.
  - Output to Google Sheets: a clean data tab, a summary tab (counts, totals, price changes since the last run) and a log tab listing every fix.
  - A weekly schedule, plus the same rules as a menu inside Google Sheets for people who don't use Python.
- Diagrama: CSV · Excel · PDF: Supplier files dropped in a folder → Python: Tables extracted from each format → Python: Dates, prices and names normalized → Google Sheets: Clean table, summary and fix log
- Resultado: "~4h of retyping supplier files saved per week" [selo: estimated] + "Supplier files with mixed dates, prices and column layouts become one consistent table in seconds, with a log of every fix."
- Nota de dados: "Demo built with fictitious supplier files that reproduce common real-world problems. Time saved is an estimate."
- Texto para o Upwork: "Data extraction and cleanup pipeline: tables are extracted from messy CSV, Excel and PDF files (merged headers, mixed date formats, currency text, duplicates, split columns), normalized and merged into one clean Google Sheet with a summary tab and a log of every fix. Runs as a Python script on a schedule or from a menu in Google Sheets. Saves about 4 hours a week of retyping (estimate). Demo uses fictitious supplier files. Stack: Python (pandas, pdfplumber), Google Sheets, Apps Script."

PROJETO 06 — E-commerce Profit & ROAS Dashboard (dashboard)
- Resumo: "Real margin per product and per order after shipping and fees, plus a marketing tab with ad spend, sales and ROAS for every channel."
- Texto do caso:
  ## Problem
  The store owner could see revenue going up every month, but had no idea which products actually made money. Shipping, marketplace commission and payment fees were scattered across different exports, so "best sellers" and "most profitable" were being treated as the same list. They weren't.
  ## What I built
  - A clean data model joining orders, items, products, payments, freight and sellers (8 tables from the Olist dataset).
  - A real margin measure per order line: price − freight − marketplace fee − payment fee − product cost.
  - A product cost table with a simulated cost per category, clearly marked as simulated, so the client can swap in their own costs with one file.
  - Three report pages: monthly P&L, product ranking by net margin, and an order-level drill-down.
  - Conditional formatting that flags every SKU with negative margin, so the "what should we stop selling?" question has an answer.
  - A fourth page, Marketing, joining simulated ad spend from Google, Meta, TikTok and email to the orders: spend, attributed sales, ROAS and cost per new customer per channel, with a plain-English recommendation. It showed 61% of the budget returning under 3×.
- Diagrama: Orders · ads: Orders, fees, freight and ad spend → Power Query · SQL: One clean data model → DAX: Net margin and ROAS measures → Power BI: Profit, products and marketing pages
- Resultado: "312 products found selling at a loss" [selo: simulated] + "Real net margin for ~99k orders, loss-making products flagged, and a marketing tab showing 61% of ad spend returned under 3×."
- Nota de dados: "Built on the public Olist e-commerce dataset. Product cost and ad spend are simulated (Olist does not publish them) and labeled as such in the report."
- Texto para o Upwork: "Power BI dashboard for an online store that shows real profit, not just revenue: net margin per product and per order after shipping, marketplace and payment fees, with loss-making products flagged. A marketing tab compares ad spend and sales per channel (ROAS, cost per new customer) and shows where to move the budget. Built on the public Olist dataset (~99k orders); product cost and ad spend are simulated and labeled. Stack: Power BI, DAX, Power Query, SQL, Python."