import { getProjects } from "@/lib/content";
import { Hero } from "@/components/home/Hero";
import { HomeDeck } from "@/components/home/HomeDeck";
import { ProjectList } from "@/components/home/ProjectList";
import { Services } from "@/components/home/Services";
import { ContactCard } from "@/components/layout/ContactCard";

export default function Home() {
  return (
    <HomeDeck
      panels={{
        intro: <Hero />,
        projects: <ProjectList projects={getProjects()} />,
        services: <Services />,
        contact: <ContactCard fill />,
      }}
    />
  );
}
