"use client";

import { useSyncExternalStore } from "react";
import { deckStore, PANELS, type Panel } from "@/lib/deck-store";

const labels: Record<Panel, string> = { intro: "Home", projects: "Projects", services: "Services", contact: "Contact" };

/** Side menu on the home page: switches the central panel. */
export function NavList() {
  const active = useSyncExternalStore(deckStore.subscribe, deckStore.get, deckStore.getServer);
  return (
    <nav aria-label="Sections">
      <ul className="flex flex-col gap-2.5">
        {PANELS.map((p) => (
          <li key={p}>
            <a
              href={p === "intro" ? "#" : `#${p}`}
              onClick={(e) => {
                e.preventDefault();
                deckStore.go(p);
              }}
              aria-current={p === active ? "page" : undefined}
              className={`label inline-flex items-center gap-2 transition-colors hover:text-on-bg ${
                p === active ? "text-on-bg" : "text-on-bg-muted"
              }`}
            >
              <span
                aria-hidden="true"
                className={`h-px transition-[width] duration-300 ${p === active ? "w-3 bg-accent" : "w-0 bg-current"}`}
              />
              {labels[p]}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
