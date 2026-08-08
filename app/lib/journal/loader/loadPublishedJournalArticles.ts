import { loadAllJournalArticles } from "./loadAllJournalArticles";

export function loadPublishedJournalArticles() {
  const allArticles =
    loadAllJournalArticles();

  return Object.fromEntries(
    Object.entries(allArticles).filter(
      ([, article]) =>
        article.meta.status ===
        "published"
    )
  );
}