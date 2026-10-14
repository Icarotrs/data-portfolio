/**
 * Screenshot definitions for every portfolio project. All data is
 * fictitious (or derived from public datasets) and generated
 * deterministically, so re-rendering gives identical images.
 *
 * Each entry: { file, html } → public/projects/<slug>/<file>.webp
 */
import { C, W, H, rng, fmt, esc, page, powerbi, sheets, gmail, pdf, terminal, bars, lines, hbars, n8n, slack, appsScript } from "./kit.mjs";

const R = (n) => (n < 0 ? "−" : "") + fmt.money(Math.abs(n), "R$ ");
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// ── 01 Shopify → Sheets → AI → Alerts ────────────────────────
export const SHOP_ORDERS = [
  ["#1081", "Oct 14, 09:12", "Emma Carter", 84.0, "2 items", "Austin, TX", ["Low", "good"], ["Normal", "neutral"], ["Returning", "info"], "Repeat buyer, address matches past orders"],
  ["#1082", "Oct 14, 09:20", "Liam Brooks", 129.5, "3 items", "Denver, CO", ["Low", "good"], ["Normal", "neutral"], ["New", "neutral"], "First order, standard basket"],
  ["#1083", "Oct 14, 09:41", "Olivia Reed", 412.0, "1 item", "Miami, FL", ["Medium", "warn"], ["Normal", "neutral"], ["New", "neutral"], "High value for a first order"],
  ["#1084", "Oct 14, 09:58", "Noah Kim", 56.0, "1 item", "Seattle, WA", ["Low", "good"], ["Rush", "warn"], ["Returning", "info"], "Paid for overnight shipping"],
  ["#1085", "Oct 14, 10:07", "Ava Martinez", 238.0, "4 items", "Chicago, IL", ["Low", "good"], ["Normal", "neutral"], ["VIP", "good"], "12 past orders, $2.9k lifetime"],
  ["#1086", "Oct 14, 10:15", "Mason Lee", 97.0, "2 items", "Portland, OR", ["Low", "good"], ["Normal", "neutral"], ["Returning", "info"], "Second order this month"],
  ["#1087", "Oct 14, 10:33", "Sophia Patel", 642.5, "6 items", "Newark, NJ", ["High", "bad"], ["Normal", "neutral"], ["New", "neutral"], "Billing and shipping in different states, 3 cards tried"],
  ["#1088", "Oct 14, 10:49", "Lucas Wright", 71.0, "1 item", "Phoenix, AZ", ["Low", "good"], ["Normal", "neutral"], ["New", "neutral"], "Standard order"],
  ["#1089", "Oct 14, 11:02", "Mia Johnson", 315.0, "2 items", "Boston, MA", ["Low", "good"], ["Rush", "warn"], ["VIP", "good"], "VIP, asked for delivery before Friday"],
  ["#1090", "Oct 14, 11:18", "Ethan Davis", 44.0, "1 item", "Atlanta, GA", ["Low", "good"], ["Normal", "neutral"], ["Returning", "info"], "Small repeat order"],
  ["#1091", "Oct 14, 11:26", "Isabella Cruz", 188.0, "3 items", "San Diego, CA", ["Medium", "warn"], ["Normal", "neutral"], ["New", "neutral"], "Freight-forwarder address"],
  ["#1092", "Oct 14, 11:40", "James Wilson", 63.0, "1 item", "Dallas, TX", ["Low", "good"], ["Normal", "neutral"], ["Returning", "info"], "Address matches past orders"],
].map(([order, date, customer, total, items, ship, risk, priority, type, reason]) => ({ order, date, customer, total, items, ship, risk, priority, type, reason }));

function shopify() {
  const nodes = [
    { id: "hook", name: "Shopify order", sub: "Webhook · orders/create", icon: "⚡", color: "#7b61ff", x: 130, y: 360, ok: "1 item" },
    { id: "clean", name: "Clean up order", sub: "Code", icon: "{ }", color: "#ff9922", x: 330, y: 360, ok: "1 item" },
    { id: "ai", name: "Classify with Claude", sub: "HTTP Request · Claude API", icon: "AI", color: "#d97757", x: 530, y: 360, ok: "1 item" },
    { id: "parse", name: "Read AI answer", sub: "Code", icon: "{ }", color: "#ff9922", x: 730, y: 360, ok: "1 item" },
    { id: "sheet", name: "Log to Google Sheets", sub: "Append row · Orders", icon: "▦", color: "#0f9d58", x: 930, y: 360, ok: "1 item" },
    { id: "if", name: "Needs a person?", sub: "If · risk, rush or VIP", icon: "⑂", color: "#5c6bc0", x: 1130, y: 360, ok: "true" },
    { id: "slack", name: "Alert in Slack", sub: "#orders-alerts", icon: "#", color: "#4a154b", x: 1350, y: 250, ok: "1 item" },
    { id: "mail", name: "Email the owner", sub: "Gmail · send", icon: "✉", color: "#ea4335", x: 1350, y: 480, ok: "1 item" },
  ];
  const edges = [["hook", "clean"], ["clean", "ai"], ["ai", "parse"], ["parse", "sheet"], ["sheet", "if"], ["if", "slack", "true"], ["if", "mail", "true"]];
  const flow = n8n({
    name: "Shopify → Sheets → AI → Alerts",
    nodes,
    edges,
    toast: "✓ Workflow executed · order #1087 classified <b>High risk</b> · 1.4 s",
    executions: [["4219", "10:33:12", "Success", "1.4s"], ["4218", "10:15:40", "Success", "1.1s"], ["4217", "10:07:03", "Success", "1.3s"], ["4216", "09:58:21", "Success", "1.2s"], ["4215", "09:41:56", "Success", "1.5s"]],
  });

  const sheet = sheets({
    file: "Shopify orders — AI review",
    tabs: ["Orders", "Alerts sent", "Settings"],
    menu: [],
    cell: "G8",
    formula: "Filled by n8n: risk, priority, customer type and reason from the Claude API",
    highlightRow: 6,
    cols: [
      { key: "order", title: "Order", w: 80, cls: "mono" },
      { key: "date", title: "Created", w: 120 },
      { key: "customer", title: "Customer", w: 140 },
      { key: "total", title: "Total", w: 90, align: "right", render: (v) => `$${v.toFixed(2)}` },
      { key: "ship", title: "Ship to", w: 120 },
      { key: "risk", title: "Risk (AI)", w: 100, render: ([t, c]) => `<span class="chip ${c}">${t}</span>` },
      { key: "priority", title: "Priority (AI)", w: 110, render: ([t, c]) => `<span class="chip ${c}">${t}</span>` },
      { key: "type", title: "Customer (AI)", w: 120, render: ([t, c]) => `<span class="chip ${c}">${t}</span>` },
      { key: "reason", title: "Reason (AI)", w: 380 },
    ],
    rows: SHOP_ORDERS,
    extraCss: `td.h:nth-child(7), td.h:nth-child(8), td.h:nth-child(9), td.h:nth-child(10) { background: #1d4ed8; }`,
    toast: "⚡ <b>n8n</b> — order #1092 logged and classified (1.2 s).<br>Alerts go out only for high risk, rush or VIP.",
  });

  const alerts = slack({
    workspace: "Harbor & Pine",
    channel: "orders-alerts",
    channels: ["general", "orders-alerts", "shipping", "support"],
    messages: [
      {
        app: "Order Bot",
        time: "10:07 AM",
        text: "VIP order, worth a thank-you note in the box.",
        color: C.aqua,
        title: "★ VIP order #1085 · $238.00",
        fields: [["Customer", "Ava Martinez · Chicago, IL"], ["Customer type", "VIP (12 past orders)"], ["Risk", "Low"], ["Reason", "12 past orders, $2.9k lifetime"]],
        button: "Open in Shopify",
      },
      {
        app: "Order Bot",
        time: "10:33 AM",
        text: "<b>Hold before shipping:</b> this order looks risky.",
        color: C.bad,
        title: "● High-risk order #1087 · $642.50",
        fields: [["Customer", "Sophia Patel · Newark, NJ"], ["Risk", "<b style='color:#c4312f'>High</b>"], ["Priority", "Normal"], ["Reason", "Billing and shipping in different states, 3 cards tried"]],
        button: "Open in Shopify",
      },
      {
        app: "Order Bot",
        time: "11:02 AM",
        text: "Rush order from a VIP: ship today.",
        color: "#eda100",
        title: "▲ Rush order #1089 · $315.00",
        fields: [["Customer", "Mia Johnson · Boston, MA"], ["Priority", "Rush"], ["Customer type", "VIP"], ["Reason", "VIP, asked for delivery before Friday"]],
        button: "Open in Shopify",
      },
    ],
  });
  return [
    { file: "n8n-workflow", html: flow },
    { file: "orders-sheet", html: sheet },
    { file: "slack-alert", html: alerts },
  ];
}

// ── 06 E-commerce profit & ROAS dashboard ─────────────────────
const PROFIT_PAGES = ["Profit overview", "Products", "Marketing", "Marketing trend", "Data notes"];
function ecommerce() {
  const r = rng(11);
  const labels = [];
  const revenue = [];
  const margin = [];
  for (let i = 0; i < 20; i++) {
    labels.push(`${months[i % 12]} ${i < 12 ? "17" : "18"}`);
    const trend = 140000 + i * 46000;
    const season = i % 12 === 10 ? 1.35 : 1;
    revenue.push(trend * season * (0.93 + r() * 0.14));
    margin.push(19 + Math.sin(i / 3) * 1.6 + r() * 1.8 - (i % 12 === 10 ? 2.4 : 0));
  }
  const profit = revenue.map((v, i) => (v * margin[i]) / 100);
  const totalRev = revenue.reduce((a, b) => a + b, 0);
  const totalProfit = profit.reduce((a, b) => a + b, 0);

  const kpis = [
    ["Revenue", fmt.k(totalRev, "R$ "), "+38.2% vs prior 10 mo", "up"],
    ["Marketplace fees", fmt.k(totalRev * 0.1, "R$ "), "10.0% of revenue", ""],
    ["Freight", fmt.k(totalRev * 0.165, "R$ "), "16.5% of revenue", ""],
    ["Net margin", fmt.pct((totalProfit / totalRev) * 100), "after all costs", ""],
    ["Loss-making SKUs", "312", "R$ 184k lost · 20 mo", "down"],
  ];

  const overview = powerbi({
    file: "olist_profit.pbix",
    title: "Profit overview",
    slicers: [["Period", "Jan 2017 – Aug 2018"], ["Marketplace", "All"], ["Category", "All"]],
    pages: PROFIT_PAGES,
    active: 0,
    body: `
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:14px">
        ${kpis
          .map(
            ([l, v, d, cls]) =>
              `<div class="card kpi"><div class="label">${l}</div><div class="value">${v}</div><div class="delta ${cls}">${d}</div></div>`,
          )
          .join("")}
      </div>
      <div style="display:grid;grid-template-columns:2fr 1fr;gap:14px">
        <div class="card"><h3>Net profit by month</h3><div class="sub">R$, after marketplace fees, freight, payment fees and product cost</div>
          ${bars({ w: 980, h: 300, data: profit.map((v, i) => ({ label: labels[i], value: v })), format: (v) => fmt.k(v), labelEvery: 2, highlight: [10, 19] })}</div>
        <div class="card"><h3>Where every R$ 100 of revenue goes</h3><div class="sub">Average across all orders</div>
          ${hbars({
            w: 470,
            rowH: 52,
            labelW: 150,
            format: (v) => `R$ ${v.toFixed(1)}`,
            data: [
              { label: "Product cost (sim.)", value: 47.6, color: C.gray },
              { label: "Freight", value: 16.5, color: C.gray },
              { label: "Marketplace fee", value: 10.0, color: C.gray },
              { label: "Payment fee", value: 4.5, color: C.gray },
              { label: "Net profit", value: 21.4, color: C.blue },
            ],
          })}</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
        <div class="card"><h3>Net margin by category</h3><div class="sub">Top 7 categories by revenue · negative margin in orange</div>
          ${hbars({
            w: 740,
            rowH: 38,
            labelW: 190,
            format: (v) => fmt.pct(v),
            data: [
              ["Health & beauty", 26.4], ["Watches & gifts", 24.1], ["Bed, bath & table", 18.9], ["Sports & leisure", 17.2],
              ["Computers & accessories", 9.8], ["Furniture & decor", 4.1], ["Office furniture", -6.3],
            ].map(([label, value]) => ({ label, value, color: value < 0 ? C.orange : C.blue })),
          })}</div>
        <div class="card"><h3>Net margin % by month</h3><div class="sub">Dips in November: Black Friday discounts + free-shipping promos</div>
          ${lines({ w: 740, h: 270, labels, series: [{ name: "Margin", color: C.blue, values: margin }], format: (v) => `${v.toFixed(0)}%`, min: 10, labelEvery: 2, endLabels: false })}</div>
      </div>`,
  });

  const rr = rng(5);
  const cats = ["Office furniture", "Furniture & decor", "Computers & acc.", "Garden tools", "Housewares", "Auto", "Toys", "Bed, bath & table"];
  const rowsP = Array.from({ length: 17 }, (_, i) => {
    const rev = 2000 + rr() * 26000;
    const m = -22 + i * 1.9 + rr() * 2;
    return {
      sku: `${Math.floor(rr() * 0xffffff).toString(16).padStart(6, "0")}…${Math.floor(rr() * 0xfff).toString(16)}`,
      cat: cats[Math.floor(rr() * cats.length)],
      orders: Math.round(rev / (90 + rr() * 140)),
      rev,
      fee: rev * 0.1,
      freight: rev * (0.18 + rr() * 0.12),
      net: (rev * m) / 100,
      m,
    };
  });
  const maxAbs = Math.max(...rowsP.map((p) => Math.abs(p.m)));
  const products = powerbi({
    file: "olist_profit.pbix",
    title: "Products ranked by net margin",
    slicers: [["Net margin", "< 5%"], ["Min. orders", "≥ 10"], ["Category", "All"]],
    pages: PROFIT_PAGES,
    active: 1,
    body: `
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px">
        <div class="card kpi"><div class="label">SKUs selling at a loss</div><div class="value" style="color:${C.bad}">▼ 312</div><div class="delta">of 32,951 SKUs</div></div>
        <div class="card kpi"><div class="label">Profit lost on those SKUs</div><div class="value">R$ 184k</div><div class="delta">Jan 2017 – Aug 2018</div></div>
        <div class="card kpi"><div class="label">Main cause</div><div class="value" style="font-size:22px;margin-top:10px">Freight &gt; 30% of price</div><div class="delta">on 71% of loss-making SKUs</div></div>
      </div>
      <div class="card" style="flex:1">
        <table class="pt">
          <thead><tr><th>Product (SKU)</th><th>Category</th><th class="num">Orders</th><th class="num">Revenue</th><th class="num">Marketplace fee</th><th class="num">Freight</th><th class="num">Net profit</th><th style="width:300px">Net margin</th></tr></thead>
          <tbody>${rowsP
            .map((p) => {
              const w = (Math.abs(p.m) / maxAbs) * 120;
              const bar =
                p.m < 0
                  ? `<span class="bar"><i style="width:${w}px;margin-left:${120 - w}px;background:${C.orange}"></i><b></b><i></i></span>`
                  : `<span class="bar"><i style="width:120px"></i><b></b><i style="width:${w}px;background:${C.blue}"></i></span>`;
              return `<tr><td class="mono">${p.sku}</td><td>${p.cat}</td><td class="num">${p.orders}</td><td class="num">${R(p.rev)}</td><td class="num">${R(p.fee)}</td><td class="num">${R(p.freight)}</td>
                <td class="num" style="color:${p.net < 0 ? C.bad : C.text}">${p.net < 0 ? "▼ " : ""}${R(p.net)}</td>
                <td><div style="display:flex;align-items:center;gap:10px">${bar}<span class="num" style="width:60px">${fmt.pct(p.m)}</span>${p.m < 0 ? '<span class="chip bad">Loss</span>' : ""}</div></td></tr>`;
            })
            .join("")}</tbody></table>
      </div>`,
  }).replace(
    "</style>",
    `.pt { width: 100%; border-collapse: collapse; font-size: 13px; } .pt th { text-align: left; font-weight: 600; color: ${C.text2}; font-size: 12px; padding: 8px 10px; border-bottom: 1px solid ${C.grid}; }
     .pt th.num { text-align: right; } .pt td { padding: 9px 10px; border-bottom: 1px solid #f0efec; } .pt tr:nth-child(-n+5) td { background: #fdf6f4; }
     .bar { display: inline-flex; align-items: center; width: 242px; } .bar i { display: block; height: 12px; border-radius: 3px; } .bar b { width: 2px; height: 20px; background: ${C.muted}; }
     </style>`,
  );

  return [
    { file: "overview", html: overview },
    { file: "products", html: products },
    ...marketing(),
  ];
}

// ── 02 Form-to-sheet automation ──────────────────────────────
function formToSheet() {
  const r = rng(21);
  const customers = ["Bella Café", "Northside Gym", "Tiny Tots Daycare", "Oak & Vine", "Studio Lumen", "Harbor Dental", "Green Leaf Deli", "Atlas Coworking", "Maple Bakery", "Pixel Repair Co."];
  const products = [["Coffee beans 1kg", 24], ["Paper cups (500)", 38], ["Cleaning kit", 52], ["Printer paper (5 reams)", 31], ["Oat milk (12)", 29], ["Hand soap refill", 18]];
  const statuses = [["Shipped", "good"], ["Confirmed", "info"], ["New", "warn"]];
  const rows = Array.from({ length: 20 }, (_, i) => {
    const [product, price] = products[Math.floor(r() * products.length)];
    const qty = 1 + Math.floor(r() * 9);
    const st = i < 12 ? statuses[0] : i < 17 ? statuses[1] : statuses[2];
    const day = 6 + Math.floor(i / 3);
    return {
      ts: `10/${String(day).padStart(2, "0")}/2026 ${String(8 + Math.floor(r() * 9)).padStart(2, "0")}:${String(Math.floor(r() * 60)).padStart(2, "0")}`,
      id: `ORD-${1040 + i}`,
      customer: customers[Math.floor(r() * customers.length)],
      product,
      qty,
      price: `$${price.toFixed(2)}`,
      total: `$${(qty * price).toFixed(2)}`,
      status: st,
      owner: ["Ana", "Marco", "Ana", "Lee"][i % 4],
    };
  });
  const sheet = sheets({
    file: "Order requests 2026",
    tabs: ["Orders", "Weekly summary", "Settings", "Form responses (raw)"],
    menu: ["⚡ Automation"],
    cell: "G21",
    formula: "=E21*F21",
    highlightRow: 19,
    toast: "⚡ <b>Apps Script</b> — new form response written to <b>row 21</b>.<br>Formulas, dropdowns and formatting kept. Owner notified.",
    cols: [
      { key: "ts", title: "Timestamp", w: 150 },
      { key: "id", title: "Order ID", w: 100, cls: "mono" },
      { key: "customer", title: "Customer", w: 190 },
      { key: "product", title: "Product", w: 210 },
      { key: "qty", title: "Qty", w: 60, align: "right" },
      { key: "price", title: "Unit price", w: 100, align: "right" },
      { key: "total", title: "Total", w: 110, align: "right" },
      { key: "status", title: "Status", w: 130, render: ([s, cls]) => `<span class="chip ${cls}">${s} ▾</span>` },
      { key: "owner", title: "Owner", w: 100 },
    ],
    rows,
  });

  const days = [["Mon", 14], ["Tue", 19], ["Wed", 11], ["Thu", 17], ["Fri", 21], ["Sat", 4], ["Sun", 0]];
  const report = pdf({
    file: "Weekly order summary — week 41.pdf",
    body: `
      <div style="display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid ${C.text};padding-bottom:14px">
        <div><div class="muted" style="font-size:12px;letter-spacing:.08em;text-transform:uppercase">Weekly order summary</div><div style="font-size:30px;font-weight:600;margin-top:4px">Week 41 · Oct 6 – 12, 2026</div></div>
        <div class="muted" style="font-size:12px;text-align:right">Order requests 2026<br>Generated Mon Oct 13, 08:00</div></div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin:26px 0">
        ${[["Orders", "86", "+12% vs week 40"], ["Revenue", "$12,480", "+8%"], ["Avg. order", "$145", "−3%"], ["Pending", "7", "to confirm today"]]
          .map(([l, v, d]) => `<div style="border:1px solid ${C.grid};border-radius:8px;padding:14px 16px"><div class="muted" style="font-size:12px">${l}</div><div style="font-size:28px;font-weight:600;margin-top:2px">${v}</div><div class="muted" style="font-size:12px">${d}</div></div>`)
          .join("")}</div>
      <div style="display:grid;grid-template-columns:1.1fr 1fr;gap:30px">
        <div><div style="font-weight:600;margin-bottom:8px">Orders per day</div>${bars({ w: 480, h: 230, data: days.map(([label, value]) => ({ label, value })), highlight: [4] })}</div>
        <div><div style="font-weight:600;margin-bottom:12px">Top products</div>
          <table style="width:100%;border-collapse:collapse;font-size:13px">
            <tr style="color:${C.text2};font-size:12px"><td style="padding:6px 0">Product</td><td class="num">Qty</td><td class="num">Revenue</td></tr>
            ${[["Coffee beans 1kg", 94, 2256], ["Cleaning kit", 31, 1612], ["Paper cups (500)", 40, 1520], ["Oat milk (12)", 47, 1363], ["Printer paper (5 reams)", 29, 899]]
              .map(([p, q, v]) => `<tr style="border-top:1px solid ${C.grid}"><td style="padding:9px 0">${p}</td><td class="num">${q}</td><td class="num">$${v.toLocaleString("en-US")}</td></tr>`)
              .join("")}</table></div></div>
      <div style="margin-top:30px"><div style="font-weight:600;margin-bottom:10px">Pending orders to confirm (7)</div>
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <tr style="color:${C.text2};font-size:12px"><td style="padding:6px 0">Order</td><td>Customer</td><td>Product</td><td class="num">Total</td><td>Waiting since</td><td>Owner</td></tr>
          ${[["ORD-1057", "Atlas Coworking", "Cleaning kit", 104, "Oct 11"], ["ORD-1058", "Studio Lumen", "Cleaning kit", 416, "Oct 12"], ["ORD-1059", "Pixel Repair Co.", "Hand soap refill", 54, "Oct 12"], ["ORD-1060", "Maple Bakery", "Coffee beans 1kg", 192, "Oct 12"]]
            .map(([o, c, p, t, w], i) => `<tr style="border-top:1px solid ${C.grid}"><td style="padding:9px 0" class="mono">${o}</td><td>${c}</td><td>${p}</td><td class="num">$${t}</td><td>${w}</td><td>${["Marco", "Ana", "Lee", "Ana"][i]}</td></tr>`)
            .join("")}
          <tr style="border-top:1px solid ${C.grid}"><td colspan="6" style="padding:9px 0;color:${C.text2}">+ 3 more in the “Orders” tab</td></tr></table></div>
      <div class="muted" style="margin-top:28px;font-size:11.5px;border-top:1px solid ${C.grid};padding-top:12px">Built automatically every Monday at 08:00 by Apps Script from the “Orders” tab and emailed to the team. Recipients and schedule are set in the “Settings” tab.</div>`,
  });
  return [
    { file: "sheet", html: sheet },
    { file: "weekly-report", html: report },
  ];
}

// ── 05 Messy data extractor ───────────────────────────────────
function messyImporter() {
  const raw = [
    ["SKU;Description;Price;Stock;Updated", ""],
    ["A-1001;Ceramic mug 350ml;R$ 12,90;140;03/04/24", ""],
    ["A-1002;  ceramic MUG 500ml ;R$ 15,50;;2024-04-03", "bad"],
    ["A-1003;Glass jar w/ lid;14.2;85;April 3", "bad"],
    ["A-1001;Ceramic mug 350ml;R$ 12,90;140;03/04/24", "dup"],
    ["A-1004;Bamboo cutting board;R$ 39,00;22;03/04/24", ""],
    ["A-1005;\"Knife set, 5 pcs\";R$ 89,90;9;03.04.2024", "bad"],
    ["A-1006;Tea towel (pack of 3);R$ 24,—;60;03/04/24", "bad"],
    ["A-1007;Salad bowl 25cm;R$ 33,40;31;03/04/24", ""],
    ["A-1008;Oven mitt;7,5;n/a;03/04/24", "bad"],
    ["A-1009;Wooden spoon set;R$ 19,90;48;03/04/24", ""],
    ["A-1010;Stainless whisk ;R$ 11,00;  73;2024/04/03", "bad"],
    ["A-1004;Bamboo cutting board;R$ 39,00;22;03/04/24", "dup"],
    ["A-1011;Linen napkins (4);R$ 45,90;17;03/04/24", ""],
    ["A-1012;Cast iron pan 26cm;R$149,00;6;3 Apr 2024", "bad"],
  ];
  const clean = [
    ["A-1001", "Ceramic Mug 350 ml", "12.90", "140", "2024-04-03"],
    ["A-1002", "Ceramic Mug 500 ml", "15.50", "0", "2024-04-03"],
    ["A-1003", "Glass Jar With Lid", "14.20", "85", "2024-04-03"],
    ["A-1004", "Bamboo Cutting Board", "39.00", "22", "2024-04-03"],
    ["A-1005", "Knife Set, 5 pcs", "89.90", "9", "2024-04-03"],
    ["A-1006", "Tea Towel (Pack of 3)", "24.00", "60", "2024-04-03"],
    ["A-1007", "Salad Bowl 25 cm", "33.40", "31", "2024-04-03"],
    ["A-1008", "Oven Mitt", "7.50", "0", "2024-04-03"],
    ["A-1009", "Wooden Spoon Set", "19.90", "48", "2024-04-03"],
    ["A-1010", "Stainless Whisk", "11.00", "73", "2024-04-03"],
    ["A-1011", "Linen Napkins (4)", "45.90", "17", "2024-04-03"],
    ["A-1012", "Cast Iron Pan 26 cm", "149.00", "6", "2024-04-03"],
  ];
  const split = page(
    `<div class="wrap">
      <section class="raw"><header><span class="tag bad">Before</span> supplier_A_2024-04.csv <span class="muted">· semicolons, mixed dates, R$ text, duplicates</span></header>
        <pre class="mono">${raw
          .map(([l, k]) => `<span class="${k}">${esc(l)}</span>`)
          .join("\n")}</pre>
        <ul class="legend"><li><i class="bad"></i>format problem</li><li><i class="dup"></i>duplicate row</li></ul></section>
      <div class="arrow">→</div>
      <section class="clean"><header><span class="tag good">After</span> Supplier prices · Google Sheets <span class="muted">· one format, ready to compare</span></header>
        <table><tr>${["SKU", "Product", "Price (BRL)", "Stock", "Updated"].map((h) => `<th>${h}</th>`).join("")}</tr>
        ${clean.map((r) => `<tr>${r.map((c, i) => `<td class="${i >= 2 && i <= 3 ? "num" : ""} ${i === 0 ? "mono" : ""}">${c}</td>`).join("")}</tr>`).join("")}</table>
        <div class="fixes"><b>14 fixes applied</b> · 6 dates normalised · 3 prices parsed · 2 empty stock → 0 · 2 duplicates removed · names title-cased</div></section>
    </div>`,
    `
    .wrap { height: 100%; display: grid; grid-template-columns: 1fr 50px 1fr; align-items: center; gap: 0; padding: 40px; background: #f3f2ef; }
    section { background: #fff; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,.08); height: 820px; display: flex; flex-direction: column; overflow: hidden; }
    header { padding: 16px 20px; border-bottom: 1px solid ${C.grid}; font-weight: 600; display: flex; gap: 10px; align-items: center; font-size: 14px; }
    .tag { font-size: 11px; text-transform: uppercase; letter-spacing: .08em; padding: 3px 8px; border-radius: 4px; color: #fff; } .tag.bad { background: ${C.bad}; } .tag.good { background: ${C.good}; }
    pre { padding: 18px 20px; font-size: 15px; line-height: 2.25; flex: 1; color: #333; white-space: pre; }
    pre .bad { background: #fde8e0; box-shadow: inset 3px 0 0 ${C.orange}; } pre .dup { background: #eceaf9; text-decoration: line-through; color: #777; }
    .legend { list-style: none; display: flex; gap: 18px; padding: 14px 20px; border-top: 1px solid ${C.grid}; font-size: 12px; color: ${C.text2}; }
    .legend i { display: inline-block; width: 12px; height: 12px; margin-right: 6px; vertical-align: -2px; } .legend .bad { background: #fde8e0; box-shadow: inset 3px 0 0 ${C.orange}; } .legend .dup { background: #eceaf9; }
    .arrow { font-size: 36px; color: ${C.text2}; text-align: center; }
    table { border-collapse: collapse; margin: 18px 20px; font-size: 15px; width: calc(100% - 40px); } th { background: #1f2937; color: #fff; text-align: left; padding: 10px 12px; font-size: 13px; }
    td { padding: 11px 12px; border-bottom: 1px solid #ecebe7; } tr:nth-child(even) td { background: #fafaf8; }
    .fixes { margin-top: auto; padding: 16px 20px; border-top: 1px solid ${C.grid}; background: #f2faf5; color: ${C.good}; font-size: 13px; }
    `,
  );
  const run = terminal({
    title: "~/clients/homeware-co — python extract_suppliers.py",
    lines: [
      `<span class="d">$</span> <span class="w">python extract_suppliers.py --inbox ./inbox --sheet "Supplier prices"</span>`,
      ``,
      `<span class="b">▸ Extracting tables from 4 files in ./inbox</span>`,
      `  supplier_A_2024-04.csv   <span class="d">delimiter ;  encoding latin-1   </span>  412 rows`,
      `  supplier_B_april.xlsx    <span class="d">2-row merged header detected    </span>  238 rows`,
      `  supplier_C_prices.pdf    <span class="d">table found on pages 1–6        </span>  517 rows`,
      `  supplier_D.csv           <span class="d">delimiter ,  encoding utf-8     </span>  151 rows`,
      ``,
      `<span class="b">▸ Normalising</span>`,
      `  dates      <span class="g">✓</span> 1,318 parsed into ISO 8601   <span class="d">(03/04/24 · 2024-04-03 · April 3 · 03.04.2024)</span>`,
      `  prices     <span class="g">✓</span>   906 converted to BRL decimals   <span class="d">(R$ 12,90 → 12.90)</span>`,
      `  stock      <span class="g">✓</span>    47 empty / "n/a" → 0`,
      `  names      <span class="g">✓</span> 1,318 trimmed and title-cased`,
      `  duplicates <span class="y">!</span>    34 removed   <span class="d">(same SKU + supplier + date)</span>`,
      ``,
      `<span class="b">▸ Comparing with last run (2024-03)</span>`,
      `  price up   <span class="r">▲ 128 SKUs</span>   avg +6.4%     price down <span class="g">▼ 41 SKUs</span>   new SKUs 22`,
      ``,
      `<span class="g">✓ Wrote 1,284 rows to Google Sheet "Supplier prices"</span>  <span class="d">tabs: Clean data · Summary · Fix log</span>`,
      `<span class="d">  Done in 6.8 s</span>`,
      ``,
      `<span class="b">▸ Summary tab</span>`,
      `  supplier   rows    price ▲   price ▼   new   fixes`,
      `  A          401      42        11        6     118`,
      `  B          236      31         9        4      57`,
      `  C          504      49        17       10     203`,
      `  D          143       6         4        2      19`,
      ``,
      `<span class="d">$</span> <span class="w">crontab -l</span>`,
      `<span class="d">30 6 * * 1  cd ~/clients/homeware-co && python extract_suppliers.py --inbox ./inbox   # every Monday 06:30</span>`,
    ].join("\n"),
  });
  return [
    { file: "before-after", html: split },
    { file: "run-log", html: run },
  ];
}

// ── 03 Low-stock alerts ──────────────────────────────
function inventory() {
  const items = [
    ["SKU-2041", "Cold brew bottle 1L", 18, 6.2, 12],
    ["SKU-1180", "Reusable straw set", 34, 4.1, 10],
    ["SKU-3302", "Glass meal-prep box (3)", 52, 3.9, 14],
    ["SKU-1007", "Ceramic pour-over", 96, 3.0, 21],
    ["SKU-2210", "Bamboo utensil kit", 140, 5.8, 10],
    ["SKU-4401", "Insulated tumbler 500ml", 46, 2.4, 14],
    ["SKU-0915", "Beeswax wraps (pack 3)", 118, 6.6, 12],
    ["SKU-3017", "Lunch box steel 2-tier", 75, 1.9, 21],
    ["SKU-1555", "Silicone food bags (4)", 33, 1.1, 14],
    ["SKU-2880", "Cotton produce bags", 330, 7.4, 7],
    ["SKU-0420", "Travel cutlery case", 48, 0.8, 10],
    ["SKU-3760", "Glass water bottle", 122, 3.3, 21],
    ["SKU-1993", "Coffee filter (metal)", 57, 1.4, 14],
    ["SKU-2604", "Spice jar set (6)", 15, 0.6, 21],
  ].map(([sku, name, onHand, daily, lead]) => {
    const cover = onHand / daily;
    const reorderPoint = Math.ceil(daily * (lead + 7));
    const status = cover < lead ? ["Reorder now", "bad", "●"] : cover < lead + 7 ? ["Reorder soon", "warn", "▲"] : ["OK", "good", "✓"];
    const suggest = status[1] === "good" ? 0 : Math.ceil(daily * 45 - onHand);
    return { sku, name, onHand, daily: daily.toFixed(1), cover, lead, reorderPoint, suggest, status };
  });
  const maxCover = 70;
  const sheet = sheets({
    file: "Inventory control — EcoHome store",
    tabs: ["Stock", "Reorder log", "Suppliers", "Settings"],
    menu: ["📦 Inventory"],
    cell: "E2",
    formula: "=IFERROR(C2/D2, \"—\")",
    cols: [
      { key: "sku", title: "SKU", w: 100, cls: "mono" },
      { key: "name", title: "Product", w: 230 },
      { key: "onHand", title: "On hand", w: 90, align: "right" },
      { key: "daily", title: "Sales / day (30d)", w: 140, align: "right" },
      {
        key: "cover",
        title: "Days of cover",
        w: 210,
        render: (v, r) =>
          `<div style="display:flex;align-items:center;gap:8px"><span style="display:block;height:12px;border-radius:3px;width:${Math.min(v, maxCover) * 2}px;background:${r.status[1] === "bad" ? C.orange : r.status[1] === "warn" ? "#eda100" : C.blue}"></span><span class="muted">${v.toFixed(0)} d</span></div>`,
      },
      { key: "lead", title: "Lead time", w: 90, align: "right", render: (v) => `${v} d` },
      { key: "reorderPoint", title: "Reorder point", w: 120, align: "right" },
      { key: "suggest", title: "Suggested order", w: 140, align: "right", render: (v) => (v ? `<b>${v}</b>` : '<span class="muted">—</span>') },
      { key: "status", title: "Status", w: 150, render: ([s, cls, icon]) => `<span class="chip ${cls}">${icon} ${s}</span>` },
    ],
    rows: items,
    toast: "📦 <b>Daily check · 07:00</b> — 3 SKUs below reorder point.<br>Alert emailed to purchasing@ecohome.store",
  });
  const urgent = items.filter((i) => i.status[1] === "bad");
  const mail = gmail({
    subject: `Reorder alert: ${urgent.length} SKUs below reorder point`,
    label: "Inventory",
    from: "Inventory Bot",
    fromEmail: "inventory-bot@ecohome.store",
    to: "purchasing",
    time: "07:00 (2 hours ago)",
    body: `<p>Good morning,</p><p>The daily stock check found <b>${urgent.length} products</b> that will run out before a new order can arrive:</p>
      <table><tr><th>SKU</th><th>Product</th><th>On hand</th><th>Runs out in</th><th>Lead time</th><th>Suggested order</th></tr>
      ${urgent
        .map((i) => `<tr><td>${i.sku}</td><td>${i.name}</td><td>${i.onHand}</td><td style="color:${C.bad};font-weight:600">● ${i.cover.toFixed(0)} days</td><td>${i.lead} days</td><td><b>${i.suggest} units</b></td></tr>`)
        .join("")}</table>
      <p>Suggested quantities cover 45 days of sales at the last 30 days' pace.</p>
      <p style="margin-top:14px"><b>Close to reorder point</b> (order this week):</p>
      <table><tr><th>SKU</th><th>Product</th><th>On hand</th><th>Runs out in</th><th>Lead time</th></tr>
      ${items
        .filter((i) => i.status[1] === "warn")
        .map((i) => `<tr><td>${i.sku}</td><td>${i.name}</td><td>${i.onHand}</td><td style="color:${C.warn};font-weight:600">▲ ${i.cover.toFixed(0)} days</td><td>${i.lead} days</td></tr>`)
        .join("")}</table>
      <span class="btn">Open the reorder sheet</span>
      <p style="color:#5f6368;font-size:12px;margin-top:22px">Sent automatically by Apps Script every day at 07:00. Thresholds and recipients are in the “Settings” tab.</p>`,
  });
  return [
    { file: "stock-sheet", html: sheet },
    { file: "alert-email", html: mail },
  ];
}

// ── 06 (cont.) Marketing tab of the profit dashboard ─────────
// Ad spend is simulated (Olist does not publish it), in R$ like the rest.
function marketing() {
  const money = (n) => fmt.money(n, "R$ ");
  const channels = [
    { name: "Email", spend: 2100, revenue: 23520, cust: 310, color: C.aqua },
    { name: "Google Search", spend: 16400, revenue: 75440, cust: 640, color: C.blue },
    { name: "Meta Ads", spend: 22300, revenue: 53520, cust: 470, color: C.orange },
    { name: "TikTok Ads", spend: 7400, revenue: 9620, cust: 115, color: C.gray },
  ];
  const spend = channels.reduce((a, c) => a + c.spend, 0);
  const rev = channels.reduce((a, c) => a + c.revenue, 0);
  const cust = channels.reduce((a, c) => a + c.cust, 0);
  const overview = powerbi({
    file: "olist_profit.pbix",
    title: "Marketing · ad spend vs sales",
    slicers: [["Period", "Jul – Sep 2018"], ["Ad spend", "Simulated"], ["Attribution", "Last click, 7d"]],
    pages: PROFIT_PAGES,
    active: 2,
    body: `
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:14px">
        ${[
          ["Ad spend", money(spend), "+9% vs Q2", ""],
          ["Attributed revenue", money(rev), "+21% vs Q2", "up"],
          ["ROAS", `${(rev / spend).toFixed(2)}×`, "target 3.0×", "up"],
          ["Cost per new customer", money(spend / cust), "−11% vs Q2", "up"],
          ["New customers", fmt.int(cust), "+18% vs Q2", "up"],
        ]
          .map(([l, v, d, cls]) => `<div class="card kpi"><div class="label">${l}</div><div class="value">${v}</div><div class="delta ${cls}">${d}</div></div>`)
          .join("")}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1.25fr;gap:14px">
        <div class="card"><h3>ROAS by channel</h3><div class="sub">Revenue ÷ spend · target 3.0× · below target in orange</div>
          ${hbars({
            w: 600,
            rowH: 64,
            labelW: 130,
            format: (v) => `${v.toFixed(1)}×`,
            data: channels
              .map((c) => ({ label: c.name, value: c.revenue / c.spend }))
              .sort((a, b) => b.value - a.value)
              .map((d) => ({ ...d, color: d.value < 3 ? C.orange : C.blue })),
          })}
          <div class="muted" style="margin-top:14px;font-size:12px">Meta and TikTok spend 61% of the budget but return under 3×.</div></div>
        <div class="card"><h3>Channel table</h3>
          <table class="ct"><tr><th>Channel</th><th class="num">Spend</th><th class="num">Revenue</th><th class="num">ROAS</th><th class="num">New cust.</th><th class="num">CAC</th><th>Status</th></tr>
            ${channels
              .map((c) => {
                const ro = c.revenue / c.spend;
                const st = ro >= 3 ? '<span class="chip good">✓ Scale</span>' : ro >= 2 ? '<span class="chip warn">▲ Optimise</span>' : '<span class="chip bad">● Cut / test</span>';
                return `<tr><td><b>${c.name}</b></td><td class="num">${money(c.spend)}</td><td class="num">${money(c.revenue)}</td><td class="num">${ro.toFixed(1)}×</td><td class="num">${c.cust}</td><td class="num">${money(c.spend / c.cust)}</td><td>${st}</td></tr>`;
              })
              .join("")}
            <tr class="tot"><td>Total</td><td class="num">${money(spend)}</td><td class="num">${money(rev)}</td><td class="num">${(rev / spend).toFixed(2)}×</td><td class="num">${cust}</td><td class="num">${money(spend / cust)}</td><td></td></tr></table>
          <div class="note"><b>Recommendation:</b> move ~R$ 4k/month from TikTok to Google Search brand + shopping campaigns; keep Meta on retargeting only.</div></div>
      </div>
      <div class="card" style="flex:1"><h3>Top campaigns by revenue</h3>
        <table class="ct"><tr><th>Campaign</th><th>Channel</th><th class="num">Spend</th><th class="num">Revenue</th><th class="num">ROAS</th><th class="num">Conv. rate</th></tr>
          ${[
            ["Shopping — best sellers", "Google Search", 6900, 38640, 3.1],
            ["Brand search", "Google Search", 2100, 19950, 6.2],
            ["Retargeting — viewed product", "Meta Ads", 5400, 21600, 2.7],
            ["Abandoned cart flow", "Email", 380, 7900, 4.9],
            ["UGC video — summer", "TikTok Ads", 4100, 5330, 0.9],
          ]
            .map(([n, ch, s, r2, cr]) => `<tr><td><b>${n}</b></td><td>${ch}</td><td class="num">${money(s)}</td><td class="num">${money(r2)}</td><td class="num">${(r2 / s).toFixed(1)}×</td><td class="num">${cr.toFixed(1)}%</td></tr>`)
            .join("")}</table></div>`,
  }).replace(
    "</style>",
    `.ct { width: 100%; border-collapse: collapse; font-size: 13.5px; } .ct th { text-align: left; color: ${C.text2}; font-weight: 600; font-size: 12px; padding: 10px; border-bottom: 1px solid ${C.grid}; } .ct th.num { text-align: right; }
     .ct td { padding: 13px 10px; border-bottom: 1px solid #f0efec; } .ct .tot td { font-weight: 700; border-top: 2px solid ${C.text}; }
     .note { margin-top: 18px; background: #f4f8fd; border-left: 3px solid ${C.blue}; padding: 12px 14px; font-size: 13px; line-height: 1.5; }</style>`,
  );

  const r = rng(77);
  const weeks = Array.from({ length: 13 }, (_, i) => `W${27 + i}`);
  const mk = (base, growth, noise) => weeks.map((_, i) => base + growth * i + (r() - 0.5) * noise);
  const series = [
    { name: "Google Search", color: C.blue, values: mk(4300, 230, 900) },
    { name: "Meta Ads", color: C.orange, values: mk(4400, -40, 1100) },
    { name: "Email", color: C.aqua, values: mk(1200, 110, 500) },
  ];
  const trend = powerbi({
    file: "olist_profit.pbix",
    title: "Marketing trend",
    slicers: [["Period", "Jul – Sep 2018 · weekly"], ["Metric", "Attributed revenue"]],
    pages: PROFIT_PAGES,
    active: 3,
    body: `
      <div style="display:grid;grid-template-columns:2.2fr 1fr;gap:14px;flex:1">
        <div class="card"><h3>Attributed revenue per week</h3><div class="sub">R$ · three largest channels · TikTok omitted (under R$ 1k/week)</div>
          <div style="display:flex;gap:18px;font-size:12px;margin:6px 0 4px">${series.map((s) => `<span><i style="display:inline-block;width:14px;height:3px;background:${s.color};vertical-align:middle;margin-right:6px;border-radius:2px"></i>${s.name}</span>`).join("")}</div>
          ${lines({ w: 1000, h: 740, labels: weeks, series, format: (v) => fmt.k(v, "R$ ") })}</div>
        <div style="display:flex;flex-direction:column;gap:14px">
          ${[
            ["Google Search keeps growing", "+62% weekly revenue from W27 to W39 with flat CPC after the shopping feed fix in W31.", C.blue],
            ["Meta is flat while spend grew", "Revenue stayed around R$ 4.2k/week while spend rose 18%. Creative fatigue on the two top ads.", C.orange],
            ["Email is the most efficient channel", "11.2× ROAS. The abandoned-cart flow alone brought R$ 7.9k this quarter.", C.aqua],
          ]
            .map(([t, d, col]) => `<div class="card" style="border-left:4px solid ${col}"><h3>${t}</h3><div style="font-size:13px;line-height:1.55;color:${C.text2}">${d}</div></div>`)
            .join("")}
          <div class="card"><h3>Data note</h3><div style="font-size:13px;line-height:1.55;color:${C.text2}">Ad spend in this demo is simulated and joined to the Olist orders by week. With real accounts, spend is pulled daily from the ad platforms.</div></div>
        </div>
      </div>`,
  });
  return [
    { file: "marketing", html: overview },
    { file: "marketing-trend", html: trend },
  ];
}

// ── 04 AI review classifier ───────────────────────────────
function reviews() {
  const topics = [
    ["Delivery time", 41, 12, 47],
    ["Product quality", 14, 9, 77],
    ["Packaging", 22, 18, 60],
    ["Size & fit", 27, 15, 58],
    ["Price / value", 11, 20, 69],
    ["Customer service", 19, 10, 71],
    ["Returns & refunds", 36, 14, 50],
  ];
  const rowH = 78;
  const cx = 470;
  const scale = 4.2;
  const div = `<svg width="1000" height="${topics.length * rowH + 40}" font-size="12.5" font-family="Inter, sans-serif">
    <text x="${cx - 8}" y="14" text-anchor="end" fill="${C.text2}">◀ negative</text><text x="${cx + 8}" y="14" fill="${C.text2}">positive ▶</text>
    ${topics
      .map(([t, neg, neu, pos], i) => {
        const y = 30 + i * rowH;
        return `<text x="0" y="${y + 22}" fill="${C.text}" font-weight="500">${t}</text>
          <rect x="${cx - neg * scale}" y="${y + 6}" width="${neg * scale}" height="28" rx="3" fill="${C.orange}"/>
          <rect x="${cx}" y="${y + 6}" width="${pos * scale}" height="28" rx="3" fill="${C.blue}"/>
          <text x="${cx - neg * scale - 8}" y="${y + 24}" text-anchor="end" fill="${C.text2}">${neg}%</text>
          <text x="${cx + pos * scale + 8}" y="${y + 24}" fill="${C.text2}">${pos}%  <tspan fill="${C.muted}">· ${neu}% neutral</tspan></text>`;
      })
      .join("")}
    <line x1="${cx}" x2="${cx}" y1="24" y2="${topics.length * rowH + 34}" stroke="${C.muted}"/>
  </svg>`;
  const dash = powerbi({
    file: "review_insights.pbix",
    title: "What customers say · 5,214 reviews",
    slicers: [["Period", "Last 12 months"], ["Store", "Amazon + Shopify"], ["Rating", "All"]],
    pages: ["Topics", "Reviews", "Method"],
    active: 0,
    body: `
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px">
        ${[
          ["Reviews analysed", "5,214", "tagged by an LLM, spot-checked by hand", ""],
          ["Negative share", "18.4%", "−4.1 pts after packaging change", "up"],
          ["Top complaint", "Delivery time", "41% of delivery mentions negative", "down"],
          ["Avg. rating", "4.1 ★", "Amazon 3.9 · Shopify 4.4", ""],
        ]
          .map(([l, v, d, cls]) => `<div class="card kpi"><div class="label">${l}</div><div class="value">${v}</div><div class="delta ${cls}">${d}</div></div>`)
          .join("")}
      </div>
      <div style="display:grid;grid-template-columns:1.6fr 1fr;gap:14px;flex:1">
        <div class="card"><h3>Sentiment by topic</h3><div class="sub">Share of mentions per topic · neutral share in grey text</div>${div}</div>
        <div class="card"><h3>AI summaries · delivery time</h3>
          ${[
            ["“Arrived 9 days after the estimate, no tracking updates.”", "Late · no tracking", "bad"],
            ["“Courier left it at the wrong address twice.”", "Wrong address", "bad"],
            ["“Fast! Ordered Monday, here on Wednesday.”", "Fast delivery", "good"],
            ["“Took a while but the seller kept me posted.”", "Slow · good communication", "neutral"],
          ]
            .map(([q, s, cls]) => `<div style="padding:12px 0;border-bottom:1px solid #f0efec"><div style="font-size:13.5px;line-height:1.5">${q}</div><div style="margin-top:6px"><span class="chip ${cls}">${s}</span></div></div>`)
            .join("")}
          <div class="muted" style="margin-top:14px;font-size:12px;line-height:1.5">Each review is classified into topic + sentiment with a one-line summary. 300 random reviews were checked by hand: 94% agreement.</div></div>
      </div>`,
  });

  const sample = [
    ["2026-09-28", 2, "Package arrived crushed and one glass was broken. Seller replaced it quickly though.", "Packaging", ["Negative", "bad"], "Broken in transit, fast replacement", 0.93],
    ["2026-09-27", 5, "Exactly as described, great quality for the price. Will buy again.", "Product quality", ["Positive", "good"], "Matches description, good value", 0.97],
    ["2026-09-27", 1, "Waited almost three weeks and no one answered my emails.", "Delivery time", ["Negative", "bad"], "Late, no support response", 0.95],
    ["2026-09-26", 4, "Runs a bit small, order one size up. Fabric is lovely.", "Size & fit", ["Mixed", "warn"], "Runs small, good fabric", 0.88],
    ["2026-09-26", 3, "Fine. Nothing special for this price.", "Price / value", ["Neutral", "neutral"], "Average value", 0.81],
    ["2026-09-25", 5, "Support sorted my exchange in one day. Super friendly.", "Customer service", ["Positive", "good"], "Quick, friendly exchange", 0.96],
    ["2026-09-25", 2, "Refund took 15 days after they received the return.", "Returns & refunds", ["Negative", "bad"], "Slow refund", 0.94],
    ["2026-09-24", 5, "Arrived next day, nicely packed, gift wrap was a nice touch.", "Delivery time", ["Positive", "good"], "Next-day, nice packing", 0.92],
    ["2026-09-24", 4, "Good product, the instructions could be clearer.", "Product quality", ["Mixed", "warn"], "Good product, unclear manual", 0.86],
    ["2026-09-23", 1, "Wrong colour sent and the return label didn't work.", "Returns & refunds", ["Negative", "bad"], "Wrong item, broken return label", 0.95],
    ["2026-09-23", 5, "Third order, always perfect.", "Product quality", ["Positive", "good"], "Repeat buyer, consistent", 0.9],
    ["2026-09-22", 3, "Delivery was okay, box a bit damaged but product fine.", "Packaging", ["Mixed", "warn"], "Damaged box, product intact", 0.84],
  ].map(([date, stars, text, topic, sentiment, summary, conf]) => ({ date, stars, text, topic, sentiment, summary, conf }));
  const sheet = sheets({
    file: "Reviews — AI tagged",
    tabs: ["Reviews", "Topic summary", "Prompt & settings", "Hand check (300)"],
    menu: ["🤖 AI tagging"],
    cell: "E2",
    formula: "Tagged by script: topic, sentiment and summary from the review text",
    cols: [
      { key: "date", title: "Date", w: 100 },
      { key: "stars", title: "Rating", w: 90, render: (v) => `<span style="color:#e3a008;letter-spacing:1px">${"★".repeat(v)}</span><span style="color:#ddd">${"★".repeat(5 - v)}</span>` },
      { key: "text", title: "Review", w: 470 },
      { key: "topic", title: "Topic (AI)", w: 150 },
      { key: "sentiment", title: "Sentiment (AI)", w: 130, render: ([s, cls]) => `<span class="chip ${cls}">${s}</span>` },
      { key: "summary", title: "Summary (AI)", w: 270 },
      { key: "conf", title: "Confidence", w: 100, align: "right", render: (v) => `${Math.round(v * 100)}%` },
    ],
    rows: sample,
    extraCss: `td:nth-child(5), td:nth-child(7) { background: #f6faff; } td.h:nth-child(5), td.h:nth-child(6), td.h:nth-child(7), td.h:nth-child(8) { background: #1d4ed8; }`,
    toast: "🤖 <b>AI tagging</b> — 212 new reviews tagged (2m 41s).<br>Low-confidence rows (&lt; 80%) flagged for a quick human check.",
  });
  const script = appsScript({
    project: "Review tagger",
    files: ["Code.gs", "Prompt.gs", "Sheet.gs", "appsscript.json"],
    code: `<span class="k">const</span> MODEL = <span class="s">'claude-opus-5-5'</span>;
<span class="k">const</span> BATCH = <span class="n">25</span>;

<span class="c">/** Menu: AI tagging → Tag new reviews (also runs nightly). */</span>
<span class="k">function</span> <span class="fn">tagNewReviews</span>() {
  <span class="k">const</span> sheet = SpreadsheetApp.<span class="fn">getActive</span>().<span class="fn">getSheetByName</span>(<span class="s">'Reviews'</span>);
  <span class="k">const</span> rows = <span class="fn">untaggedRows_</span>(sheet);           <span class="c">// reviews with no topic yet</span>
  <span class="k">for</span> (<span class="k">const</span> batch <span class="k">of</span> <span class="fn">chunk_</span>(rows, BATCH)) {
    <span class="k">const</span> res = UrlFetchApp.<span class="fn">fetch</span>(<span class="s">'https://api.anthropic.com/v1/messages'</span>, {
      method: <span class="s">'post'</span>,
      contentType: <span class="s">'application/json'</span>,
      headers: {
        <span class="s">'x-api-key'</span>: PropertiesService.<span class="fn">getScriptProperties</span>().<span class="fn">getProperty</span>(<span class="s">'ANTHROPIC_API_KEY'</span>),
        <span class="s">'anthropic-version'</span>: <span class="s">'2023-06-01'</span>,
      },
      payload: JSON.<span class="fn">stringify</span>({
        model: MODEL,
        max_tokens: <span class="n">4000</span>,
        system: PROMPT,                                  <span class="c">// topics, sentiment rules, examples</span>
        output_config: { effort: <span class="s">'low'</span>, format: { type: <span class="s">'json_schema'</span>, schema: TAGS_SCHEMA } },
        messages: [{ role: <span class="s">'user'</span>, content: JSON.<span class="fn">stringify</span>(batch.<span class="fn">map</span>(r => r.text)) }],
      }),
    });
    <span class="k">const</span> reply = JSON.<span class="fn">parse</span>(res.<span class="fn">getContentText</span>());
    <span class="k">const</span> tags = JSON.<span class="fn">parse</span>(reply.content.<span class="fn">find</span>(b => b.type === <span class="s">'text'</span>).text).reviews;
    <span class="fn">writeTags_</span>(sheet, batch, tags);                  <span class="c">// topic, sentiment, summary, confidence</span>
  }
}`,
    log: [
      ["2:00:03 AM", "Notice", "Execution started"],
      ["2:00:04 AM", "Info", "212 untagged reviews → 9 batches"],
      ["2:00:21 AM", "Info", "Batch 1/9 · 25 tagged · 2 flagged for review (confidence &lt; 80%)"],
      ["2:01:58 AM", "Info", "Batch 9/9 · 12 tagged · 1 flagged"],
      ["2:02:44 AM", "Info", "212 reviews tagged · 14 flagged · written to Reviews!E:H"],
      ["2:02:44 AM", "Notice", "Execution completed"],
    ],
  });
  return [
    { file: "tagged-sheet", html: sheet },
    { file: "apps-script", html: script },
    { file: "topics", html: dash },
  ];
}

export const shots = {
  "shopify-ai-order-alerts": shopify(),
  "form-to-sheet-automation": formToSheet(),
  "low-stock-alerts": inventory(),
  "ai-review-classifier": reviews(),
  "messy-data-extractor": messyImporter(),
  "ecommerce-profit-roas-dashboard": ecommerce(),
};

export { W, H };
