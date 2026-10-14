import { Background } from "@/components/background/Background";
import { SectionObserver } from "@/components/background/SectionObserver";
import { SiteFrame } from "@/components/layout/SiteFrame";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <a
        href="#main"
        className="label sr-only z-50 rounded-[4px] bg-cta px-3 py-2 text-cta-fg focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <Background />
      <SectionObserver />
      <SiteFrame />
      <main id="main" className="pointer-events-none relative z-20 w-full px-4 pb-24 pt-20 sm:pt-28 [&>*]:pointer-events-auto">
        {children}
      </main>
    </>
  );
}
