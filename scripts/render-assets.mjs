#!/usr/bin/env node
/**
 * Renders image assets from the built site and exports Upwork texts.
 *
 *   npm run build && npm run assets
 *
 * Outputs
 *   exports/covers/<slug>.png      1600×1200 Upwork portfolio covers
 *   exports/upwork/<slug>.txt      title, description (≤600 chars), stack, result
 *   public/og/<slug|home>.png      1200×630 Open Graph images
 *   public/fallback/bg-<theme>.webp  background shown when WebGL2 is unavailable
 *
 * Options
 *   --theme=dark|light   theme for covers and OG images (default: dark)
 *   --only=covers,og,fallback,upwork
 *
 * Needs a Chromium binary: set CHROME_PATH, or have Playwright browsers
 * installed (PLAYWRIGHT_BROWSERS_PATH), or a local Chrome.
 */
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { chromium } from "playwright-core";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const OUT = path.join(ROOT, "out");
const PROJECTS = path.join(ROOT, "content", "projects");
const UPWORK_MAX = 600;

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? "true"];
  }),
);
const theme = args.theme === "light" ? "light" : "dark";
const only = new Set((args.only ?? "covers,og,fallback,upwork").split(","));

// ── Content ────────────────────────────────────────────────────
const projects = fs
  .readdirSync(PROJECTS, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => ({ slug: d.name, ...JSON.parse(fs.readFileSync(path.join(PROJECTS, d.name, "project.json"), "utf8")) }))
  .sort((a, b) => a.order - b.order);

function writeFile(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, data);
  console.log("  ✓", path.relative(ROOT, file));
}

// ── Upwork texts (no browser needed) ───────────────────────────
if (only.has("upwork")) {
  console.log("Upwork texts");
  for (const p of projects) {
    if (p.upworkBlurb.length > UPWORK_MAX) {
      throw new Error(`${p.slug}: upworkBlurb is ${p.upworkBlurb.length} chars (max ${UPWORK_MAX})`);
    }
    const text = [
      `TITLE`,
      p.title,
      ``,
      `DESCRIPTION (${p.upworkBlurb.length}/${UPWORK_MAX} characters)`,
      p.upworkBlurb,
      ``,
      `SKILLS`,
      p.stack.join(", "),
      ``,
      `RESULT`,
      p.result,
      ``,
      `COVER`,
      `exports/covers/${p.slug}.png`,
      ``,
    ].join("\n");
    writeFile(path.join(ROOT, "exports", "upwork", `${p.slug}.txt`), text);
  }
}

const needsBrowser = ["covers", "og", "fallback"].some((k) => only.has(k));
if (!needsBrowser) process.exit(0);

if (!fs.existsSync(path.join(OUT, "index.html"))) {
  console.error("No build found in out/. Run `npm run build` first.");
  process.exit(1);
}

// ── Static server for out/ ─────────────────────────────────────
const types = {
  ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json",
  ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml", ".woff2": "font/woff2",
  ".txt": "text/plain", ".ico": "image/x-icon", ".xml": "application/xml",
};
const server = http.createServer((req, res) => {
  let file = path.join(OUT, decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
  if (!file.startsWith(OUT) || !fs.existsSync(file)) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { "content-type": types[path.extname(file)] ?? "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;

// ── Browser ────────────────────────────────────────────────────
function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    (() => {
      try {
        return chromium.executablePath();
      } catch {
        return undefined;
      }
    })(),
  ];
  const pwDir = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (pwDir && fs.existsSync(pwDir)) {
    for (const d of fs.readdirSync(pwDir).filter((d) => /^chromium-\d+$/.test(d)).sort().reverse()) {
      candidates.push(path.join(pwDir, d, "chrome-linux", "chrome"), path.join(pwDir, d, "chrome-linux64", "chrome"));
    }
  }
  candidates.push(
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  );
  return candidates.find((c) => c && fs.existsSync(c));
}

const executablePath = findChrome();
if (!executablePath) {
  console.error("No Chromium found. Set CHROME_PATH to a Chrome/Chromium binary.");
  process.exit(1);
}

const browser = await chromium.launch({
  executablePath,
  // Software WebGL so rendering works on machines without a GPU.
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});

async function render(route, { width, height, theme: t = theme }) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.addInitScript((value) => localStorage.setItem("theme", value), t);
  page.on("pageerror", (e) => console.error("  page error:", e.message));
  await page.goto(base + route, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(
    () => document.documentElement.dataset.bgReady === "1" || document.documentElement.dataset.webgl === "off",
    null,
    { timeout: 60_000 },
  );
  if ((await page.evaluate(() => document.documentElement.dataset.webgl)) === "off") {
    throw new Error("WebGL2 is not available in this browser; cannot render assets.");
  }
  const png = await page.screenshot({ type: "png" });
  return { page, png };
}

async function toWebp(page, png, quality = 0.82) {
  const dataUrl = await page.evaluate(
    async ({ b64, quality }) => {
      const img = new Image();
      img.src = `data:image/png;base64,${b64}`;
      await img.decode();
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      c.getContext("2d").drawImage(img, 0, 0);
      return c.toDataURL("image/webp", quality);
    },
    { b64: png.toString("base64"), quality },
  );
  return Buffer.from(dataUrl.split(",")[1], "base64");
}

try {
  if (only.has("fallback")) {
    console.log("Fallback backgrounds");
    for (const t of ["light", "dark"]) {
      const { page, png } = await render("/render/background/", { width: 1600, height: 1000, theme: t });
      writeFile(path.join(ROOT, "public", "fallback", `bg-${t}.webp`), await toWebp(page, png));
      await page.close();
    }
  }

  if (only.has("og")) {
    console.log(`Open Graph images (${theme})`);
    for (const slug of ["home", ...projects.map((p) => p.slug)]) {
      const { page, png } = await render(`/render/og/${slug}/`, { width: 1200, height: 630 });
      writeFile(path.join(ROOT, "public", "og", `${slug}.png`), png);
      await page.close();
    }
  }

  if (only.has("covers")) {
    console.log(`Upwork covers (${theme})`);
    for (const p of projects) {
      const { page, png } = await render(`/render/cover/${p.slug}/`, { width: 1600, height: 1200 });
      writeFile(path.join(ROOT, "exports", "covers", `${p.slug}.png`), png);
      await page.close();
    }
  }
} finally {
  await browser.close();
  server.close();
}
