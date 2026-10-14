import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getLocalizedProjects } from "@/lib/content";
import { Hero } from "@/components/home/Hero";
import { ProjectList } from "@/components/home/ProjectList";
import { Services } from "@/components/home/Services";
import { ContactCard } from "@/components/layout/ContactCard";

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);
  return (
    <div className="flex flex-col gap-28 sm:gap-40">
      <Hero lang={lang} dict={dict} />
      <ProjectList projects={getLocalizedProjects(lang)} lang={lang} dict={dict} />
      <Services dict={dict} />
      <div className="mx-auto w-full max-w-[1120px]">
        <ContactCard dict={dict} />
      </div>
    </div>
  );
}
