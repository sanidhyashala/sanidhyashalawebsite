"use client";

import Link from "next/link";

interface Result {
  slug: string;
  title: string;
  subtitle: string;
}

interface Props {
  results: Result[];
}

export default function JournalSearchResults({
  results,
}: Props) {
  if (results.length === 0) {
    return null;
  }

  return (
    <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-xl border dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl dark:shadow-2xl dark:shadow-black/50">
      {results.map((result) => (
        <Link
          key={result.slug}
          href={`/journal/${result.slug}`}
          className="block border-b border-slate-100 dark:border-slate-800 px-4 py-4 transition hover:bg-slate-50 dark:hover:bg-slate-800/50 last:border-b-0"
        >
          <h3 className="font-semibold text-slate-900 dark:text-slate-100">
            {result.title}
          </h3>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {result.subtitle}
          </p>
        </Link>
      ))}
    </div>
  );
}