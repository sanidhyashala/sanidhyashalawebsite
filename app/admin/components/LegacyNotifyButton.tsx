"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { notifyLegacyJournalAction } from "@/app/lib/journal/actions/notifyLegacyJournalAction";

import type {
  LegacyNotificationRecord,
} from "@/app/lib/journal/legacy/types";

interface LegacyNotifyButtonProps {
  slug: string;

  notification: LegacyNotificationRecord;
}

export default function LegacyNotifyButton({
  slug,
  notification,
}: LegacyNotifyButtonProps) {
  const router = useRouter();

  const [isPending, startTransition] =
    useTransition();

  const [message, setMessage] =
    useState("");

  function handleNotify() {
    startTransition(async () => {
      setMessage("");

      const result =
        await notifyLegacyJournalAction(
          slug
        );

      if (!result.success) {
        setMessage(result.message);
        return;
      }

      setMessage(
        `Community recommended • Delivered ${result.delivered}/${result.recipients}`
      );

      router.refresh();
    });
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
          ? "Sending..."
          : notification.notificationSentAt
          ? "Recommend Again"
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