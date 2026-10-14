import { BackgroundCanvas } from "./BackgroundCanvas";
import { FilterBoxLayer } from "./FilterBoxLayer";
import { UserImageLayer } from "./UserImageLayer";

/**
 * Fixed full-viewport background:
 *   1. CSS gradient (instant, always there)
 *   2. Pre-rendered image, only when WebGL2 is unavailable
 *   3. WebGL scene (shapes + visitor images + filters), faded in once loaded
 *   4. Filter panels and image frames (DOM, drive the shader; movable on home)
 */
export function Background({ stillTime }: { stillTime?: number }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <div aria-hidden="true" className="bg-css absolute inset-0" />
      <div aria-hidden="true" className="bg-fallback absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element -- static export, decorative */}
        <img src="/fallback/bg-light.webp" alt="" loading="lazy" className="bg-fallback-light h-full w-full object-cover" />
        {/* eslint-disable-next-line @next/next/no-img-element -- static export, decorative */}
        <img src="/fallback/bg-dark.webp" alt="" loading="lazy" className="bg-fallback-dark h-full w-full object-cover" />
      </div>
      <BackgroundCanvas stillTime={stillTime} />
      <FilterBoxLayer movable={stillTime !== undefined ? false : undefined} />
      {stillTime === undefined && <UserImageLayer />}
    </div>
  );
}
