import type { Metadata } from "next";
import { site } from "@site";
import { LOCALES, LOCALE_LABELS } from "@/i18n/config";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: `${site.name} — Portfolio`,
  alternates: {
    canonical: "/en/",
    languages: { ...Object.fromEntries(LOCALES.map((l) => [LOCALE_LABELS[l].htmlLang, `/${l}/`])), "x-default": "/en/" },
  },
};

/** Minimal document for "/", which only forwards to a language. */
export default function RootRedirectLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body style={{ background: "#0b0b0c", color: "#ededed", fontFamily: "system-ui, sans-serif" }}>{children}</body>
    </html>
  );
}
