"use client";

import { useId, useRef, useState, useSyncExternalStore, type DragEvent } from "react";
import { labStore, MAX_IMAGES } from "@/lib/lab-store";

/**
 * Lets visitors drop their own images into the background, where the
 * filter panels process them. Images stay in the browser (object URLs);
 * nothing is uploaded anywhere.
 */
export function ImageLab() {
  const { images } = useSyncExternalStore(labStore.subscribe, labStore.get, labStore.get);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const full = images.length >= MAX_IMAGES;

  async function add(files: FileList | null) {
    setError(null);
    const list = Array.from(files ?? []).filter((f) => f.type.startsWith("image/"));
    if (list.length === 0 && files?.length) setError("That file is not an image.");
    for (const file of list.slice(0, MAX_IMAGES - images.length)) {
      try {
        await labStore.addImage(file);
      } catch {
        setError(`Could not read ${file.name}.`);
      }
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (!full) add(e.dataTransfer.files);
  }

  return (
    <section id="lab" data-section="lab" aria-labelledby="lab-title" className="scroll-mt-24">
      <div className="glass p-7 sm:p-9">
        <p className="label text-accent">Image lab</p>
        <h2 id="lab-title" className="mt-4 text-[22px] leading-tight tracking-tight">
          Put your own image under the effect panels
        </h2>
        <p className="mt-2 text-pretty text-[15px] leading-relaxed text-muted">
          Add an image and it appears in the background. Drag it, and the panels, around the screen to see dither,
          ASCII, halftone and the other filters process it live.
        </p>

        <label
          htmlFor={inputId}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`mt-6 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[6px] border border-dashed px-4 py-8 text-center transition-colors ${
            dragOver ? "border-accent bg-[color-mix(in_srgb,var(--accent)_10%,transparent)]" : "border-line-strong hover:border-accent"
          } ${full ? "pointer-events-none opacity-60" : ""}`}
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6 text-accent" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <circle cx="9" cy="10" r="2" />
            <path d="m21 16-5-5-9 9" />
          </svg>
          <span className="text-[15px]">{full ? `Limit of ${MAX_IMAGES} images reached` : "Drop an image here or choose a file"}</span>
          <span className="label text-faint">PNG, JPG, WebP · stays in your browser</span>
        </label>
        <input
          ref={input}
          id={inputId}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          disabled={full}
          onChange={(e) => {
            add(e.target.files);
            e.target.value = "";
          }}
        />
        {error && (
          <p role="alert" className="mt-3 text-sm text-accent">
            {error}
          </p>
        )}

        {images.length > 0 && (
          <ul className="mt-5 flex flex-col gap-2 border-t border-line pt-4">
            {images.map((im, i) => (
              <li key={im.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate">
                  <span className="label mr-2 text-faint">{String(i + 1).padStart(2, "0")}</span>
                  {im.name}
                </span>
                <button type="button" onClick={() => labStore.removeImage(im.id)} className="label text-muted hover:text-accent">
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <p className="label text-faint">Drag with the mouse · touch the label tab · or Tab + arrow keys</p>
          <button type="button" onClick={() => labStore.resetLayout()} className="label text-muted hover:text-accent">
            Reset panels
          </button>
        </div>
      </div>
    </section>
  );
}
