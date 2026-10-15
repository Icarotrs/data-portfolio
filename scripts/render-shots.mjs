#!/usr/bin/env node
/**
 * Renders the project screenshots defined in scripts/shots/projects.mjs to
 * public/projects/<slug>/<file>.webp (1600×1000), plus Portuguese and
 * Spanish versions (<file>.pt.webp, <file>.es.webp) translated with
 * scripts/shots/i18n.mjs.
 *
 *   npm run shots
 *
 * Needs a Chromium binary: set CHROME_PATH, or have Playwright browsers
 * installed (PLAYWRIGHT_BROWSERS_PATH), or a local Chrome.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import { shots, W, H } from "./shots/projects.mjs";
import { translateDocument, pageArgs } from "./shots/i18n.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const only = process.argv.find((a) => a.startsWith("--only="))?.slice(7);

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

const executablePath = findChrome();
if (!executablePath) {
  console.error("No Chromium found. Set CHROME_PATH to a Chrome/Chromium binary.");
  process.exit(1);
}

const browser = await chromium.launch({ executablePath });
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
try {
  for (const [slug, list] of Object.entries(shots)) {
    if (only && slug !== only) continue;
    for (const shot of list) for (const lang of ["en", "pt", "es"]) {
      await page.setContent(shot.html, { waitUntil: "load" });
      if (lang !== "en") await page.evaluate(translateDocument, pageArgs(lang));
      await page.evaluate(() => document.fonts.ready);
      const png = await page.screenshot({ type: "png" });
      // Encode WebP in the browser (Chromium supports it natively).
      const dataUrl = await page.evaluate(async (b64) => {
        const img = new Image();
        img.src = `data:image/png;base64,${b64}`;
        await img.decode();
        const c = document.createElement("canvas");
        c.width = img.width;
        c.height = img.height;
        c.getContext("2d").drawImage(img, 0, 0);
        return c.toDataURL("image/webp", 0.86);
      }, png.toString("base64"));
      const out = path.join(ROOT, "public", "projects", slug, `${shot.file}${lang === "en" ? "" : `.${lang}`}.webp`);
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, Buffer.from(dataUrl.split(",")[1], "base64"));
      console.log("  ✓", path.relative(ROOT, out));
    }
  }
} finally {
  await browser.close();
}
