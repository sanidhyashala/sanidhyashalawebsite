"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { notifyJournalAction } from "@/app/lib/journal/actions/notifyJournalAction";

interface NotifyJournalButtonProps {
  slug: string;

  published: boolean;

  resend?: boolean;
}

export default function NotifyJournalButton({
  slug,
  published,
  resend = false,
}: NotifyJournalButtonProps) {
  const router = useRouter();

  const [isPending, startTransition] =
    useTransition();

  const [message, setMessage] =
    useState("");

  async function handleNotify() {
    startTransition(async () => {
      setMessage("");

      const result =
        await notifyJournalAction(
          slug,
          resend
        );

      if (result.success) {
        setMessage(
          `Delivered ${result.delivered}/${result.recipients} emails successfully.`
        );

        router.refresh();
      } else {
        setMessage(result.message);
      }
    });
  }

  if (!published) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">

      <button
        type="button"
        onClick={handleNotify}
        disabled={isPending}
        className="
          rounded-lg
          bg-indigo-600
          px-3
          py-2
          text-sm
          text-white

          hover:bg-indigo-700

          disabled:cursor-not-allowed
          disabled:opacity-50
        "
      >
        {isPending
          ? "Notifying..."
          : resend
            ? "Send Again"
            : "Notify Community"}
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