"use client";

import { useSyncExternalStore } from "react";
import { shapeStore } from "@/lib/shape-store";

const pad = (n: number) => String(n).padStart(2, "0");

export function ProjectCounter({ total }: { total: number }) {
  const index = useSyncExternalStore(
    shapeStore.subscribe,
    () => shapeStore.getState().hoverIndex,
    () => null,
  );
  return (
    <span>
      PRJ <span className="text-fg">{index ? pad(index) : "--"}</span> / {pad(total)}
    </span>
  );
}
