/**
 * Fixed full-viewport background. The CSS grid is always there; the WebGL
 * scene fades in on top of it once loaded.
 */
export function Background() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
      <div className="bg-css absolute inset-0" />
    </div>
  );
}
