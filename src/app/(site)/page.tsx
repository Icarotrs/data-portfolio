import { getProjects } from "@/lib/content";
import { Hero } from "@/components/home/Hero";
import { ProjectList } from "@/components/home/ProjectList";
import { Services } from "@/components/home/Services";

export default function Home() {
  return (
    <>
      <Hero />
      <ProjectList projects={getProjects()} />
      <Services />
    </>
  );
}
