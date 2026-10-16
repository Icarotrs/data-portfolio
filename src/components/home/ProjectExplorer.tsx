"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { FolderId } from "@site";
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

export interface ExplorerLabels {
  folders: Record<FolderId, string>;
  foldersNav: string;
  close: string;
  viewCase: string;
  code: string;
  mockNote: string;
  file: string;
}

const HASH = "#projects";
const slugFromHash = (hash: string) => (hash.startsWith(`${HASH}/`) ? decodeURIComponent(hash.slice(HASH.length + 1)) : null);

/**
 * Projects filed like a classic file explorer, reduced to the essentials:
 * a folder tree on the left and the project files on the right, each with
 * its own line icon. Clicking a file opens it in a pop-up window. Orange
 * only marks the active folder and hover.
 *
 * Every file is a real link to its project page (works without JavaScript
 * and with "open in new tab"); a plain click opens the pop-up instead. An
 * open file is #projects/<slug> in the URL, so it can be shared and the
 * back button closes it. Esc or a click outside closes it too.
 */
export function ProjectExplorer({ items, folders, labels }: { items: ExplorerItem[]; folders: FolderId[]; labels: ExplorerLabels }) {
  // Only folders that have something in them.
  const visibleFolders = useMemo(() => folders.filter((f) => items.some((i) => i.folder === f)), [folders, items]);
  const [folder, setFolder] = useState<FolderId>(visibleFolders[0]);
  const [open, setOpen] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const pushed = useRef(false);
  const lastFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- portals need document.body, which exists only after mount
    setMounted(true);
  }, []);

  const files = items.filter((i) => i.folder === folder);
  const openItem = open ? items.find((i) => i.slug === open) ?? null : null;

  const openFile = useCallback((slug: string) => {
    lastFocus.current = document.activeElement as HTMLElement | null;
    setOpen(slug);
    history.pushState({ explorer: slug }, "", `${HASH}/${encodeURIComponent(slug)}`);
    pushed.current = true;
  }, []);

  const closeFile = useCallback(() => {
    setOpen(null);
    if (pushed.current && history.state?.explorer) {
      pushed.current = false;
      history.back();
    } else {
      history.replaceState(null, "", HASH);
    }
    requestAnimationFrame(() => lastFocus.current?.focus());
  }, []);

  // Open from the URL (shared links, "back" and "forward").
  useEffect(() => {
    const sync = () => {
      const slug = slugFromHash(location.hash);
      const item = slug ? items.find((i) => i.slug === slug) : undefined;
      if (item) {
        setFolder(item.folder);
        setOpen(item.slug);
      } else {
        setOpen(null);
      }
    };
    sync();
    window.addEventListener("popstate", sync);
    window.addEventListener("hashchange", sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("hashchange", sync);
    };
  }, [items]);

  // While the pop-up is open: Esc closes it and the page behind does not scroll.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeFile();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, closeFile]);

  return (
    <div className="card card-strong grid overflow-hidden p-0 md:min-h-[400px] md:grid-cols-[220px_minmax(0,1fr)]">
      {/* Folder tree */}
      <nav
        aria-label={labels.foldersNav}
        className="grid grid-cols-2 gap-1 border-b border-line p-3 md:flex md:flex-col md:gap-0.5 md:border-b-0 md:border-r md:px-4 md:py-8"
      >
        {visibleFolders.map((f) => {
          const active = f === folder;
          return (
            <button
              key={f}
              type="button"
              aria-pressed={active}
              onClick={() => setFolder(f)}
              className={`grid grid-cols-[10px_22px_minmax(0,1fr)] items-center gap-2 px-2 py-2 text-left font-mono text-[10.5px] uppercase tracking-[0.06em] transition-colors ${
                active ? "text-fg" : "text-faint hover:text-fg"
              }`}
            >
              <span aria-hidden="true" className={`text-[14px] leading-none transition-transform ${active ? "rotate-90 text-accent" : ""}`}>
                ›
              </span>
              <FolderIcon open={active} />
              <span className="leading-snug">{labels.folders[f]}</span>
            </button>
          );
        })}
      </nav>

      {/* Files */}
      <ul key={folder} className="grid grid-cols-2 content-center gap-x-4 gap-y-8 px-4 py-8 sm:grid-cols-3 sm:px-10 md:py-12">
        {files.map((it, i) => (
          <li key={it.slug} className="explorer-in min-w-0" style={{ "--i": i } as React.CSSProperties}>
            <a
              href={it.href}
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; // new tab / window
                e.preventDefault();
                openFile(it.slug);
              }}
              className="group flex flex-col items-center gap-3 px-1 py-2 text-center text-muted transition-[color,transform] duration-200 hover:-translate-y-0.5 hover:text-fg focus-visible:text-fg"
            >
              <span className="h-[66px] w-[58px] text-faint transition-colors duration-200 group-hover:text-accent group-focus-visible:text-accent">
                <FileIcon slug={it.slug} />
              </span>
              <span className="w-full font-mono text-[11px] leading-snug">{it.title}</span>
            </a>
          </li>
        ))}
      </ul>

      {mounted && openItem && createPortal(<ProjectWindow item={openItem} labels={labels} onClose={closeFile} />, document.body)}
    </div>
  );
}

/** The opened file: orange title bar, the screen on the left, the project on the right. */
function ProjectWindow({ item, labels, onClose }: { item: ExplorerItem; labels: ExplorerLabels; onClose: () => void }) {
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => title.current?.focus(), []);
  return (
    <div
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="explorer-backdrop fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-[rgb(8_3_2/0.78)] p-3 backdrop-blur-[9px] sm:p-6"
    >
      <article
        role="dialog"
        aria-modal="true"
        aria-labelledby="explorer-title"
        className="explorer-window w-full max-w-[880px] border border-accent/50 bg-bg shadow-[0_35px_100px_rgb(0_0_0/0.7)]"
      >
        <div className="flex h-10 items-center justify-between bg-accent pl-4 text-accent-fg">
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.04em]">
            {labels.file}_{item.number}.EXE
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label={labels.close}
            className="inline-flex h-full w-11 items-center justify-center border-l border-black/25 transition-colors hover:bg-fg hover:text-bg"
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="m3 3 10 10M13 3 3 13" />
            </svg>
          </button>
        </div>
        <div className="grid md:grid-cols-2">
          <div className="relative border-b border-line md:border-b-0 md:border-r">
            {item.thumb ? (
              // eslint-disable-next-line @next/next/no-img-element -- static export, pre-sized WebP
              <img src={item.thumb} alt={item.thumbAlt ?? ""} className="aspect-[16/10] w-full object-cover object-left-top md:absolute md:inset-0 md:aspect-auto md:h-full" />
            ) : (
              <div className="flex aspect-[16/10] items-center justify-center text-accent md:h-full">
                <span className="h-32 w-28">
                  <FileIcon slug={item.slug} />
                </span>
              </div>
            )}
            <p className="label absolute bottom-3 left-3 right-3 text-[10px] text-faint">
              <span className="bg-bg/85 px-1.5 py-0.5 [box-decoration-break:clone]">{labels.mockNote}</span>
            </p>
          </div>
          <div className="flex flex-col p-6 sm:p-9">
            <p className="label text-accent">
              {item.number} / {item.kind}
            </p>
            <h3 id="explorer-title" ref={title} tabIndex={-1} style={{ outline: "none" }} className="mt-4 text-[28px] leading-[1.1] tracking-tight sm:text-[32px]">
              {item.title}
            </h3>
            <p className="mt-4 text-pretty text-[15px] leading-relaxed text-muted">{item.summary}</p>
            <ul className="mt-5 flex flex-wrap gap-1.5">
              {item.stack.map((s) => (
                <li key={s} className="label border border-line-strong px-2 py-1 text-faint">
                  {s}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex items-baseline gap-3 border-t border-line pt-5">
              <span className="font-mono text-[24px] font-light leading-none text-accent">{item.metric.value}</span>
              <span className="text-[13px] leading-snug text-muted">
                {item.metric.label}
                {item.metric.basis && <span className="label ml-2 border border-line-strong px-1.5 py-px text-faint">{item.metric.basis}</span>}
              </span>
            </div>
            <div className="mt-7 flex flex-wrap gap-3 md:mt-auto md:pt-7">
              <a href={item.href} className="label inline-flex h-10 items-center gap-2 bg-accent px-4 text-accent-fg transition hover:opacity-90">
                {labels.viewCase} <ArrowRight className="h-3.5 w-3.5" />
              </a>
              {item.github && (
                <a
                  href={item.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="label inline-flex h-10 items-center gap-2 border border-line-strong px-4 text-fg transition hover:border-fg"
                >
                  <GitHubIcon className="h-3.5 w-3.5" /> {labels.code}
                </a>
              )}
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}

/* ── Icons: thin line drawings. A file sheet, with a symbol for each project. ── */

function FolderIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 20" className={`h-[18px] w-[22px] ${open ? "text-accent" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" aria-hidden="true">
      {open ? <path d="M1.5 4.5h7l2 2h8v2.5M1.5 4.5V17h17.5l3-8H5.5l-3.5 8" /> : <path d="M1.5 3.5h7l2 2.5h11.5V17h-20.5Z" />}
    </svg>
  );
}

const SHEET = "M10 8h35l9 9v47H10V8Z";
const FOLD = "M45 8v10h9";

/** The symbol on each project's file, by slug; any other project gets plain text lines. */
const SYMBOLS: Record<string, ReactNode> = {
  // an order arrives and the team is alerted: a bell
  "shopify-ai-order-alerts": (
    <>
      <path d="M32 26v-2M24 44V35a8 8 0 0 1 16 0v9l3 4H21l3-4Z" />
      <path d="M29 51a3 3 0 0 0 6 0M44 29a8 8 0 0 1 2 5M20 29a8 8 0 0 0-2 5" />
    </>
  ),
  // a form written into a sheet: fields and a check
  "form-to-sheet-automation": (
    <>
      <path d="M19 27h26M19 35h26M19 43h14" />
      <path d="M37 47l3 3 6-7" />
    </>
  ),
  // stock levels against a threshold
  "low-stock-alerts": (
    <>
      <path d="M21 50V38M30 50V32M39 50V44" />
      <path d="M17 40h30" strokeDasharray="2 3" />
    </>
  ),
  // reviews read by AI: a speech bubble with a spark
  "ai-review-classifier": (
    <>
      <path d="M18 28h26v15H28l-6 5v-5h-4Z" />
      <path d="M31 31.5v8M27 35.5h8" />
    </>
  ),
  // messy files in, one clean table out: a funnel
  "messy-data-extractor": <path d="M18 27h28l-11 12v9l-6 3V39Z" />,
  // profit over time: a rising line on a base
  "ecommerce-profit-roas-dashboard": (
    <>
      <path d="M18 50h28" />
      <path d="M19 44l7-7 6 4 9-11 4 3" />
    </>
  ),
};

function FileIcon({ slug }: { slug: string }) {
  return (
    <svg viewBox="0 0 64 72" className="h-full w-full" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={SHEET} />
      <path d={FOLD} />
      {SYMBOLS[slug] ?? <path d="M19 30h26M19 38h26M19 46h16" />}
    </svg>
  );
}
