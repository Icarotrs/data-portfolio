"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import type { IconTheme } from "@site";
import { sceneStore } from "@/lib/scene-store";

const items: { label: string; href: string; themes: IconTheme[] }[] = [
  { label: "Home", href: "/#top", themes: ["intro"] },
  { label: "Projects", href: "/#projects", themes: ["projects", "dashboard", "automation", "cleaning", "code"] },
  { label: "Services", href: "/#services", themes: ["services"] },
  { label: "Contact", href: "/#contact", themes: ["contact"] },
];

const getTheme = () => sceneStore.getState().theme;

/** Section menu; the item for the section in view is highlighted. */
export function NavList() {
  const theme = useSyncExternalStore(sceneStore.subscribe, getTheme, () => "intro" as IconTheme);
  return (
    <nav aria-label="Sections">
      <ul className="flex flex-col gap-2.5">
        {items.map((item) => {
          const active = item.themes.includes(theme);
          return (
            <li key={item.label}>
              <Link
                href={item.href}
                aria-current={active ? "true" : undefined}
                className={`label inline-flex items-center gap-2 transition-colors hover:text-on-bg ${
                  active ? "text-on-bg" : "text-on-bg-muted"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`h-px bg-current transition-[width] duration-300 ${active ? "w-3" : "w-0"}`}
                />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
