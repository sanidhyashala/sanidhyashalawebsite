"use client";

import { useMemo, useState } from "react";

import type { BulkMcqInput } from "@/app/lib/admin/mcq-bank/mcq-bulk-import.actions";

import MathTextPreview from "../components/MathTextPreview";

interface Props {
  questions: BulkMcqInput[];
  fileName?: string | null;
}

/* =========================================================
 * Helpers
 * ========================================================= */

function getDifficultyLabel(
  difficulty: BulkMcqInput["difficulty"]
): string {
  return difficulty ?? "Not specified";
}

function getSourceLabel(
  sourceType: BulkMcqInput["sourceType"]
): string {
  return sourceType;
}

/* =========================================================
 * Component
 * ========================================================= */

export default function ExcelMcqPreview({
  questions,
  fileName,
}: Props) {
  const [showAll, setShowAll] = useState(false);

  const summary = useMemo(() => {
    const difficulty = {
      EASY: 0,
      MEDIUM: 0,
      HARD: 0,
      UNSPECIFIED: 0,
    };

    const source = {
      ORIGINAL: 0,
      PYQ: 0,
      PRACTICE: 0,
    };

    questions.forEach((question) => {
      if (question.difficulty) {
        difficulty[question.difficulty]++;
      } else {
        difficulty.UNSPECIFIED++;
      }

      source[question.sourceType]++;
    });

    return {
      difficulty,
      source,
    };
  }, [questions]);

  if (questions.length === 0) {
    return null;
  }

  const visibleQuestions = showAll
    ? questions
    : questions.slice(0, 5);

  return (
    <section
      className="
        rounded-2xl
        border
        border-slate-200
        bg-white
        p-5
        dark:border-slate-800
        dark:bg-slate-950
      "
    >
      {/* =================================================
       * Header
       * ================================================= */}

      <div
        className="
          flex
          flex-col
          gap-3
          sm:flex-row
          sm:items-start
          sm:justify-between
        "
      >
        <div>
          <p
            className="
              text-xs
              font-semibold
              uppercase
              tracking-wider
              text-blue-600
              dark:text-blue-400
            "
          >
            Excel Import Preview
          </p>

          <h3
            className="
              mt-1
              text-base
              font-semibold
              text-slate-900
              dark:text-white
            "
          >
            {questions.length} MCQ(s) ready
          </h3>

          {fileName && (
            <p
              className="
                mt-1
                text-xs
                text-slate-500
                dark:text-slate-400
              "
            >
              {fileName}
            </p>
          )}
        </div>

        <div
          className="
            inline-flex
            w-fit
            items-center
            rounded-full
            border
            border-green-200
            bg-green-50
            px-3
            py-1
            text-xs
            font-semibold
            text-green-700
            dark:border-green-900/50
            dark:bg-green-950/30
            dark:text-green-400
          "
        >
          ✓ Validation passed
        </div>
      </div>

      {/* =================================================
       * Summary
       * ================================================= */}

      <div
        className="
          mt-5
          grid
          gap-4
          sm:grid-cols-2
        "
      >
        <div
          className="
            rounded-xl
            border
            border-slate-200
            p-4
            dark:border-slate-800
          "
        >
          <p
            className="
              text-xs
              font-semibold
              uppercase
              tracking-wider
              text-slate-400
            "
          >
            Difficulty
          </p>

          <div
            className="
              mt-3
              flex
              flex-wrap
              gap-2
            "
          >
            <SummaryBadge
              label="Easy"
              value={summary.difficulty.EASY}
            />

            <SummaryBadge
              label="Medium"
              value={summary.difficulty.MEDIUM}
            />

            <SummaryBadge
              label="Hard"
              value={summary.difficulty.HARD}
            />

            {summary.difficulty.UNSPECIFIED > 0 && (
              <SummaryBadge
                label="Unspecified"
                value={
                  summary.difficulty.UNSPECIFIED
                }
              />
            )}
          </div>
        </div>

        <div
          className="
            rounded-xl
            border
            border-slate-200
            p-4
            dark:border-slate-800
          "
        >
          <p
            className="
              text-xs
              font-semibold
              uppercase
              tracking-wider
              text-slate-400
            "
          >
            Source
          </p>

          <div
            className="
              mt-3
              flex
              flex-wrap
              gap-2
            "
          >
            <SummaryBadge
              label="Original"
              value={summary.source.ORIGINAL}
            />

            <SummaryBadge
              label="PYQ"
              value={summary.source.PYQ}
            />

            <SummaryBadge
              label="Practice"
              value={summary.source.PRACTICE}
            />
          </div>
        </div>
      </div>

      {/* =================================================
       * Questions
       * ================================================= */}

      <div className="mt-5 space-y-4">
        {visibleQuestions.map(
          (question, index) => (
            <QuestionPreview
              key={`${index}-${question.questionText}`}
              question={question}
              number={index + 1}
            />
          )
        )}
      </div>

      {/* =================================================
       * Show More / Less
       * ================================================= */}

      {questions.length > 5 && (
        <div
          className="
            mt-5
            flex
            justify-center
          "
        >
          <button
            type="button"
            onClick={() =>
              setShowAll((current) => !current)
            }
            className="
              rounded-xl
              border
              border-slate-300
              px-4
              py-2
              text-xs
              font-semibold
              text-slate-700
              transition
              hover:bg-slate-50
              dark:border-slate-700
              dark:text-slate-300
              dark:hover:bg-slate-900
            "
          >
            {showAll
              ? "Show less"
              : `Show all ${questions.length} MCQs`}
          </button>
        </div>
      )}

      {/* =================================================
       * Final Safety Note
       * ================================================= */}

      <div
        className="
          mt-5
          rounded-xl
          border
          border-blue-100
          bg-blue-50
          px-4
          py-3
          dark:border-blue-900/50
          dark:bg-blue-950/20
        "
      >
        <p
          className="
            text-xs
            leading-5
            text-blue-700
            dark:text-blue-300
          "
        >
          These MCQs have passed Excel-side
          validation. Database validation will
          run again during import. The import
          is atomic, so a database error rolls
          back the entire batch.
        </p>
      </div>
    </section>
  );
}

/* =========================================================
 * Summary Badge
 * ========================================================= */

function SummaryBadge({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <span
      className="
        inline-flex
        items-center
        gap-1.5
        rounded-full
        bg-slate-100
        px-3
        py-1.5
        text-xs
        font-medium
        text-slate-700
        dark:bg-slate-900
        dark:text-slate-300
      "
    >
      <span>{label}</span>

      <span className="font-semibold">
        {value}
      </span>
    </span>
  );
}

/* =========================================================
 * Question Preview
 * ========================================================= */

function QuestionPreview({
  question,
  number,
}: {
  question: BulkMcqInput;
  number: number;
}) {
  return (
    <article
      className="
        rounded-xl
        border
        border-slate-200
        p-4
        dark:border-slate-800
      "
    >
      {/* =================================================
       * Question Header
       * ================================================= */}

      <div
        className="
          flex
          items-start
          justify-between
          gap-3
        "
      >
        <p
          className="
            text-xs
            font-semibold
            text-slate-400
          "
        >
          MCQ {number}
        </p>

        <div
          className="
            flex
            flex-wrap
            justify-end
            gap-2
          "
        >
          <span
            className="
              rounded-full
              bg-slate-100
              px-2.5
              py-1
              text-[11px]
              font-medium
              text-slate-600
              dark:bg-slate-900
              dark:text-slate-400
            "
          >
            {getSourceLabel(
              question.sourceType
            )}
          </span>

          {question.difficulty && (
            <span
              className="
                rounded-full
                bg-blue-50
                px-2.5
                py-1
                text-[11px]
                font-medium
                text-blue-700
                dark:bg-blue-950/30
                dark:text-blue-300
              "
            >
              {getDifficultyLabel(
                question.difficulty
              )}
            </span>
          )}
        </div>
      </div>

      {/* =================================================
       * Question Text
       * ================================================= */}

      <div
        className="
          mt-3
          text-sm
          font-medium
          leading-6
          text-slate-900
          dark:text-white
        "
      >
        <MathTextPreview
          value={question.questionText}
        />
      </div>

      {/* =================================================
       * Options
       * ================================================= */}

      <div
        className="
          mt-3
          grid
          gap-2
          sm:grid-cols-2
        "
      >
        {question.options.map(
          (option) => (
            <div
              key={option.optionKey}
              className={`
                rounded-lg
                border
                px-3
                py-2.5
                text-sm
                ${
                  option.isCorrect
                    ? `
                      border-green-300
                      bg-green-50
                      text-green-800
                      dark:border-green-900
                      dark:bg-green-950/30
                      dark:text-green-300
                    `
                    : `
                      border-slate-200
                      bg-slate-50
                      text-slate-700
                      dark:border-slate-800
                      dark:bg-slate-900/50
                      dark:text-slate-300
                    `
                }
              `}
            >
              <div className="flex items-start gap-2">
                <span className="shrink-0 font-semibold">
                  {option.optionKey}.
                </span>

                <div className="min-w-0 flex-1">
                  <MathTextPreview
                    value={option.optionText}
                  />
                </div>

                {option.isCorrect && (
                  <span
                    className="
                      shrink-0
                      text-xs
                      font-semibold
                    "
                    title="Correct answer"
                  >
                    ✓
                  </span>
                )}
              </div>
            </div>
          )
        )}
      </div>

      {/* =================================================
       * Solution / Mistake Insight
       * ================================================= */}

      {(question.solutionText ||
        question.mistakeInsight) && (
        <div
          className="
            mt-3
            grid
            gap-3
            sm:grid-cols-2
          "
        >
          {/* Solution */}

          {question.solutionText && (
            <div
              className="
                rounded-lg
                bg-slate-50
                px-3
                py-2.5
                dark:bg-slate-900/50
              "
            >
              <p
                className="
                  text-[11px]
                  font-semibold
                  uppercase
                  tracking-wide
                  text-slate-400
                "
              >
                Solution
              </p>

              <div
                className="
                  mt-1
                  text-xs
                  leading-5
                  text-slate-600
                  dark:text-slate-400
                "
              >
                <MathTextPreview
                  value={
                    question.solutionText
                  }
                />
              </div>
            </div>
          )}

          {/* Mistake Insight */}

          {question.mistakeInsight && (
            <div
              className="
                rounded-lg
                bg-amber-50
                px-3
                py-2.5
                dark:bg-amber-950/20
              "
            >
              <p
                className="
                  text-[11px]
                  font-semibold
                  uppercase
                  tracking-wide
                  text-amber-600
                  dark:text-amber-400
                "
              >
                Mistake Insight
              </p>

              <div
                className="
                  mt-1
                  text-xs
                  leading-5
                  text-amber-800
                  dark:text-amber-300
                "
              >
                <MathTextPreview
                  value={
                    question.mistakeInsight
                  }
                />
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  );
}