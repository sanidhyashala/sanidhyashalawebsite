import Link from "next/link";
import { notFound } from "next/navigation";

import { journalArticles } from "@/content/journal";

interface Props {
  params: Promise<{
    tag: string;
  }>;
}

export default async function TagPage({
  params,
}: Props) {
  const { tag } = await params;

  const decodedTag =
    decodeURIComponent(tag);

  const posts = Object.entries(
    journalArticles
  ).filter(([, data]) =>
    data.meta.tags.some(
      (t) =>
        t.toLowerCase() ===
        decodedTag.toLowerCase()
    )
  );

  if (posts.length === 0) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="mb-4 text-5xl font-bold text-blue-900">
        Tag: {decodedTag}
      </h1>

      <p className="mb-12 text-slate-600">
        Articles related to "{decodedTag}"
      </p>

      <div className="space-y-6">
        {posts.map(([slug, data]) => (
          <article
            key={slug}
            className="rounded-xl border bg-white p-6 shadow-sm"
          >
            <h2 className="mb-3 text-2xl font-semibold">
              {data.meta.title}
            </h2>

            <p className="mb-4 text-slate-600">
              {data.meta.description}
            </p>

            <Link
              href={`/journal/${slug}`}
              className="font-medium text-blue-900 hover:underline"
            >
              Read Article →
            </Link>
          </article>
        ))}
      </div>
    </main>
  );
}