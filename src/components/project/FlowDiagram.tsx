import type { FlowStep } from "@/lib/content";

/**
 * A project's flow as numbered steps joined by connectors, with a pulse
 * running along each connector. Horizontal on large screens, vertical on
 * small ones. Pure HTML/CSS.
 */
export function FlowDiagram({ steps, title }: { steps: FlowStep[]; title: string }) {
  return (
    <figure className="card p-7 sm:p-9">
      <figcaption className="label text-faint">{title}</figcaption>
      <ol className="mt-6 flex flex-col lg:flex-row lg:items-stretch">
        {steps.map((s, i) => (
          <li key={i} className="flex flex-col lg:flex-1 lg:flex-row lg:items-center">
            <div className="flex-1 rounded-[3px] border border-line-strong bg-card-2 p-4">
              <p className="label text-accent">
                {String(i + 1).padStart(2, "0")} · {s.tool}
              </p>
              <p className="mt-2 text-[15px] leading-snug">{s.label}</p>
            </div>
            {i < steps.length - 1 && (
              <span aria-hidden="true" className="flow-link" style={{ animationDelay: `${i * 0.4}s` }} />
            )}
          </li>
        ))}
      </ol>
    </figure>
  );
}
