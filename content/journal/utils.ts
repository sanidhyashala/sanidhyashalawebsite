import type {
  JournalArticle,
  Language,
} from "./types";

export function getReadingTime(
  article: JournalArticle
): string {
  const totalWords = article.sections
    .flatMap((section) => section.paragraphs)
    .join(" ")
    .trim()
    .split(/\s+/).length;

  const minutes = Math.max(
    1,
    Math.ceil(totalWords / 200)
  );

  return `${minutes} min read`;
}

export function getLanguages(
  hasHindi: boolean
): Language[] {
  return hasHindi
    ? ["English", "Hindi"]
    : ["English"];
}