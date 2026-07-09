import Link from "next/link";

import { journalArticles } from "@/content/journal";

interface Props {
  currentSlug: string;
}

export default function RelatedArticles({
  currentSlug,
}: Props) {
  const currentArticle =
    journalArticles[
      currentSlug as keyof typeof journalArticles
    ];

  if (!currentArticle) {
    return null;
  }

  const related = Object.entries(
    journalArticles
  )
    .filter(
      ([slug]) => slug !== currentSlug
    )
    .map(([slug, data]) => {
      let score = 0;

      const currentCategories =
        currentArticle.meta.categories;

      const currentTags =
        currentArticle.meta.tags;

      const categories =
        data.meta.categories;

      const tags = data.meta.tags;

      categories.forEach((category) => {
        if (
          currentCategories.includes(category)
        ) {
          score += 3;
        }
      });

      tags.forEach((tag) => {
        if (currentTags.includes(tag)) {
          score += 1;
        }
      });

      return {
  slug,
  data,
  score,
};
})
.filter(
  (article) => article.score > 0
)
.sort((a, b) => b.score - a.score)
    .slice(0, 3);

  if (related.length === 0) {
    return null;
  }

  return (
    <section className="mt-24 border-t border-slate-200 dark:border-slate-800 pt-12">
      <h2 className="mb-8 text-3xl font-bold text-blue-900 dark:text-blue-400">
        Related Articles
      </h2>

      <div className="space-y-4">
        {related.map(
          ({ slug, data }) => (
            <Link
              key={slug}
              href={`/journal/${slug}`}
              className="block rounded-xl border p-5 transition-all hover:-translate-y-1 hover:shadow-md dark:bg-slate-900 dark:border-slate-800 dark:hover:border-slate-700 dark:hover:shadow-lg dark:hover:shadow-black/30"
            >
              <h3 className="mb-2 text-xl font-semibold text-slate-900 dark:text-slate-100">
                {data.meta.title}
              </h3>

              <p className="mb-3 text-slate-600 dark:text-slate-300">
                {data.meta.description}
              </p>

              <div className="flex flex-wrap gap-2">
                {data.meta.categories.map(
                  (category) => (
                    <span
                      key={category}
                      className="rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                    >
                      {category}
                    </span>
                  )
                )}
              </div>
            </Link>
          )
        )}
      </div>
    </section>
  );
}