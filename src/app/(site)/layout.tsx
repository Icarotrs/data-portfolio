import { Background } from "@/components/background/Background";
import { SectionObserver } from "@/components/background/SectionObserver";
import { ContactCard } from "@/components/layout/ContactCard";
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
      <main
        id="main"
        className="relative z-20 mx-auto flex w-full max-w-[560px] flex-col gap-16 px-4 pb-24 pt-20 sm:gap-24 sm:pt-28"
      >
        {children}
        <ContactCard />
      </main>
    </>
  );
}
