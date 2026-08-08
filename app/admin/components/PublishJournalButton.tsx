"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { publishJournalAction } from "@/app/lib/journal/actions/publishJournalAction";

interface PublishJournalButtonProps {
  slug: string;

  published: boolean;
}

export default function PublishJournalButton({
  slug,
  published,
}: PublishJournalButtonProps) {
  const router = useRouter();

  const [isPending, startTransition] =
    useTransition();

  const [message, setMessage] =
    useState("");

  async function handlePublish() {
    startTransition(async () => {
      setMessage("");

      const result =
        await publishJournalAction(
          slug
        );

      setMessage(result.message);

      if (result.success) {
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">

      <button
        type="button"
        onClick={handlePublish}
        disabled={isPending || published}
        className="
          rounded-lg
          bg-emerald-600
          px-3
          py-2
          text-sm
          text-white

          hover:bg-emerald-700

          disabled:cursor-not-allowed
          disabled:opacity-50
        "
      >
        {published
  ? "Published ✓"
  : isPending
    ? "Publishing..."
    : "Live Publish"}
      </button>

      {message && (
        <p
          className="
            text-xs
            text-slate-500

            dark:text-slate-400
          "
        >
          {message}
        </p>
      )}

    </div>
  );
}