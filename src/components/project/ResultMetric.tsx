import type { Project } from "@/lib/content";

export function ResultMetric({ project }: { project: Project }) {
  return (
    <div className="glass reveal rounded-2xl p-6">
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">Result</p>
      <p className="text-silver mt-3 font-mono text-5xl font-light tracking-tight">{project.metric.value}</p>
      <p className="mt-2 text-sm text-muted">{project.metric.label}</p>
      <p className="mt-5 border-t border-line pt-4 text-pretty text-sm leading-relaxed">
        {project.result}
      </p>
    </div>
  );
}
