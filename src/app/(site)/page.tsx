import { getProjects } from "@/lib/content";
import { Hero } from "@/components/home/Hero";
import { ProjectList } from "@/components/home/ProjectList";
import { Services } from "@/components/home/Services";

export default function Home() {
  return (
    <div className="flex flex-col gap-20 sm:gap-28">
      <Hero />
      <ProjectList projects={getProjects()} />
      <Services />
    </div>
  );
}
