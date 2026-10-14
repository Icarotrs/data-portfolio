export function SectionHeading({
  id,
  eyebrow,
  title,
}: {
  id: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="glass inline-flex flex-col rounded-2xl px-5 py-4">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-faint">{eyebrow}</p>
      <h2 id={id} className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
        {title}
      </h2>
    </div>
  );
}
