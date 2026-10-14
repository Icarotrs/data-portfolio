import type { ShapeId } from "@site";

/**
 * Tiny external store for "which 3D shape is in the background".
 * Pages set a default shape; hovering/focusing a project card overrides it.
 * React reads it with useSyncExternalStore, the WebGL engine subscribes
 * directly — no React re-render is needed to change the scene.
 */

interface ShapeState {
  page: ShapeId;
  hover: ShapeId | null;
  /** Index (1-based) of the hovered project, for the chrome counter. */
  hoverIndex: number | null;
}

let state: ShapeState = { page: "home", hover: null, hoverIndex: null };
const listeners = new Set<() => void>();

function emit(next: ShapeState) {
  state = next;
  listeners.forEach((l) => l());
}

export const shapeStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getState: () => state,
  getActive: (): ShapeId => state.hover ?? state.page,
  setPage(page: ShapeId) {
    if (page !== state.page || state.hover) emit({ page, hover: null, hoverIndex: null });
  },
  setHover(hover: ShapeId | null, hoverIndex: number | null = null) {
    if (hover !== state.hover || hoverIndex !== state.hoverIndex) {
      emit({ ...state, hover, hoverIndex });
    }
  },
};
