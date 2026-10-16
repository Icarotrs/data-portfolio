"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { FolderId } from "@site";
import type { Dictionary } from "@/i18n/dictionaries";
import { ArrowRight, GitHubIcon } from "@/components/ui/icons";

export interface ExplorerItem {
  slug: string;
  number: string;
  title: string;
  folder: FolderId;
  kind: string;
  summary: string;
  stack: string[];
  href: string;
  github?: string;
  thumb?: string;
  thumbAlt?: string;
  metric: { value: string; label: string; basis?: string };
}

type Labels = Dictionary["explorer"] & { viewCase: string; code: string; mockNote: string };

type Entry =
  | { type: "folder"; key: string; id: FolderId; name: string; count: number }
  | { type: "file"; key: string; item: ExplorerItem };

const HASH = "#projects";
const slugFromHash = (hash: string) => (hash.startsWith(`${HASH}/`) ? decodeURIComponent(hash.slice(HASH.length + 1)) : null);
const isSmall = () => window.matchMedia("(max-width: 767px)").matches;

/**
 * Projects as a small file explorer organized like Windows 95 — title bar,
 * menu bar, toolbar with the path and "up", a grid of folder and file icons
 * (or a details list) and a status bar — drawn in the site's own card style.
 *
 * Click selects, double-click (or a second click) opens; one tap opens on
 * phones. Arrows move, Enter opens, Backspace goes up, Esc closes. An open
 * project is #projects/<slug> in the URL, so it can be linked and the back
 * button closes it. Before JavaScript runs, the HTML is a plain list of
 * links to every project page.
 */
export function ProjectExplorer({ items, folders, labels }: { items: ExplorerItem[]; folders: FolderId[]; labels: Labels }) {
  const [path, setPath] = useState<FolderId | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [view, setView] = useState<"icons" | "list">("icons");
  const [query, setQuery] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [small, setSmall] = useState(false);
  const frame = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLUListElement>(null);
  const windowTitle = useRef<HTMLHeadingElement>(null);
  const pushed = useRef(false);
  const openRef = useRef<string | null>(null);
  const wasSelected = useRef(false);

  useEffect(() => {
    openRef.current = open;
  }, [open]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- swap the no-JS link list for the explorer after hydration
    setHydrated(true);
  }, []);

  const name = useCallback((id: FolderId) => labels.folders[id], [labels.folders]);
  const dir = (id: FolderId) => name(id).toUpperCase().replace(/\s*&\s*|\s+/g, "_");

  // At the root: folders. Inside a folder: its projects. With a filter: matching projects.
  const entries: Entry[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q) {
      return items
        .filter((it) => (!path || it.folder === path) && [it.title, it.kind, it.summary, ...it.stack].some((s) => s.toLowerCase().includes(q)))
        .map((item) => ({ type: "file", key: item.slug, item }));
    }
    if (!path) return folders.map((id) => ({ type: "folder", key: `dir:${id}`, id, name: name(id), count: items.filter((i) => i.folder === id).length }));
    return items.filter((i) => i.folder === path).map((item) => ({ type: "file", key: item.slug, item }));
  }, [items, folders, path, query, name]);

  const openItem = open ? items.find((i) => i.slug === open) ?? null : null;
  const selEntry = entries.find((e) => e.key === selected) ?? null;
  const address = `C:\\${labels.root}${path ? `\\${dir(path)}` : ""}`;

  const focusLater = (selector: string) => requestAnimationFrame(() => grid.current?.querySelector<HTMLElement>(selector)?.focus());

  const openFile = useCallback(
    (slug: string) => {
      const item = items.find((i) => i.slug === slug);
      if (!item || openRef.current === slug) return;
      setSmall(isSmall());
      setPath(item.folder);
      setSelected(slug);
      setOpen(slug);
      history.pushState({ explorer: slug }, "", `${HASH}/${encodeURIComponent(slug)}`);
      pushed.current = true;
    },
    [items],
  );

  const closeFile = useCallback(() => {
    const slug = openRef.current;
    setOpen(null);
    if (pushed.current && history.state?.explorer === slug) {
      pushed.current = false;
      history.back();
    } else {
      history.replaceState(null, "", HASH);
    }
    requestAnimationFrame(() => grid.current?.querySelector<HTMLElement>(`[data-key="${slug}"]`)?.focus());
  }, []);

  const enterFolder = (id: FolderId) => {
    setPath(id);
    setQuery("");
    setSelected(null);
    focusLater("[data-key]");
  };

  const goUp = () => {
    if (!path) return;
    const from = path;
    setPath(null);
    setQuery("");
    setSelected(`dir:${from}`);
    focusLater(`[data-key="dir:${from}"]`);
  };

  const activate = (e: Entry) => (e.type === "folder" ? enterFolder(e.id) : openFile(e.item.slug));

  // Open from the URL: on load, on #projects/<slug> links, on back/forward.
  useEffect(() => {
    const sync = (scroll: boolean) => {
      const slug = slugFromHash(location.hash);
      const item = slug ? items.find((i) => i.slug === slug) : undefined;
      if (item) {
        setSmall(isSmall());
        setQuery("");
        setPath(item.folder);
        setSelected(item.slug);
        setOpen(item.slug);
        if (scroll) frame.current?.scrollIntoView({ block: "center" });
      } else {
        setOpen(null);
      }
    };
    sync(true);
    const onHash = () => sync(true);
    const onPop = () => sync(false);
    window.addEventListener("hashchange", onHash);
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("popstate", onPop);
    };
  }, [items]);

  // Focus the window title on open; on phones the window is full screen, so lock page scroll.
  useEffect(() => {
    if (!open) return;
    windowTitle.current?.focus();
    if (!small) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, small]);

  const focusKey = (key: string) => {
    setSelected(key);
    grid.current?.querySelector<HTMLElement>(`[data-key="${CSS.escape(key)}"]`)?.focus();
  };

  const onGridKey = (e: KeyboardEvent<HTMLUListElement>) => {
    if (!entries.length) return;
    const idx = Math.max(0, entries.findIndex((x) => x.key === selected));
    const cols = view === "list" || !grid.current ? 1 : getComputedStyle(grid.current).gridTemplateColumns.split(" ").filter(Boolean).length || 1;
    const move = (to: number) => focusKey(entries[Math.min(entries.length - 1, Math.max(0, to))].key);
    const keys: Record<string, () => void> = {
      ArrowRight: () => move(idx + 1),
      ArrowLeft: () => move(idx - 1),
      ArrowDown: () => move(idx + cols),
      ArrowUp: () => move(idx - cols),
      Home: () => move(0),
      End: () => move(entries.length - 1),
      Enter: () => selEntry && activate(selEntry),
      Backspace: goUp,
    };
    const run = keys[e.key];
    if (run) {
      e.preventDefault();
      run();
    }
  };

  const onRootKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Escape") return;
    if (open) {
      e.preventDefault();
      closeFile();
    } else if (helpOpen) setHelpOpen(false);
    else if (query) setQuery("");
  };

  const tabTarget = selected && entries.some((x) => x.key === selected) ? selected : entries[0]?.key;
  const count = (n: number) => labels.objects.replace("{n}", String(n));
  const status =
    selEntry?.type === "file"
      ? `${selEntry.item.title} · ${selEntry.item.kind}`
      : selEntry?.type === "folder"
        ? `${selEntry.name} · ${count(selEntry.count)}`
        : count(entries.length);

  const projectWindow = openItem && (
    <ProjectWindow
      item={openItem}
      labels={labels}
      small={small}
      onClose={closeFile}
      titleRef={windowTitle}
      path={`${address}\\${openItem.number}_${openItem.slug}`}
    />
  );

  return (
    <div ref={frame} onKeyDown={onRootKey} className="card card-strong relative flex min-w-0 scroll-mt-24 flex-col overflow-hidden p-0 md:h-[580px]">
      {/* Title bar */}
      <div className="flex h-10 shrink-0 items-center justify-between gap-3 border-b border-line pl-4 pr-2">
        <span className="label flex min-w-0 items-center gap-2 truncate text-accent">
          <FolderGlyph className="h-4 w-4 shrink-0" />
          <span className="truncate">{address}</span>
        </span>
        <span aria-hidden="true" className="flex shrink-0 gap-1">
          {["—", "□", "×"].map((c) => (
            <span key={c} className="inline-flex h-6 w-6 items-center justify-center rounded-[3px] border border-line text-[11px] leading-none text-faint">
              {c}
            </span>
          ))}
        </span>
      </div>

      {/* Menu bar */}
      <div className="flex h-8 shrink-0 items-center gap-0.5 border-b border-line px-2 text-[13px] text-muted">
        {selEntry?.type === "file" ? (
          <a href={selEntry.item.href} className="rounded-[3px] px-2 py-0.5 hover:bg-card-2 hover:text-fg">
            <u>{labels.menu.file[0]}</u>
            {labels.menu.file.slice(1)}
          </a>
        ) : (
          <span className="px-2 py-0.5 opacity-50">
            <u>{labels.menu.file[0]}</u>
            {labels.menu.file.slice(1)}
          </span>
        )}
        <button type="button" onClick={() => setView(view === "icons" ? "list" : "icons")} className="rounded-[3px] px-2 py-0.5 hover:bg-card-2 hover:text-fg">
          <u>{labels.menu.view[0]}</u>
          {labels.menu.view.slice(1)}
        </button>
        <button type="button" onClick={() => setHelpOpen(!helpOpen)} aria-expanded={helpOpen} className="rounded-[3px] px-2 py-0.5 hover:bg-card-2 hover:text-fg">
          <u>{labels.menu.help[0]}</u>
          {labels.menu.help.slice(1)}
        </button>
        {helpOpen && <span className="label ml-2 truncate text-faint">{labels.hint}</span>}
      </div>

      {/* Toolbar */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-line p-2">
        <label className="flex h-8 min-w-0 flex-1 items-center gap-2 rounded-[3px] border border-line-strong bg-card-2 px-2">
          <FolderGlyph className="h-3.5 w-3.5 shrink-0 text-accent" />
          <span className="sr-only">{labels.root}</span>
          <select
            value={path ?? ""}
            onChange={(e) => (e.target.value ? enterFolder(e.target.value as FolderId) : goUp())}
            className="min-w-0 flex-1 bg-transparent font-mono text-[12.5px] text-fg focus:outline-none [&>option]:bg-bg"
          >
            <option value="">C:\{labels.root}</option>
            {folders.map((id) => (
              <option key={id} value={id}>
                C:\{labels.root}\{dir(id)}
              </option>
            ))}
          </select>
        </label>
        <ToolButton label={labels.up} onClick={goUp} disabled={!path}>
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </ToolButton>
        <ToolButton label={labels.viewIcons} pressed={view === "icons"} onClick={() => setView("icons")}>
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
            <rect x="4" y="4" width="6.5" height="6.5" rx="1" />
            <rect x="13.5" y="4" width="6.5" height="6.5" rx="1" />
            <rect x="4" y="13.5" width="6.5" height="6.5" rx="1" />
            <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1" />
          </svg>
        </ToolButton>
        <ToolButton label={labels.viewList} pressed={view === "list"} onClick={() => setView("list")}>
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
            <path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" />
          </svg>
        </ToolButton>
        <label className="flex h-8 w-full items-center gap-2 rounded-[3px] border border-line-strong bg-card-2 px-2 sm:w-60">
          <span className="font-mono text-accent">&gt;</span>
          <span className="sr-only">{labels.filterLabel}</span>
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(null);
            }}
            placeholder={labels.filterPlaceholder}
            className="min-w-0 flex-1 bg-transparent font-mono text-[12.5px] text-fg placeholder:text-faint focus:outline-none"
          />
        </label>
      </div>

      {/* Icons / details */}
      <div className="relative min-h-[320px] flex-1 overflow-y-auto">
        {hydrated && view === "list" && entries.length > 0 && (
          <div className="label sticky top-0 z-10 grid grid-cols-[1fr_170px] gap-4 border-b border-line bg-card-2 px-4 py-2 text-faint">
            <span>{labels.columns.name}</span>
            <span>{labels.columns.type}</span>
          </div>
        )}
        <ul
          ref={grid}
          onKeyDown={onGridKey}
          aria-label={address}
          className={view === "icons" && hydrated ? "grid grid-cols-[repeat(auto-fill,minmax(112px,1fr))] content-start gap-x-2 gap-y-3 p-4 sm:p-6" : "py-1"}
        >
          {!hydrated &&
            items.map((it) => (
              <li key={`ssr-${it.slug}`}>
                <a href={it.href} className="flex gap-3 px-4 py-2 text-[15px] hover:text-accent">
                  <span className="label text-faint">{it.number}</span>
                  {it.title}
                </a>
              </li>
            ))}
          {hydrated &&
            entries.map((e, i) => {
              const isSel = e.key === selected;
              const label = e.type === "folder" ? e.name : e.item.title;
              return (
                <li key={`${path}-${e.key}`} className="explorer-in" style={{ "--i": i } as React.CSSProperties}>
                  <a
                    href={e.type === "file" ? e.item.href : HASH}
                    data-key={e.key}
                    tabIndex={e.key === tabTarget ? 0 : -1}
                    aria-current={isSel ? "true" : undefined}
                    title={e.type === "file" ? e.item.summary : undefined}
                    onFocus={() => setSelected(e.key)}
                    onPointerDown={() => {
                      wasSelected.current = isSel;
                    }}
                    onClick={(ev) => {
                      if (e.type === "file" && (ev.metaKey || ev.ctrlKey || ev.shiftKey)) return; // open in a new tab
                      ev.preventDefault();
                      if (isSmall() || wasSelected.current) activate(e);
                      else focusKey(e.key);
                      wasSelected.current = false;
                    }}
                    onDoubleClick={(ev) => {
                      ev.preventDefault();
                      activate(e);
                    }}
                    className={
                      view === "icons"
                        ? `group flex flex-col items-center gap-2 rounded-[3px] border px-1.5 pb-2.5 pt-3 text-center outline-none transition-colors ${
                            isSel ? "border-accent/60 bg-accent/10" : "border-transparent hover:bg-card-2"
                          }`
                        : `grid grid-cols-[1fr_170px] items-center gap-4 px-4 py-2 outline-none ${isSel ? "bg-accent/10" : "hover:bg-card-2"}`
                    }
                  >
                    {view === "icons" ? (
                      <>
                        <span className={`relative flex h-16 w-16 items-center justify-center ${isSel ? "text-accent" : "text-fg/80 group-hover:text-fg"}`}>
                          {e.type === "folder" ? <FolderIcon count={e.count} /> : <FileIcon number={e.item.number} />}
                        </span>
                        <span className={`max-w-full rounded-[2px] px-1 text-[13px] leading-snug ${isSel ? "bg-accent text-accent-fg" : "text-fg"}`}>{label}</span>
                      </>
                    ) : (
                      <>
                        <span className="flex min-w-0 items-center gap-3">
                          <span className={`h-5 w-5 shrink-0 ${isSel ? "text-accent" : "text-muted"}`}>{e.type === "folder" ? <FolderGlyph /> : <FileGlyph />}</span>
                          <span className={`truncate text-[14px] ${isSel ? "text-accent" : "text-fg"}`}>
                            {e.type === "file" && <span className="label mr-2 text-faint">{e.item.number}</span>}
                            {label}
                          </span>
                        </span>
                        <span className="label truncate text-faint">{e.type === "folder" ? labels.folderType : e.item.kind}</span>
                      </>
                    )}
                  </a>
                </li>
              );
            })}
        </ul>
        {hydrated && entries.length === 0 && <p className="label px-6 py-4 text-faint">{query ? labels.noResults : labels.emptyFolder}</p>}
        {!small && projectWindow}
      </div>

      {/* Status bar */}
      <div className="label flex h-8 shrink-0 items-stretch border-t border-line text-faint">
        <span className="block min-w-0 flex-1 truncate px-4 leading-8" aria-live="polite">
          {hydrated ? status : count(items.length)}
        </span>
        <span className="hidden items-center border-l border-line px-4 md:flex">{path ? name(path) : labels.root}</span>
      </div>

      {small && projectWindow && createPortal(projectWindow, document.body)}
    </div>
  );
}

/** The open project: preview and the way to the full case study. */
function ProjectWindow({
  item,
  labels,
  small,
  onClose,
  titleRef,
  path,
}: {
  item: ExplorerItem;
  labels: Labels;
  small: boolean;
  onClose: () => void;
  titleRef: React.RefObject<HTMLHeadingElement | null>;
  path: string;
}) {
  return (
    <section
      role="dialog"
      aria-modal={small}
      aria-labelledby="explorer-window-title"
      className={
        small
          ? "explorer-window fixed inset-0 z-[60] flex flex-col overflow-hidden bg-bg"
          : "explorer-window card card-strong absolute inset-3 z-20 flex flex-col overflow-hidden p-0 sm:inset-5"
      }
    >
      <div className="flex h-10 shrink-0 items-center justify-between gap-3 border-b border-line pl-4 pr-2">
        <h3 id="explorer-window-title" ref={titleRef} tabIndex={-1} className="label min-w-0 truncate text-accent outline-none">
          {path}
        </h3>
        <button
          type="button"
          onClick={onClose}
          aria-label={labels.close}
          className="label inline-flex h-7 shrink-0 items-center gap-2 rounded-[3px] border border-line-strong px-2.5 text-fg hover:border-accent hover:text-accent"
        >
          {small ? `← ${labels.back}` : "×"}
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          {item.thumb && (
            <figure className="overflow-hidden rounded-[3px] border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element -- static export, pre-sized WebP */}
              <img src={item.thumb} alt={item.thumbAlt ?? ""} className="aspect-[16/10] w-full object-cover object-left-top" />
              <figcaption className="label border-t border-line px-3 py-2 text-faint">{labels.mockNote}</figcaption>
            </figure>
          )}
          <div className="flex flex-col">
            <p className="label text-accent">
              {item.number} · {item.kind}
            </p>
            <p className="mt-3 text-[26px] leading-tight tracking-tight">{item.title}</p>
            <p className="mt-3 text-pretty text-[15px] leading-relaxed text-muted">{item.summary}</p>
            <div className="mt-5 flex items-baseline gap-3 border-t border-line pt-4">
              <span className="font-mono text-[26px] font-light leading-none text-accent">{item.metric.value}</span>
              <span className="text-sm text-muted">
                {item.metric.label}
                {item.metric.basis && <span className="label ml-2 rounded-[3px] border border-line-strong px-1.5 py-px text-faint">{item.metric.basis}</span>}
              </span>
            </div>
            <p className="label mt-5 text-faint">{item.stack.join(" · ")}</p>
            <div className="mt-6 flex flex-wrap gap-3 lg:mt-auto lg:pt-6">
              <a href={item.href} className="label inline-flex h-9 items-center gap-2 rounded-[3px] bg-cta px-3.5 text-cta-fg transition hover:opacity-90">
                {labels.viewCase} <ArrowRight className="h-3.5 w-3.5" />
              </a>
              {item.github && (
                <a href={item.github} target="_blank" rel="noopener noreferrer" className="label inline-flex h-9 items-center gap-2 rounded-[3px] border border-line-strong px-3.5 text-fg transition hover:bg-fg hover:text-bg">
                  <GitHubIcon className="h-3.5 w-3.5" /> {labels.code}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ToolButton({ label, onClick, disabled, pressed, children }: { label: string; onClick: () => void; disabled?: boolean; pressed?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[3px] border transition-colors disabled:opacity-35 ${
        pressed ? "border-accent text-accent" : "border-line-strong text-muted hover:border-fg hover:text-fg"
      }`}
    >
      {children}
    </button>
  );
}

/* ── Icons: modern line icons, accent where it matters ───────── */

function FolderIcon({ count }: { count: number }) {
  return (
    <svg viewBox="0 0 56 56" className="h-full w-full" fill="none" aria-hidden="true">
      <path d="M6 15.5a3.5 3.5 0 0 1 3.5-3.5h11.2l4.6 5.2h21.2A3.5 3.5 0 0 1 50 20.7V41a3.5 3.5 0 0 1-3.5 3.5h-37A3.5 3.5 0 0 1 6 41Z" fill="var(--accent)" fillOpacity="0.14" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M6 23h44" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1.2" />
      <text x="44" y="39" textAnchor="end" fontFamily="var(--font-geist-mono), monospace" fontSize="9" fill="currentColor" fillOpacity="0.7">
        {count}
      </text>
    </svg>
  );
}

function FileIcon({ number }: { number: string }) {
  return (
    <svg viewBox="0 0 56 56" className="h-full w-full" fill="none" aria-hidden="true">
      <path d="M14 6h19l10 10v31a3 3 0 0 1-3 3H14a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3Z" fill="var(--card-2)" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M33 6v10h10" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M17 26h20M17 32h20M17 38h12" stroke="currentColor" strokeOpacity="0.4" strokeWidth="1.4" strokeLinecap="round" />
      <rect x="27" y="40" width="18" height="11" rx="2" fill="var(--accent)" />
      <text x="36" y="48.2" textAnchor="middle" fontFamily="var(--font-geist-mono), monospace" fontSize="8" fill="var(--accent-fg)">
        {number}
      </text>
    </svg>
  );
}

function FolderGlyph({ className = "h-full w-full" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h4.8l2 2.2h8.2A1.5 1.5 0 0 1 21 9.7V17.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5Z" />
    </svg>
  );
}

function FileGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
      <path d="M6.5 3h7.5l4.5 4.5V20a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M14 3v4.5h4.5M8.5 12h7M8.5 15.5h7" />
    </svg>
  );
}
