"use client";

import { useEffect, useRef } from "react";

/**
 * The page background: the blurred orange band plus soft blobs that drift
 * and merge slowly, like a lava lamp, under a frosted-glass texture.
 *
 * Built for smooth scrolling. The lava is drawn into a tiny canvas (about
 * 240px wide) and stretched to fill the screen: the stretch blurs it for
 * free, each frame costs a few small gradient fills, and the page has a
 * single background layer to composite. It updates at ~20 fps, pauses while
 * the page scrolls and when the tab is hidden, and stays still for reduced
 * motion. Before the script
 * runs, the static band image (CSS) shows instead.
 */

const W = 240; // canvas width in pixels; height follows the window's aspect ratio

type Blob = {
  color: string; // CSS variable holding the colour
  r: number; // radius, as a share of the canvas width
  sx: number; // ellipse stretch
  cx: number; // centre of the path, as shares of width / height
  cy: number;
  ax: number; // path amplitude
  ay: number;
  fx: number; // path speed (radians per second)
  fy: number;
  p: number; // phase
};

const BLOBS: Blob[] = [
  { color: "--lava-1", r: 0.42, sx: 1.5, cx: 0.25, cy: 0.72, ax: 0.22, ay: 0.16, fx: 0.119, fy: 0.085, p: 0 },
  { color: "--lava-2", r: 0.38, sx: 1.3, cx: 0.78, cy: 0.18, ax: 0.18, ay: 0.2, fx: 0.085, fy: 0.136, p: 2 },
  { color: "--lava-3", r: 0.3, sx: 1.2, cx: 0.55, cy: 0.5, ax: 0.3, ay: 0.25, fx: 0.153, fy: 0.102, p: 4 },
  { color: "--lava-4", r: 0.36, sx: 1.4, cx: 0.3, cy: 0.2, ax: 0.25, ay: 0.22, fx: 0.068, fy: 0.119, p: 1 },
];

/**
 * The same colour at alpha 0, whatever syntax the CSS uses (the build may
 * minify rgb() to #rrggbbaa). The canvas normalises it to #rrggbb or rgba().
 */
function clear(ctx: CanvasRenderingContext2D, color: string) {
  ctx.fillStyle = color;
  const c = String(ctx.fillStyle);
  if (c.startsWith("#")) {
    const n = parseInt(c.slice(1, 7), 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, 0)`;
  }
  return c.replace(/,\s*[\d.]+\s*\)$/, ", 0)");
}

export function LavaBackground() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d", { alpha: false });
    if (!canvas || !ctx) return;

    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let colors: Record<string, string> = {};
    let band: HTMLCanvasElement | null = null;
    let raf = 0;
    let last = 0;
    let lastScroll = 0;

    // Theme colours and the band image, pre-shrunk to the canvas size once.
    const loadTheme = () => {
      const css = getComputedStyle(document.documentElement);
      colors = Object.fromEntries(["--bg", ...BLOBS.map((b) => b.color)].map((v) => [v, css.getPropertyValue(v).trim()]));
      const src = css.getPropertyValue("--bg-image").trim().replace(/^url\(["']?|["']?\)$/g, "");
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = canvas.width;
        c.height = canvas.height;
        c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height);
        band = c;
        draw(performance.now());
        canvas.classList.add("ready");
      };
      img.src = src;
    };

    const resize = () => {
      canvas.width = W;
      canvas.height = Math.max(90, Math.round((W * innerHeight) / innerWidth));
      loadTheme();
    };

    const draw = (now: number) => {
      const t = now / 1000;
      const w = canvas.width;
      const h = canvas.height;
      ctx.globalAlpha = 1;
      ctx.fillStyle = colors["--bg"] || "#000";
      ctx.fillRect(0, 0, w, h);
      if (band) {
        // The band sways slowly.
        ctx.save();
        ctx.translate(w / 2, h / 2);
        // Drawn larger than the canvas so its corners never show as it turns.
        ctx.rotate(Math.sin(t * 0.05) * 0.05);
        const s = 1.4 + Math.sin(t * 0.04) * 0.05;
        ctx.scale(s, s);
        ctx.drawImage(band, -w / 2 + Math.sin(t * 0.06) * w * 0.03, -h / 2 + Math.cos(t * 0.05) * h * 0.03, w, h);
        ctx.restore();
      }
      for (const b of BLOBS) {
        const x = (b.cx + b.ax * Math.sin(t * b.fx + b.p)) * w;
        const y = (b.cy + b.ay * Math.sin(t * b.fy + b.p * 1.7)) * h;
        const r = b.r * w * (1 + 0.15 * Math.sin(t * 0.18 + b.p));
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Math.sin(t * 0.05 + b.p) * 0.6);
        ctx.scale(b.sx, 1);
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
        g.addColorStop(0, colors[b.color]);
        g.addColorStop(1, clear(ctx, colors[b.color])); // same colour at alpha 0: no dark fringe
        ctx.fillStyle = g;
        ctx.fillRect(-r, -r, r * 2, r * 2);
        ctx.restore();
      }
    };

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      // ~20 fps is plenty for slow lava; skip frames while the page scrolls,
      // so scrolling has the whole frame budget (the lava is too slow for
      // the pause to show).
      if (now - last < 50 || now - lastScroll < 180) return;
      last = now;
      draw(now);
    };

    resize();
    if (!still) raf = requestAnimationFrame(loop);

    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden && !still) raf = requestAnimationFrame(loop);
    };
    let resizeTimer = 0;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 200);
    };
    const onScroll = () => {
      lastScroll = performance.now();
    };
    const themeObserver = new MutationObserver(loadTheme);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    document.addEventListener("visibilitychange", onVisibility);
    addEventListener("resize", onResize);
    addEventListener("scroll", onScroll, { passive: true });
    return () => {
      removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
      themeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div className="lava" aria-hidden="true">
      <canvas ref={ref} className="lava-canvas" />
      <i className="lava-glass" />
    </div>
  );
}
