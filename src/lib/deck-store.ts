/**
 * Which home panel is showing. The URL hash is the source of truth
 * (#projects, #services, #contact; empty = intro), so links like
 * "/#projects" from other pages open the right panel and the browser's
 * back button works.
 */

export const PANELS = ["intro", "projects", "services", "contact"] as const;
export type Panel = (typeof PANELS)[number];

function read(): Panel {
  const id = location.hash.slice(1);
  return (PANELS as readonly string[]).includes(id) ? (id as Panel) : "intro";
}

export const deckStore = {
  subscribe(listener: () => void) {
    addEventListener("hashchange", listener);
    addEventListener("popstate", listener);
    return () => {
      removeEventListener("hashchange", listener);
      removeEventListener("popstate", listener);
    };
  },
  get: read,
  getServer: (): Panel => "intro",
  go(panel: Panel) {
    if (read() === panel) return;
    history.pushState(null, "", panel === "intro" ? location.pathname + location.search : `#${panel}`);
    dispatchEvent(new PopStateEvent("popstate"));
  },
};
