"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { createAdminSubjectiveQuestion } from "@/app/lib/admin/subjective/subjective-question.actions";
import MathTextPreview from "@/app/admin/mcq-bank/components/MathTextPreview";

type Props = {
  curriculumNodeId: string;
  curriculumClassName: string;
  curriculumChapterName: string;
};

export default function SubjectiveQuestionCreateForm({
  curriculumNodeId,
  curriculumClassName,
  curriculumChapterName,
}: Props) {
  const router = useRouter();

  const [questionText, setQuestionText] = useState("");
  const [solutionText, setSolutionText] = useState("");
  const [mistakeInsight, setMistakeInsight] = useState("");

  const [difficulty, setDifficulty] = useState<
    "" | "EASY" | "MEDIUM" | "HARD"
  >("");

  const [sourceType, setSourceType] = useState<
    "ORIGINAL" | "PYQ" | "PRACTICE"
  >("ORIGINAL");

  const [sourceReference, setSourceReference] = useState("");

  const [marks, setMarks] = useState("1");
  const [estimatedTimeMinutes, setEstimatedTimeMinutes] =
    useState("1");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");
    setError("");

    const trimmedQuestion = questionText.trim();
    const trimmedSolution = solutionText.trim();
    const trimmedMistakeInsight =
      mistakeInsight.trim();
    const trimmedSourceReference =
      sourceReference.trim();

    // -------------------------------------------------------
    // Validation
    // -------------------------------------------------------

    if (!trimmedQuestion) {
      setError("Question text is required.");
      return;
    }

    if (!difficulty) {
      setError("Please select a difficulty level.");
      return;
    }

    const parsedMarks = Number(marks);
    const parsedTime = Number(estimatedTimeMinutes);

    if (
      !Number.isFinite(parsedMarks) ||
      parsedMarks <= 0
    ) {
      setError("Marks must be greater than 0.");
      return;
    }

    if (
      !Number.isInteger(parsedTime) ||
      parsedTime < 0
    ) {
      setError(
        "Estimated time must be a non-negative integer."
      );
      return;
    }

    if (!curriculumNodeId) {
      setError("Curriculum chapter is missing.");
      return;
    }

    // -------------------------------------------------------
    // Create
    // -------------------------------------------------------

    try {
      setSaving(true);

      const result =
        await createAdminSubjectiveQuestion({
          questionText: trimmedQuestion,
          sourceType,
          sourceReference:
            trimmedSourceReference || null,
          difficulty,
          marks: parsedMarks,
          estimatedTimeMinutes: parsedTime,
          solutionText:
            trimmedSolution || null,
          mistakeInsight:
            trimmedMistakeInsight || null,
          curriculumNodeId,
        });

      setMessage(
        `Question #${result.admin_question_number} created successfully as DRAFT.`
      );

      // -------------------------------------------------------
      // Reset form after successful creation
      // -------------------------------------------------------

      setQuestionText("");
      setSolutionText("");
      setMistakeInsight("");
      setSourceReference("");
      setDifficulty("");
      setMarks("1");
      setEstimatedTimeMinutes("1");

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create Subjective question."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8"
    >
      {/* =====================================================
          QUESTION
      ===================================================== */}

      <section>
        <label
          htmlFor="questionText"
          className="mb-2 block text-sm font-medium text-slate-900"
        >
          Question
        </label>

        <textarea
          id="questionText"
          value={questionText}
          onChange={(event) =>
            setQuestionText(event.target.value)
          }
          rows={7}
          placeholder="Write the Subjective question here..."
          className="w-full rounded-lg border px-3 py-3 text-sm outline-none transition focus:ring-2 focus:ring-blue-500"
          disabled={saving}
        />

        <p className="mt-2 text-xs text-slate-500">
          Write the complete question clearly.
          Mathematical expressions can be previewed below.
        </p>

        {questionText.trim() && (
          <div className="mt-4 rounded-lg border bg-slate-50 p-4">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Question Preview
            </div>

            <MathTextPreview value={questionText} />
          </div>
        )}
      </section>

      {/* =====================================================
          SOLUTION / EXPECTED ANSWER
      ===================================================== */}

      <section>
        <label
          htmlFor="solutionText"
          className="mb-2 block text-sm font-medium text-slate-900"
        >
          Solution / Expected Answer
          <span className="ml-2 font-normal text-slate-500">
            Optional
          </span>
        </label>

        <textarea
          id="solutionText"
          value={solutionText}
          onChange={(event) =>
            setSolutionText(event.target.value)
          }
          rows={7}
          placeholder="Write the expected solution, answer, or evaluation reference..."
          className="w-full rounded-lg border px-3 py-3 text-sm outline-none transition focus:ring-2 focus:ring-blue-500"
          disabled={saving}
        />

        <p className="mt-2 text-xs text-slate-500">
          This information will help during evaluation and
          teacher review.
        </p>

        {solutionText.trim() && (
          <div className="mt-4 rounded-lg border bg-slate-50 p-4">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Solution Preview
            </div>

            <MathTextPreview value={solutionText} />
          </div>
        )}
      </section>

      {/* =====================================================
          MISTAKE INSIGHT
      ===================================================== */}

      <section>
        <label
          htmlFor="mistakeInsight"
          className="mb-2 block text-sm font-medium text-slate-900"
        >
          Mistake Insight
          <span className="ml-2 font-normal text-slate-500">
            Optional
          </span>
        </label>

        <textarea
          id="mistakeInsight"
          value={mistakeInsight}
          onChange={(event) =>
            setMistakeInsight(event.target.value)
          }
          rows={4}
          placeholder="Mention common mistakes, misconceptions, or important evaluation points..."
          className="w-full rounded-lg border px-3 py-3 text-sm outline-none transition focus:ring-2 focus:ring-blue-500"
          disabled={saving}
        />

        <p className="mt-2 text-xs text-slate-500">
          Useful for AI-assisted evaluation and teacher
          review.
        </p>
      </section>

      {/* =====================================================
          ACADEMIC DETAILS
      ===================================================== */}

      <section>
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-slate-900">
            Academic Details
          </h3>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {/* Difficulty */}

          <div>
            <label
              htmlFor="difficulty"
              className="mb-2 block text-sm font-medium text-slate-900"
            >
              Difficulty
            </label>

            <select
              id="difficulty"
              value={difficulty}
              onChange={(event) =>
                setDifficulty(
                  event.target.value as
                    | ""
                    | "EASY"
                    | "MEDIUM"
                    | "HARD"
                )
              }
              className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              disabled={saving}
            >
              <option value="">
                Select difficulty
              </option>

              <option value="EASY">
                Easy
              </option>

              <option value="MEDIUM">
                Medium
              </option>

              <option value="HARD">
                Hard
              </option>
            </select>
          </div>

          {/* Marks */}

          <div>
            <label
              htmlFor="marks"
              className="mb-2 block text-sm font-medium text-slate-900"
            >
              Marks
            </label>

            <input
              id="marks"
              type="number"
              min="0.5"
              step="0.5"
              value={marks}
              onChange={(event) =>
                setMarks(event.target.value)
              }
              className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              disabled={saving}
            />
          </div>

          {/* Estimated Time */}

          <div>
            <label
              htmlFor="estimatedTimeMinutes"
              className="mb-2 block text-sm font-medium text-slate-900"
            >
              Estimated Time
            </label>

            <div className="relative">
              <input
                id="estimatedTimeMinutes"
                type="number"
                min="0"
                step="1"
                value={estimatedTimeMinutes}
                onChange={(event) =>
                  setEstimatedTimeMinutes(
                    event.target.value
                  )
                }
                className="w-full rounded-lg border px-3 py-2.5 pr-20 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                disabled={saving}
              />

              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                minutes
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          SOURCE INFORMATION
      ===================================================== */}

      <section>
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-slate-900">
            Source Information
          </h3>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {/* Source Type */}

          <div>
            <label
              htmlFor="sourceType"
              className="mb-2 block text-sm font-medium text-slate-900"
            >
              Source Type
            </label>

            <select
              id="sourceType"
              value={sourceType}
              onChange={(event) =>
                setSourceType(
                  event.target.value as
                    | "ORIGINAL"
                    | "PYQ"
                    | "PRACTICE"
                )
              }
              className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              disabled={saving}
            >
              <option value="ORIGINAL">
                Original
              </option>

              <option value="PYQ">
                Previous Year Question
              </option>

              <option value="PRACTICE">
                Practice
              </option>
            </select>
          </div>

          {/* Source Reference */}

          <div>
            <label
              htmlFor="sourceReference"
              className="mb-2 block text-sm font-medium text-slate-900"
            >
              Source Reference
              <span className="ml-2 font-normal text-slate-500">
                Optional
              </span>
            </label>

            <input
              id="sourceReference"
              type="text"
              value={sourceReference}
              onChange={(event) =>
                setSourceReference(
                  event.target.value
                )
              }
              placeholder="e.g. CBSE 2025, NCERT Ex 3.2..."
              className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              disabled={saving}
            />
          </div>
        </div>
      </section>

      {/* =====================================================
          CURRICULUM CONTEXT
      ===================================================== */}

      <section className="rounded-xl border bg-slate-50 p-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-slate-900">
            Curriculum Context
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            This is fixed by the Subjective resource.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Class
            </div>

            <div className="mt-1 text-sm font-medium text-slate-900">
              {curriculumClassName}
            </div>
          </div>

          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Chapter
            </div>

            <div className="mt-1 text-sm font-medium text-slate-900">
              {curriculumChapterName}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          STATUS
      ===================================================== */}

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {message && (
        <div
          role="status"
          className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
        >
          {message}
        </div>
      )}

      {/* =====================================================
          ACTION
      ===================================================== */}

      <div className="flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500">
          The question will be created as DRAFT.
        </p>

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving
            ? "Creating..."
            : "Create Subjective Question"}
        </button>
      </div>
    </form>
  );
}