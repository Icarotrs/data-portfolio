"use client";

import { useEffect, useRef } from "react";

/**
 * "none": no WebGL2 → pre-rendered image.
 * "software": WebGL2 runs on the CPU (SwiftShader, llvmpipe…). The animated
 * scene would hog the main thread, so these visitors keep the CSS background.
 */
function detectWebGL(): "gpu" | "software" | "none" {
  try {
    const gl = document.createElement("canvas").getContext("webgl2");
    if (!gl) return "none";
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = String(
      gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER) ?? "",
    );
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return /swiftshader|llvmpipe|softpipe|software|basic render/i.test(renderer)
      ? "software"
      : "gpu";
  } catch {
    return "none";
  }
}

/**
 * Loads the three.js engine lazily: after the page has loaded and the main
 * thread is idle (or on the first interaction), so the decorative background
 * never competes with content for the first paint.
 */
export function BackgroundCanvas({ stillTime }: { stillTime?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const root = document.documentElement;
    let disposed = false;
    let engine: { dispose(): void } | undefined;
    const cleanups: (() => void)[] = [];

    async function start() {
      if (disposed || engine) return;
      cleanups.splice(0).forEach((c) => c());
      const support = detectWebGL();
      // Asset rendering (stillTime) and ?forcegl (testing) may use software WebGL.
      const allowSoftware = stillTime !== undefined || location.search.includes("forcegl");
      if (support === "none" || (support === "software" && !allowSoftware)) {
        root.dataset.webgl = support === "none" ? "off" : "soft";
        return;
      }
      const { createEngine } = await import("@/lib/webgl/engine");
      if (disposed) return;
      try {
        engine = createEngine({
          canvas,
          stillTime,
          onFirstFrame: () => {
            root.dataset.webgl = "on";
            canvas.style.opacity = "1";
            if (stillTime !== undefined) {
              // Two frames later the canvas is composited; tell the asset renderer.
              requestAnimationFrame(() => requestAnimationFrame(() => (root.dataset.bgReady = "1")));
            }
          },
        });
      } catch {
        root.dataset.webgl = "off";
      }
    }

    if (stillTime !== undefined) {
      start();
    } else {
      const coarse = matchMedia("(pointer: coarse)").matches;
      const delay = coarse ? 3000 : 1200;
      const onInteract = () => start();
      const events = ["pointermove", "pointerdown", "scroll", "keydown", "touchstart"] as const;
      const arm = () => {
        const timer = setTimeout(() => {
          if ("requestIdleCallback" in window) {
            const id = requestIdleCallback(() => start(), { timeout: 2000 });
            cleanups.push(() => cancelIdleCallback(id));
          } else start();
        }, delay);
        cleanups.push(() => clearTimeout(timer));
        events.forEach((e) => addEventListener(e, onInteract, { once: true, passive: true }));
        cleanups.push(() => events.forEach((e) => removeEventListener(e, onInteract)));
      };
      if (document.readyState === "complete") arm();
      else {
        addEventListener("load", arm, { once: true });
        cleanups.push(() => removeEventListener("load", arm));
      }
    }

    return () => {
      disposed = true;
      cleanups.forEach((c) => c());
      engine?.dispose();
    };
  }, [stillTime]);

  return (
    <canvas
      ref={ref}
      className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-700"
    />
  );
}
