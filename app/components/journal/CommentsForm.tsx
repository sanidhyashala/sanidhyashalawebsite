"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { getSignInUrl } from "@/lib/auth-redirect";

interface Props {
  articleSlug: string;
  onCommentAdded: () => void;
}

export default function CommentsForm({
  articleSlug,
  onCommentAdded,
}: Props) {
  const { user, isSignedIn } = useUser();

  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!comment.trim()) return;

    setLoading(true);

    try {
      const response = await fetch(
        "/api/journal/comments",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            articleSlug,
            comment,
            userName:
              user?.firstName || "Anonymous",
          }),
        }
      );

      if (response.status === 401) {
        window.location.href = getSignInUrl();
        return;
      }

      setComment("");

      onCommentAdded();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  if (!isSignedIn) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <p className="mb-4 text-slate-600 dark:text-slate-400">
          Please sign in to share your reflection.
        </p>

        <button
  onClick={() => {
    window.location.href = getSignInUrl();
  }}
  className="rounded-lg bg-blue-900 px-4 py-2 text-white transition-colors hover:bg-blue-800 dark:bg-blue-700 dark:hover:bg-blue-600"
>
  Sign In
</button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-4 text-xl font-semibold text-slate-900 dark:text-slate-100">
        Share Your Reflection
      </h3>

      <textarea
        value={comment}
        onChange={(e) =>
          setComment(e.target.value)
        }
        rows={5}
        placeholder="What resonated with you?"
        className="w-full rounded-lg border border-slate-300 bg-white p-3 text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:placeholder:text-slate-500"
      />

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="mt-4 rounded-lg bg-blue-900 px-5 py-2 text-white transition-colors hover:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed dark:bg-blue-700 dark:hover:bg-blue-600"
      >
        {loading
          ? "Posting..."
          : "Post Reflection"}
      </button>
    </div>
  );
}