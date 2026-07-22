import { journalArticles } from "@/content/journal/journal-articles";

export interface JournalSearchResult {
  slug: string;
  title: string;
  subtitle: string;
}

export function searchJournal(
  query: string
): JournalSearchResult[] {
  const q = query.trim().toLowerCase();

  if (!q) {
    return [];
  }

  return Object.entries(journalArticles)
    .filter(([, data]) => {
      const title =
        data.article.title.toLowerCase();

      const subtitle =
        data.article.subtitle.toLowerCase();

      const headings =
        data.article.sections
          .map((section) => section.heading)
          .join(" ")
          .toLowerCase();

      const paragraphs =
        data.article.sections
          .flatMap(
            (section) => section.paragraphs
          )
          .join(" ")
          .toLowerCase();

      return (
        title.includes(q) ||
        subtitle.includes(q) ||
        headings.includes(q) ||
        paragraphs.includes(q)
      );
    })
    .map(([slug, data]) => ({
      slug,
      title: data.article.title,
      subtitle: data.article.subtitle,
    }));
}