import { MetadataRoute } from "next";

import { loadAllJournalArticles } from "@/content/journal";

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://sanidhyashala.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const articles =
    loadAllJournalArticles();

  const journalPages: MetadataRoute.Sitemap =
    Object.keys(articles).map(
      (slug) => ({
        url: `${baseUrl}/journal/${slug}`,

        changeFrequency:
          "monthly",

        priority: 0.8,
      })
    );

  const staticRoutes = [
    "/",
    "/journal",
    "/about",
    "/contact",
    "/learning",
    "/reflection",
  ] as const;

  const staticPages: MetadataRoute.Sitemap =
    staticRoutes.map((route) => ({
      url: `${baseUrl}${route}`,

      changeFrequency:
        route === "/"
          ? "weekly"
          : "monthly",

      priority:
        route === "/"
          ? 1
          : 0.9,
    }));

  return [
    ...staticPages,
    ...journalPages,
  ];
}