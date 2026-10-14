"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { sectionStore } from "@/lib/section-store";

const items = [
  { label: "Home", href: "/#top", sections: ["intro", "lab"] },
  { label: "Projects", href: "/#projects", sections: ["projects", "project"] },
  { label: "Services", href: "/#services", sections: ["services"] },
  { label: "Contact", href: "/#contact", sections: ["contact"] },
];

/** Section menu; the item for the section in view is highlighted. */
export function NavList() {
  const section = useSyncExternalStore(sectionStore.subscribe, sectionStore.get, () => "intro");
  return (
    <nav aria-label="Sections">
      <ul className="flex flex-col gap-2.5">
        {items.map((item) => {
          const active = item.sections.includes(section);
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
                  className={`h-px transition-[width] duration-300 ${active ? "w-3 bg-accent" : "w-0 bg-current"}`}
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
