"use client";

import { useEffect } from "react";
import type { ShapeId } from "@site";
import { shapeStore } from "@/lib/shape-store";

/** Sets the page's default background shape. Renders nothing. */
export function ShapeScope({ shape }: { shape: ShapeId }) {
  useEffect(() => {
    shapeStore.setPage(shape);
  }, [shape]);
  return null;
}
