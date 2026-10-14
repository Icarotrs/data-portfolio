#!/usr/bin/env node
/**
 * Renders the blurred orange page background (dark and light versions) to
 * public/bg/<theme>.webp. A static image: no canvas or animation at runtime.
 *
 *   node scripts/render-bg.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const W = 1920;
const H = 1080;

// A wide band sweeping from the lower left to the upper right, plus a thinner
// warm highlight along its upper edge, heavily blurred.
const svg = ({ base, band, glow }) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <filter id="b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="95"/></filter>
    <filter id="b2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="60"/></filter>
    <linearGradient id="g" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0" stop-color="${band[0]}"/><stop offset=".45" stop-color="${band[1]}"/><stop offset="1" stop-color="${band[2]}"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="${base}"/>
  <path d="M-200 880 C 300 760, 620 640, 900 640 S 1400 420, 1560 180 S 1900 -80, 2100 -120" fill="none" stroke="url(#g)" stroke-width="330" stroke-linecap="round" filter="url(#b)"/>
  <path d="M-200 760 C 300 640, 640 560, 900 560 S 1360 330, 1500 110" fill="none" stroke="${glow}" stroke-width="120" stroke-linecap="round" opacity=".75" filter="url(#b2)"/>
</svg>`;

const themes = {
  dark: { base: "#120604", band: ["#b8501f", "#e2622a", "#c9682e"], glow: "#d98a3e" },
  light: { base: "#f4ece5", band: ["#f2b48c", "#f39a6a", "#f5be8e"], glow: "#f7cf9f" },
};

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined });
const page = await browser.newPage({ viewport: { width: W, height: H } });
try {
  for (const [name, t] of Object.entries(themes)) {
    await page.setContent(`<html><body style="margin:0">${svg(t)}</body></html>`);
    const png = await page.screenshot({ type: "png" });
    const dataUrl = await page.evaluate(async (b64) => {
      const img = new Image();
      img.src = `data:image/png;base64,${b64}`;
      await img.decode();
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      c.getContext("2d").drawImage(img, 0, 0);
      return c.toDataURL("image/webp", 0.8);
    }, png.toString("base64"));
    const out = path.join(ROOT, "public", "bg", `${name}.webp`);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, Buffer.from(dataUrl.split(",")[1], "base64"));
    console.log("  ✓", path.relative(ROOT, out), `${(fs.statSync(out).size / 1024).toFixed(0)} KB`);
  }
} finally {
  await browser.close();
}
