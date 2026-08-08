import type { JournalEntry } from "./types";

import { loadAllJournalArticles } from "./loadAllJournalArticles";

export function loadPublishedJournalArticles(): Record<
  string,
  JournalEntry
> {
  const allArticles =
    loadAllJournalArticles();

  return Object.fromEntries(
    Object.entries(allArticles).filter(
      ([, article]) =>
        article.meta.status ===
        "published"
    )
  ) as Record<
    string,
    JournalEntry
  >;
}