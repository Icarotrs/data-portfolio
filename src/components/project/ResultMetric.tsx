import type { Project } from "@/lib/content";

export function ResultMetric({ project }: { project: Project }) {
  return (
    <div className="glass reveal p-7 sm:p-8">
      <p className="label text-faint">Result</p>
      <p className="mt-4 font-mono text-[40px] font-light leading-none tracking-tight">{project.metric.value}</p>
      <p className="mt-3 text-sm text-muted">{project.metric.label}</p>
      <p className="mt-5 border-t border-line pt-4 text-pretty text-[15px] leading-relaxed">{project.result}</p>
    </div>
  );
}
