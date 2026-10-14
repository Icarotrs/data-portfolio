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
      className="filter-box absolute border border-line-strong"
      style={{ left: `${box.x}%`, top: `${box.y}%`, width: `${box.w}%`, height: `${box.h}%` }}
    >
      <span className="absolute -top-px left-[-1px] -translate-y-full bg-fg px-1.5 py-px font-mono text-[9px] uppercase leading-tight tracking-widest text-bg">
        {box.label ?? box.filter} · {String(index + 1).padStart(2, "0")}
      </span>
      <span className="absolute -bottom-[3px] -right-[3px] h-[5px] w-[5px] bg-fg" />
    </div>
  );
}
