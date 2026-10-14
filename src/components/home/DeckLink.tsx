"use client";

import type { ReactNode } from "react";
import { deckStore, type Panel } from "@/lib/deck-store";

/** Link that switches the home panel without a page navigation. */
export function DeckLink({ to, className, children }: { to: Panel; className?: string; children: ReactNode }) {
  return (
    <a
      href={to === "intro" ? "#" : `#${to}`}
      onClick={(e) => {
        e.preventDefault();
        deckStore.go(to);
      }}
      className={className}
    >
      {children}
    </a>
  );
}
