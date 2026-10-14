"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

/** Renders its children only on the home page. */
export function OnHome({ children }: { children: ReactNode }) {
  return usePathname() === "/" ? children : null;
}
