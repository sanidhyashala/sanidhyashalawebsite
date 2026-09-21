"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import MathTextPreview from "@/app/admin/mcq-bank/components/MathTextPreview";

import { createSubjectiveQuestionRevision } from "@/app/lib/admin/subjective/subjective-question-revision.actions";

type SubjectiveQuestionRevisionFormProps = {
  questionId: string;
  initialQuestionText: string;
  initialSolutionText: string;
  initialMistakeInsight: string;
  currentRevisionNumber: number;
};

export default function SubjectiveQuestionRevisionForm({
  questionId,
  initialQuestionText,
  initialSolutionText,
  initialMistakeInsight,
  currentRevisionNumber,
}: SubjectiveQuestionRevisionFormProps) {
  const router = useRouter();

  const [questionText, setQuestionText] =
    useState(initialQuestionText);

  const [solutionText, setSolutionText] =
    useState(initialSolutionText);

  const [mistakeInsight, setMistakeInsight] =
    useState(initialMistakeInsight);

  const [error, setError] = useState<string | null>(
    null
  );

  const [isPending, startTransition] =
    useTransition();

  function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError(null);

    if (!questionText.trim()) {
      setError("Question text is required.");
      return;
    }

    startTransition(async () => {
      const result =
        await createSubjectiveQuestionRevision({
          questionId,
          questionText,
          solutionText,
          mistakeInsight,
        });

      if (!result.success) {
        setError(result.error);
        return;
      }

      router.push(
        `/admin/subjective/${questionId}`
      );

      router.refresh();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8"
    >
      {/* =================================================
       * Revision Notice
       * ================================================= */}

      <section
        className="
          rounded-2xl
          border
          border-blue-100
          bg-blue-50
          p-5
          dark:border-blue-900/50
          dark:bg-blue-950/20
        "
      >
        <p className="text-sm font-semibold text-blue-900 dark:text-blue-300">
          Revision-safe editing
        </p>

        <p className="mt-2 text-sm leading-6 text-blue-800 dark:text-blue-400">
          Saving this form will create a new DRAFT
          revision. The currently published revision
          will remain unchanged.
        </p>

        <p className="mt-3 text-xs text-blue-700 dark:text-blue-500">
          Current revision: v
          {currentRevisionNumber}
        </p>

        <p className="mt-1 text-xs text-blue-700 dark:text-blue-500">
          The new revision will receive the next
          revision number automatically.
        </p>
      </section>

      {/* =================================================
       * Question Text
       * ================================================= */}

      <section
        className="
          rounded-2xl
          border
          border-slate-200
          bg-white
          p-6
          dark:border-slate-800
          dark:bg-slate-900
        "
      >
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Question Text
          </h2>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Edit the question using plain text and
            LaTeX math notation where required.
          </p>
        </div>

        <div className="mt-5 grid gap-6 lg:grid-cols-2">

          {/* Editor */}

          <div>
            <label
              htmlFor="questionText"
              className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
            >
              New Revision
            </label>

            <textarea
              id="questionText"
              value={questionText}
              onChange={(event) =>
                setQuestionText(event.target.value)
              }
              rows={18}
              disabled={isPending}
              placeholder="Enter the revised question..."
              className="
                w-full
                resize-y
                rounded-xl
                border
                border-slate-300
                bg-white
                px-4
                py-3
                text-sm
                leading-7
                text-slate-900
                outline-none
                transition
                focus:border-slate-500
                focus:ring-2
                focus:ring-slate-200
                disabled:cursor-not-allowed
                disabled:opacity-60
                dark:border-slate-700
                dark:bg-slate-950
                dark:text-slate-100
                dark:focus:border-slate-500
                dark:focus:ring-slate-800
              "
            />
          </div>

          {/* Preview */}

          <div>
            <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              Live Preview
            </p>

            <div
              className="
                min-h-[430px]
                rounded-xl
                border
                border-slate-200
                bg-slate-50
                p-5
                dark:border-slate-700
                dark:bg-slate-950
              "
            >
              <MathTextPreview
                value={questionText}
              />
            </div>
          </div>

        </div>
      </section>

      {/* =================================================
       * Solution
       * ================================================= */}

      <section
        className="
          rounded-2xl
          border
          border-slate-200
          bg-white
          p-6
          dark:border-slate-800
          dark:bg-slate-900
        "
      >
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Solution / Answer
          </h2>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Optional. Provide the expected solution,
            method, or answer.
          </p>
        </div>

        <div className="mt-5 grid gap-6 lg:grid-cols-2">

          <textarea
            value={solutionText}
            onChange={(event) =>
              setSolutionText(event.target.value)
            }
            rows={12}
            disabled={isPending}
            placeholder="Enter the solution or expected answer..."
            className="
              w-full
              resize-y
              rounded-xl
              border
              border-slate-300
              bg-white
              px-4
              py-3
              text-sm
              leading-7
              text-slate-900
              outline-none
              transition
              focus:border-slate-500
              focus:ring-2
              focus:ring-slate-200
              disabled:cursor-not-allowed
              disabled:opacity-60
              dark:border-slate-700
              dark:bg-slate-950
              dark:text-slate-100
              dark:focus:border-slate-500
              dark:focus:ring-slate-800
            "
          />

          <div
            className="
              min-h-[288px]
              rounded-xl
              border
              border-slate-200
              bg-slate-50
              p-5
              dark:border-slate-700
              dark:bg-slate-950
            "
          >
            <MathTextPreview
              value={solutionText}
            />
          </div>

        </div>
      </section>

      {/* =================================================
       * Mistake Insight
       * ================================================= */}

      <section
        className="
          rounded-2xl
          border
          border-slate-200
          bg-white
          p-6
          dark:border-slate-800
          dark:bg-slate-900
        "
      >
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Mistake Insight
          </h2>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Optional teacher guidance about common
            mistakes or misconceptions.
          </p>
        </div>

        <textarea
          value={mistakeInsight}
          onChange={(event) =>
            setMistakeInsight(event.target.value)
          }
          rows={8}
          disabled={isPending}
          placeholder="Enter common mistakes, misconceptions, or teacher guidance..."
          className="
            mt-5
            w-full
            resize-y
            rounded-xl
            border
            border-slate-300
            bg-white
            px-4
            py-3
            text-sm
            leading-7
            text-slate-900
            outline-none
            transition
            focus:border-slate-500
            focus:ring-2
            focus:ring-slate-200
            disabled:cursor-not-allowed
            disabled:opacity-60
            dark:border-slate-700
            dark:bg-slate-950
            dark:text-slate-100
            dark:focus:border-slate-500
            dark:focus:ring-slate-800
          "
        />
      </section>

      {/* =================================================
       * Error
       * ================================================= */}

      {error && (
        <div
          className="
            rounded-xl
            border
            border-red-200
            bg-red-50
            px-4
            py-3
            text-sm
            font-medium
            text-red-700
            dark:border-red-900/50
            dark:bg-red-950/20
            dark:text-red-400
          "
        >
          {error}
        </div>
      )}

      {/* =================================================
       * Actions
       * ================================================= */}

      <div
        className="
          flex
          flex-wrap
          items-center
          justify-between
          gap-3
          border-t
          border-slate-200
          pt-6
          dark:border-slate-800
        "
      >
        <button
          type="button"
          onClick={() =>
            router.push(
              `/admin/subjective/${questionId}`
            )
          }
          disabled={isPending}
          className="
            inline-flex
            rounded-xl
            border
            border-slate-200
            bg-white
            px-5
            py-2.5
            text-sm
            font-semibold
            text-slate-700
            transition
            hover:bg-slate-50
            disabled:cursor-not-allowed
            disabled:opacity-60
            dark:border-slate-700
            dark:bg-slate-900
            dark:text-slate-300
            dark:hover:bg-slate-800
          "
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={isPending}
          className="
            inline-flex
            items-center
            rounded-xl
            bg-slate-900
            px-5
            py-2.5
            text-sm
            font-semibold
            text-white
            transition
            hover:bg-slate-800
            disabled:cursor-not-allowed
            disabled:opacity-60
            dark:bg-white
            dark:text-slate-900
            dark:hover:bg-slate-200
          "
        >
          {isPending
            ? "Creating Revision..."
            : "Save as New Revision"}
        </button>
      </div>
    </form>
  );
}