import type { Project } from "@/lib/content";

/**
 * Screenshots and video. Entries with an empty `src` render as labeled
 * placeholders so the layout is ready before real captures exist.
 */
export function MediaGallery({ project }: { project: Project }) {
  const { screenshots, video } = project.media;
  return (
    <section aria-labelledby="media-title" className="grid gap-4">
      <h2 id="media-title" className="sr-only">
        Screenshots
      </h2>
      {video && (
        <video
          className="glass w-full rounded-2xl"
          src={video.src}
          poster={video.poster}
          controls
          preload="none"
          playsInline
        />
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {screenshots.map((s, i) =>
          s.src ? (
            <figure key={i} className="glass overflow-hidden rounded-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element -- static export, images are pre-sized */}
              <img src={s.src} alt={s.alt} loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover" />
              <figcaption className="p-4 text-sm text-muted">{s.alt}</figcaption>
            </figure>
          ) : (
            <figure
              key={i}
              className="glass flex aspect-[4/3] flex-col justify-between rounded-2xl p-5"
            >
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
                Screenshot {String(i + 1).padStart(2, "0")} · coming soon
              </span>
              <div
                aria-hidden="true"
                className="mx-auto my-4 w-full flex-1 rounded-lg border border-dashed border-line-strong"
                style={{
                  backgroundImage:
                    "linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px)",
                  backgroundSize: "24px 24px",
                }}
              />
              <figcaption className="text-sm text-muted">{s.alt}</figcaption>
            </figure>
          ),
        )}
      </div>
    </section>
  );
}
