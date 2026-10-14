import type { Project } from "@/lib/content";

/**
 * Screenshots and video: the first item large, the rest in two columns.
 * Entries with an empty `src` render as labelled placeholders.
 */
export function MediaGallery({
  project,
  labels,
}: {
  project: Project;
  labels: { title: string; comingSoon: string; note: string };
}) {
  const { screenshots, video } = project.media;
  if (!video && screenshots.length === 0) return null;
  return (
    <section aria-labelledby="media-title" className="mt-6 flex flex-col gap-5">
      <h2 id="media-title" className="label text-fg">
        {labels.title} · {String(screenshots.length).padStart(2, "0")}
      </h2>
      {video && (
        <video className="card w-full" poster={video.poster} controls muted preload="metadata" playsInline>
          {/* scripts/render-videos.mjs writes a WebM next to every MP4. */}
          {video.src.endsWith(".mp4") && <source src={video.src.replace(/\.mp4$/, ".webm")} type="video/webm" />}
          <source src={video.src} type="video/mp4" />
        </video>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        {screenshots.map((s, i) => {
          // First item full width; an odd one out at the end also spans both columns.
          const wide = i === 0 || (i === screenshots.length - 1 && (screenshots.length - 1) % 2 === 1);
          return (
          <figure key={i} className={`card overflow-hidden ${wide ? "sm:col-span-2" : ""}`}>
            {s.src ? (
              // eslint-disable-next-line @next/next/no-img-element -- static export, images are pre-sized
              <img
                src={s.src}
                alt={s.alt}
                loading="lazy"
                decoding="async"
                className={`w-full object-cover ${wide ? "aspect-[16/9]" : "aspect-[4/3]"}`}
              />
            ) : (
              <div
                aria-hidden="true"
                className={`m-5 mb-0 flex items-center justify-center rounded-[4px] border border-dashed border-line-strong ${
                  wide ? "aspect-[16/8]" : "aspect-[4/3]"
                }`}
                style={{
                  backgroundImage:
                    "linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px)",
                  backgroundSize: "24px 24px",
                }}
              >
                <span className="label text-faint">{labels.title} {String(i + 1).padStart(2, "0")} · {labels.comingSoon}</span>
              </div>
            )}
            <figcaption className="p-5 text-sm text-muted">{s.alt}</figcaption>
          </figure>
          );
        })}
      </div>
      <p className="label text-faint">{labels.note}</p>
    </section>
  );
}
