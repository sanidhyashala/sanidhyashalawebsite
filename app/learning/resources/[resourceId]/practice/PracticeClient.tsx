"use client";

import {
  useState,
  useTransition,
} from "react";

import MathText from "@/components/learning/MathText";

import {
  savePracticeAnswerAction,
  submitPracticeAttemptAction,
} from "./actions";

type PracticeOption = {
  id: string;
  option_key: string;
  option_text: string;
  display_order: number;
};

type PracticeRevision = {
  id: string;
  revision_number: number;
  question_text: string;
  solution_text: string | null;
  mistake_insight: string | null;
  status: string;

  question_revision_options: PracticeOption[];
};

type PracticeQuestion = {
  question_id: string;
  question_order: number;
  marks: number | null;
  question_revision_id: string;

  question_revisions: PracticeRevision[];
};

type PracticeClientProps = {
  attemptId: string;
  resourceId: string;
  questions: PracticeQuestion[];
};

export default function PracticeClient({
  attemptId,
  resourceId,
  questions,
}: PracticeClientProps) {
  const [
    selectedAnswers,
    setSelectedAnswers,
  ] = useState<Record<string, string>>({});

  const [
    savedAnswers,
    setSavedAnswers,
  ] = useState<Record<string, boolean>>({});

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<string | null>(null);

  const [
    savingQuestionId,
    setSavingQuestionId,
  ] = useState<string | null>(null);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    isPending,
    startTransition,
  ] = useTransition();

  /* =====================================================
   * Select option
   * ===================================================== */

  function handleSelect(
    questionId: string,
    optionId: string
  ) {
    setSelectedAnswers(
      (current) => ({
        ...current,
        [questionId]: optionId,
      })
    );

    /*
     * If the student changes an already-saved answer,
     * it is no longer considered saved until updated.
     */
    setSavedAnswers(
      (current) => ({
        ...current,
        [questionId]: false,
      })
    );

    setErrorMessage(null);
  }

  /* =====================================================
   * Save answer
   * ===================================================== */

  function handleSaveAnswer(
    questionId: string
  ) {
    const selectedOptionId =
      selectedAnswers[questionId];

    if (!selectedOptionId) {
      setErrorMessage(
        "Please select an option before saving your answer."
      );

      return;
    }

    startTransition(
      async () => {
        try {
          setSavingQuestionId(
            questionId
          );

          await savePracticeAnswerAction(
            attemptId,
            questionId,
            selectedOptionId,
            null
          );

          setSavedAnswers(
            (current) => ({
              ...current,
              [questionId]: true,
            })
          );

          setErrorMessage(null);
        } catch (error) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Failed to save answer."
          );
        } finally {
          setSavingQuestionId(null);
        }
      }
    );
  }

  /* =====================================================
   * Submit test
   * ===================================================== */

  function handleSubmitTest() {
    if (
      isSubmitting ||
      isPending
    ) {
      return;
    }

    startTransition(
      async () => {
        try {
          setIsSubmitting(true);
          setErrorMessage(null);

          await submitPracticeAttemptAction(
            attemptId
          );

          window.location.href =
            `/learning/resources/${resourceId}/result?attemptId=${encodeURIComponent(
              attemptId
            )}`;
        } catch (error) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Failed to submit test."
          );

          setIsSubmitting(false);
        }
      }
    );
  }

  const answeredCount =
    Object.keys(
      savedAnswers
    ).filter(
      (questionId) =>
        savedAnswers[questionId]
    ).length;

  return (
    <div>
      {/* =================================================
       * Progress
       * ================================================= */}

      <div
        className="
          mb-8
          rounded-2xl
          border
          bg-white
          p-5
          shadow-sm
          dark:border-slate-800
          dark:bg-slate-900
          dark:shadow-none
        "
      >
        <div
          className="
            flex
            items-center
            justify-between
            gap-4
          "
        >
          <div>
            <p
              className="
                text-sm
                font-medium
                text-slate-500
                dark:text-slate-400
              "
            >
              Progress
            </p>

            <p
              className="
                mt-1
                text-lg
                font-semibold
                text-slate-900
                dark:text-slate-100
              "
            >
              {answeredCount} /{" "}
              {questions.length}{" "}
              answered
            </p>
          </div>

          <p
            className="
              text-sm
              text-slate-500
              dark:text-slate-400
            "
          >
            Attempt in progress
          </p>
        </div>

        <div
          className="
            mt-4
            h-2
            overflow-hidden
            rounded-full
            bg-slate-100
            dark:bg-slate-800
          "
        >
          <div
            className="
              h-full
              rounded-full
              bg-blue-600
              transition-all
            "
            style={{
              width:
                questions.length > 0
                  ? `${
                      (
                        answeredCount /
                        questions.length
                      ) * 100
                    }%`
                  : "0%",
            }}
          />
        </div>
      </div>

      {/* =================================================
       * Error
       * ================================================= */}

      {errorMessage && (
        <div
          className="
            mb-6
            rounded-xl
            border
            border-red-200
            bg-red-50
            px-4
            py-3
            text-sm
            text-red-700
            dark:border-red-900
            dark:bg-red-950/40
            dark:text-red-300
          "
        >
          {errorMessage}
        </div>
      )}

      {/* =================================================
       * Questions
       * ================================================= */}

      <div className="space-y-6">
        {questions.map(
          (
            question,
            index
          ) => {
            /*
             * The exact revision attached to the
             * test_questions row is authoritative.
             */
            const revision =
              question.question_revisions.find(
                (item) =>
                  item.id ===
                  question.question_revision_id
              );

            if (!revision) {
              return null;
            }

            const options =
              revision.question_revision_options
                .slice()
                .sort(
                  (a, b) =>
                    a.display_order -
                    b.display_order
                );

            const selectedOptionId =
              selectedAnswers[
                question.question_id
              ];

            const isSaved =
              savedAnswers[
                question.question_id
              ] === true;

            const isSaving =
              savingQuestionId ===
              question.question_id;

            return (
              <section
                key={
                  question.question_id
                }
                className="
                  rounded-2xl
                  border
                  bg-white
                  p-6
                  shadow-sm
                  dark:border-slate-800
                  dark:bg-slate-900
                  dark:shadow-none
                "
              >
                {/* Question header */}

                <div
                  className="
                    mb-5
                    flex
                    items-start
                    justify-between
                    gap-4
                  "
                >
                  <p
                    className="
                      text-sm
                      font-semibold
                      text-blue-700
                      dark:text-blue-400
                    "
                  >
                    Question{" "}
                    {question.question_order ||
                      index + 1}
                  </p>

                  {question.marks !== null && (
                    <span
                      className="
                        shrink-0
                        rounded-full
                        bg-slate-100
                        px-3
                        py-1
                        text-xs
                        font-medium
                        text-slate-600
                        dark:bg-slate-800
                        dark:text-slate-300
                      "
                    >
                      {question.marks}{" "}
                      {question.marks === 1
                        ? "mark"
                        : "marks"}
                    </span>
                  )}
                </div>

                {/* =================================================
                 * Question text
                 * Math-aware rendering
                 * ================================================= */}

                <MathText
                  value={
                    revision.question_text
                  }
                  className="
                    text-lg
                    font-semibold
                    leading-8
                  "
                />

                {/* =================================================
                 * Options
                 * ================================================= */}

                <div
                  className="
                    mt-6
                    space-y-3
                  "
                >
                  {options.map(
                    (option) => {
                      const isSelected =
                        selectedOptionId ===
                        option.id;

                      return (
                        <label
                          key={
                            option.id
                          }
                          className={`
                            flex
                            cursor-pointer
                            items-start
                            gap-3
                            rounded-xl
                            border
                            p-4
                            transition
                            ${
                              isSelected
                                ? "border-blue-500 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/40"
                                : "border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 dark:border-slate-800 dark:hover:border-slate-700 dark:hover:bg-slate-800/50"
                            }
                          `}
                        >
                          <input
                            type="radio"
                            name={`question-${question.question_id}`}
                            value={
                              option.id
                            }
                            checked={
                              isSelected
                            }
                            onChange={() =>
                              handleSelect(
                                question.question_id,
                                option.id
                              )
                            }
                            disabled={
                              isPending ||
                              isSubmitting
                            }
                            className="
                              mt-1
                              h-4
                              w-4
                            "
                          />

                          <div
                            className="
                              min-w-0
                              text-slate-700
                              dark:text-slate-300
                            "
                          >
                            <span
                              className="
                                mr-2
                                font-semibold
                                text-slate-900
                                dark:text-slate-100
                              "
                            >
                              {
                                option.option_key
                              }.
                            </span>

                            <MathText
                              value={
                                option.option_text
                              }
                              className="
                                inline
                                text-base
                                leading-7
                              "
                            />
                          </div>
                        </label>
                      );
                    }
                  )}
                </div>

                {/* =================================================
                 * Save answer
                 * ================================================= */}

                <div
                  className="
                    mt-6
                    flex
                    items-center
                    justify-between
                    gap-4
                    border-t
                    pt-5
                    dark:border-slate-800
                  "
                >
                  <div>
                    {isSaved ? (
                      <p
                        className="
                          text-sm
                          font-medium
                          text-green-700
                          dark:text-green-400
                        "
                      >
                        ✓ Answer saved
                      </p>
                    ) : (
                      <p
                        className="
                          text-sm
                          text-slate-500
                          dark:text-slate-400
                        "
                      >
                        Select an option and
                        save your answer.
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleSaveAnswer(
                        question.question_id
                      )
                    }
                    disabled={
                      isPending ||
                      isSubmitting ||
                      !selectedOptionId
                    }
                    className="
                      inline-flex
                      items-center
                      justify-center
                      rounded-xl
                      bg-blue-700
                      px-5
                      py-2.5
                      text-sm
                      font-semibold
                      text-white
                      shadow-sm
                      transition
                      hover:bg-blue-800
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                      dark:bg-blue-600
                      dark:hover:bg-blue-500
                    "
                  >
                    {isSaving
                      ? "Saving..."
                      : isSaved
                        ? "Update Answer"
                        : "Save Answer"}
                  </button>
                </div>
              </section>
            );
          }
        )}
      </div>

      {/* =================================================
       * Submit
       * ================================================= */}

      <section
        className="
          mt-8
          rounded-2xl
          border
          bg-white
          p-6
          shadow-sm
          dark:border-slate-800
          dark:bg-slate-900
          dark:shadow-none
        "
      >
        <div
          className="
            flex
            flex-col
            gap-5
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <div>
            <h2
              className="
                font-semibold
                text-slate-900
                dark:text-slate-100
              "
            >
              Ready to submit?
            </h2>

            <p
              className="
                mt-1
                text-sm
                text-slate-500
                dark:text-slate-400
              "
            >
              Make sure you have saved your
              answers before submitting.
            </p>
          </div>

          <button
            type="button"
            onClick={
              handleSubmitTest
            }
            disabled={
              isPending ||
              isSubmitting
            }
            className="
              inline-flex
              items-center
              justify-center
              rounded-xl
              bg-green-700
              px-6
              py-3
              font-semibold
              text-white
              shadow-sm
              transition
              hover:bg-green-800
              disabled:cursor-not-allowed
              disabled:opacity-50
              dark:bg-green-600
              dark:hover:bg-green-500
            "
          >
            {isSubmitting
              ? "Submitting..."
              : "Submit Test →"}
          </button>
        </div>
      </section>
    </div>
  );
}