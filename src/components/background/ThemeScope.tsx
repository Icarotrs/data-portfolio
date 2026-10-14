"use client";

import { useEffect } from "react";
import type { IconTheme } from "@site";
import { sceneStore } from "@/lib/scene-store";

/** Pins the icon theme (used by the asset-rendering pages). Renders nothing. */
export function ThemeScope({ theme }: { theme: IconTheme }) {
  useEffect(() => {
    sceneStore.set({ theme });
  }, [theme]);
  return null;
}
