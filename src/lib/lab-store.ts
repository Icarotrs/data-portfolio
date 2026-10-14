/**
 * Interactive background state ("lab"):
 *   - filter panel positions the visitor dragged (saved in localStorage)
 *   - the position of the small "add image" card
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
  /** Position of the "add image" card, % of the viewport. */
  slot: Point;
}

const DEFAULT_SLOT: Point = { x: 2.5, y: 36 };

const STORAGE_KEY = "lab-boxes";
export const MAX_IMAGES = 4;

let state: LabState = { boxes: {}, images: [], slot: DEFAULT_SLOT };
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

  moveSlot(p: Point) {
    emit({ ...state, slot: p });
  },

  resetLayout() {
    emit({ ...state, boxes: {}, slot: DEFAULT_SLOT });
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
              // Cascade new images next to the "add image" card.
              x: Math.min(state.slot.x + 13 + n * 3, 70),
              y: Math.min(Math.max(state.slot.y - 10 + n * 6, 2), 70),
              w: 20,
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
