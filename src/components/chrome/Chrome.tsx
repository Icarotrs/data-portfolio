import { CornerDate } from "./CornerDate";
import { AxisGizmo } from "./AxisGizmo";
import { SectionReadout } from "./SectionReadout";

/**
 * Decorative "instrument" details fixed to the viewport: crop marks,
 * a side ruler, date, axis gizmo and section readout.
 * Purely visual — hidden from assistive tech.
 */
export function Chrome() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-10 select-none">
      {/* Crop marks */}
      <span className="absolute left-2 top-2 h-3 w-3 border-l border-t border-line-strong" />
      <span className="absolute right-2 top-2 h-3 w-3 border-r border-t border-line-strong" />
      <span className="absolute bottom-2 left-2 h-3 w-3 border-b border-l border-line-strong" />
      <span className="absolute bottom-2 right-2 h-3 w-3 border-b border-r border-line-strong" />

      {/* Side ruler */}
      <div className="absolute bottom-24 left-4 top-24 hidden w-3 xl:block">
        <div className="absolute inset-y-0 left-0 border-l border-line" />
        <div
          className="absolute inset-y-0 left-0 w-2"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to bottom, var(--line-strong) 0 1px, transparent 1px 24px)",
          }}
        />
        <div
          className="absolute inset-y-0 left-0 w-3"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to bottom, var(--line-strong) 0 1px, transparent 1px 120px)",
          }}
        />
      </div>

      <div className="absolute bottom-5 left-5 hidden items-end gap-4 xl:flex">
        <AxisGizmo />
        <SectionReadout />
      </div>

      <div className="absolute bottom-5 right-6 hidden flex-col items-end gap-1 text-right font-mono text-[10px] uppercase tracking-widest text-faint xl:flex">
        <CornerDate />
      </div>
    </div>
  );
}
