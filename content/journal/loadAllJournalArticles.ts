import type { JournalEntry } from "./types";

import { journalArticles } from "./journal-articles";
import { generatedJournalEntries } from "@/app/content/journal/journalEntries";

export function loadAllJournalArticles(): Record<
  string,
  JournalEntry
> {
  const allArticles: Record<
    string,
    JournalEntry
  > = {
    ...journalArticles,
    ...generatedJournalEntries,
  };

  return Object.fromEntries(
    Object.entries(allArticles).filter(
      ([, article]) =>
        article.meta.status === "published"
    )
  ) as Record<string, JournalEntry>;
}