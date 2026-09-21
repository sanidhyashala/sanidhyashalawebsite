"use client";

import {
  CheckCircle2,
  Loader2,
  Mail,
  RefreshCw,
} from "lucide-react";
import { useState, useTransition } from "react";

import {
  resendSubjectiveEvaluationEmail,
} from "@/app/lib/admin/subjective/resend-subjective-evaluation-email.actions";

type Props = {
  attemptId: string;
};

export default function ResendSubjectiveEvaluationEmailButton({
  attemptId,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleResend() {
    setMessage(null);
    setSuccess(false);

    startTransition(async () => {
      const result =
        await resendSubjectiveEvaluationEmail(
          attemptId,
        );

      if (result.success) {
        setSuccess(true);
        setMessage("Email sent");

        window.setTimeout(() => {
          setMessage(null);
          setSuccess(false);
        }, 4000);

        return;
      }

      setMessage(result.error);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        type="button"
        onClick={handleResend}
        disabled={isPending}
        title="Send the evaluation email again"
        className="
          inline-flex items-center gap-1.5
          rounded-lg
          border border-blue-200
          bg-blue-50
          px-3 py-2
          text-xs font-semibold
          text-blue-700
          transition
          hover:border-blue-300
          hover:bg-blue-100
          disabled:cursor-not-allowed
          disabled:opacity-60
          dark:border-blue-900/60
          dark:bg-blue-950/30
          dark:text-blue-300
          dark:hover:bg-blue-950/50
        "
      >
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : success ? (
          <CheckCircle2 className="h-3.5 w-3.5" />
        ) : (
          <RefreshCw className="h-3.5 w-3.5" />
        )}

        {isPending
          ? "Sending..."
          : success
            ? "Sent"
            : "Resend Email"}
      </button>

      {message && !success && (
        <div className="max-w-44 text-right text-[11px] leading-4 text-red-600 dark:text-red-400">
          {message}
        </div>
      )}

      {message && success && (
        <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
          <Mail className="h-3 w-3" />
          {message}
        </div>
      )}
    </div>
  );
}
