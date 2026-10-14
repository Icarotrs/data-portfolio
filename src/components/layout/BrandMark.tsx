/** "IT" monogram (Icaro Torres) in a square; the T in the accent colour. */
export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" className={className} aria-hidden="true">
      <rect x="0.75" y="0.75" width="26.5" height="26.5" rx="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <rect x="6.5" y="8" width="3" height="12" fill="currentColor" />
      <rect x="12" y="8" width="10" height="3" fill="var(--accent)" />
      <rect x="15.5" y="8" width="3" height="12" fill="var(--accent)" />
    </svg>
  );
}
