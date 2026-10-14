import type { Metadata } from "next";

/**
 * Internal pages used by scripts/render-assets.mjs to screenshot covers,
 * Open Graph images and the no-WebGL fallback. Not linked, not indexed.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function RenderLayout({ children }: LayoutProps<"/render">) {
  return children;
}
