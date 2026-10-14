import type { MetadataRoute } from "next";
import { site } from "@site";
import { LOCALES, LOCALE_LABELS } from "@/i18n/config";
import { getProjects } from "@/lib/content";

export const dynamic = "force-static";

/** Every page in every language, each listing its translations. */
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["/", ...getProjects().map((p) => `/projects/${p.slug}/`)];
  return paths.flatMap((path) =>
    LOCALES.map((lang) => ({
      url: `${site.url}/${lang}${path}`,
      changeFrequency: "monthly" as const,
      priority: path === "/" ? 1 : 0.8,
      alternates: {
        languages: Object.fromEntries(LOCALES.map((l) => [LOCALE_LABELS[l].htmlLang, `${site.url}/${l}${path}`])),
      },
    })),
  );
}
