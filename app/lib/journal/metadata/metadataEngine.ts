import { parseJournalContent } from "../parser/articleParser";

export interface JournalMetadata {
  title: string;

  readingTime: string;

  wordCount: number;

  sectionCount: number;
}

export function generateMetadata(
  hindiArticle: string
): JournalMetadata {
  const article =
    parseJournalContent(hindiArticle);

  const words =
    hindiArticle
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  const wordCount =
    words.length;

  const readingMinutes =
    Math.max(
      1,
      Math.ceil(wordCount / 180)
    );

  return {
    title: article.title,

    readingTime:
      `${readingMinutes} min read`,

    wordCount,

    sectionCount:
      article.sections.length,
  };
}