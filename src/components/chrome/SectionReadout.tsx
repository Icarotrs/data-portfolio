"use client";

import { useSyncExternalStore } from "react";
import { sceneStore } from "@/lib/scene-store";

const pad = (n: number) => String(n).padStart(2, "0");
const getState = () => sceneStore.getState();

/** "Line control" readout: current section theme on a slider track. */
export function SectionReadout() {
  const { theme, section, sections } = useSyncExternalStore(sceneStore.subscribe, getState, getState);
  const steps = Math.max(sections, 2);
  return (
    <div className="mb-1 w-44 font-mono text-[10px] uppercase tracking-widest text-faint">
      <div className="flex justify-between">
        <span>
          SEC {pad(section)}/{pad(sections)}
        </span>
        <span className="text-fg">{theme}</span>
      </div>
      <div className="relative mt-2 h-px bg-line-strong">
        {Array.from({ length: steps }, (_, k) => (
          <span
            key={k}
            className="absolute top-[-3px] h-[7px] w-px bg-line-strong"
            style={{ left: `${(k / (steps - 1)) * 100}%` }}
          />
        ))}
        <span
          className="absolute top-[-4px] h-[9px] w-[9px] -translate-x-1/2 rounded-full border border-fg bg-bg transition-[left] duration-500"
          style={{ left: `${((section - 1) / (steps - 1)) * 100}%` }}
        />
      </div>
    </div>
  );
}
