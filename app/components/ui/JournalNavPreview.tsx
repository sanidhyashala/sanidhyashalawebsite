"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";

type JournalArticle = {
  slug: string;
  title: string;
  description: string;
  readingTime?: string;
  languages?: string[];
};

type JournalNavPreviewProps = {
  href: string;
  isActive: boolean;
  onNavigate: () => void;
};

export default function JournalNavPreview({
  href,
  isActive,
  onNavigate,
}: JournalNavPreviewProps) {
  const [open, setOpen] = useState(false);
  const [articles, setArticles] = useState<JournalArticle[]>([]);
  const [loading, setLoading] = useState(false);

  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openPreview = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
    }

    setOpen(true);
  };

  const closePreview = () => {
    closeTimer.current = setTimeout(() => {
      setOpen(false);
    }, 120);
  };

  useEffect(() => {
    if (!open || articles.length > 0) return;

    let cancelled = false;

    const loadArticles = async () => {
      try {
        setLoading(true);

        const response = await fetch("/api/journal/latest");

        if (!response.ok) {
          throw new Error("Failed to load journal articles");
        }

        const data = await response.json();

        if (!cancelled) {
          setArticles(data.articles ?? []);
        }
      } catch (error) {
        console.error("Journal preview error:", error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadArticles();

    return () => {
      cancelled = true;
    };
  }, [open, articles.length]);

  useEffect(() => {
    return () => {
      if (closeTimer.current) {
        clearTimeout(closeTimer.current);
      }
    };
  }, []);

  return (
    <div
      className="relative"
      onMouseEnter={openPreview}
      onMouseLeave={closePreview}
    >
      <Link
        href={href}
        onClick={onNavigate}
        onFocus={openPreview}
        onBlur={closePreview}
        aria-current={isActive ? "page" : undefined}
        aria-expanded={open}
        className={`relative flex items-center rounded-lg border-b-2 px-3 py-2 text-sm font-medium outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-600 dark:focus-visible:ring-blue-400 ${
          isActive
            ? "border-blue-600 bg-blue-50/60 font-semibold text-blue-600 dark:border-blue-400 dark:bg-blue-500/10 dark:text-blue-400"
            : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-slate-800/50 dark:hover:text-blue-400"
        }`}
      >
        Journal
      </Link>

      {/* Journal Preview */}
      <div
        onMouseEnter={openPreview}
        onMouseLeave={closePreview}
        className={`absolute right-0 top-full z-[60] w-[380px] origin-top-right pt-3 transition-all duration-200 ${
          open
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none -translate-y-1 scale-[0.98] opacity-0"
        }`}
      >
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-xl shadow-slate-900/10 backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95 dark:shadow-black/30">

          {/* Header */}
          <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />

                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  From the Journal
                </span>
              </div>

              <span className="text-xs text-slate-400 dark:text-slate-500">
                Latest
              </span>
            </div>
          </div>

          {/* Articles */}
          <div className="p-3">
            {loading && articles.length === 0 ? (
              <div className="space-y-2">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="rounded-xl p-3">
                    <div className="mb-2 h-4 w-3/4 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                    <div className="h-3 w-full animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                    <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                  </div>
                ))}
              </div>
            ) : articles.length > 0 ? (
              <div className="space-y-1">
                {articles.map((article) => (
                  <Link
                    key={article.slug}
                    href={`/journal/${article.slug}`}
                    onClick={onNavigate}
                    className="group block rounded-xl p-3 transition-colors duration-150 hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none dark:hover:bg-slate-800/70 dark:focus-visible:bg-slate-800/70"
                  >
                    <div className="mb-1 flex items-start justify-between gap-3">
                      <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-slate-900 transition-colors group-hover:text-blue-700 dark:text-slate-100 dark:group-hover:text-blue-400">
                        {article.title}
                      </h3>

                      <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 translate-x-0 text-slate-400 transition-transform duration-150 group-hover:translate-x-1 group-hover:text-blue-600 dark:text-slate-500 dark:group-hover:text-blue-400" />
                    </div>

                    <p className="line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                      {article.description}
                    </p>

                    <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500">
                      {article.readingTime && (
                        <span>{article.readingTime}</span>
                      )}

                      {article.readingTime && article.languages?.length ? (
                        <span>·</span>
                      ) : null}

                      {article.languages?.length ? (
                        <span>
                          {article.languages.join(" + ")}
                        </span>
                      ) : null}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="px-3 py-6 text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  The Journal is quietly waiting.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 px-5 py-3 dark:border-slate-800">
            <Link
              href="/journal"
              onClick={onNavigate}
              className="group inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 transition-colors hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Explore the Journal
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}