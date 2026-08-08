"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// 👇 Change 1: Updated import
import { loadAllJournalArticles } from "@/content/journal";

export default function SavedArticlesDrawer() {
  const [open, setOpen] = useState(false);
  const [savedSlugs, setSavedSlugs] = useState<string[]>([]);
  const [signedIn, setSignedIn] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSavedArticles() {
      try {
        const response = await fetch("/api/journal/saved-articles");
        const data = await response.json();

        setSignedIn(data.signedIn ?? true);
        setSavedSlugs(data.articles || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadSavedArticles();
  }, []);

  // 👇 Change 2: Added function call right before the return
  const journalArticles = loadAllJournalArticles();
  const visibleSavedArticles =
  savedSlugs
    .map((slug) => ({
      slug,
      article: journalArticles[slug],
    }))
    .filter(
      (item) => item.article
    );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-[52px] min-w-[130px] items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 text-sm font-medium text-slate-700 transition-all duration-200 hover:border-blue-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-500 dark:hover:bg-slate-800"
      >
        🔖 Saved

        {!loading && (
          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
            {visibleSavedArticles.length}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
          />

          <div
            className="
              fixed right-0 top-0 z-50
              h-full w-full max-w-md
              border-l border-slate-200
              bg-white p-6 shadow-2xl

              transform transition-transform
              duration-300 ease-out

              dark:border-slate-800
              dark:bg-slate-950
            "
          >
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-blue-900 dark:text-blue-400">
                  🔖 Your Saved Articles
                </h2>

                {!loading && (
                  <p className="mt-1 text-sm text-slate-500">
                    {visibleSavedArticles.length} article
                    {visibleSavedArticles.length !== 1 ? "s" : ""}
                  </p>
                )}
              </div>

              <button
                onClick={() => setOpen(false)}
                className="text-xl transition hover:rotate-90"
              >
                ✕
              </button>
            </div>

            {loading ? (
              <p>Loading...</p>
            ) : !signedIn ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center dark:border-slate-700">
                <p className="font-medium">
                  Sign in required
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  Sign in to access your
                  saved reflections.
                </p>

                <Link
                  href="/sign-in"
                  className="mt-4 inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Sign In
                </Link>
              </div>
            ) : visibleSavedArticles.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center dark:border-slate-700">
                <p className="font-medium">
                  No saved articles yet
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  Save reflections you
                  want to revisit.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {visibleSavedArticles.map(
  ({ slug, article }) => (
    <Link
      key={slug}
      href={`/journal/${slug}`}
      onClick={() => setOpen(false)}
      className="
        group block
        rounded-2xl
        border border-slate-200
        p-4

        transition-all
        duration-200

        hover:-translate-y-0.5
        hover:border-blue-200
        hover:bg-blue-50
        hover:shadow-md

        dark:border-slate-800
        dark:hover:border-blue-800
        dark:hover:bg-slate-900
      "
    >
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-slate-900 dark:text-slate-100">
          {article.meta.title}
        </h3>

        <span className="transition group-hover:translate-x-1">
          →
        </span>
      </div>

      <p className="mt-2 text-sm text-slate-500">
        {article.meta.readingTime}
      </p>
    </Link>
  )
)}
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}