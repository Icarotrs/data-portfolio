"use client";

import { useRef, type KeyboardEvent, type PointerEvent } from "react";
import type { Point } from "./lab-store";

interface Options {
  enabled: boolean;
  /** Current top-left position, % of the viewport. */
  position: Point;
  /** Element size, % of the viewport (used to keep it on screen). */
  size: { w: number; h: number };
  onMove: (p: Point) => void;
}

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), Math.max(min, max));

/**
 * Drag an absolutely-positioned element around the viewport.
 * Mouse: drag anywhere on it. Touch/pen: drag by a child marked
 * `data-drag-handle` (so touching a panel never blocks page scrolling).
 * Keyboard: arrow keys move 1% (Shift: 5%).
 */
export function useDraggable({ enabled, position, size, onMove }: Options) {
  const start = useRef<{ px: number; py: number; x: number; y: number } | null>(null);

  const place = (x: number, y: number) =>
    onMove({ x: clamp(x, 0, 100 - size.w), y: clamp(y, 0, 100 - size.h) });

  if (!enabled) return {};

  return {
    tabIndex: 0,
    onPointerDown(e: PointerEvent<HTMLElement>) {
      const target = e.target as HTMLElement;
      if (e.button !== 0 || target.closest("button, a, input")) return;
      if (e.pointerType !== "mouse" && !target.closest("[data-drag-handle]")) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      start.current = { px: e.clientX, py: e.clientY, ...position };
      e.preventDefault();
    },
    onPointerMove(e: PointerEvent<HTMLElement>) {
      const s = start.current;
      if (!s) return;
      place(s.x + ((e.clientX - s.px) / innerWidth) * 100, s.y + ((e.clientY - s.py) / innerHeight) * 100);
    },
    onPointerUp() {
      start.current = null;
    },
    onPointerCancel() {
      start.current = null;
    },
    onKeyDown(e: KeyboardEvent<HTMLElement>) {
      const step = e.shiftKey ? 5 : 1;
      const delta = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[
        e.key
      ];
      if (!delta) return;
      e.preventDefault();
      place(position.x + delta[0], position.y + delta[1]);
    },
  };
}
