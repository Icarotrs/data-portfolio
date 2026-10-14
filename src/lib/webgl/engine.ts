import type { FilterType } from "@site";
import {
  FILTER_IDS,
  FULLSCREEN_VERTEX,
  IMAGE_FRAGMENT,
  IMAGE_VERTEX,
  MAX_BOXES,
  POST_FRAGMENT,
  SHAPE_FRAGMENT,
  SHAPE_VERTEX,
  createGlyphStrip,
} from "./post";
import { Batch, Transform, cube, icosahedron, pyramid, type Batches, type Colors, type RGB } from "./shapes";

/**
 * Background renderer, plain WebGL2 (no 3D library):
 *   1. Scene → offscreen texture: visitor images (from the Image lab), then
 *      three simple wireframe solids on a slow carousel around the centre.
 *   2. Post: one full-screen shader draws the smooth background, composites
 *      the scene and applies each filter panel's effect inside its rectangle.
 *
 * Filter panels and image frames are DOM elements; their rectangles are the
 * source of truth for where effects and images go.
 */

export interface EngineOptions {
  canvas: HTMLCanvasElement;
  /** Render a single frame at this time (asset rendering). */
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
const CAMERA_Z = 7;
const ORBIT_SECONDS = 80; // one full turn of the carousel
const STATIC_TIME = 6; // frame shown with prefers-reduced-motion

function cssColor(name: string, fallback: string): RGB {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const hex = /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as RGB;
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
  const cache: Record<string, WebGLUniformLocation | null> = {};
  const u = (name: string) => (name in cache ? cache[name] : (cache[name] = gl.getUniformLocation(program, name)));
  return { program, u };
}

function texture(gl: WebGL2RenderingContext, source: TexImageSource, mipmaps = false) {
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

/** Downscale big photos before upload (keeps GPU memory and upload time small). */
function imageSource(img: HTMLImageElement): TexImageSource {
  const max = 1024;
  const s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  if (s === 1) return img;
  const c = document.createElement("canvas");
  c.width = Math.round(img.naturalWidth * s);
  c.height = Math.round(img.naturalHeight * s);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  return c;
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
  const shapeProgram = compile(gl, SHAPE_VERTEX, SHAPE_FRAGMENT);
  const imageProgram = compile(gl, IMAGE_VERTEX, IMAGE_FRAGMENT);
  const postProgram = compile(gl, FULLSCREEN_VERTEX, POST_FRAGMENT);
  const glyphs = texture(gl, createGlyphStrip());
  const sceneTex = gl.createTexture()!;
  const fbo = gl.createFramebuffer()!;
  const emptyVao = gl.createVertexArray()!;

  const shapeVao = gl.createVertexArray()!;
  const shapeBuffer = gl.createBuffer()!;
  gl.bindVertexArray(shapeVao);
  gl.bindBuffer(gl.ARRAY_BUFFER, shapeBuffer);
  const aPos = gl.getAttribLocation(shapeProgram.program, "aPos");
  const aColor = gl.getAttribLocation(shapeProgram.program, "aColor");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 28, 0);
  gl.enableVertexAttribArray(aColor);
  gl.vertexAttribPointer(aColor, 4, gl.FLOAT, false, 28, 12);
  gl.bindVertexArray(null);

  const batches: Batches = { lines: new Batch(), points: new Batch(), tris: new Batch() };
  const transform = new Transform();
  let colors: Colors = { line: [0.85, 0.85, 0.85], accent: [1, 0.42, 0.12] };

  // ── Theme colours (CSS custom properties) ──────────────────
  function applyColors() {
    const dark = document.documentElement.dataset.theme === "dark";
    const pick = (name: string, light: string, night: string) => cssColor(name, dark ? night : light);
    const accent = pick("--accent-gl", "#e8591a", "#ff6a1f");
    colors = { line: pick("--shape-line", "#2a2a2a", "#d6d6d6"), accent };
    gl!.useProgram(postProgram.program);
    gl!.uniform3fv(postProgram.u("uBase"), pick("--g-base", "#c4c4c1", "#0b0b0c"));
    gl!.uniform3fv(postProgram.u("uBase2"), pick("--g-base2", "#dcdcd9", "#1c1c1e"));
    gl!.uniform3fv(postProgram.u("uInk"), pick("--ink", "#161616", "#e6e6e6"));
    gl!.uniform3fv(postProgram.u("uAccent"), accent);
    gl!.uniform1f(postProgram.u("uVignette"), dark ? 0.35 : 0.12);
    wake(0);
  }
  const themeObserver = new MutationObserver(applyColors);
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  // ── Filter panels (DOM is the source of truth) ─────────────
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
    wake(0.4);
  }
  const onLayout = () => syncBoxes();
  addEventListener("bg:layout", onLayout);

  // ── Visitor images ─────────────────────────────────────────
  const imageTextures = new Map<string, WebGLTexture | null>(); // null while loading
  function imageTexture(url: string) {
    if (imageTextures.has(url)) return imageTextures.get(url) ?? null;
    imageTextures.set(url, null);
    const img = new Image();
    img.onload = () => {
      imageTextures.set(url, texture(gl!, imageSource(img)));
      wake(0);
    };
    img.src = url;
    return null;
  }

  function drawImages() {
    const frames = document.querySelectorAll<HTMLElement>("[data-user-image]");
    const live = new Set<string>();
    if (frames.length) {
      gl!.useProgram(imageProgram.program);
      gl!.uniform2f(imageProgram.u("uView"), width, height);
      gl!.bindVertexArray(emptyVao);
      for (const el of frames) {
        const url = el.dataset.src;
        if (!url) continue;
        live.add(url);
        const tex = imageTexture(url);
        if (!tex) continue;
        const r = el.getBoundingClientRect();
        gl!.bindTexture(gl!.TEXTURE_2D, tex);
        gl!.uniform4f(imageProgram.u("uRect"), r.left, r.top, r.width, r.height);
        gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
      }
    }
    // Free textures of removed images.
    for (const [url, tex] of imageTextures) {
      if (!live.has(url) && tex) {
        gl!.deleteTexture(tex);
        imageTextures.delete(url);
      }
    }
    return frames.length > 0;
  }

  // ── Size & camera ──────────────────────────────────────────
  let width = 0;
  let height = 0;
  let scale = 1;
  let fov = 35;
  const viewProj = new Float32Array(16);

  function resize() {
    width = canvas.clientWidth || innerWidth;
    height = canvas.clientHeight || innerHeight;
    scale = Math.min(devicePixelRatio || 1, MAX_DPR, Math.sqrt(MAX_PIXELS / (width * height)));
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    scale = canvas.width / width;

    const aspect = width / height;
    fov = aspect < 0.8 ? 52 : 35;
    const f = 1 / Math.tan((fov * Math.PI) / 360);
    const near = 0.1;
    const far = 50;
    const a = (far + near) / (near - far);
    const b = (2 * far * near) / (near - far);
    // perspective × translate(0, 0, -CAMERA_Z), column-major
    viewProj.set([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, a, -1, 0, 0, -CAMERA_Z * a + b, CAMERA_Z]);

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
    syncBoxes();
  }

  // ── Shapes: carousel around the centre ─────────────────────
  function buildShapes(t: number) {
    batches.lines.reset();
    batches.points.reset();
    batches.tris.reset();
    const aspect = width / height;
    const visibleW = 2 * CAMERA_Z * Math.tan((fov * Math.PI) / 360) * aspect;
    const rx = visibleW * (aspect < 0.8 ? 0.3 : 0.27);
    const rz = 2.0;
    const size = aspect < 0.8 ? 0.6 : 0.85;
    const builders = [cube, pyramid, icosahedron];
    builders.forEach((build, i) => {
      const angle = (t / ORBIT_SECONDS) * Math.PI * 2 + (i * Math.PI * 2) / 3;
      const x = Math.sin(angle) * rx;
      const z = Math.cos(angle) * rz;
      const y = Math.sin(t * 0.4 + i * 2) * 0.15;
      const alpha = 0.55 + 0.45 * ((z / rz + 1) / 2); // dimmer at the back
      const spin: [number, number, number] = [0.35 + Math.sin(t * 0.2 + i) * 0.15, t * (0.14 + i * 0.03) + i, 0];
      transform.set(spin[0], spin[1], spin[2], size, x, y, z);
      build(transform, t, batches, colors, alpha);
    });
  }

  function drawBatch(batch: Batch, mode: number, round: boolean) {
    if (!batch.count) return;
    gl!.bufferData(gl!.ARRAY_BUFFER, batch.data.subarray(0, batch.count * 7), gl!.STREAM_DRAW);
    gl!.uniform1f(shapeProgram.u("uRound"), round ? 1 : 0);
    gl!.drawArrays(mode, 0, batch.count);
  }

  // ── Frame ──────────────────────────────────────────────────
  let time = stillTime ?? (reduced ? STATIC_TIME : 0);
  let activeUntil = 0;
  let raf = 0;
  let lastFrame = performance.now();
  let lastRender = 0;
  let firstFrame = true;
  let dirty = true;

  function render() {
    // Pass 1: images + shapes → offscreen texture.
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, fbo);
    gl!.viewport(0, 0, canvas.width, canvas.height);
    gl!.clearColor(0, 0, 0, 0);
    gl!.clear(gl!.COLOR_BUFFER_BIT);
    gl!.activeTexture(gl!.TEXTURE0);
    const hasImages = drawImages();

    buildShapes(time);
    gl!.enable(gl!.BLEND);
    gl!.blendFunc(gl!.ONE, gl!.ONE_MINUS_SRC_ALPHA);
    gl!.useProgram(shapeProgram.program);
    gl!.uniformMatrix4fv(shapeProgram.u("uViewProj"), false, viewProj);
    gl!.uniform1f(shapeProgram.u("uPointScale"), 5 * scale * CAMERA_Z);
    gl!.bindVertexArray(shapeVao);
    gl!.bindBuffer(gl!.ARRAY_BUFFER, shapeBuffer);
    drawBatch(batches.tris, gl!.TRIANGLES, false);
    drawBatch(batches.lines, gl!.LINES, false);
    drawBatch(batches.points, gl!.POINTS, true);
    gl!.disable(gl!.BLEND);
    gl!.bindTexture(gl!.TEXTURE_2D, sceneTex);
    gl!.generateMipmap(gl!.TEXTURE_2D);

    // Pass 2: background + composite + filter panels → screen.
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, null);
    gl!.useProgram(postProgram.program);
    const u = postProgram.u;
    gl!.uniform1i(u("tScene"), 0);
    gl!.activeTexture(gl!.TEXTURE1);
    gl!.bindTexture(gl!.TEXTURE_2D, glyphs);
    gl!.uniform1i(u("tGlyph"), 1);
    gl!.uniform2f(u("uRes"), canvas.width, canvas.height);
    gl!.uniform1f(u("uDpr"), scale);
    gl!.uniform1f(u("uTime"), time);
    gl!.uniform4fv(u("uBoxes"), boxRects);
    gl!.uniform1fv(u("uBoxType"), boxTypes);
    gl!.uniform1i(u("uBoxCount"), boxCount);
    gl!.bindVertexArray(emptyVao);
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);
    gl!.bindVertexArray(null);
    gl!.activeTexture(gl!.TEXTURE0);

    dirty = false;
    if (firstFrame) {
      firstFrame = false;
      onFirstFrame?.();
    }
    return hasImages;
  }

  function tick(now: number) {
    raf = 0;
    const dt = Math.min((now - lastFrame) / 1000, 0.1);
    lastFrame = now;

    if (reduced || still) {
      if (dirty) render();
      // Keep image frames in sync while they are dragged.
      if (now < activeUntil) schedule();
      return;
    }
    time += dt;
    // Full frame rate while something is being dragged, ~30fps otherwise.
    if (now < activeUntil || dirty || now - lastRender >= 1000 / IDLE_FPS - 2) {
      render();
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
    if (reduced) time = STATIC_TIME;
    wake(0);
  }
  reducedQuery.addEventListener("change", onReducedMotion);

  // Panels and image frames may mount after the engine (client navigation).
  const domObserver = new MutationObserver(() => {
    if (document.querySelectorAll("[data-filter-box]").length !== boxElements.length) collectBoxes();
    syncBoxes();
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
      removeEventListener("bg:layout", onLayout);
      document.removeEventListener("visibilitychange", onVisibility);
      reducedQuery.removeEventListener("change", onReducedMotion);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      themeObserver.disconnect();
      boxObserver.disconnect();
      domObserver.disconnect();
      gl!.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
