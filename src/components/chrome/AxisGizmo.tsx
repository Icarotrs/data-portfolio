/** Small XYZ axis gizmo, like the one in a 3D viewport corner. */
export function AxisGizmo() {
  return (
    <svg viewBox="0 0 64 64" className="h-14 w-14 text-faint" fill="none" stroke="currentColor">
      <circle cx="28" cy="36" r="2" fill="currentColor" stroke="none" />
      <path d="M28 36 52 44" strokeWidth="1.25" />
      <path d="M28 36V8" strokeWidth="1.25" />
      <path d="M28 36 12 50" strokeWidth="1.25" strokeDasharray="2 2" />
      <text x="55" y="49" fontSize="8" fill="currentColor" stroke="none" fontFamily="var(--font-mono)">X</text>
      <text x="25" y="6" fontSize="8" fill="currentColor" stroke="none" fontFamily="var(--font-mono)">Y</text>
      <text x="4" y="58" fontSize="8" fill="currentColor" stroke="none" fontFamily="var(--font-mono)">Z</text>
    </svg>
  );
}
