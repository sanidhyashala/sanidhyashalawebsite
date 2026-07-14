"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { journalArticles } from "@/content/journal";

export default function SavedArticles() {
  const [savedSlugs, setSavedSlugs] =
    useState<string[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function loadSavedArticles() {
      try {
        const response =
          await fetch(
            "/api/journal/saved-articles"
          );

        const data =
          await response.json();

        setSavedSlugs(
          data.articles || []
        );
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadSavedArticles();
  }, []);

  if (loading) {
    return (
      <section className="mb-16">
        <h2 className="mb-4 text-2xl font-bold text-blue-900 dark:text-blue-400">
          🔖 Your Saved Articles
        </h2>

        <p className="text-slate-500">
          Loading...
        </p>
      </section>
    );
  }

  if (savedSlugs.length === 0) {
    return (
      <section className="mb-16">
        <h2 className="mb-4 text-2xl font-bold text-blue-900 dark:text-blue-400">
          🔖 Your Saved Articles
        </h2>

        <p className="text-slate-500 dark:text-slate-400">
          No saved articles yet.
        </p>
      </section>
    );
  }

  return (
    <section className="mb-16">
      <h2 className="mb-6 text-2xl font-bold text-blue-900 dark:text-blue-400">
        🔖 Your Saved Articles
      </h2>

      <div className="space-y-4">
        {savedSlugs.map((slug) => {
          const article =
            journalArticles[slug];

          if (!article)
            return null;

          return (
            <Link
              key={slug}
              href={`/journal/${slug}`}
              className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
                {
                  article.meta
                    .title
                }
              </h3>

              <p className="text-sm text-slate-600 dark:text-slate-400">
                {
                  article.meta
                    .description
                }
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}