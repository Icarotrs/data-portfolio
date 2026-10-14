"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { deckStore, PANELS, type Panel } from "@/lib/deck-store";
import { ArrowLeft, ArrowRight } from "@/components/ui/icons";

const labels: Record<Panel, string> = {
  intro: "Home",
  projects: "Projects",
  services: "Services",
  contact: "Contact",
};

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * The home page as one screen: a single panel in the middle, switched by
 * the side menu, the pager below it or the ← → keys. Every panel is in the
 * HTML (inactive ones are `hidden`), so crawlers and screen readers that
 * load the page still get all the content.
 */
export function HomeDeck({ panels }: { panels: Record<Panel, ReactNode> }) {
  const active = useSyncExternalStore(deckStore.subscribe, deckStore.get, deckStore.getServer);
  const index = PANELS.indexOf(active);
  const prev = PANELS[(index + PANELS.length - 1) % PANELS.length];
  const next = PANELS[(index + 1) % PANELS.length];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.altKey || e.ctrlKey || e.metaKey || t.closest("input, textarea, [role=group]")) return;
      if (e.key === "ArrowRight") deckStore.go(next);
      if (e.key === "ArrowLeft") deckStore.go(prev);
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [next, prev]);

  return (
    <div className="mx-auto flex w-full max-w-[560px] flex-col gap-4 lg:h-[calc(100dvh-10rem)]">
      {/* Tabs for small screens (the side menu takes over on large ones). */}
      <nav aria-label="Section tabs" className="flex gap-4 overflow-x-auto lg:hidden">
        {PANELS.map((p) => (
          <a
            key={p}
            href={p === "intro" ? "#" : `#${p}`}
            onClick={(e) => {
              e.preventDefault();
              deckStore.go(p);
            }}
            aria-current={p === active ? "page" : undefined}
            className={`label whitespace-nowrap border-b pb-1 ${
              p === active ? "border-accent text-on-bg" : "border-transparent text-on-bg-muted"
            }`}
          >
            {labels[p]}
          </a>
        ))}
      </nav>

      <div className="relative min-h-0 flex-1">
        {PANELS.map((p) => (
          <section
            key={p}
            id={`panel-${p}`}
            aria-label={labels[p]}
            hidden={p !== active}
            className="deck-panel h-full"
          >
            {panels[p]}
          </section>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <button type="button" onClick={() => deckStore.go(prev)} className="label inline-flex items-center gap-2 text-on-bg-muted hover:text-accent">
          <ArrowLeft className="h-3.5 w-3.5" />
          {labels[prev]}
        </button>
        <span className="label text-on-bg-muted" aria-live="polite">
          {pad(index + 1)} / {pad(PANELS.length)}
        </span>
        <button type="button" onClick={() => deckStore.go(next)} className="label inline-flex items-center gap-2 text-on-bg-muted hover:text-accent">
          {labels[next]}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
