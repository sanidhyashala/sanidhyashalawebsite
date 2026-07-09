import Link from "next/link";
import { notFound } from "next/navigation";

import { journalArticles } from "@/content/journal";

interface Props {
  params: Promise<{
    category: string;
  }>;
}

export default async function CategoryPage({
  params,
}: Props) {
  const { category } =
    await params;

  const articles = Object.entries(
    journalArticles
  ).filter(([, data]) =>
    data.meta.categories.some(
      (c) =>
        c.toLowerCase() ===
        category.toLowerCase()
    )
  );

  if (articles.length === 0) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="mb-4 text-5xl font-bold text-blue-900">
        {category}
      </h1>

      <p className="mb-12 text-slate-600">
        Articles related to{" "}
        {category}.
      </p>

      <div className="space-y-6">
        {articles.map(
          ([slug, data]) => (
            <article
              key={slug}
              className="rounded-xl border bg-white p-6 shadow-sm"
            >
              <h2 className="mb-3 text-2xl font-semibold">
                {data.meta.title}
              </h2>

              <p className="mb-4 text-slate-600">
                {
                  data.meta
                    .description
                }
              </p>

              <Link
                href={`/journal/${slug}`}
                className="font-medium text-blue-900 hover:underline"
              >
                Read Article →
              </Link>
            </article>
          )
        )}
      </div>
    </main>
  );
}