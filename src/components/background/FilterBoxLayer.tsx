"use client";

import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { site, type FilterBox } from "@site";
import { labStore, type BoxSet } from "@/lib/lab-store";
import { useDraggable } from "@/lib/use-draggable";

const sets: { key: BoxSet; className: string }[] = [
  { key: "desktop", className: "hidden lg:block" },
  { key: "tablet", className: "hidden sm:block lg:hidden" },
  { key: "mobile", className: "block sm:hidden" },
];

/**
 * The filter panels as real DOM elements. These are the source of truth:
 * the WebGL engine reads their on-screen rectangles and applies each
 * panel's effect to that region. CSS decides which set is visible per
 * breakpoint. On the home page they can be dragged around.
 */
export function FilterBoxLayer({ movable }: { movable?: boolean }) {
  const pathname = usePathname();
  const { boxes } = useSyncExternalStore(labStore.subscribe, labStore.get, labStore.get);
  const enabled = movable ?? pathname === "/";

  return (
    <>
      {sets.map(({ key, className }) => (
        <div key={key} className={`pointer-events-none absolute inset-0 ${className}`}>
          {site.filterBoxes[key].map((box, i) => (
            <Panel
              key={i}
              box={{ ...box, ...boxes[key]?.[i] }}
              index={i}
              enabled={enabled}
              onMove={(p) => labStore.moveBox(key, i, p)}
            />
          ))}
        </div>
      ))}
    </>
  );
}

function Panel({
  box,
  index,
  enabled,
  onMove,
}: {
  box: FilterBox;
  index: number;
  enabled: boolean;
  onMove: (p: { x: number; y: number }) => void;
}) {
  const drag = useDraggable({ enabled, position: box, size: box, onMove });
  const name = box.label ?? box.filter;
  return (
    <div
      data-filter-box
      data-filter={box.filter}
      {...drag}
      {...(enabled
        ? {
            role: "group",
            "aria-roledescription": "movable panel",
            "aria-label": `${name} effect panel. Use the arrow keys to move it.`,
          }
        : { "aria-hidden": true })}
      className={`absolute rounded-[3px] border border-[color-mix(in_srgb,var(--on-bg)_18%,transparent)] ${
        enabled
          ? "pointer-events-auto cursor-grab transition-colors hover:border-accent focus-visible:border-accent active:cursor-grabbing"
          : ""
      }`}
      style={{ left: `${box.x}%`, top: `${box.y}%`, width: `${box.w}%`, height: `${box.h}%` }}
    >
      <span
        data-drag-handle
        className="label absolute left-0 top-0 touch-none px-2 py-1 text-[9px] tracking-[0.12em] text-on-bg-muted"
      >
        {name} / {String(index + 1).padStart(2, "0")}
      </span>
    </div>
  );
}
