import { site } from "@site";
import { GitHubIcon, LinkedInIcon, UpworkIcon } from "@/components/ui/icons";

const links = [
  { label: "Upwork", href: site.links.upwork, Icon: UpworkIcon },
  { label: "LinkedIn", href: site.links.linkedin, Icon: LinkedInIcon },
  { label: "GitHub", href: site.links.github, Icon: GitHubIcon },
];

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer data-icon-theme="contact" className="relative z-20 px-3 pb-6 sm:px-6">
      <div className="glass mx-auto flex max-w-5xl flex-col gap-5 rounded-2xl p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold">{site.name}</p>
          <p className="mt-1 text-sm text-muted">
            All projects and contact go through Upwork.
          </p>
        </div>
        <ul className="flex flex-wrap gap-2">
          {links.map(({ label, href, Icon }) => (
            <li key={label}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center gap-2 rounded-full border border-line-strong px-4 text-sm transition-colors hover:bg-fg hover:text-bg"
              >
                <Icon className="h-4 w-4" />
                {label}
              </a>
            </li>
          ))}
        </ul>
      </div>
      <p className="mx-auto mt-4 max-w-5xl px-2 font-mono text-[11px] uppercase tracking-wider text-faint">
        © {year} {site.name} · Demo projects use public or fictitious data
      </p>
    </footer>
  );
}
