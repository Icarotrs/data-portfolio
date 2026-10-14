"use client";

import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { labStore, type UserImage } from "@/lib/lab-store";
import { useDraggable } from "@/lib/use-draggable";

/**
 * Frames for images the visitor added in the Image lab (home page only).
 * The WebGL engine draws each image into the background at its frame's
 * rectangle, so the filter panels apply to it. Without WebGL the <img>
 * inside the frame is shown instead.
 */
export function UserImageLayer() {
  const pathname = usePathname();
  const { images } = useSyncExternalStore(labStore.subscribe, labStore.get, labStore.get);
  if (pathname !== "/" || images.length === 0) return null;
  return (
    <div className="pointer-events-none absolute inset-0">
      {images.map((image, i) => (
        <Frame key={image.id} image={image} index={i} />
      ))}
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
        <span className="truncate">
          Image / {String(index + 1).padStart(2, "0")}
        </span>
        <button
          type="button"
          onClick={() => labStore.removeImage(image.id)}
          aria-label={`Remove ${image.name}`}
          className="pointer-events-auto -mr-1 px-1 hover:opacity-70"
        >
          ×
        </button>
      </div>
    </div>
  );
}
