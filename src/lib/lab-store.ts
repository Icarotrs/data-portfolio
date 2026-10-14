/**
 * Interactive background state ("lab"):
 *   - filter panel positions the visitor dragged (saved in localStorage)
 *   - images the visitor added (kept in memory as object URLs; never uploaded)
 *
 * Positions are percentages of the viewport, like site.config.ts.
 */

export type BoxSet = "desktop" | "tablet" | "mobile";

export interface Point {
  x: number;
  y: number;
}

export interface UserImage {
  id: string;
  url: string;
  name: string;
  /** width / height of the image */
  aspect: number;
  x: number;
  y: number;
  /** width in % of the viewport width */
  w: number;
}

interface LabState {
  boxes: Partial<Record<BoxSet, Record<number, Point>>>;
  images: UserImage[];
}

const STORAGE_KEY = "lab-boxes";
export const MAX_IMAGES = 4;

let state: LabState = { boxes: {}, images: [] };
let loaded = false;
const listeners = new Set<() => void>();

function emit(next: LabState) {
  state = next;
  listeners.forEach((l) => l());
  // Tell the WebGL engine that DOM rectangles moved.
  window.dispatchEvent(new Event("bg:layout"));
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.boxes));
  } catch {
    // Storage can be blocked; positions then last for this page view only.
  }
}

export const labStore = {
  subscribe(listener: () => void) {
    if (!loaded) {
      loaded = true;
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
        if (saved && typeof saved === "object") state = { ...state, boxes: saved };
      } catch {}
    }
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  get: () => state,

  moveBox(set: BoxSet, index: number, p: Point) {
    emit({ ...state, boxes: { ...state.boxes, [set]: { ...state.boxes[set], [index]: p } } });
    save();
  },

  resetLayout() {
    emit({ ...state, boxes: {} });
    save();
  },

  addImage(file: File): Promise<void> {
    if (state.images.length >= MAX_IMAGES) return Promise.resolve();
    const url = URL.createObjectURL(file);
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const n = state.images.length;
        emit({
          ...state,
          images: [
            ...state.images,
            {
              id: `${Date.now()}-${n}`,
              url,
              name: file.name,
              aspect: img.naturalWidth / img.naturalHeight || 1,
              // Cascade new images near the left of the central column.
              x: 8 + n * 3,
              y: 22 + n * 6,
              w: 22,
            },
          ],
        });
        resolve();
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Not a readable image"));
      };
      img.src = url;
    });
  },

  moveImage(id: string, p: Point) {
    emit({ ...state, images: state.images.map((im) => (im.id === id ? { ...im, ...p } : im)) });
  },

  removeImage(id: string) {
    const target = state.images.find((im) => im.id === id);
    if (target) URL.revokeObjectURL(target.url);
    emit({ ...state, images: state.images.filter((im) => im.id !== id) });
  },
};
