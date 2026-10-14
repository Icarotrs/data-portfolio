"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { getTheme, setTheme, THEME_STORAGE_KEY, type Theme } from "@/lib/theme";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

const options: { theme: Theme; icon: ReactNode }[] = [
  {
    theme: "dark",
    icon: <path d="M12 3a9 9 0 0 0 0 18Z" fill="currentColor" />,
  },
  {
    theme: "light",
    icon: (
      <>
        <circle cx="12" cy="12" r="3.5" fill="currentColor" />
        <path d="M12 5v1.5M12 17.5V19M5 12h1.5M17.5 12H19M7 7l1 1M16 16l1 1M7 17l1-1M16 8l1-1" />
      </>
    ),
  },
];

/** Two small round buttons (dark / light), like the reference. */
export function ThemeSwitch({ labels }: { labels: { dark: string; light: string; group: string } }) {
  const current = useSyncExternalStore<Theme | null>(subscribe, getTheme, () => null);

  // Follow the system preference until the visitor picks a theme.
  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => {
      let saved: string | null = null;
      try {
        saved = localStorage.getItem(THEME_STORAGE_KEY);
      } catch {}
      if (!saved) setTheme(e.matches ? "dark" : "light", false);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return (
    <div className="flex gap-2" role="group" aria-label={labels.group}>
      {options.map(({ theme, icon }) => (
        <button
          key={theme}
          type="button"
          aria-label={labels[theme]}
          aria-pressed={current === theme}
          onClick={() => setTheme(theme)}
          className={`inline-flex h-6 w-6 items-center justify-center rounded-full border transition-opacity ${
            current === theme ? "border-fg opacity-100" : "border-fg opacity-55 hover:opacity-100"
          } text-fg`}
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            {icon}
          </svg>
        </button>
      ))}
    </div>
  );
}
