"use client";

import { useSyncExternalStore } from "react";
import type { ShapeId } from "@site";
import { shapeStore } from "@/lib/shape-store";

const order: ShapeId[] = ["home", "cube-bars", "torus", "particle-sphere"];

/** "Line control" readout: current background shape on a slider track. */
export function ShapeReadout() {
  const shape = useSyncExternalStore(shapeStore.subscribe, shapeStore.getActive, () => "home" as ShapeId);
  const i = order.indexOf(shape);
  return (
    <div className="mb-1 w-40 font-mono text-[10px] uppercase tracking-widest text-faint">
      <div className="flex justify-between">
        <span>Shape</span>
        <span className="text-fg">{shape.replace("-", " ")}</span>
      </div>
      <div className="relative mt-2 h-px bg-line-strong">
        {order.map((s, k) => (
          <span
            key={s}
            className="absolute top-[-3px] h-[7px] w-px bg-line-strong"
            style={{ left: `${(k / (order.length - 1)) * 100}%` }}
          />
        ))}
        <span
          className="absolute top-[-4px] h-[9px] w-[9px] -translate-x-1/2 rounded-full border border-fg bg-bg transition-[left] duration-700"
          style={{ left: `${(i / (order.length - 1)) * 100}%` }}
        />
      </div>
    </div>
  );
}
