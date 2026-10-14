import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { site } from "@site";
import { LOCALES, LOCALE_LABELS, isLocale, languageAlternates } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { themeInitScript } from "@/lib/theme";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { fontClasses } from "../fonts";
import "../globals.css";

export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const { meta } = getDictionary(lang);
  return {
    metadataBase: new URL(site.url),
    title: { default: `${meta.title} — ${site.name}`, template: `%s — ${site.name}` },
    description: meta.description,
    alternates: { canonical: `/${lang}/`, languages: languageAlternates("/") },
    openGraph: {
      type: "website",
      url: `/${lang}/`,
      siteName: site.name,
      locale: LOCALE_LABELS[lang].og,
      title: meta.title,
      description: meta.description,
      images: [{ url: "/og/home.png", width: 1200, height: 630, alt: meta.title }],
    },
    twitter: { card: "summary_large_image", title: meta.title, description: meta.description, images: ["/og/home.png"] },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#e7e7e4" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0c" },
  ],
};

export default async function LangLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);
  return (
    <html lang={LOCALE_LABELS[lang].htmlLang} suppressHydrationWarning className={fontClasses}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="page-bg min-h-dvh">
        <a
          href="#main"
          className="label sr-only z-50 rounded-[3px] bg-cta px-3 py-2 text-cta-fg focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          {dict.nav.skip}
        </a>
        <Header lang={lang} dict={dict} />
        <main id="main" className="px-4 pb-24 pt-10 sm:px-6 sm:pt-16">
          {children}
        </main>
        <Footer dict={dict} />
      </body>
    </html>
  );
}
