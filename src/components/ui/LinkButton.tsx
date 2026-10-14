import Link from "next/link";
import type { ReactNode } from "react";

interface LinkButtonProps {
  href: string;
  children: ReactNode;
  variant?: "primary" | "ghost";
  external?: boolean;
  className?: string;
}

const variants = {
  primary: "bg-cta text-cta-fg hover:opacity-90",
  ghost: "border border-line-strong text-fg hover:bg-fg hover:text-bg",
};

/** Small, square-ish mono button. */
export function LinkButton({ href, children, variant = "primary", external, className = "" }: LinkButtonProps) {
  const classes = `label inline-flex h-9 items-center justify-center gap-2 rounded-[3px] px-3.5 transition ${variants[variant]} ${className}`;
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}
