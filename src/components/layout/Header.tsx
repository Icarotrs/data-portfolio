import Link from "next/link";
import { site } from "@site";
import { BrandMark } from "@/components/chrome/BrandMark";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { UpworkIcon } from "@/components/ui/icons";

export function Header() {
  return (
    <header className="sticky top-0 z-30 px-3 pt-3 sm:px-6">
      <div className="glass-strong mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 rounded-full pl-4 pr-2">
        <BrandMark />
        <nav aria-label="Main" className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/#projects"
            className="hidden rounded-full px-3 py-2 text-sm text-muted transition-colors hover:text-fg sm:inline"
          >
            Projects
          </Link>
          <Link
            href="/#services"
            className="hidden rounded-full px-3 py-2 text-sm text-muted transition-colors hover:text-fg sm:inline"
          >
            Services
          </Link>
          <ThemeToggle />
          <a
            href={site.links.upwork}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-cta px-3.5 text-sm font-medium text-cta-fg transition hover:opacity-90"
          >
            <UpworkIcon className="h-4 w-4" />
            <span>Hire me</span>
          </a>
        </nav>
      </div>
    </header>
  );
}
