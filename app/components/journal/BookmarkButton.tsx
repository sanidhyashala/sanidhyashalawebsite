"use client";

import {
  useEffect,
  useState,
  useCallback,
} from "react";
import { getSignInUrl } from "@/lib/auth-redirect";

interface Props {
  articleSlug: string;
}

const baseClasses =
  "flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-slate-700 transition-all hover:bg-slate-50 hover:border-blue-300 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:border-blue-500";

const savedClasses =
  "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300";

export default function BookmarkButton({
  articleSlug,
}: Props) {
  const [bookmarked, setBookmarked] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const loadBookmarkStatus =
  useCallback(async () => {
    try {
      const response = await fetch(
        `/api/journal/bookmark-status?articleSlug=${articleSlug}`
      );

      const data =
        await response.json();

      setBookmarked(
        data.bookmarked || false
      );
    } catch (error) {
      console.error(
        "Failed to load bookmark status:",
        error
      );
    }
  }, [articleSlug]);

  async function handleBookmark() {
    if (loading) return;

    setLoading(true);

    try {
      const response = await fetch(
        "/api/journal/bookmark",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            articleSlug,
          }),
        }
      );

      if (response.status === 401) {
        window.location.href = getSignInUrl();
        return;
      }

      const data =
        await response.json();

      setBookmarked(
        data.bookmarked
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
  loadBookmarkStatus();
}, [loadBookmarkStatus]);

  const buttonClassName = bookmarked
    ? `${baseClasses} ${savedClasses}`
    : baseClasses;

  return (
    <button
      onClick={handleBookmark}
      disabled={loading}
      className={buttonClassName}
    >
      {bookmarked ? "🔖" : "📑"}

      <span>
        {loading
          ? "Loading..."
          : bookmarked
          ? "Saved"
          : "Save Article"}
      </span>
    </button>
  );
}