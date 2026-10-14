import type { IconTheme } from "@site";

/**
 * Which section theme is in view. Sections are tracked on scroll by
 * SectionObserver; the WebGL engine subscribes directly and the chrome reads
 * it with useSyncExternalStore.
 */

interface SceneState {
  theme: IconTheme;
  /** 1-based index of the section in view and the number of sections. */
  section: number;
  sections: number;
}

let state: SceneState = { theme: "intro", section: 1, sections: 1 };
const listeners = new Set<() => void>();

export const sceneStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getState: () => state,
  set(next: Partial<SceneState>) {
    const merged = { ...state, ...next };
    if (
      merged.theme === state.theme &&
      merged.section === state.section &&
      merged.sections === state.sections
    ) {
      return;
    }
    state = merged;
    listeners.forEach((l) => l());
  },
};
