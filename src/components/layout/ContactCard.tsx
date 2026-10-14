import { site } from "@site";
import { LinkButton } from "@/components/ui/LinkButton";

/** Last section on every page: the only call to action is Upwork. */
export function ContactCard() {
  return (
    <section id="contact" data-section="contact" aria-labelledby="contact-title" className="scroll-mt-24">
      <div className="glass p-7 sm:p-9">
        <p className="label text-accent">Contact</p>
        <h2 id="contact-title" className="mt-4 text-[26px] leading-tight tracking-tight">
          Have a report that eats your week?
        </h2>
        <p className="mt-3 text-pretty text-[15px] leading-relaxed text-muted">
          Send me the details on Upwork. All projects and payments go through the platform.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
          <LinkButton href={site.links.upwork} external>
            Hire me on Upwork
          </LinkButton>
          <a href={site.links.linkedin} target="_blank" rel="noopener noreferrer" className="label text-muted hover:text-accent">
            LinkedIn
          </a>
          <a href={site.links.github} target="_blank" rel="noopener noreferrer" className="label text-muted hover:text-accent">
            GitHub
          </a>
        </div>
      </div>
      <p className="label mt-6 text-center text-on-bg-muted lg:hidden">
        © {new Date().getFullYear()} {site.name}
      </p>
    </section>
  );
}
