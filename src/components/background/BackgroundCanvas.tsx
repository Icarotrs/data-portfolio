"use client";

import { useEffect, useRef } from "react";

function supportsWebGL2() {
  try {
    const gl = document.createElement("canvas").getContext("webgl2");
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    return !!gl;
  } catch {
    return false;
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
      if (!supportsWebGL2()) {
        root.dataset.webgl = "off";
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
