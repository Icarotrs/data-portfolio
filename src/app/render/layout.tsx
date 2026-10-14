import type { Metadata } from "next";
import { themeInitScript } from "@/lib/theme";
import { fontClasses } from "../fonts";
import "../globals.css";

/**
 * Internal pages used by scripts/render-assets.mjs to screenshot covers and
 * Open Graph images. Not linked, not indexed. English only (Upwork).
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function RenderLayout({ children }: LayoutProps<"/render">) {
  return (
    <html lang="en" suppressHydrationWarning className={fontClasses}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
