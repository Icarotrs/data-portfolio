import { Background } from "@/components/background/Background";
import { SectionObserver } from "@/components/background/SectionObserver";
import { Chrome } from "@/components/chrome/Chrome";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <a
        href="#main"
        className="sr-only z-50 rounded-full bg-cta px-4 py-2 text-cta-fg focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <Background />
      <Chrome />
      <SectionObserver />
      <Header />
      <main id="main" className="relative z-20 mx-auto w-full max-w-5xl px-3 pb-16 sm:px-6">
        {children}
      </main>
      <Footer />
    </>
  );
}
