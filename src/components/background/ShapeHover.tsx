"use client";

import type { ReactNode } from "react";
import type { ShapeId } from "@site";
import { shapeStore } from "@/lib/shape-store";

/** Hover or keyboard focus inside the children switches the background shape. */
export function ShapeHover({
  shape,
  index,
  children,
  className,
}: {
  shape: ShapeId;
  index: number;
  children: ReactNode;
  className?: string;
}) {
  const on = () => shapeStore.setHover(shape, index);
  const off = () => shapeStore.setHover(null);
  return (
    <div
      className={className}
      onPointerEnter={on}
      onPointerLeave={off}
      onFocus={on}
      onBlur={off}
    >
      {children}
    </div>
  );
}
