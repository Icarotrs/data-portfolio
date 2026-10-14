/**
 * Building blocks for the project screenshots: app "chrome" (Power BI,
 * Google Sheets, Gmail, PDF, terminal) and small SVG charts. Every
 * screenshot is plain HTML rendered by scripts/render-shots.mjs.
 *
 * Chart colours follow the validated categorical palette (light mode):
 * slot 1 blue, slot 2 orange, slot 3 aqua; neutral grey for deductions.
 */

export const C = {
  blue: "#2a78d6",
  orange: "#eb6834",
  aqua: "#1baf7a",
  gray: "#a8a7a1",
  text: "#0b0b0b",
  text2: "#52514e",
  muted: "#8a8984",
  grid: "#e7e6e2",
  surface: "#fcfcfb",
  bad: "#c4312f",
  warn: "#b26a00",
  good: "#167a3e",
};

export const W = 1600;
export const H = 1000;

/** Deterministic pseudo-random numbers so screenshots are reproducible. */
export function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

export const fmt = {
  int: (n) => Math.round(n).toLocaleString("en-US"),
  money: (n, cur = "$") => `${cur}${Math.round(n).toLocaleString("en-US")}`,
  k: (n, cur = "") => {
    const a = Math.abs(n);
    const sign = n < 0 ? "−" : "";
    if (a >= 1e6) return `${sign}${cur}${(a / 1e6).toFixed(1)}M`;
    if (a >= 1e3) return `${sign}${cur}${(a / 1e3).toFixed(a < 1e4 && a % 1000 ? 1 : 0)}k`;
    return `${sign}${cur}${Math.round(a)}`;
  },
  pct: (n, d = 1) => `${n.toFixed(d)}%`,
};

export const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const BASE_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: ${W}px; height: ${H}px; overflow: hidden; }
  body { font-family: Inter, "Segoe UI", Roboto, Arial, sans-serif; color: ${C.text}; background: #fff; font-size: 13px; -webkit-font-smoothing: antialiased; }
  .mono { font-family: "DejaVu Sans Mono", ui-monospace, Menlo, monospace; }
  .num { font-variant-numeric: tabular-nums; text-align: right; }
  .muted { color: ${C.text2}; }
  .chip { display: inline-flex; align-items: center; gap: 5px; padding: 2px 9px; border-radius: 999px; font-size: 12px; font-weight: 500; white-space: nowrap; }
  .chip.good { background: #e3f4e8; color: ${C.good}; }
  .chip.warn { background: #fdf0d9; color: ${C.warn}; }
  .chip.bad { background: #fbe4e3; color: ${C.bad}; }
  .chip.info { background: #e4eefb; color: #1d5fae; }
  .chip.neutral { background: #efeeeb; color: ${C.text2}; }
`;

export function page(body, css = "") {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${BASE_CSS}${css}</style></head><body>${body}</body></html>`;
}

// ── App chrome ────────────────────────────────────────────────

/** Power BI–style report: dark top bar, slicer row, visuals canvas, page tabs. */
export function powerbi({ title, file, slicers = [], pages = [], active = 0, body }) {
  return page(
    `<div class="pbi">
      <header class="top"><span class="logo"></span><b>${esc(file)}</b><span class="sep">|</span><span>Power BI Desktop</span>
        <span class="right">File&nbsp;&nbsp; Home&nbsp;&nbsp; Insert&nbsp;&nbsp; Modeling&nbsp;&nbsp; View</span></header>
      <div class="canvas">
        <div class="titlebar"><h1>${esc(title)}</h1><div class="slicers">${slicers
          .map((s) => `<div class="slicer"><span>${esc(s[0])}</span><b>${esc(s[1])}</b><i>▾</i></div>`)
          .join("")}</div></div>
        ${body}
      </div>
      <footer class="tabs">${pages.map((p, i) => `<span class="${i === active ? "on" : ""}">${esc(p)}</span>`).join("")}</footer>
    </div>`,
    `
    .pbi { height: 100%; display: flex; flex-direction: column; background: #f3f2f1; }
    .top { height: 40px; background: #252423; color: #f3f2f1; display: flex; align-items: center; gap: 10px; padding: 0 16px; font-size: 13px; }
    .top .logo { width: 18px; height: 18px; background: linear-gradient(90deg, #f2c811 0 33%, #e8b10b 33% 66%, #c79a07 66%); border-radius: 2px; }
    .top .sep { opacity: .4 } .top .right { margin-left: auto; opacity: .8 }
    .canvas { flex: 1; padding: 20px 24px; display: flex; flex-direction: column; gap: 14px; }
    .titlebar { display: flex; align-items: center; justify-content: space-between; }
    .titlebar h1 { font-size: 22px; font-weight: 600; letter-spacing: -.01em; }
    .slicers { display: flex; gap: 10px; }
    .slicer { background: #fff; border: 1px solid #e1dfdd; border-radius: 4px; padding: 6px 12px; display: flex; gap: 8px; align-items: center; font-size: 12px; }
    .slicer span { color: ${C.text2}; } .slicer i { font-style: normal; color: ${C.muted}; }
    .tabs { height: 34px; background: #fff; border-top: 1px solid #e1dfdd; display: flex; align-items: stretch; padding-left: 16px; font-size: 12px; }
    .tabs span { padding: 0 16px; display: flex; align-items: center; color: ${C.text2}; }
    .tabs span.on { color: ${C.text}; font-weight: 600; box-shadow: inset 0 -3px 0 #f2c811; background: #faf9f8; }
    .card { background: #fff; border-radius: 6px; box-shadow: 0 1px 2px rgba(0,0,0,.08); padding: 14px 16px; }
    .card h3 { font-size: 13px; font-weight: 600; margin-bottom: 8px; }
    .card .sub { font-size: 11.5px; color: ${C.text2}; margin-top: -6px; margin-bottom: 8px; }
    .kpi .label { font-size: 12px; color: ${C.text2}; } .kpi .value { font-size: 28px; font-weight: 600; margin-top: 4px; letter-spacing: -.02em; }
    .kpi .delta { font-size: 12px; margin-top: 2px; } .kpi .delta.up { color: ${C.good}; } .kpi .delta.down { color: ${C.bad}; }
    `,
  );
}

/** Google Sheets–style grid. `cols`: [{ key, title, w, align, render? }]. */
export function sheets({ file, tabs, active = 0, formula = "", cell = "A1", cols, rows, highlightRow = -1, extraCss = "", toast = "", menu = [], fillTo = 24 }) {
  const letters = "ABCDEFGHIJKLMNOP";
  const head = cols
    .map((c, i) => `<th style="width:${c.w}px">${letters[i]}</th>`)
    .join("");
  const titleRow = cols.map((c) => `<td class="h ${c.align === "right" ? "num" : ""}">${esc(c.title)}</td>`).join("");
  const body = rows
    .map(
      (r, i) =>
        `<tr class="${i === highlightRow ? "hl" : ""}"><th>${i + 2}</th>${cols
          .map((c) => `<td class="${c.align === "right" ? "num" : ""} ${c.cls ?? ""}">${c.render ? c.render(r[c.key], r) : esc(r[c.key] ?? "")}</td>`)
          .join("")}</tr>`,
    )
    .join("") +
    // Empty rows below the data, like a real spreadsheet.
    Array.from({ length: Math.max(0, fillTo - rows.length) }, (_, i) => `<tr><th>${rows.length + i + 2}</th>${cols.map(() => "<td></td>").join("")}<td class="pad"></td></tr>`).join("");
  return page(
    `<div class="gs">
      <header class="bar"><span class="icon"></span><div><b>${esc(file)}</b>
        <div class="menu">${["File", "Edit", "View", "Insert", "Format", "Data", "Tools", "Extensions", ...menu]
          .map((m) => `<span class="${menu.includes(m) ? "custom" : ""}">${m}</span>`)
          .join("")}</div></div>
        <span class="share">Share</span></header>
      <div class="fx"><span class="ref">${cell}</span><span class="fxi">fx</span><span class="mono">${esc(formula)}</span></div>
      <div class="grid"><table><thead><tr><th class="corner"></th>${head}<th class="pad"></th></tr></thead>
        <tbody><tr><th>1</th>${titleRow}</tr>${body}</tbody></table></div>
      ${toast ? `<div class="toast">${toast}</div>` : ""}
      <footer class="tabs"><span class="plus">+</span>${tabs.map((t, i) => `<span class="${i === active ? "on" : ""}">${esc(t)}</span>`).join("")}</footer>
    </div>`,
    `
    .gs { height: 100%; display: flex; flex-direction: column; background: #f9fbfd; font-family: Inter, Roboto, Arial, sans-serif; }
    .bar { height: 64px; display: flex; align-items: center; gap: 12px; padding: 0 16px; }
    .bar .icon { width: 28px; height: 36px; background: #0f9d58; border-radius: 3px; position: relative; }
    .bar .icon::after { content: ""; position: absolute; inset: 10px 6px; border: 2px solid #fff; border-width: 2px 0; box-shadow: inset 0 6px 0 -4px #fff; }
    .bar b { font-size: 17px; font-weight: 500; } .menu { display: flex; gap: 14px; font-size: 13px; color: #3c4043; margin-top: 3px; }
    .menu .custom { color: #0b57d0; font-weight: 600; }
    .share { margin-left: auto; background: #c2e7ff; color: #001d35; padding: 9px 22px; border-radius: 999px; font-weight: 500; }
    .fx { height: 30px; background: #fff; border-top: 1px solid #e3e3e3; border-bottom: 1px solid #e3e3e3; display: flex; align-items: center; gap: 12px; padding: 0 10px; font-size: 13px; }
    .fx .ref { width: 70px; color: #3c4043; border-right: 1px solid #e3e3e3; } .fx .fxi { color: #9aa0a6; font-style: italic; }
    .grid { flex: 1; overflow: hidden; background: #fff; }
    table { border-collapse: collapse; table-layout: fixed; font-size: 13px; }
    thead th { background: #f8f9fa; color: #5f6368; font-weight: 400; height: 22px; border: 1px solid #e2e3e3; font-size: 11px; }
    tbody th { background: #f8f9fa; color: #5f6368; font-weight: 400; width: 46px; border: 1px solid #e2e3e3; font-size: 11px; }
    .corner { width: 46px; }
    td { height: 34px; padding: 0 9px; border: 1px solid #e2e3e3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .pad { width: 400px; } tbody td.pad, thead th.pad { border-left: none; }
    td.h { background: #1f2937; color: #fff; font-weight: 600; font-size: 12.5px; border-color: #374151; }
    tr.hl td { background: #fff8e1; } tr.hl td:first-of-type { box-shadow: inset 2px 0 0 #0b57d0; }
    .toast { position: absolute; right: 24px; bottom: 56px; background: #1f1f1f; color: #fff; padding: 14px 18px; border-radius: 8px; font-size: 13px; box-shadow: 0 8px 24px rgba(0,0,0,.25); max-width: 460px; line-height: 1.45; }
    .tabs { height: 38px; background: #f9fbfd; border-top: 1px solid #e3e3e3; display: flex; align-items: center; gap: 4px; padding: 0 12px; font-size: 13px; }
    .tabs span { padding: 7px 16px; color: #3c4043; border-radius: 6px 6px 0 0; } .tabs .plus { color: #5f6368; font-size: 18px; padding: 0 10px; }
    .tabs span.on { background: #e1e9f7; color: #0b57d0; font-weight: 600; }
    ${extraCss}
    `,
  );
}

/** Gmail-style message view. */
export function gmail({ subject, from, fromEmail, to, time, label, body }) {
  return page(
    `<div class="gm">
      <aside><div class="compose">✎ Compose</div>${["Inbox", "Starred", "Snoozed", "Sent", "Drafts"]
        .map((x, i) => `<div class="nav ${i === 0 ? "on" : ""}">${x}${i === 0 ? "<b>4</b>" : ""}</div>`)
        .join("")}</aside>
      <main><div class="search">Search mail</div>
        <article><h1>${esc(subject)} <span class="lbl">${esc(label)}</span></h1>
          <div class="from"><span class="av">${esc(from[0])}</span><div><b>${esc(from)}</b> <span class="muted">&lt;${esc(fromEmail)}&gt;</span><div class="muted">to ${esc(to)}</div></div><span class="time muted">${esc(time)}</span></div>
          <div class="msg">${body}</div></article></main>
    </div>`,
    `
    .gm { height: 100%; display: flex; background: #f6f8fc; font-family: Inter, Roboto, Arial, sans-serif; }
    aside { width: 240px; padding: 16px 12px; } .compose { background: #c2e7ff; border-radius: 16px; padding: 18px 22px; font-weight: 500; width: 150px; margin-bottom: 16px; }
    .nav { padding: 7px 16px; border-radius: 999px; display: flex; justify-content: space-between; color: #202124; } .nav.on { background: #d3e3fd; font-weight: 600; }
    main { flex: 1; padding: 12px 16px 16px 0; display: flex; flex-direction: column; gap: 12px; }
    .search { background: #e9eef6; border-radius: 999px; padding: 14px 22px; color: #5f6368; width: 720px; }
    article { flex: 1; background: #fff; border-radius: 16px; padding: 28px 40px; }
    h1 { font-size: 22px; font-weight: 400; display: flex; align-items: center; gap: 10px; }
    .lbl { font-size: 12px; background: #ddd; color: #444; padding: 2px 6px; border-radius: 4px; }
    .from { display: flex; gap: 12px; align-items: flex-start; margin: 24px 0; font-size: 13px; }
    .av { width: 40px; height: 40px; border-radius: 50%; background: #0f9d58; color: #fff; display: grid; place-items: center; font-weight: 600; }
    .time { margin-left: auto; } .msg { font-size: 14px; line-height: 1.6; color: #202124; max-width: 900px; }
    .msg table { border-collapse: collapse; margin: 14px 0; font-size: 13.5px; }
    .msg th { text-align: left; background: #f1f3f4; padding: 9px 14px; font-weight: 600; } .msg td { padding: 9px 14px; border-bottom: 1px solid #eee; }
    .btn { display: inline-block; background: #0b57d0; color: #fff; padding: 10px 20px; border-radius: 6px; font-weight: 500; margin-top: 8px; }
    `,
  );
}

/** A report page (PDF) on a grey viewer background. */
export function pdf({ file, body }) {
  return page(
    `<div class="pv"><header>${esc(file)}<span>1 / 2</span></header><div class="sheet">${body}</div></div>`,
    `
    .pv { height: 100%; background: #525659; display: flex; flex-direction: column; align-items: center; }
    header { width: 100%; height: 44px; background: #323639; color: #f1f1f1; display: flex; align-items: center; justify-content: space-between; padding: 0 20px; font-size: 13px; }
    .sheet { margin-top: 24px; width: 1040px; flex: 1; background: #fff; box-shadow: 0 4px 18px rgba(0,0,0,.35); padding: 46px 56px; }
    `,
  );
}

/** Dark terminal window. */
export function terminal({ title, lines }) {
  return page(
    `<div class="tw"><div class="win"><header><i></i><i></i><i></i><span>${esc(title)}</span></header><pre class="mono">${lines}</pre></div></div>`,
    `
    .tw { height: 100%; background: linear-gradient(135deg, #1c2333, #0e1117); display: grid; place-items: center; }
    .win { width: 1440px; height: 880px; background: #0d1117; border-radius: 12px; box-shadow: 0 24px 60px rgba(0,0,0,.5); overflow: hidden; border: 1px solid #30363d; }
    header { height: 38px; background: #161b22; display: flex; align-items: center; gap: 8px; padding: 0 14px; color: #8b949e; font-size: 13px; }
    header i { width: 12px; height: 12px; border-radius: 50%; background: #ff5f57; } header i:nth-child(2) { background: #febc2e; } header i:nth-child(3) { background: #28c840; }
    header span { margin-left: 12px; }
    pre { padding: 22px 26px; color: #c9d1d9; font-size: 15px; line-height: 1.55; white-space: pre; }
    .g { color: #3fb950; } .y { color: #d29922; } .b { color: #58a6ff; } .r { color: #f85149; } .d { color: #6e7681; } .w { color: #f0f6fc; font-weight: 700; }
    `,
  );
}

// ── Charts (SVG) ──────────────────────────────────────────────

/** Axis top: four equal, round steps (0, 50, 100, 150, 200 …). */
function niceMax(v) {
  const raw = v / 4;
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * p).find((m) => m >= raw);
  return step * 4;
}

/** Vertical bars, one series. Rounded data-end, baseline-anchored. */
export function bars({ w, h, data, color = C.blue, format = fmt.int, labelEvery = 1, highlight = [] }) {
  const pad = { l: 48, r: 8, t: 12, b: 26 };
  const max = niceMax(Math.max(...data.map((d) => d.value)));
  const iw = w - pad.l - pad.r;
  const ih = h - pad.t - pad.b;
  const bw = (iw / data.length) * 0.62;
  const step = iw / data.length;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);
  return `<svg width="${w}" height="${h}" font-size="11" font-family="Inter, sans-serif">
    ${ticks
      .map((t) => {
        const y = pad.t + ih - (t / max) * ih;
        return `<line x1="${pad.l}" x2="${w - pad.r}" y1="${y}" y2="${y}" stroke="${C.grid}"/><text x="${pad.l - 8}" y="${y + 4}" text-anchor="end" fill="${C.text2}">${format(t)}</text>`;
      })
      .join("")}
    ${data
      .map((d, i) => {
        const bh = Math.max(2, (d.value / max) * ih);
        const x = pad.l + i * step + (step - bw) / 2;
        const y = pad.t + ih - bh;
        const r = Math.min(4, bw / 2);
        const hl = highlight.includes(i);
        return `<path d="M${x},${pad.t + ih} V${y + r} Q${x},${y} ${x + r},${y} H${x + bw - r} Q${x + bw},${y} ${x + bw},${y + r} V${pad.t + ih} Z" fill="${color}"/>
          ${hl ? `<text x="${x + bw / 2}" y="${y - 6}" text-anchor="middle" fill="${C.text}" font-weight="600">${format(d.value)}</text>` : ""}
          ${i % labelEvery === 0 ? `<text x="${x + bw / 2}" y="${h - 8}" text-anchor="middle" fill="${C.text2}">${d.label}</text>` : ""}`;
      })
      .join("")}
    <line x1="${pad.l}" x2="${w - pad.r}" y1="${pad.t + ih}" y2="${pad.t + ih}" stroke="${C.muted}"/>
  </svg>`;
}

/** Line chart, 1–3 series, direct labels at the line ends. */
export function lines({ w, h, labels, series, format = fmt.int, min = 0, labelEvery = 1, endLabels = true }) {
  const pad = { l: 52, r: endLabels ? 160 : 12, t: 14, b: 26 };
  const all = series.flatMap((s) => s.values);
  const lo = min;
  const max = lo + niceMax(Math.max(...all) - lo);
  const iw = w - pad.l - pad.r;
  const ih = h - pad.t - pad.b;
  const x = (i) => pad.l + (i / (labels.length - 1)) * iw;
  const y = (v) => pad.t + ih - ((v - lo) / (max - lo)) * ih;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => lo + f * (max - lo));
  return `<svg width="${w}" height="${h}" font-size="11" font-family="Inter, sans-serif">
    ${ticks
      .map((t) => `<line x1="${pad.l}" x2="${pad.l + iw}" y1="${y(t)}" y2="${y(t)}" stroke="${C.grid}"/><text x="${pad.l - 8}" y="${y(t) + 4}" text-anchor="end" fill="${C.text2}">${format(t)}</text>`)
      .join("")}
    ${labels.map((l, i) => (i % labelEvery === 0 ? `<text x="${x(i)}" y="${h - 8}" text-anchor="middle" fill="${C.text2}">${l}</text>` : "")).join("")}
    ${series
      .map((s) => {
        const d = s.values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
        const last = s.values.length - 1;
        return `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="2" stroke-linejoin="round"/>
          <circle cx="${x(last)}" cy="${y(s.values[last])}" r="4" fill="${s.color}" stroke="#fff" stroke-width="2"/>
          ${endLabels ? `<text x="${x(last) + 10}" y="${y(s.values[last]) + 4}" fill="${C.text}" font-weight="600">${s.name} <tspan fill="${C.text2}" font-weight="400">${format(s.values[last])}</tspan></text>` : ""}`;
      })
      .join("")}
  </svg>`;
}

/** Horizontal bars with labels on the left and values on the right. */
export function hbars({ w, rowH = 30, data, color = C.blue, format = fmt.int, labelW = 170 }) {
  const max = Math.max(...data.map((d) => Math.abs(d.value)));
  const bwMax = w - labelW - 80;
  const h = data.length * rowH;
  return `<svg width="${w}" height="${h}" font-size="12" font-family="Inter, sans-serif">
    ${data
      .map((d, i) => {
        const bw = Math.max(3, (Math.abs(d.value) / max) * bwMax);
        const y = i * rowH + rowH * 0.2;
        const bh = rowH * 0.6;
        return `<text x="0" y="${y + bh / 2 + 4}" fill="${C.text}">${esc(d.label)}</text>
          <rect x="${labelW}" y="${y}" width="${bw}" height="${bh}" rx="3" fill="${d.color ?? color}"/>
          <text x="${labelW + bw + 8}" y="${y + bh / 2 + 4}" fill="${C.text2}">${format(d.value)}</text>`;
      })
      .join("")}
  </svg>`;
}

// ── More app chrome: n8n, Slack, Apps Script ──────────────────

/**
 * n8n editor canvas. `nodes`: [{ id, name, sub, icon, color, x, y, ok }],
 * `edges`: [[fromId, toId, label?]]. Nodes are 96px squares centred on x, y.
 */
export function n8n({ name, nodes, edges, toast = "", executions = [] }) {
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const S = 96;
  const paths = edges
    .map(([a, b, label]) => {
      const p = byId[a];
      const q = byId[b];
      const x1 = p.x + S / 2 + 6;
      const x2 = q.x - S / 2 - 8;
      const mx = (x1 + x2) / 2;
      return `<path d="M${x1},${p.y} C${mx},${p.y} ${mx},${q.y} ${x2},${q.y}" fill="none" stroke="#b6b6c2" stroke-width="2"/>
        <path d="M${x2 - 7},${q.y - 5} L${x2 + 1},${q.y} L${x2 - 7},${q.y + 5}" fill="none" stroke="#b6b6c2" stroke-width="2"/>
        <circle cx="${x1}" cy="${p.y}" r="5" fill="#fff" stroke="#9a9aa8" stroke-width="2"/>
        ${label ? `<text x="${mx}" y="${(p.y + q.y) / 2 - 8}" text-anchor="middle" font-size="12" fill="#6b6b78">${esc(label)}</text>` : ""}`;
    })
    .join("");
  return page(
    `<div class="n8">
      <header><span class="logo">n8n</span><span class="crumb">Personal /</span><b>${esc(name)}</b>
        <span class="tabs"><span class="on">Editor</span><span>Executions</span></span>
        <span class="right"><span class="active"><i></i> Active</span><span class="btn">Save</span></span></header>
      <div class="canvas">
        <svg class="edges" width="${W}" height="${H - 56}">${paths}</svg>
        ${nodes
          .map(
            (n) => `<div class="node ${n.ok ? "ok" : ""}" data-id="${n.id}" style="left:${n.x - S / 2}px;top:${n.y - S / 2}px">
              <span class="ic" style="background:${n.color}">${n.icon}</span>
              ${n.ok ? `<span class="badge">✓ ${n.ok}</span>` : ""}
              <div class="nm"><b>${esc(n.name)}</b><span>${esc(n.sub ?? "")}</span></div></div>`,
          )
          .join("")}
        ${executions.length ? `<aside class="ex"><h4>Recent executions</h4>${executions.map(([id, when, st, t]) => `<div class="row"><span class="st ${st === "Success" ? "good" : "bad"}">${st}</span><span>#${id}</span><span class="muted">${when}</span><span class="muted">${t}</span></div>`).join("")}</aside>` : ""}
        <div class="exec">▶ Execute workflow</div>
        ${toast ? `<div class="toast">${toast}</div>` : ""}
      </div>
    </div>`,
    `
    .n8 { height: 100%; display: flex; flex-direction: column; font-family: Inter, "Segoe UI", Arial, sans-serif; }
    .n8 header { height: 56px; background: #fff; border-bottom: 1px solid #e3e3ea; display: flex; align-items: center; gap: 12px; padding: 0 20px; font-size: 14px; }
    .logo { font-weight: 800; color: #ea4b71; font-size: 18px; letter-spacing: -.02em; }
    .crumb { color: #8a8a99; } .tabs { margin-left: 40px; display: flex; gap: 4px; background: #f2f2f6; border-radius: 6px; padding: 3px; }
    .tabs span { padding: 5px 14px; border-radius: 4px; font-size: 13px; color: #555; } .tabs .on { background: #fff; color: #111; box-shadow: 0 1px 2px rgba(0,0,0,.1); }
    .right { margin-left: auto; display: flex; gap: 14px; align-items: center; }
    .active { display: flex; align-items: center; gap: 6px; color: #2f8a4e; font-weight: 600; font-size: 13px; } .active i { width: 30px; height: 16px; border-radius: 8px; background: #3fb36a; position: relative; } .active i::after { content: ""; position: absolute; right: 2px; top: 2px; width: 12px; height: 12px; border-radius: 50%; background: #fff; }
    .btn { background: #ff6d5a; color: #fff; padding: 7px 16px; border-radius: 6px; font-weight: 600; font-size: 13px; }
    .canvas { position: relative; flex: 1; background: #f6f6f9; background-image: radial-gradient(#d6d6de 1.2px, transparent 1.2px); background-size: 22px 22px; overflow: hidden; }
    .edges { position: absolute; inset: 0; }
    .node { position: absolute; width: 96px; height: 96px; background: #fff; border: 2px solid #c9c9d4; border-radius: 12px; display: grid; place-items: center; box-shadow: 0 2px 6px rgba(0,0,0,.06); }
    .node.ok { border-color: #3fb36a; }
    .node .ic { width: 46px; height: 46px; border-radius: 10px; display: grid; place-items: center; color: #fff; font-weight: 700; font-size: 18px; }
    .node .badge { position: absolute; top: -12px; right: -14px; background: #3fb36a; color: #fff; font-size: 11px; font-weight: 600; padding: 2px 7px; border-radius: 999px; white-space: nowrap; }
    .node .nm { position: absolute; top: 104px; left: 50%; transform: translateX(-50%); width: 170px; text-align: center; font-size: 13px; line-height: 1.35; }
    .node .nm b { display: block; font-weight: 600; } .node .nm span { color: #7a7a88; font-size: 12px; }
    .ex { position: absolute; right: 20px; bottom: 28px; width: 300px; background: #fff; border: 1px solid #e3e3ea; border-radius: 10px; padding: 14px 16px; font-size: 12.5px; }
    .ex h4 { font-size: 13px; margin-bottom: 8px; } .ex .row { display: grid; grid-template-columns: 70px 54px 1fr 40px; gap: 6px; padding: 6px 0; border-top: 1px solid #f0f0f4; }
    .ex .st { font-weight: 600; } .ex .st.good { color: #2f8a4e; } .ex .st.bad { color: #c4312f; }
    .exec { position: absolute; left: 50%; bottom: 28px; transform: translateX(-50%); background: #ff6d5a; color: #fff; font-weight: 600; padding: 12px 22px; border-radius: 8px; font-size: 14px; box-shadow: 0 4px 14px rgba(255,109,90,.35); }
    .toast { position: absolute; left: 20px; top: 20px; background: #fff; border-left: 4px solid #3fb36a; padding: 12px 16px; border-radius: 8px; font-size: 13px; box-shadow: 0 6px 20px rgba(0,0,0,.12); }
    `,
  );
}

/** Slack channel view. `messages`: [{ app, time, text, color, title, fields: [[k, v]], button }]. */
export function slack({ workspace, channel, channels, messages }) {
  return page(
    `<div class="sl">
      <aside><div class="ws">${esc(workspace)}</div>${channels
        .map((c) => `<div class="ch ${c === channel ? "on" : ""}"># ${esc(c)}</div>`)
        .join("")}</aside>
      <main><header><b># ${esc(channel)}</b><span class="muted">Orders that need a person · posted by Order Bot</span></header>
        <div class="msgs">${messages
          .map(
            (m) => `<div class="msg"><span class="av">OB</span><div class="body">
              <div class="who"><b>${esc(m.app)}</b><span class="app">APP</span><span class="muted">${esc(m.time)}</span></div>
              <div class="text">${m.text}</div>
              <div class="att" style="border-color:${m.color}"><b>${m.title}</b>
                <div class="fields">${m.fields.map(([k, v]) => `<div><span class="muted">${esc(k)}</span><div>${v}</div></div>`).join("")}</div>
                ${m.button ? `<span class="btn">${esc(m.button)}</span>` : ""}</div></div></div>`,
          )
          .join("")}</div>
        <div class="composer">Message #${esc(channel)}</div></main>
    </div>`,
    `
    .sl { height: 100%; display: flex; font-family: Lato, "Segoe UI", Arial, sans-serif; }
    aside { width: 260px; background: #3f0e40; color: #cfc3cf; padding: 14px 0; font-size: 15px; }
    .ws { color: #fff; font-weight: 800; font-size: 18px; padding: 4px 18px 16px; border-bottom: 1px solid #5d2c5d; margin-bottom: 10px; }
    .ch { padding: 6px 18px; } .ch.on { background: #1164a3; color: #fff; font-weight: 700; }
    main { flex: 1; display: flex; flex-direction: column; background: #fff; }
    main header { height: 60px; border-bottom: 1px solid #e8e8e8; display: flex; align-items: center; gap: 14px; padding: 0 22px; font-size: 17px; }
    main header .muted { font-size: 13px; }
    .msgs { flex: 1; padding: 18px 22px; display: flex; flex-direction: column; gap: 22px; overflow: hidden; }
    .msg { display: flex; gap: 12px; } .av { width: 40px; height: 40px; border-radius: 6px; background: #ff6d5a; color: #fff; font-weight: 800; display: grid; place-items: center; font-size: 14px; flex: none; }
    .who { display: flex; gap: 8px; align-items: center; font-size: 15px; } .app { font-size: 10px; background: #e8e8e8; color: #555; padding: 1px 4px; border-radius: 3px; font-weight: 700; }
    .text { font-size: 15px; margin-top: 4px; line-height: 1.5; }
    .att { margin-top: 8px; border-left: 4px solid; padding: 6px 0 6px 14px; font-size: 14.5px; max-width: 760px; }
    .fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 26px; margin-top: 10px; }
    .fields .muted { font-size: 13px; font-weight: 700; color: #616061; }
    .att .btn { display: inline-block; margin-top: 12px; border: 1px solid #ccc; border-radius: 6px; padding: 6px 14px; font-weight: 700; font-size: 14px; }
    .composer { margin: 0 22px 20px; border: 1px solid #ccc; border-radius: 8px; padding: 14px; color: #888; }
    `,
  );
}

/** Apps Script editor with a code file and the execution log. `code` is pre-highlighted HTML. */
export function appsScript({ project, files, active = 0, code, log }) {
  const lines = code.split("\n");
  return page(
    `<div class="as">
      <header><span class="logo"></span><b>Apps Script</b><span class="proj">${esc(project)}</span><span class="right"><span class="run">▶ Run</span><span class="muted">tagNewReviews ▾</span><span class="dep">Deploy</span></span></header>
      <div class="body">
        <aside><div class="h">Files</div>${files.map((f, i) => `<div class="f ${i === active ? "on" : ""}">${esc(f)}</div>`).join("")}
          <div class="h" style="margin-top:22px">Triggers</div><div class="f">⏰ tagNewReviews · daily 2am</div></aside>
        <section class="ed"><div class="code mono">${lines.map((l, i) => `<div class="ln"><i>${i + 1}</i><span>${l || " "}</span></div>`).join("")}</div>
          <div class="log"><div class="lh"><b>Execution log</b><span class="muted">tagNewReviews</span></div>
            <div class="mono">${log.map(([t, lvl, msg]) => `<div class="lr"><span class="muted">${t}</span><span class="lv ${lvl.toLowerCase()}">${lvl}</span><span>${msg}</span></div>`).join("")}</div></div></section>
      </div>
    </div>`,
    `
    .as { height: 100%; display: flex; flex-direction: column; font-family: "Google Sans", Roboto, Arial, sans-serif; background: #fff; }
    .as header { height: 56px; border-bottom: 1px solid #e0e0e0; display: flex; align-items: center; gap: 12px; padding: 0 18px; font-size: 15px; }
    .as .logo { width: 26px; height: 26px; border-radius: 6px; background: conic-gradient(#4285f4 0 25%, #34a853 0 50%, #fbbc04 0 75%, #ea4335 0); }
    .proj { margin-left: 18px; color: #3c4043; } .right { margin-left: auto; display: flex; gap: 16px; align-items: center; font-size: 13px; }
    .run { color: #1a73e8; font-weight: 600; } .dep { background: #1a73e8; color: #fff; padding: 8px 16px; border-radius: 4px; font-weight: 500; }
    .body { flex: 1; display: flex; min-height: 0; }
    .as aside { width: 250px; border-right: 1px solid #e0e0e0; padding: 16px 12px; font-size: 13.5px; }
    .as aside .h { font-size: 12px; color: #5f6368; text-transform: uppercase; letter-spacing: .06em; margin-bottom: 8px; padding: 0 8px; }
    .as aside .f { padding: 7px 10px; border-radius: 4px; color: #3c4043; } .as aside .f.on { background: #e8f0fe; color: #1967d2; font-weight: 600; }
    .ed { flex: 1; display: flex; flex-direction: column; min-width: 0; }
    .code { flex: 1; padding: 12px 0; font-size: 13.5px; line-height: 1.62; color: #202124; overflow: hidden; }
    .ln { display: flex; white-space: pre; } .ln i { width: 54px; text-align: right; padding-right: 16px; color: #9aa0a6; font-style: normal; flex: none; }
    .k { color: #a626a4; } .s { color: #188038; } .c { color: #80868b; font-style: italic; } .fn { color: #1a73e8; } .n { color: #b55c00; }
    .log { height: 250px; border-top: 1px solid #e0e0e0; background: #fafafa; font-size: 13px; }
    .lh { display: flex; gap: 12px; padding: 10px 18px; border-bottom: 1px solid #eee; } .lr { display: grid; grid-template-columns: 110px 70px 1fr; padding: 4px 18px; }
    .lv.notice { color: #5f6368; } .lv.info { color: #1a73e8; } .lv.warning { color: #b26a00; }
    `,
  );
}
