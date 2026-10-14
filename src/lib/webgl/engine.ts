import { site, type FilterType, type IconTheme } from "@site";
import { sceneStore } from "@/lib/scene-store";
import {
  ATLAS_COLUMNS,
  CARET_TILE,
  GLYPH_TILE_COUNT,
  GLYPH_TILE_START,
  ICON_TILE,
  createIconAtlas,
} from "@/lib/icons/atlas";
import {
  FILTER_IDS,
  FULLSCREEN_VERTEX,
  ICON_FRAGMENT,
  ICON_VERTEX,
  MAX_BOXES,
  POST_FRAGMENT,
  createGlyphStrip,
} from "./post";

/**
 * Background renderer, plain WebGL2 (no 3D library):
 *   1. Icons — instanced quads from one atlas, drawn into an offscreen
 *      texture (one draw call).
 *   2. Post — one full-screen fragment shader composites the icons over a
 *      background field and applies each filter box's effect.
 *
 * Icons travel clockwise around rounded-rectangle "rings" inside the
 * viewport. Scrolling pushes them along; entering a new page section makes
 * every icon "type" its way into a random icon of that section's theme.
 */

export interface EngineOptions {
  canvas: HTMLCanvasElement;
  /** Render a single settled frame at this time (asset rendering). */
  stillTime?: number;
  /** Called after the first frame is drawn. */
  onFirstFrame?: () => void;
}

export interface Engine {
  dispose(): void;
}

const MAX_DPR = 1.5;
const MAX_PIXELS = 2_400_000; // cap on drawing-buffer size for big screens
const IDLE_FPS = 30;
const TYPE_SECONDS = 0.6; // per-icon "typing" transition
const TYPE_STAGGER = 0.045; // delay between neighbouring icons
const FLOATS_PER_ICON = 8;

interface Ring {
  /** Inset from the viewport edges, as a fraction of width / height. */
  insetX: number;
  insetY: number;
  count: number;
  size: number;
  /** Loops per second when idle. */
  speed: number;
  alpha: number;
}

function ringsFor(width: number): Ring[] {
  if (width < 640) {
    return [{ insetX: 0.09, insetY: 0.1, count: 10, size: 26, speed: 1 / 110, alpha: 0.5 }];
  }
  return [
    { insetX: 0.085, insetY: 0.12, count: 16, size: 32, speed: 1 / 130, alpha: 0.62 },
    { insetX: 0.26, insetY: 0.3, count: 9, size: 26, speed: 1 / 95, alpha: 0.4 },
  ];
}

interface Icon {
  ring: number;
  slot: number;
  seed: number;
  tile: number;
  next: number;
  /** Transition start time; NaN when idle. */
  start: number;
  accent: number;
}

const hash = (a: number, b: number) => {
  const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return s - Math.floor(s);
};

/** Point at fraction s of a clockwise rounded-rectangle loop. */
function ringPoint(s: number, x0: number, y0: number, x1: number, y1: number, r: number): [number, number] {
  const a = x1 - x0 - 2 * r;
  const b = y1 - y0 - 2 * r;
  const arc = (Math.PI / 2) * r;
  const corner = (cx: number, cy: number, from: number, d: number): [number, number] => [
    cx + Math.cos(from + d / r) * r,
    cy + Math.sin(from + d / r) * r,
  ];
  const segments: [number, (d: number) => [number, number]][] = [
    [a, (d) => [x0 + r + d, y0]],
    [arc, (d) => corner(x1 - r, y0 + r, -Math.PI / 2, d)],
    [b, (d) => [x1, y0 + r + d]],
    [arc, (d) => corner(x1 - r, y1 - r, 0, d)],
    [a, (d) => [x1 - r - d, y1]],
    [arc, (d) => corner(x0 + r, y1 - r, Math.PI / 2, d)],
    [b, (d) => [x0, y1 - r - d]],
    [arc, (d) => corner(x0 + r, y0 + r, Math.PI, d)],
  ];
  let d = (((s % 1) + 1) % 1) * (2 * a + 2 * b + 4 * arc);
  for (const [len, at] of segments) {
    if (d <= len) return at(d);
    d -= len;
  }
  return [x0 + r, y0];
}

function cssColor(name: string, fallback: string): [number, number, number] {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const hex = /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number];
}

function compile(gl: WebGL2RenderingContext, vertex: string, fragment: string) {
  const program = gl.createProgram()!;
  for (const [type, source] of [
    [gl.VERTEX_SHADER, vertex],
    [gl.FRAGMENT_SHADER, fragment],
  ] as const) {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(shader) ?? "shader compile failed");
    }
    gl.attachShader(program, shader);
  }
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) ?? "program link failed");
  }
  const uniforms = new Proxy({} as Record<string, WebGLUniformLocation | null>, {
    get: (cache, name: string) => (name in cache ? cache[name] : (cache[name] = gl.getUniformLocation(program, name))),
  });
  return { program, uniforms };
}

function texture(gl: WebGL2RenderingContext, source: TexImageSource, mipmaps: boolean) {
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
  if (mipmaps) gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mipmaps ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return tex;
}

export function createEngine({ canvas, stillTime, onFirstFrame }: EngineOptions): Engine {
  const still = stillTime !== undefined;
  const gl = canvas.getContext("webgl2", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "high-performance",
    preserveDrawingBuffer: still,
  });
  if (!gl) throw new Error("WebGL2 unavailable");

  const reducedQuery = matchMedia("(prefers-reduced-motion: reduce)");
  let reduced = reducedQuery.matches;

  // ── GPU resources ──────────────────────────────────────────
  const iconProgram = compile(gl, ICON_VERTEX, ICON_FRAGMENT);
  const postProgram = compile(gl, FULLSCREEN_VERTEX, POST_FRAGMENT);

  const atlasCanvas = createIconAtlas();
  const atlas = texture(gl, atlasCanvas, true);
  const atlasGrid = [ATLAS_COLUMNS, atlasCanvas.height / (atlasCanvas.width / ATLAS_COLUMNS)];
  const glyphs = texture(gl, createGlyphStrip(), false);

  const sceneTex = gl.createTexture()!;
  const fbo = gl.createFramebuffer()!;

  const iconVao = gl.createVertexArray()!;
  gl.bindVertexArray(iconVao);
  const cornerBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cornerBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, 0.5]), gl.STATIC_DRAW);
  const aCorner = gl.getAttribLocation(iconProgram.program, "aCorner");
  gl.enableVertexAttribArray(aCorner);
  gl.vertexAttribPointer(aCorner, 2, gl.FLOAT, false, 0, 0);
  const instanceBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
  for (const [name, offset] of [
    ["aA", 0],
    ["aB", 16],
  ] as const) {
    const loc = gl.getAttribLocation(iconProgram.program, name);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 4, gl.FLOAT, false, FLOATS_PER_ICON * 4, offset);
    gl.vertexAttribDivisor(loc, 1);
  }
  const postVao = gl.createVertexArray()!;
  gl.bindVertexArray(null);

  // ── Icons ──────────────────────────────────────────────────
  let rings: Ring[] = [];
  let icons: Icon[] = [];
  let instanceData = new Float32Array(0);
  const ringProgress: number[] = [];
  let theme: IconTheme = sceneStore.getState().theme;

  function pickTiles(forTheme: IconTheme) {
    const names = [...site.iconThemes[forTheme]];
    for (let i = names.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [names[i], names[j]] = [names[j], names[i]];
    }
    return icons.map((_, i) => ICON_TILE[names[i % names.length]]);
  }

  function buildIcons(width: number) {
    const nextRings = ringsFor(width);
    if (nextRings.length === rings.length && nextRings[0].count === rings[0]?.count) return;
    rings = nextRings;
    icons = [];
    rings.forEach((ring, r) => {
      ringProgress[r] = ringProgress[r] ?? Math.random();
      for (let slot = 0; slot < ring.count; slot++) {
        const seed = hash(r, slot);
        icons.push({ ring: r, slot, seed, tile: CARET_TILE, next: CARET_TILE, start: NaN, accent: seed < 0.15 ? 1 : 0 });
      }
    });
    instanceData = new Float32Array(icons.length * FLOATS_PER_ICON);
    gl!.bindBuffer(gl!.ARRAY_BUFFER, instanceBuffer);
    gl!.bufferData(gl!.ARRAY_BUFFER, instanceData.byteLength, gl!.DYNAMIC_DRAW);
    switchTheme(theme, true);
  }

  /** Start the typing transition into a new random set of icons. */
  function switchTheme(next: IconTheme, initial = false) {
    theme = next;
    const tiles = pickTiles(next);
    const instant = reduced || still;
    icons.forEach((icon, i) => {
      icon.next = tiles[i];
      if (instant) {
        icon.tile = icon.next;
        icon.start = NaN;
      } else {
        // Ripple along each ring, like text being typed.
        icon.start = time + (initial ? 0.3 : 0) + icon.slot * TYPE_STAGGER + icon.ring * 0.12 + icon.seed * 0.05;
      }
    });
    boost = instant ? 0 : 1;
    wake(instant ? 0 : TYPE_SECONDS + 1.2);
  }

  // ── Theme colors (CSS custom properties) ───────────────────
  function applyColors() {
    const dark = document.documentElement.dataset.theme === "dark";
    const pick = (name: string, light: string, night: string) => cssColor(name, dark ? night : light);
    gl!.useProgram(postProgram.program);
    gl!.uniform3fv(postProgram.uniforms.uTop, pick("--bg-top", "#f2c7a6", "#1b0d08"));
    gl!.uniform3fv(postProgram.uniforms.uBottom, pick("--bg-bottom", "#d0703f", "#722c15"));
    gl!.uniform3fv(postProgram.uniforms.uGlow, pick("--bg-glow", "#f7d6bb", "#b9562c"));
    gl!.uniform3fv(postProgram.uniforms.uShade, pick("--bg-shade", "#3b1a10", "#050303"));
    const ink = pick("--ink", "#fff5ee", "#ffe8da");
    gl!.uniform3fv(postProgram.uniforms.uInk, ink);
    gl!.useProgram(iconProgram.program);
    gl!.uniform3fv(iconProgram.uniforms.uFg, ink);
    gl!.uniform3fv(iconProgram.uniforms.uAccent, pick("--ink-accent", "#3b1a10", "#ff9b66"));
    wake(0);
  }
  const themeObserver = new MutationObserver(applyColors);
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  // ── Filter boxes (DOM is the source of truth) ──────────────
  let boxElements: HTMLElement[] = [];
  const boxRects = new Float32Array(MAX_BOXES * 4);
  const boxTypes = new Float32Array(MAX_BOXES);
  let boxCount = 0;
  const boxObserver = new ResizeObserver(() => syncBoxes());

  function collectBoxes() {
    boxObserver.disconnect();
    boxElements = Array.from(document.querySelectorAll<HTMLElement>("[data-filter-box]"));
    boxElements.forEach((el) => boxObserver.observe(el));
  }

  function syncBoxes() {
    boxCount = 0;
    for (const el of boxElements) {
      if (boxCount >= MAX_BOXES) break;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue; // hidden at this breakpoint
      boxRects.set([r.left * scale, (height - r.bottom) * scale, r.right * scale, (height - r.top) * scale], boxCount * 4);
      boxTypes[boxCount] = FILTER_IDS[el.dataset.filter as FilterType] ?? 0;
      boxCount++;
    }
    wake(0);
  }

  // ── Size ───────────────────────────────────────────────────
  let width = 0;
  let height = 0;
  let scale = 1;
  function resize() {
    width = canvas.clientWidth || innerWidth;
    height = canvas.clientHeight || innerHeight;
    scale = Math.min(devicePixelRatio || 1, MAX_DPR, Math.sqrt(MAX_PIXELS / (width * height)));
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    scale = canvas.width / width;

    gl!.bindTexture(gl!.TEXTURE_2D, sceneTex);
    gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, canvas.width, canvas.height, 0, gl!.RGBA, gl!.UNSIGNED_BYTE, null);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.LINEAR_MIPMAP_LINEAR);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.LINEAR);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
    gl!.generateMipmap(gl!.TEXTURE_2D);
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, fbo);
    gl!.framebufferTexture2D(gl!.FRAMEBUFFER, gl!.COLOR_ATTACHMENT0, gl!.TEXTURE_2D, sceneTex, 0);
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, null);

    buildIcons(width);
    syncBoxes();
  }

  // ── Scroll drives the loop ─────────────────────────────────
  let lastScroll = scrollY;
  let scrollPush = 0; // px of scroll not yet applied to the rings
  let spin = 0;
  function onScroll() {
    const delta = Math.abs(scrollY - lastScroll);
    lastScroll = scrollY;
    scrollPush += delta;
    spin = Math.min(spin + delta * 0.002, 1.5);
    wake(0.5);
  }
  addEventListener("scroll", onScroll, { passive: true });

  // ── Frame ──────────────────────────────────────────────────
  let time = stillTime ?? 0;
  let boost = 0;
  let activeUntil = 0;
  let raf = 0;
  let lastFrame = performance.now();
  let lastRender = 0;
  let firstFrame = true;
  let dirty = true;

  function updateIcons(dt: number) {
    const moving = !reduced && !still;
    rings.forEach((ring, r) => {
      const [x0, y0, x1, y1] = [width * ring.insetX, height * ring.insetY, width * (1 - ring.insetX), height * (1 - ring.insetY)];
      const perimeter = 2 * (x1 - x0 + y1 - y0);
      if (moving) ringProgress[r] += dt * ring.speed * (1 + boost * 4) + (scrollPush * 0.35) / perimeter;
    });
    scrollPush = 0;

    icons.forEach((icon, i) => {
      const ring = rings[icon.ring];
      const [x0, y0, x1, y1] = [width * ring.insetX, height * ring.insetY, width * (1 - ring.insetX), height * (1 - ring.insetY)];
      const radius = Math.min(x1 - x0, y1 - y0) * 0.18;
      let [x, y] = ringPoint(ringProgress[icon.ring] + icon.slot / ring.count, x0, y0, x1, y1, radius);

      let size = ring.size;
      let tile = icon.tile;
      let alpha = ring.alpha;
      let rot = moving ? Math.sin(time * 0.5 + icon.seed * 10) * 0.22 + spin * Math.sin(icon.seed * 20) : 0;
      if (moving) y += Math.sin(time * 1.3 + icon.seed * 6) * 3;

      if (!Number.isNaN(icon.start) && time >= icon.start) {
        const p = (time - icon.start) / TYPE_SECONDS;
        if (p >= 1) {
          icon.tile = icon.next;
          icon.start = NaN;
          tile = icon.tile;
        } else if (p < 0.14) {
          // Blinking caret before "typing".
          tile = CARET_TILE;
          size *= 0.7;
          rot = 0;
          alpha *= Math.floor(time * 16) % 2 ? 1 : 0.25;
        } else if (p < 0.82) {
          // Random code characters, oscillating.
          tile = GLYPH_TILE_START + Math.floor(hash(icon.seed * 50, Math.floor(time * 18)) * GLYPH_TILE_COUNT);
          size *= 0.78 + 0.22 * Math.sin(p * Math.PI * 7);
          x += Math.sin(time * 55 + i) * 2.5 * (1 - p);
          rot = 0;
          alpha *= 0.65 + 0.35 * hash(i, Math.floor(time * 24));
        } else {
          tile = icon.next;
          size *= 1 + 0.25 * Math.sin(((p - 0.82) / 0.18) * Math.PI);
        }
      }

      instanceData.set([x, y, size, rot, tile, alpha, 1, icon.accent], i * FLOATS_PER_ICON);
    });
  }

  function render(dt: number) {
    boost = Math.max(0, boost - dt * 0.8);
    spin *= Math.exp(-dt * 2.5);
    updateIcons(dt);

    // Pass 1: icons → offscreen texture.
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, fbo);
    gl!.viewport(0, 0, canvas.width, canvas.height);
    gl!.clearColor(0, 0, 0, 0);
    gl!.clear(gl!.COLOR_BUFFER_BIT);
    gl!.enable(gl!.BLEND);
    gl!.blendFunc(gl!.ONE, gl!.ONE_MINUS_SRC_ALPHA);
    gl!.useProgram(iconProgram.program);
    gl!.uniform2f(iconProgram.uniforms.uView, width, height);
    gl!.uniform2fv(iconProgram.uniforms.uGrid, atlasGrid);
    gl!.activeTexture(gl!.TEXTURE0);
    gl!.bindTexture(gl!.TEXTURE_2D, atlas);
    gl!.uniform1i(iconProgram.uniforms.uAtlas, 0);
    gl!.bindVertexArray(iconVao);
    gl!.bindBuffer(gl!.ARRAY_BUFFER, instanceBuffer);
    gl!.bufferSubData(gl!.ARRAY_BUFFER, 0, instanceData);
    gl!.drawArraysInstanced(gl!.TRIANGLE_STRIP, 0, 4, icons.length);
    gl!.disable(gl!.BLEND);
    gl!.bindTexture(gl!.TEXTURE_2D, sceneTex);
    gl!.generateMipmap(gl!.TEXTURE_2D);

    // Pass 2: composite + filter boxes → screen.
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, null);
    gl!.useProgram(postProgram.program);
    const u = postProgram.uniforms;
    gl!.uniform1i(u.tScene, 0);
    gl!.activeTexture(gl!.TEXTURE1);
    gl!.bindTexture(gl!.TEXTURE_2D, glyphs);
    gl!.uniform1i(u.tGlyph, 1);
    gl!.uniform2f(u.uRes, canvas.width, canvas.height);
    gl!.uniform1f(u.uDpr, scale);
    gl!.uniform1f(u.uTime, time);
    gl!.uniform4fv(u.uBoxes, boxRects);
    gl!.uniform1fv(u.uBoxType, boxTypes);
    gl!.uniform1i(u.uBoxCount, boxCount);
    gl!.bindVertexArray(postVao);
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);
    gl!.bindVertexArray(null);
    gl!.activeTexture(gl!.TEXTURE0);

    dirty = false;
    if (firstFrame) {
      firstFrame = false;
      onFirstFrame?.();
    }
  }

  function tick(now: number) {
    raf = 0;
    const dt = Math.min((now - lastFrame) / 1000, 0.1);
    lastFrame = now;
    const active = now < activeUntil;

    if (reduced || still) {
      if (dirty) render(0);
      return; // static: redraw only when something changes
    }
    time += dt;
    // Full frame rate while scrolling or animating, ~30fps when idle.
    if (active || dirty || now - lastRender >= 1000 / IDLE_FPS - 2) {
      render(Math.min((now - (lastRender || now - 16)) / 1000, 0.1));
      lastRender = now;
    }
    schedule();
  }

  function schedule() {
    if (!raf && !document.hidden) raf = requestAnimationFrame(tick);
  }

  /** Mark the frame dirty and keep full frame rate for `seconds`. */
  function wake(seconds: number) {
    dirty = true;
    activeUntil = Math.max(activeUntil, performance.now() + seconds * 1000);
    schedule();
  }

  function onVisibility() {
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = 0;
    } else {
      lastFrame = performance.now();
      wake(0);
    }
  }
  document.addEventListener("visibilitychange", onVisibility);

  function onReducedMotion(e: MediaQueryListEvent) {
    reduced = e.matches;
    switchTheme(theme);
  }
  reducedQuery.addEventListener("change", onReducedMotion);

  const unsubscribe = sceneStore.subscribe(() => {
    const next = sceneStore.getState().theme;
    if (next !== theme) switchTheme(next);
  });

  // Filter boxes may mount after the engine on client navigation.
  const domObserver = new MutationObserver(() => {
    if (document.querySelectorAll("[data-filter-box]").length !== boxElements.length) {
      collectBoxes();
      syncBoxes();
    }
  });
  domObserver.observe(document.body, { childList: true, subtree: true });

  function onContextLost(e: Event) {
    e.preventDefault();
    cancelAnimationFrame(raf);
    raf = 0;
    document.documentElement.dataset.webgl = "soft";
  }
  canvas.addEventListener("webglcontextlost", onContextLost);

  addEventListener("resize", resize);
  collectBoxes();
  resize();
  applyColors();
  wake(0);

  return {
    dispose() {
      cancelAnimationFrame(raf);
      removeEventListener("resize", resize);
      removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      reducedQuery.removeEventListener("change", onReducedMotion);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      themeObserver.disconnect();
      boxObserver.disconnect();
      domObserver.disconnect();
      unsubscribe();
      gl!.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
