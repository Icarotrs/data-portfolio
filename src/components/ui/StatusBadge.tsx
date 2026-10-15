/** "In progress" seal for projects whose build is not finished yet. */
export function StatusBadge({ label }: { label: string }) {
  return (
    <span className="label inline-flex items-center gap-1.5 rounded-[3px] border border-accent px-2 py-0.5 text-accent">
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent" />
      {label}
    </span>
  );
}
