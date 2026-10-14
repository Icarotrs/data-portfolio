"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import type { IconTheme } from "@site";
import { sceneStore } from "@/lib/scene-store";

/**
 * Watches every element with `data-icon-theme` and reports the one crossing
 * the middle of the viewport to the scene store.
 */
export function SectionObserver() {
  const pathname = usePathname();

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-icon-theme]"));
    if (sections.length === 0) return;
    sceneStore.set({ sections: sections.length });

    const activate = (el: HTMLElement) =>
      sceneStore.set({
        theme: el.dataset.iconTheme as IconTheme,
        section: sections.indexOf(el) + 1,
      });
    activate(sections[0]);

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) activate(entry.target as HTMLElement);
        }
      },
      // A thin band across the middle of the screen.
      { rootMargin: "-45% 0px -45% 0px" },
    );
    sections.forEach((s) => observer.observe(s));

    // The last section may never reach the middle band on short pages.
    const onScroll = () => {
      const bottom = window.scrollY + window.innerHeight;
      if (bottom >= document.documentElement.scrollHeight - 4) activate(sections[sections.length - 1]);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [pathname]);

  return null;
}
