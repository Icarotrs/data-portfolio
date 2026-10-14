/**
 * Which page section is in view ("intro", "projects", "services",
 * "contact"…). Only used to highlight the side menu.
 */

let section = "intro";
const listeners = new Set<() => void>();

export const sectionStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  get: () => section,
  set(next: string) {
    if (next === section) return;
    section = next;
    listeners.forEach((l) => l());
  },
};
