import { getProjects } from "@/lib/content";
import { Hero } from "@/components/home/Hero";
import { ProjectList } from "@/components/home/ProjectList";
import { Services } from "@/components/home/Services";
import { ImageLab } from "@/components/lab/ImageLab";
import { ContactCard } from "@/components/layout/ContactCard";

export default function Home() {
  return (
    <div className="mx-auto flex max-w-[560px] flex-col gap-16 sm:gap-24">
      <Hero />
      <ProjectList projects={getProjects()} />
      <ImageLab />
      <Services />
      <ContactCard />
    </div>
  );
}
