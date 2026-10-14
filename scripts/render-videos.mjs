#!/usr/bin/env node
/**
 * Renders the project demo videos defined in scripts/shots/videos.mjs to
 * public/projects/<slug>/demo.mp4 (1280×800, H.264, no audio) and demo.webm (VP9).
 *
 *   npm run videos
 *   npm run videos -- --only=form-to-sheet-automation
 *
 * The scenes are stacked iframes in one host page with a fake cursor and a
 * caption bar on top. Frames are captured with the Chrome DevTools screencast
 * and encoded with ffmpeg (must be on PATH). Needs a Chromium binary: set
 * CHROME_PATH, or have Playwright browsers installed, or a local Chrome.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { chromium } from "playwright-core";
import { videos } from "./shots/videos.mjs";
import { W, H } from "./shots/kit.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const only = process.argv.find((a) => a.startsWith("--only="))?.slice(7);
const OUT_W = 1280;
const OUT_H = 800;

function findChrome() {
  const candidates = [process.env.CHROME_PATH];
  try {
    candidates.push(chromium.executablePath());
  } catch {}
  const pw = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (pw && fs.existsSync(pw)) {
    for (const d of fs.readdirSync(pw).filter((d) => /^chromium-\d+$/.test(d)).sort().reverse()) {
      candidates.push(path.join(pw, d, "chrome-linux", "chrome"), path.join(pw, d, "chrome-linux64", "chrome"));
    }
  }
  candidates.push("/usr/bin/google-chrome", "/usr/bin/chromium", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe");
  return candidates.find((c) => c && fs.existsSync(c));
}

// ── Host page: scenes, cursor, tooltip, caption ────────────────
const HOST = `<!doctype html><html><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; margin: 0; }
  html, body { width: ${W}px; height: ${H}px; overflow: hidden; background: #111; font-family: Inter, "Segoe UI", Roboto, Arial, sans-serif; }
  iframe { position: absolute; inset: 0; width: ${W}px; height: ${H}px; border: 0; opacity: 0; transition: opacity 600ms ease; background: #fff; }
  #cursor { position: absolute; left: 0; top: 0; z-index: 10; width: 30px; height: 30px; transform: translate(1320px, 820px); will-change: transform; }
  #cursor svg { filter: drop-shadow(0 2px 3px rgba(0,0,0,.35)); transition: transform 120ms ease; }
  #cursor.down svg { transform: scale(.82); }
  .ring { position: absolute; z-index: 9; width: 44px; height: 44px; margin: -22px 0 0 -22px; border-radius: 50%; border: 3px solid #eb6834; animation: ring 520ms ease-out forwards; }
  @keyframes ring { from { transform: scale(.3); opacity: 1; } to { transform: scale(1.4); opacity: 0; } }
  #tip { position: absolute; z-index: 11; background: #1f1f1f; color: #fff; font-size: 15px; padding: 9px 13px; border-radius: 7px; box-shadow: 0 8px 20px rgba(0,0,0,.3); opacity: 0; transition: opacity 200ms; white-space: nowrap; }
  #caption { position: absolute; z-index: 12; left: 50%; bottom: 60px; transform: translateX(-50%); max-width: 1200px; background: rgba(17,17,17,.9); color: #fff; font-size: 24px; font-weight: 500; letter-spacing: -.01em; padding: 14px 26px; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,.3); opacity: 0; transition: opacity 300ms; white-space: nowrap; }
  #caption::before { content: ""; display: inline-block; width: 10px; height: 10px; border-radius: 2px; background: #eb6834; margin-right: 14px; vertical-align: 3px; }
</style></head><body>
  <div id="cursor"><svg width="30" height="30" viewBox="0 0 24 24"><path d="M4 2.5v17.2l4.6-4.4 2.9 6.6 3-1.3-2.9-6.5h6.4Z" fill="#111" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg></div>
  <div id="tip"></div><div id="caption"></div>
<script>
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  let frames = [], active = 0, cx = 1320, cy = 820;
  const doc = () => frames[active].contentDocument;
  const $$ = (sel) => [...doc().querySelectorAll(sel)];
  const cursor = document.getElementById("cursor");
  const tip = document.getElementById("tip");
  const caption = document.getElementById("caption");

  window.__load = async (htmls) => {
    frames = await Promise.all(htmls.map((h, i) => new Promise((resolve) => {
      const f = document.createElement("iframe");
      f.style.zIndex = i;
      f.onload = () => resolve(f);
      f.srcdoc = h;
      document.body.prepend(f);
    })));
  };
  window.__prep = (i, steps) => { const prev = active; active = i; for (const [fn, sel, opts] of steps) F[fn](sel, opts || {}); active = prev; };
  window.__scene = (i) => { frames.forEach((f, j) => { f.style.opacity = j === i ? 1 : 0; f.style.zIndex = j === i ? 5 : 1; }); active = i; };
  window.__rect = (sel) => { const e = $$(sel)[0]; if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; };
  window.__move = (x, y, ms) => {
    cx = x; cy = y;
    cursor.style.transition = "transform " + ms + "ms cubic-bezier(.45,.05,.25,1)";
    cursor.style.transform = "translate(" + (x - 5) + "px," + (y - 3) + "px)";
    tip.style.left = x + 22 + "px"; tip.style.top = y + 26 + "px";
  };
  window.__click = async () => {
    cursor.classList.add("down");
    const r = document.createElement("div"); r.className = "ring"; r.style.left = cx + "px"; r.style.top = cy + "px";
    document.body.append(r); setTimeout(() => r.remove(), 600);
    await sleep(160); cursor.classList.remove("down");
  };
  window.__tip = (text) => { if (text) tip.textContent = text; tip.style.opacity = text ? 1 : 0; };
  window.__caption = (text) => {
    caption.style.opacity = 0;
    setTimeout(() => { if (text) { caption.textContent = text; caption.style.opacity = 1; } }, text && caption.textContent ? 250 : 0);
  };
  window.__f = (fn, sel, opts) => F[fn](sel, opts || {});

  const ease = (p) => 1 - Math.pow(1 - p, 3);
  const NUM = /\\d[\\d,]*(\\.\\d+)?/;
  const F = {
    hide(sel, { x = 0, y = 12 }) { for (const e of $$(sel)) { e.style.transition = "none"; e.style.opacity = 0; e.style.transform = "translate(" + x + "px," + y + "px)"; } },
    async reveal(sel, { stagger = 60, dur = 450 }) {
      const els = $$(sel);
      els.forEach((e, i) => setTimeout(() => {
        e.style.transition = "opacity " + dur + "ms ease, transform " + dur + "ms cubic-bezier(.2,.7,.2,1)";
        e.style.opacity = 1; e.style.transform = "none";
      }, i * stagger));
      await sleep((els.length - 1) * stagger + dur);
    },
    setText(sel, { text }) { for (const e of $$(sel)) e.textContent = text; },
    addClass(sel, { cls }) { for (const e of $$(sel)) e.classList.add(cls); },
    removeClass(sel, { cls }) { for (const e of $$(sel)) e.classList.remove(cls); },
    async type(sel, { text, cps = 16 }) {
      const e = $$(sel)[0]; e.textContent = "";
      for (const ch of text) { e.textContent += ch; await sleep(1000 / cps); }
    },
    growPrep(sel, { rightFill }) {
      for (const e of $$(sel)) {
        const fill = e.getAttribute("fill");
        if (e.tagName === "path" && fill === "none") {
          const L = e.getTotalLength(); e.style.strokeDasharray = L; e.style.strokeDashoffset = L; e.dataset.line = 1; continue;
        }
        const vertical = e.tagName === "path";
        e.style.transformBox = "fill-box";
        e.style.transformOrigin = vertical ? "50% 100%" : rightFill && fill === rightFill ? "100% 50%" : "0 50%";
        e.style.transform = vertical ? "scaleY(0)" : "scaleX(0)";
        e.dataset.grow = 1;
      }
    },
    async grow(sel, { stagger = 35, dur = 700 }) {
      const els = $$(sel).filter((e) => e.dataset.grow || e.dataset.line);
      let longest = 0;
      els.forEach((e, i) => setTimeout(() => {
        if (e.dataset.line) { e.style.transition = "stroke-dashoffset " + dur * 2.5 + "ms ease-in-out"; e.style.strokeDashoffset = 0; }
        else { e.style.transition = "transform " + dur + "ms cubic-bezier(.2,.7,.2,1)"; e.style.transform = "none"; }
      }, i * stagger));
      if (els.some((e) => e.dataset.line)) longest = dur * 2.5; else longest = dur;
      await sleep((els.length - 1) * stagger + longest);
    },
    countPrep(sel) {
      for (const e of $$(sel)) {
        const m = e.textContent.match(NUM); if (!m) continue;
        e.dataset.full = e.textContent;
        e.textContent = e.textContent.replace(m[0], "0");
      }
    },
    async countUp(sel, { dur = 1200 }) {
      const els = $$(sel).filter((e) => e.dataset.full);
      const start = performance.now();
      await new Promise((done) => {
        const tick = (now) => {
          const p = Math.min(1, (now - start) / dur);
          for (const e of els) {
            const full = e.dataset.full, m = full.match(NUM);
            const target = parseFloat(m[0].replace(/,/g, "")), dec = m[1] ? m[1].length - 1 : 0;
            let s = (target * ease(p)).toFixed(dec);
            if (m[0].includes(",")) s = Number(s).toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
            e.textContent = p === 1 ? full : full.replace(m[0], s);
          }
          p < 1 ? requestAnimationFrame(tick) : done();
        };
        requestAnimationFrame(tick);
      });
    },
    clear(sel) { for (const e of $$(sel)) { e.dataset.html = e.innerHTML; e.innerHTML = ""; } },
    async fillRows(sel, { from, to, stagger = 420 }) {
      let wait = stagger;
      for (const row of $$(sel)) {
        const cells = [...row.querySelectorAll("td")].slice(from - 1, to).filter((c) => c.dataset.html);
        if (!cells.length) continue;
        for (const c of cells) {
          c.innerHTML = c.dataset.html;
          c.animate([{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], { duration: 260, easing: "ease-out" });
          await sleep(Math.max(40, wait / 4));
        }
        wait = Math.max(120, wait * 0.8);
        await sleep(wait);
      }
    },
    termPrep(sel) {
      const pre = $$(sel)[0];
      pre.innerHTML = pre.innerHTML.split("\\n").map((l) => '<span class="ln" style="display:none">' + l + "\\n</span>").join("");
    },
    async term(sel) {
      for (const ln of $$(sel + " .ln")) {
        const htmlLine = ln.innerHTML;
        ln.style.display = "inline";
        if (ln.textContent.startsWith("$ ")) {
          const text = ln.textContent.replace(/\\n$/, "");
          ln.textContent = "$ ";
          for (const ch of text.slice(2)) { ln.textContent += ch; await sleep(28); }
          await sleep(350);
          ln.innerHTML = htmlLine;
          continue;
        }
        await sleep(ln.textContent.trim() === "" ? 60 : ln.textContent.includes("▸") ? 420 : 150);
      }
    },
  };
</script></body></html>`;

// ── Recorder ───────────────────────────────────────────────────
const executablePath = findChrome();
if (!executablePath) {
  console.error("No Chromium found. Set CHROME_PATH to a Chrome/Chromium binary.");
  process.exit(1);
}

const browser = await chromium.launch({ executablePath });
try {
  for (const [slug, video] of Object.entries(videos)) {
    if (only && slug !== only) continue;
    const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
    page.on("pageerror", (e) => console.error("  page error:", e.message));
    await page.setContent(HOST);
    await page.evaluate((htmls) => window.__load(htmls), video.scenes.map((s) => s.html));
    for (const [i, s] of video.scenes.entries()) await page.evaluate(([i, steps]) => window.__prep(i, steps), [i, s.prep]);

    const v = {
      wait: (ms) => page.waitForTimeout(ms),
      async scene(i) {
        await page.evaluate((i) => window.__scene(i), i);
        await page.waitForTimeout(700);
      },
      caption: (text) => page.evaluate((t) => window.__caption(t), text),
      tip: (text) => page.evaluate((t) => window.__tip(t), text),
      async move(sel, { fx = 0.5, fy = 0.5, ms = 850 } = {}) {
        const r = await page.evaluate((s) => window.__rect(s), sel);
        if (!r) throw new Error(`${slug}: nothing matches "${sel}"`);
        await page.evaluate(([x, y, ms]) => window.__move(x, y, ms), [r.x + r.w * fx, r.y + r.h * fy, ms]);
        await page.waitForTimeout(ms + 150);
      },
      async click() {
        await page.evaluate(() => window.__click());
        await page.waitForTimeout(250);
      },
      type: (sel, text) => page.evaluate(([s, t]) => window.__f("type", s, { text: t }), [sel, text]),
      f: (fn, sel, opts) => page.evaluate(([fn, s, o]) => window.__f(fn, s, o), [fn, sel, opts ?? {}]),
    };

    // Capture every painted frame with its timestamp.
    const frames = [];
    const cdp = await page.context().newCDPSession(page);
    cdp.on("Page.screencastFrame", async (f) => {
      frames.push({ data: f.data, t: f.metadata.timestamp });
      await cdp.send("Page.screencastFrameAck", { sessionId: f.sessionId }).catch(() => {});
    });
    await cdp.send("Page.startScreencast", { format: "jpeg", quality: 90, maxWidth: W, maxHeight: H, everyNthFrame: 1 });
    await page.waitForTimeout(400);
    const t0 = Date.now();
    await video.play(v);
    await page.evaluate(() => window.__caption(null));
    await page.waitForTimeout(900);
    await cdp.send("Page.stopScreencast");
    if (process.env.DEBUG_FRAMES) console.log("  frame span", (frames.at(-1).t - frames[0].t).toFixed(2), "s");
    await page.close();

    // Frames → ffconcat list with real durations → H.264.
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), `video-${slug}-`));
    const list = ["ffconcat version 1.0"];
    frames.forEach((fr, i) => {
      const file = `f${String(i).padStart(5, "0")}.jpg`;
      fs.writeFileSync(path.join(tmp, file), Buffer.from(fr.data, "base64"));
      const next = frames[i + 1]?.t ?? fr.t + 0.5;
      list.push(`file ${file}`, `duration ${Math.max(0.001, next - fr.t).toFixed(4)}`);
    });
    list.push(`file f${String(frames.length - 1).padStart(5, "0")}.jpg`);
    fs.writeFileSync(path.join(tmp, "list.txt"), list.join("\n"));

    const out = path.join(ROOT, "public", "projects", slug, "demo.mp4");
    fs.mkdirSync(path.dirname(out), { recursive: true });
    execFileSync("ffmpeg", [
      "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", path.join(tmp, "list.txt"),
      "-vf", `fps=30,scale=${OUT_W}:${OUT_H}:flags=lanczos,format=yuv420p`,
      "-c:v", "libx264", "-preset", "slow", "-crf", "23", "-movflags", "+faststart", "-an", out,
    ]);
    // WebM (VP9) too, for browsers without H.264 (e.g. some Linux builds).
    execFileSync("ffmpeg", [
      "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", path.join(tmp, "list.txt"),
      "-vf", `fps=30,scale=${OUT_W}:${OUT_H}:flags=lanczos,format=yuv420p`,
      "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "36", "-row-mt", "1", "-an", out.replace(/\.mp4$/, ".webm"),
    ]);
    fs.rmSync(tmp, { recursive: true, force: true });
    const secs = ((Date.now() - t0) / 1000).toFixed(1);
    console.log("  ✓", path.relative(ROOT, out), `${secs}s · ${frames.length} frames · ${(fs.statSync(out).size / 1e6).toFixed(1)} MB`);
  }
} finally {
  await browser.close();
}
