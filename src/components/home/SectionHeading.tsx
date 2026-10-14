export function SectionHeading({ id, eyebrow, title, intro }: { id: string; eyebrow: string; title: string; intro?: string }) {
  return (
    <div className="card reveal max-w-[760px] p-7 sm:p-9">
      <p className="label text-accent">{eyebrow}</p>
      <h2 id={id} className="mt-3 text-balance text-[32px] leading-[1.1] tracking-tight sm:text-[42px]">
        {title}
      </h2>
      {intro && <p className="mt-4 text-pretty text-[16px] leading-relaxed text-muted">{intro}</p>}
    </div>
  );
}
