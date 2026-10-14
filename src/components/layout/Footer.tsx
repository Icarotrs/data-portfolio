import { site } from "@site";
import type { Dictionary } from "@/i18n/dictionaries";

export function Footer({ dict }: { dict: Dictionary }) {
  return (
    <footer className="glass border-t border-line">
      <div className="label mx-auto flex max-w-[1120px] flex-col gap-3 px-4 py-8 text-faint sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          © {new Date().getFullYear()} {site.name} · {dict.footer.note}
        </p>
        <p className="flex gap-4">
          {[
            ["Upwork", site.links.upwork],
            ["LinkedIn", site.links.linkedin],
            ["GitHub", site.links.github],
          ].map(([label, href]) => (
            <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="hover:text-accent">
              {label}
            </a>
          ))}
        </p>
      </div>
    </footer>
  );
}
