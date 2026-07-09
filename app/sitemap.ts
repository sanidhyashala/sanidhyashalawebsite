import { MetadataRoute } from "next";

import { journalArticles } from "@/content/journal/journal-articles";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://sanidhyashala.com";

  const journalPages = Object.keys(
    journalArticles
  ).map((slug) => ({
    url: `${baseUrl}/journal/${slug}`,

    lastModified: new Date(),

    changeFrequency: "monthly" as const,

    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,

      lastModified: new Date(),

      changeFrequency: "weekly",

      priority: 1,
    },

    {
      url: `${baseUrl}/journal`,

      lastModified: new Date(),

      changeFrequency: "weekly",

      priority: 0.9,
    },

    ...journalPages,
  ];
}