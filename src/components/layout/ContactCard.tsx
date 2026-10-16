import { site } from "@site";
import type { Dictionary } from "@/i18n/dictionaries";
import { LinkButton } from "@/components/ui/LinkButton";

/** Last section on every page: email first, then Upwork and the other profiles. */
export function ContactCard({ dict }: { dict: Dictionary }) {
  const t = dict.contact;
  return (
    <section id="contact" aria-labelledby="contact-title" className="scroll-mt-24">
      <div className="card reveal p-7 sm:p-10">
        <p className="label text-accent">{t.eyebrow}</p>
        <h2 id="contact-title" className="mt-4 text-[30px] leading-tight tracking-tight sm:text-[36px]">
          {t.title}
        </h2>
        <p className="mt-3 text-pretty text-[15px] leading-relaxed text-muted">
          {t.body}
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
          <a href={`mailto:${site.links.email}`} className="label inline-flex h-9 items-center justify-center gap-2 rounded-[3px] bg-cta px-3.5 text-cta-fg transition hover:opacity-90">
            {site.links.email}
          </a>
          <LinkButton href={site.links.upwork} external variant="ghost">
            {t.cta}
          </LinkButton>
          <a href={site.links.linkedin} target="_blank" rel="noopener noreferrer" className="label text-muted hover:text-accent">
            LinkedIn
          </a>
          <a href={site.links.github} target="_blank" rel="noopener noreferrer" className="label text-muted hover:text-accent">
            GitHub
          </a>
        </div>
      </div>
    </section>
  );
}
