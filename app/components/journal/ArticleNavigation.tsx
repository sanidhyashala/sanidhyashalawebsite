import Link from "next/link";

import { loadAllJournalArticles } from "@/content/journal";

interface Props {
  currentSlug: string;
}

export default function ArticleNavigation({
  currentSlug,
}: Props) {

  const journalArticles =
    loadAllJournalArticles();

  const slugs = Object.keys(
    journalArticles
  );

  const currentIndex =
    slugs.indexOf(currentSlug);

  const previousSlug =
    currentIndex > 0
      ? slugs[currentIndex - 1]
      : null;

  const nextSlug =
    currentIndex < slugs.length - 1
      ? slugs[currentIndex + 1]
      : null;

  if (
    !previousSlug &&
    !nextSlug
  ) {
    return null;
  }

  return (
    <section className="mt-20 border-t border-slate-200 dark:border-slate-800 pt-10">
      <div className="grid gap-4 md:grid-cols-2">

        {previousSlug ? (
          <Link
            href={`/journal/${previousSlug}`}
            className="rounded-2xl border p-5 transition-all hover:-translate-y-1 hover:shadow-md dark:bg-slate-900 dark:border-slate-800 dark:hover:border-slate-700 dark:hover:shadow-black/30 dark:hover:bg-slate-900"
          >
            <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">
              ← Previous Article
            </p>

            <h3 className="font-semibold text-blue-900 dark:text-blue-400">
              {
                journalArticles[
                  previousSlug
                ].meta.title
              }
            </h3>
          </Link>
        ) : (
          <div />
        )}

        {nextSlug ? (
          <Link
            href={`/journal/${nextSlug}`}
            className="rounded-2xl border p-5 text-right transition-all hover:-translate-y-1 hover:shadow-md dark:bg-slate-900 dark:border-slate-800 dark:hover:border-slate-700 dark:hover:shadow-black/30 dark:hover:bg-slate-900"
          >
            <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">
              Next Article →
            </p>

            <h3 className="font-semibold text-blue-900 dark:text-blue-400">
              {
                journalArticles[
                  nextSlug
                ].meta.title
              }
            </h3>
          </Link>
        ) : (
          <div />
        )}

      </div>
    </section>
  );
}