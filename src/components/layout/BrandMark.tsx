/** Square with three rising bars (one in the accent colour). */
export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" className={className} aria-hidden="true">
      <rect x="0.75" y="0.75" width="26.5" height="26.5" rx="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <rect x="7" y="15" width="3" height="6" fill="currentColor" />
      <rect x="12.5" y="11" width="3" height="10" fill="currentColor" />
      <rect x="18" y="7" width="3" height="14" fill="var(--accent)" />
    </svg>
  );
}
