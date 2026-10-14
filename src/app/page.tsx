import { site } from "@site";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default function Home() {
  return (
    <main className="bg-css flex min-h-dvh items-center justify-center p-6">
      <div className="glass max-w-xl rounded-2xl p-8">
        <p className="font-mono text-xs uppercase tracking-widest text-faint">{site.role}</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">{site.title}</h1>
        <p className="mt-4 text-muted">{site.valueProp}</p>
        <div className="mt-6">
          <ThemeToggle />
        </div>
      </div>
    </main>
  );
}
