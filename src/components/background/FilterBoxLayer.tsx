import { site, type FilterBox } from "@site";

const sets: { key: keyof typeof site.filterBoxes; className: string }[] = [
  { key: "desktop", className: "hidden lg:block" },
  { key: "tablet", className: "hidden sm:block lg:hidden" },
  { key: "mobile", className: "block sm:hidden" },
];

/**
 * The filter boxes as real DOM elements. These are the source of truth:
 * the WebGL engine reads their on-screen rectangles and applies each box's
 * filter to that region of the background. CSS decides which set is
 * visible per breakpoint.
 */
export function FilterBoxLayer() {
  return (
    <>
      {sets.map(({ key, className }) => (
        <div key={key} className={`absolute inset-0 ${className}`}>
          {site.filterBoxes[key].map((box, i) => (
            <Box key={i} box={box} index={i} />
          ))}
        </div>
      ))}
    </>
  );
}

function Box({ box, index }: { box: FilterBox; index: number }) {
  return (
    <div
      data-filter-box
      data-filter={box.filter}
      className="absolute rounded-[3px] border border-[color-mix(in_srgb,var(--on-bg)_16%,transparent)]"
      style={{ left: `${box.x}%`, top: `${box.y}%`, width: `${box.w}%`, height: `${box.h}%` }}
    >
      <span className="absolute left-2 top-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-[color-mix(in_srgb,var(--on-bg)_55%,transparent)]">
        {box.label ?? box.filter} / {String(index + 1).padStart(2, "0")}
      </span>
    </div>
  );
}
