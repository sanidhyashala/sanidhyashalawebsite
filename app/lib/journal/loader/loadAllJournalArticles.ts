import { journalArticles } from "@/content/journal";
import { generatedJournalEntries } from "@/app/content/journal/journalEntries";

export function loadAllJournalArticles() {
  const allArticles = {
    ...journalArticles,
    ...generatedJournalEntries,
  };

  return Object.fromEntries(
    Object.entries(allArticles).filter(
      ([, article]) =>
        article.meta.status === "published"
    )
  );
}