"use client";

import { useId, useState, useSyncExternalStore, type DragEvent } from "react";
import { usePathname } from "next/navigation";
import { labStore, MAX_IMAGES, type UserImage } from "@/lib/lab-store";
import { useDraggable } from "@/lib/use-draggable";

/**
 * Home page only (large screens): a small "add image" card plus a frame
 * for each image the visitor added. The WebGL engine draws each image into
 * the background at its frame's rectangle, so the filter panels apply to
 * it. Without WebGL the <img> inside the frame is shown instead. Images
 * stay in the browser; nothing is uploaded.
 */
export function UserImageLayer() {
  const pathname = usePathname();
  const { images } = useSyncExternalStore(labStore.subscribe, labStore.get, labStore.get);
  if (pathname !== "/") return null;
  return (
    <div className="pointer-events-none absolute inset-0 hidden lg:block">
      <UploadSlot full={images.length >= MAX_IMAGES} />
      {images.map((image, i) => (
        <Frame key={image.id} image={image} index={i} />
      ))}
    </div>
  );
}

const SLOT_W = 11; // % of viewport width

function UploadSlot({ full }: { full: boolean }) {
  const { slot } = useSyncExternalStore(labStore.subscribe, labStore.get, labStore.get);
  const [over, setOver] = useState(false);
  const [error, setError] = useState(false);
  const inputId = useId();
  const h = typeof window === "undefined" ? 15 : ((SLOT_W * 0.8) * innerWidth) / innerHeight;
  const drag = useDraggable({ enabled: true, position: slot, size: { w: SLOT_W, h }, onMove: labStore.moveSlot });

  async function add(files: FileList | null) {
    setError(false);
    for (const file of Array.from(files ?? []).filter((f) => f.type.startsWith("image/"))) {
      if (labStore.get().images.length >= MAX_IMAGES) break;
      await labStore.addImage(file).catch(() => setError(true));
    }
  }

  return (
    <div
      {...drag}
      role="group"
      aria-roledescription="movable card"
      aria-label="Add your own image under the effect panels. Use the arrow keys to move this card."
      onDragOver={(e: DragEvent) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e: DragEvent) => {
        e.preventDefault();
        setOver(false);
        if (!full) add(e.dataTransfer.files);
      }}
      className={`pointer-events-auto absolute cursor-grab border border-dashed bg-[color-mix(in_srgb,var(--bg)_70%,transparent)] active:cursor-grabbing ${
        over ? "border-accent" : "border-[color-mix(in_srgb,var(--accent)_60%,transparent)]"
      }`}
      style={{ left: `${slot.x}%`, top: `${slot.y}%`, width: `${SLOT_W}%`, aspectRatio: "5 / 4" }}
    >
      <div
        data-drag-handle
        className="label absolute inset-x-0 -top-px flex -translate-y-full touch-none items-center justify-between gap-2 bg-accent px-2 py-0.5 text-[9px] text-accent-fg"
      >
        <span>Image / add</span>
        <button type="button" onClick={() => labStore.resetLayout()} className="hover:opacity-70" title="Put the panels back">
          Reset
        </button>
      </div>
      <label
        htmlFor={inputId}
        className={`flex h-full cursor-pointer flex-col items-center justify-center gap-1.5 p-2 text-center ${full ? "pointer-events-none opacity-50" : ""}`}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-accent" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <circle cx="9" cy="10" r="2" />
          <path d="m21 16-5-5-9 9" />
        </svg>
        <span className="text-xs leading-tight text-on-bg">{full ? "Limit reached" : "Drop or click to add an image"}</span>
        <span className="label text-[9px] leading-tight text-on-bg-muted">{error ? "Could not read file" : "Drag it under a panel"}</span>
      </label>
      <input
        id={inputId}
        type="file"
        accept="image/*"
        multiple
        disabled={full}
        className="sr-only"
        onChange={(e) => {
          add(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function Frame({ image, index }: { image: UserImage; index: number }) {
  const h = typeof window === "undefined" ? 20 : ((image.w / image.aspect) * innerWidth) / innerHeight;
  const drag = useDraggable({
    enabled: true,
    position: image,
    size: { w: image.w, h },
    onMove: (p) => labStore.moveImage(image.id, p),
  });
  return (
    <div
      data-user-image
      data-src={image.url}
      {...drag}
      role="group"
      aria-roledescription="movable image"
      aria-label={`Your image ${image.name}. Use the arrow keys to move it.`}
      className="pointer-events-auto absolute cursor-grab border border-accent active:cursor-grabbing"
      style={{ left: `${image.x}%`, top: `${image.y}%`, width: `${image.w}%`, aspectRatio: String(image.aspect) }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- local object URL */}
      <img src={image.url} alt="" className="user-image-img h-full w-full object-cover" draggable={false} />
      <div
        data-drag-handle
        className="label absolute inset-x-0 -top-px flex -translate-y-full touch-none items-center justify-between gap-2 bg-accent px-2 py-0.5 text-[9px] text-accent-fg"
      >
        <span className="truncate">Image / {String(index + 1).padStart(2, "0")}</span>
        <button
          type="button"
          onClick={() => labStore.removeImage(image.id)}
          aria-label={`Remove ${image.name}`}
          className="-mr-1 px-1 hover:opacity-70"
        >
          ×
        </button>
      </div>
    </div>
  );
}
