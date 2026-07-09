"use client";

import { useEffect, useState } from "react";
import { getSignInUrl } from "@/lib/auth-redirect";

interface Props {
  articleSlug: string;
}

export default function ReactionButton({
  articleSlug,
}: Props) {
  const [count, setCount] = useState(0);
  const [reacted, setReacted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function loadCount() {
    try {
      const response = await fetch(
        `/api/journal/reaction-count?articleSlug=${articleSlug}`
      );

      const data = await response.json();

      setCount(data.count || 0);
    } catch (error) {
      console.error(
        "Failed to load reactions:",
        error
      );
    }
  }

  async function loadReactionStatus() {
    try {
      const response = await fetch(
        `/api/journal/reaction-status?articleSlug=${articleSlug}`
      );

      const data = await response.json();

      setReacted(data.reacted || false);
    } catch (error) {
      console.error(
        "Failed to load reaction status:",
        error
      );
    }
  }

  async function handleReaction() {
    if (loading) return;

    setLoading(true);

    try {
      const response = await fetch(
        "/api/journal/react",
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

      setReacted(data.reacted);

      await loadCount();
    } catch (error) {
      console.error(
        "Reaction failed:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCount();
    loadReactionStatus();
  }, [articleSlug]);

  const baseClasses =
    "flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-slate-700 transition-all hover:bg-slate-50 hover:border-blue-300 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:border-blue-500";

  const reactedClasses =
    "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300";

  const buttonClassName = reacted
    ? `${baseClasses} ${reactedClasses}`
    : baseClasses;

  return (
    <button
      onClick={handleReaction}
      disabled={loading}
      className={buttonClassName}
    >
      {reacted ? "❤️" : "🤍"}

      <span>
        {loading
          ? "Loading..."
          : `Resonated With Me (${count})`}
      </span>
    </button>
  );
}