import * as THREE from "three";
import type { FilterType } from "@site";
import { shapeStore } from "@/lib/shape-store";
import { Director } from "./director";
import { createPostPass, FILTER_IDS, MAX_BOXES } from "./post";

export interface EngineOptions {
  canvas: HTMLCanvasElement;
  /** Render a single settled frame at this time (asset rendering). */
  stillTime?: number;
  /** Called after the first frame is on screen. */
  onFirstFrame?: () => void;
}

export interface Engine {
  dispose(): void;
}

const MAX_DPR = 1.5;
const CAMERA_Z = 7;
const FOV = 35;

// Colors are given in display space (sRGB hex from CSS) and written as-is.
THREE.ColorManagement.enabled = false;

function cssColor(name: string, fallback: string) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return new THREE.Color(value.startsWith("#") ? value : fallback);
}

export function createEngine({ canvas, stillTime, onFirstFrame }: EngineOptions): Engine {
  const still = stillTime !== undefined;
  const reducedMotionQuery = matchMedia("(prefers-reduced-motion: reduce)");
  let reducedMotion = reducedMotionQuery.matches;
  const lite = Math.min(innerWidth, innerHeight) < 640;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    alpha: false,
    powerPreference: "high-performance",
    // Asset rendering screenshots the canvas.
    preserveDrawingBuffer: still,
  });
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.setClearColor(0x000000, 0);

  const dpr = Math.min(devicePixelRatio || 1, MAX_DPR);
  renderer.setPixelRatio(dpr);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 50);
  camera.position.set(0, 0, CAMERA_Z);

  // Scene → render target with mipmaps (frost / pixelate sample lower mips).
  const target = new THREE.WebGLRenderTarget(1, 1, {
    samples: lite ? 0 : 4,
    generateMipmaps: true,
    minFilter: THREE.LinearMipmapLinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: true,
  });
  const post = createPostPass();
  post.uniforms.tScene.value = target.texture;
  post.uniforms.uDpr.value = dpr;

  const director = new Director(shapeStore.getActive(), { lite });
  scene.add(director.root);

  // Floor grid, light theme only.
  const floor = new THREE.GridHelper(40, 40);
  (floor.material as THREE.Material).dispose();
  const floorMaterial = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.14, depthWrite: false });
  floor.material = floorMaterial;
  floor.position.y = -2.4;
  scene.add(floor);
  scene.fog = new THREE.Fog(0x000000, 7, 22);

  // ── Theme ──────────────────────────────────────────────────
  function applyTheme() {
    const dark = document.documentElement.dataset.theme === "dark";
    const bg = cssColor("--bg", dark ? "#050506" : "#eceef2");
    const fg = cssColor("--fg", dark ? "#eceef2" : "#0d1015");
    const accent = cssColor("--accent", dark ? "#8fb0ff" : "#1d4fd8");
    post.uniforms.uBg.value.copy(bg);
    post.uniforms.uFg.value.copy(fg);
    post.uniforms.uDark.value = dark ? 1 : 0;
    post.uniforms.uFrost.value.copy(dark ? bg.clone().lerp(fg, 0.14) : new THREE.Color(1, 1, 1));
    (scene.fog as THREE.Fog).color.copy(bg);
    floorMaterial.color.copy(fg);
    floor.visible = !dark;
    director.setColors(fg, accent);
    invalidate();
  }
  const themeObserver = new MutationObserver(applyTheme);
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  // ── Filter boxes: DOM elements are the source of truth ─────
  let boxElements: HTMLElement[] = [];
  const boxObserver = new ResizeObserver(() => syncBoxes());

  function collectBoxes() {
    boxObserver.disconnect();
    boxElements = Array.from(document.querySelectorAll<HTMLElement>("[data-filter-box]"));
    boxElements.forEach((el) => boxObserver.observe(el));
  }

  function syncBoxes() {
    const height = canvas.clientHeight;
    let count = 0;
    for (const el of boxElements) {
      if (count >= MAX_BOXES) break;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue; // hidden at this breakpoint
      post.uniforms.uBoxes.value[count].set(
        r.left * dpr,
        (height - r.bottom) * dpr,
        r.right * dpr,
        (height - r.top) * dpr,
      );
      post.uniforms.uBoxType.value[count] = FILTER_IDS[el.dataset.filter as FilterType] ?? 0;
      count++;
    }
    post.uniforms.uBoxCount.value = count;
    invalidate();
  }

  // ── Size ───────────────────────────────────────────────────
  let width = 0;
  let height = 0;
  function resize() {
    width = canvas.clientWidth || innerWidth;
    height = canvas.clientHeight || innerHeight;
    renderer.setSize(width, height, false);
    const size = renderer.getDrawingBufferSize(new THREE.Vector2());
    target.setSize(size.x, size.y);
    post.uniforms.uRes.value.copy(size);
    camera.aspect = width / height;
    // Keep shapes a sensible size on portrait screens.
    camera.fov = camera.aspect < 0.8 ? FOV * 1.45 : FOV;
    camera.updateProjectionMatrix();
    syncBoxes();
  }
  addEventListener("resize", resize);

  // ── Loop ───────────────────────────────────────────────────
  let last = performance.now();
  const delta = () => {
    const now = performance.now();
    const d = (now - last) / 1000;
    last = now;
    return d;
  };
  let time = still ? stillTime : 0;
  let raf = 0;
  let firstFrame = true;
  let needsFrame = true;

  function drift(t: number) {
    // Shapes wander slowly so they pass behind different filter boxes.
    const visibleH = 2 * CAMERA_Z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const visibleW = visibleH * camera.aspect;
    director.root.position.set(
      Math.sin(t * 0.07) * visibleW * 0.18 + visibleW * 0.08,
      Math.cos(t * 0.053) * visibleH * 0.12,
      0,
    );
  }

  function renderFrame(dt: number) {
    drift(time);
    const animating = director.update(time, dt);
    post.uniforms.uTime.value = time;
    renderer.setRenderTarget(target);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    renderer.render(post.scene, post.camera);
    if (firstFrame) {
      firstFrame = false;
      onFirstFrame?.();
    }
    return animating;
  }

  function tick() {
    raf = 0;
    const dt = Math.min(delta(), 0.1);
    if (reducedMotion || still) {
      // Static frame: run the crossfade instantly, keep time frozen.
      renderFrame(dt);
      needsFrame = false;
      return;
    }
    time += dt;
    renderFrame(dt);
    schedule();
  }

  function schedule() {
    if (raf || document.hidden) return;
    raf = requestAnimationFrame(tick);
  }

  function invalidate() {
    needsFrame = true;
    if (reducedMotion || still) schedule();
  }

  function onVisibility() {
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = 0;
    } else {
      delta(); // drop the time spent hidden
      if (!reducedMotion || needsFrame) schedule();
    }
  }
  document.addEventListener("visibilitychange", onVisibility);

  function onReducedMotion(e: MediaQueryListEvent) {
    reducedMotion = e.matches;
    director.setActive(shapeStore.getActive(), time, reducedMotion);
    invalidate();
    schedule();
  }
  reducedMotionQuery.addEventListener("change", onReducedMotion);

  const unsubscribe = shapeStore.subscribe(() => {
    director.setActive(shapeStore.getActive(), time, reducedMotion || still);
    invalidate();
  });

  // Boxes may mount after the engine on client navigation.
  const domObserver = new MutationObserver(() => {
    const found = document.querySelectorAll("[data-filter-box]").length;
    if (found !== boxElements.length) {
      collectBoxes();
      syncBoxes();
    }
  });
  domObserver.observe(document.body, { childList: true, subtree: true });

  director.setActive(shapeStore.getActive(), time, reducedMotion || still);
  collectBoxes();
  resize();
  applyTheme();
  delta();
  schedule();

  return {
    dispose() {
      cancelAnimationFrame(raf);
      removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
      reducedMotionQuery.removeEventListener("change", onReducedMotion);
      themeObserver.disconnect();
      boxObserver.disconnect();
      domObserver.disconnect();
      unsubscribe();
      director.dispose();
      floor.geometry.dispose();
      floorMaterial.dispose();
      post.dispose();
      target.dispose();
      renderer.dispose();
    },
  };
}
