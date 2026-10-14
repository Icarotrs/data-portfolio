"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { sectionStore } from "@/lib/section-store";

/**
 * Watches every element with `data-section` and reports the one crossing
 * the middle of the viewport (used to highlight the side menu).
 */
export function SectionObserver() {
  const pathname = usePathname();

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-section]"));
    if (sections.length === 0) return;
    const activate = (el: HTMLElement) => sectionStore.set(el.dataset.section ?? "intro");
    activate(sections[0]);

    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && activate(e.target as HTMLElement)),
      { rootMargin: "-45% 0px -45% 0px" },
    );
    sections.forEach((s) => observer.observe(s));

    // The last section may never reach the middle band on short pages.
    const onScroll = () => {
      if (scrollY + innerHeight >= document.documentElement.scrollHeight - 4) activate(sections[sections.length - 1]);
    };
    addEventListener("scroll", onScroll, { passive: true });
    return () => {
      observer.disconnect();
      removeEventListener("scroll", onScroll);
    };
  }, [pathname]);

  return null;
}
