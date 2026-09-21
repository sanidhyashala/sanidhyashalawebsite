"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { publishSubjectiveQuestionRevision } from "@/app/lib/admin/subjective/subjective-question-publish.actions";

type PublishSubjectiveRevisionButtonProps = {
  questionId: string;
  revisionId: string;
  revisionNumber: number;
};

export default function PublishSubjectiveRevisionButton({
  questionId,
  revisionId,
  revisionNumber,
}: PublishSubjectiveRevisionButtonProps) {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handlePublish() {
    setError(null);

    const confirmed = window.confirm(
      `Publish Revision ${revisionNumber}?\n\n` +
        `This revision will become the current published revision. ` +
        `If another revision is currently published, it will be archived.`
    );

    if (!confirmed) {
      return;
    }

    startTransition(async () => {
      const result =
        await publishSubjectiveQuestionRevision({
          questionId,
          revisionId,
        });

      if (!result.success) {
        setError(result.error);
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handlePublish}
        disabled={isPending}
        className="
          inline-flex
          items-center
          rounded-xl
          bg-green-600
          px-4
          py-2
          text-sm
          font-semibold
          text-white
          transition
          hover:bg-green-700
          disabled:cursor-not-allowed
          disabled:opacity-60
          dark:bg-green-500
          dark:text-white
          dark:hover:bg-green-600
        "
      >
        {isPending
          ? "Publishing..."
          : `Publish Revision ${revisionNumber}`}
      </button>

      {error && (
        <p
          className="
            max-w-sm
            text-right
            text-xs
            font-medium
            text-red-600
            dark:text-red-400
          "
        >
          {error}
        </p>
      )}
    </div>
  );
}