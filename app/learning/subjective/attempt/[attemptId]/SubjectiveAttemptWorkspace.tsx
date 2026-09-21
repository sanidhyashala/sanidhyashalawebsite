"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";

import { useRouter } from "next/navigation";

import { useLearningSupabaseBrowser } from "@/lib/learning/supabase-learning-browser";

import {
  saveSubjectiveDraft,
} from "@/app/lib/learning/subjective/subjective-draft.actions";

import {
  submitSubjectiveAttempt,
} from "@/app/lib/learning/subjective/subjective-submit.actions";

import MathTextPreview from "@/app/admin/mcq-bank/components/MathTextPreview";
import SubjectiveSolutionUploader from "./SubjectiveSolutionUploader";

/*
 * ---------------------------------------------------------
 * Types
 * ---------------------------------------------------------
 */

export type SubjectiveSubmissionFile = {
  id: string;
  file_path: string;
  file_name: string;
  mime_type: string;
  file_size_bytes: number | null;
  page_number: number | null;
};

export type SubjectiveAttemptSubmission = {
  id: string;
  answer_text: string;
  status: string;
  updated_at: string;
  files: SubjectiveSubmissionFile[];
};

export type SubjectiveAttemptQuestion = {
  id: string;
  question_id: string;
  question_revision_id: string;
  question_order: number;
  marks: number;
  question_text: string;
  submission: SubjectiveAttemptSubmission | null;
};

type Props = {
  attemptId: string;
  setTitle: string;
  attemptNumber: number;
  attemptStatus: string;
  questions: SubjectiveAttemptQuestion[];
};

/*
 * ---------------------------------------------------------
 * Current solution state
 * ---------------------------------------------------------
 */

type SolutionState = {
  submissionId: string | null;
  fileCount: number;
};

/*
 * ---------------------------------------------------------
 * Component
 * ---------------------------------------------------------
 */

export default function SubjectiveAttemptWorkspace({
  attemptId,
  setTitle,
  attemptNumber,
  attemptStatus,
  questions,
}: Props) {
  const router = useRouter();

  const supabase =
    useLearningSupabaseBrowser();

  const [
    currentIndex,
    setCurrentIndex,
  ] = useState(0);

  const [
    answers,
    setAnswers,
  ] = useState<Record<string, string>>(
    () =>
      Object.fromEntries(
        questions.map((question) => [
          question.id,
          question.submission?.answer_text ?? "",
        ])
      )
  );

  const [
    saveState,
    setSaveState,
  ] = useState<
    Record<
      string,
      "idle" | "saving" | "saved" | "error"
    >
  >({});

  const [
    saveError,
    setSaveError,
  ] = useState<
    Record<string, string | null>
  >({});

  /*
   * -------------------------------------------------------
   * Solution state
   *
   * solutionStates:
   *   submission id + file count
   *
   * solutionFiles:
   *   COMPLETE live file list for every question
   *
   * This is the important fix for:
   * Q9 -> Q3 -> Q9
   * -------------------------------------------------------
   */

  const [
    solutionStates,
    setSolutionStates,
  ] = useState<
    Record<string, SolutionState>
  >(() =>
    Object.fromEntries(
      questions.map((question) => [
        question.id,
        {
          submissionId:
            question.submission?.id ??
            null,
          fileCount:
            question.submission?.files
              ?.length ?? 0,
        },
      ])
    )
  );

  const [
    solutionFiles,
    setSolutionFiles,
  ] = useState<
    Record<
      string,
      SubjectiveSubmissionFile[]
    >
  >(() =>
    Object.fromEntries(
      questions.map((question) => [
        question.id,
        question.submission?.files ?? [],
      ])
    )
  );

  const [
    isRefreshingSolutions,
    setIsRefreshingSolutions,
  ] = useState(false);

  const [
    isReviewOpen,
    setIsReviewOpen,
  ] = useState(false);

  const [
    isSubmitDialogOpen,
    setIsSubmitDialogOpen,
  ] = useState(false);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    submitError,
    setSubmitError,
  ] = useState<string | null>(null);

  const [
    submitResult,
    setSubmitResult,
  ] = useState<{
    submittedCount: number;
    questionCount: number;
  } | null>(null);

  const [
    isPending,
    startTransition,
  ] = useTransition();

  /*
   * -------------------------------------------------------
   * Locked state
   * -------------------------------------------------------
   */

  const isLocked =
    attemptStatus !==
    "IN_PROGRESS";

  /*
   * -------------------------------------------------------
   * Current question
   * -------------------------------------------------------
   */

  const currentQuestion =
    questions[currentIndex];

  const currentAnswer =
    currentQuestion
      ? answers[currentQuestion.id] ?? ""
      : "";

  /*
   * -------------------------------------------------------
   * Solution counts
   *
   * IMPORTANT:
   * A question is considered solved only when
   * at least one solution file exists.
   *
   * Reflection / difficulty note does NOT count.
   * -------------------------------------------------------
   */

  const submittedSolutionCount =
    useMemo(
      () =>
        questions.filter(
          (question) =>
            (
              solutionStates[
                question.id
              ]?.fileCount ?? 0
            ) > 0
        ).length,
      [
        questions,
        solutionStates,
      ]
    );

  const questionCount =
    questions.length;

  const reflectionCount =
    useMemo(
      () =>
        questions.filter(
          (question) =>
            (
              answers[
                question.id
              ] ?? ""
            ).trim().length > 0
        ).length,
      [
        questions,
        answers,
      ]
    );

  const allSolutionsSubmitted =
    questionCount > 0 &&
    submittedSolutionCount ===
      questionCount;

  /*
   * -------------------------------------------------------
   * Refresh solution state from database
   *
   * IMPORTANT:
   * We now fetch COMPLETE file metadata,
   * not just file id/count.
   * -------------------------------------------------------
   */

  const refreshSolutionStates =
    useCallback(
      async () => {
        if (
          questions.length === 0
        ) {
          return;
        }

        setIsRefreshingSolutions(
          true
        );

        try {
          const questionIds =
            questions.map(
              (question) =>
                question.id
            );

          /*
           * -----------------------------------------------
           * Fetch submissions
           * -----------------------------------------------
           */

          const {
            data:
              submissionRows,
            error:
              submissionError,
          } =
            await supabase
              .from(
                "subjective_submissions"
              )
              .select(
                `
                  id,
                  attempt_question_id
                `
              )
              .in(
                "attempt_question_id",
                questionIds
              );

          if (submissionError) {
            throw new Error(
              submissionError.message
            );
          }

          const submissions =
            (submissionRows ??
              []) as Array<{
              id: string;
              attempt_question_id: string;
            }>;

          const submissionIds =
            submissions.map(
              (submission) =>
                submission.id
            );

          /*
           * -----------------------------------------------
           * Fetch COMPLETE file rows
           * -----------------------------------------------
           */

          let fileRows: Array<{
            id: string;
            submission_id: string;
            file_path: string;
            file_name: string;
            mime_type: string;
            file_size_bytes: number | null;
            page_number: number | null;
          }> = [];

          if (
            submissionIds.length > 0
          ) {
            const {
              data:
                filesData,
              error:
                filesError,
            } =
              await supabase
                .from(
                  "subjective_submission_files"
                )
                .select(
                  `
                    id,
                    submission_id,
                    file_path,
                    file_name,
                    mime_type,
                    file_size_bytes,
                    page_number
                  `
                )
                .in(
                  "submission_id",
                  submissionIds
                )
                .order(
                  "page_number",
                  {
                    ascending: true,
                    nullsFirst: false,
                  }
                );

            if (filesError) {
              throw new Error(
                filesError.message
              );
            }

            fileRows =
              (filesData ??
                []) as Array<{
                id: string;
                submission_id: string;
                file_path: string;
                file_name: string;
                mime_type: string;
                file_size_bytes: number | null;
                page_number: number | null;
              }>;
          }

          /*
           * -----------------------------------------------
           * Build next solution state
           * -----------------------------------------------
           */

          const nextStates: Record<
            string,
            SolutionState
          > = {};

          const nextFiles: Record<
            string,
            SubjectiveSubmissionFile[]
          > = {};

          /*
           * Start every question with an empty state.
           */

          for (const question of questions) {
            nextStates[
              question.id
            ] = {
              submissionId:
                null,
              fileCount: 0,
            };

            nextFiles[
              question.id
            ] = [];
          }

          /*
           * Map submission -> question
           */

          const submissionToQuestion =
            new Map<
              string,
              string
            >();

          for (
            const submission of submissions
          ) {
            submissionToQuestion.set(
              submission.id,
              submission.attempt_question_id
            );

            nextStates[
              submission.attempt_question_id
            ] = {
              submissionId:
                submission.id,
              fileCount: 0,
            };
          }

          /*
           * Map complete files to their question.
           */

          for (
            const file of fileRows
          ) {
            const questionId =
              submissionToQuestion.get(
                file.submission_id
              );

            if (!questionId) {
              continue;
            }

            const normalizedFile: SubjectiveSubmissionFile =
              {
                id: file.id,
                file_path:
                  file.file_path,
                file_name:
                  file.file_name,
                mime_type:
                  file.mime_type,
                file_size_bytes:
                  file.file_size_bytes,
                page_number:
                  file.page_number,
              };

            nextFiles[
              questionId
            ] = [
              ...(nextFiles[
                questionId
              ] ?? []),
              normalizedFile,
            ];
          }

          /*
           * Recalculate counts from the
           * complete file map.
           */

          for (const question of questions) {
            const files =
              nextFiles[
                question.id
              ] ?? [];

            const existingSubmission =
              nextStates[
                question.id
              ];

            nextStates[
              question.id
            ] = {
              submissionId:
                existingSubmission
                  ?.submissionId ??
                null,
              fileCount:
                files.length,
            };
          }

          /*
           * IMPORTANT:
           * Update both states together.
           */

          setSolutionStates(
            nextStates
          );

          setSolutionFiles(
            nextFiles
          );
        } catch (error) {
          console.error(
            "Failed to refresh Subjective solution states:",
            error
          );
        } finally {
          setIsRefreshingSolutions(
            false
          );
        }
      },
      [
        questions,
        supabase,
      ]
    );

  /*
   * -------------------------------------------------------
   * Initial solution state refresh
   * -------------------------------------------------------
   */

  useEffect(() => {
    void refreshSolutionStates();
  }, [
    refreshSolutionStates,
  ]);

  /*
   * -------------------------------------------------------
   * Keep local answer state aligned with server props
   *
   * IMPORTANT:
   * Do NOT reset solutionStates or solutionFiles here.
   *
   * Those states are controlled locally because
   * the uploader can change them without changing
   * the server component props.
   * -------------------------------------------------------
   */

  useEffect(() => {
    setAnswers(
      Object.fromEntries(
        questions.map((question) => [
          question.id,
          question.submission?.answer_text ??
            "",
        ])
      )
    );

    setCurrentIndex((previous) =>
      Math.min(
        previous,
        Math.max(
          questions.length - 1,
          0
        )
      )
    );
  }, [questions]);

  /*
   * -------------------------------------------------------
   * Save reflection / difficulty note
   *
   * IMPORTANT:
   * This is NOT the final solution.
   * The actual solution is uploaded through
   * SubjectiveSolutionUploader.
   * -------------------------------------------------------
   */

  async function handleSaveReflection(
    questionId: string
  ) {
    if (isLocked) {
      return;
    }

    setSaveState(
      (previous) => ({
        ...previous,
        [questionId]:
          "saving",
      })
    );

    setSaveError(
      (previous) => ({
        ...previous,
        [questionId]:
          null,
      })
    );

    try {
      const result =
        await saveSubjectiveDraft(
          questionId,
          answers[questionId] ?? ""
        );

      if (!result.success) {
        setSaveState(
          (previous) => ({
            ...previous,
            [questionId]:
              "error",
          })
        );

        setSaveError(
          (previous) => ({
            ...previous,
            [questionId]:
              result.error,
          })
        );

        return false;
      }

      setSaveState(
        (previous) => ({
          ...previous,
          [questionId]:
            "saved",
        })
      );

      return true;
    } catch (error) {
      console.error(
        "Subjective reflection save error:",
        error
      );

      setSaveState(
        (previous) => ({
          ...previous,
          [questionId]:
            "error",
        })
      );

      setSaveError(
        (previous) => ({
          ...previous,
          [questionId]:
            error instanceof Error
              ? error.message
              : "Unable to save your reflection.",
        })
      );

      return false;
    }
  }

  /*
   * -------------------------------------------------------
   * Update reflection
   * -------------------------------------------------------
   */

  function handleAnswerChange(
    questionId: string,
    value: string
  ) {
    if (isLocked) {
      return;
    }

    setAnswers(
      (previous) => ({
        ...previous,
        [questionId]:
          value,
      })
    );

    setSaveState(
      (previous) => ({
        ...previous,
        [questionId]:
          "idle",
      })
    );

    setSaveError(
      (previous) => ({
        ...previous,
        [questionId]:
          null,
      })
    );
  }

  /*
   * -------------------------------------------------------
   * Navigate to another question
   * -------------------------------------------------------
   */

  async function navigateToQuestion(
    nextIndex: number
  ) {
    if (
      nextIndex < 0 ||
      nextIndex >=
        questions.length ||
      nextIndex === currentIndex
    ) {
      return;
    }

    if (
      !isLocked &&
      currentQuestion
    ) {
      const currentText =
        answers[
          currentQuestion.id
        ] ?? "";

      /*
       * Save only when the reflection has content.
       * Empty reflection remains optional.
       */

      if (currentText.trim()) {
        await handleSaveReflection(
          currentQuestion.id
        );
      }
    }

    setCurrentIndex(
      nextIndex
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  /*
   * -------------------------------------------------------
   * Keyboard shortcut
   * Ctrl/Cmd + Enter = Save reflection
   * -------------------------------------------------------
   */

  function handleReflectionKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) {
    if (
      (event.ctrlKey ||
        event.metaKey) &&
      event.key === "Enter"
    ) {
      event.preventDefault();

      if (
        currentQuestion &&
        !isLocked
      ) {
        startTransition(
          async () => {
            await handleSaveReflection(
              currentQuestion.id
            );
          }
        );
      }
    }
  }

  /*
   * -------------------------------------------------------
   * Open Review
   * -------------------------------------------------------
   */

  async function handleOpenReview() {
    if (isLocked) {
      return;
    }

    await refreshSolutionStates();

    setSubmitError(null);
    setIsReviewOpen(true);
  }

  /*
   * -------------------------------------------------------
   * Close Review
   * -------------------------------------------------------
   */

  function handleCloseReview() {
    if (isSubmitting) {
      return;
    }

    setIsReviewOpen(false);
    setSubmitError(null);
  }

  /*
   * -------------------------------------------------------
   * Jump from Review to question
   * -------------------------------------------------------
   */

  function handleReviewQuestionClick(
    index: number
  ) {
    setCurrentIndex(index);
    setIsReviewOpen(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  /*
   * -------------------------------------------------------
   * Prepare final submission
   * -------------------------------------------------------
   */

  async function handlePrepareFinalSubmit() {
    if (
      isLocked ||
      isSubmitting
    ) {
      return;
    }

    setSubmitError(null);

    /*
     * Refresh once more immediately before
     * opening confirmation.
     *
     * This prevents stale solution counts.
     */

    await refreshSolutionStates();

    setIsSubmitDialogOpen(
      true
    );
  }

  /*
   * -------------------------------------------------------
   * Cancel final submit
   * -------------------------------------------------------
   */

  function handleCancelFinalSubmit() {
    if (isSubmitting) {
      return;
    }

    setIsSubmitDialogOpen(
      false
    );
    setSubmitError(null);
  }

  /*
   * -------------------------------------------------------
   * Confirm final submission
   * -------------------------------------------------------
   */

  async function handleConfirmFinalSubmit() {
    if (
      isLocked ||
      isSubmitting
    ) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result =
        await submitSubjectiveAttempt(
          attemptId
        );

      if (!result.success) {
        setSubmitError(
          result.error
        );
        return;
      }

      setSubmitResult({
        submittedCount:
          result.submittedCount,
        questionCount:
          result.questionCount,
      });

      setIsSubmitDialogOpen(
        false
      );

      /*
       * Refresh the server component tree so
       * the locked state is reflected everywhere.
       */

      router.refresh();
    } catch (error) {
      console.error(
        "Subjective final submission error:",
        error
      );

      setSubmitError(
        error instanceof Error
          ? error.message
          : "Unable to submit your Subjective practice."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  /*
   * -------------------------------------------------------
   * Locked result banner
   * -------------------------------------------------------
   */

  if (
    submitResult &&
    isLocked
  ) {
    /*
     * This branch is intentionally kept lightweight.
     * The normal server-rendered locked state will take over
     * after router.refresh().
     */
  }

  /*
   * -------------------------------------------------------
   * No questions safeguard
   * -------------------------------------------------------
   */

  if (
    questions.length === 0
  ) {
    return (
      <div
        className="
          rounded-3xl
          border
          border-amber-200
          bg-amber-50
          p-6
          text-sm
          leading-6
          text-amber-800
          dark:border-amber-900
          dark:bg-amber-950/30
          dark:text-amber-300
        "
      >
        This Subjective practice does not
        contain any questions yet.
      </div>
    );
  }

  /*
   * -------------------------------------------------------
   * Current question safety
   * -------------------------------------------------------
   */

  if (!currentQuestion) {
    return null;
  }

  const currentSolutionState =
    solutionStates[
      currentQuestion.id
    ];

  const currentHasSolution =
    (
      currentSolutionState?.fileCount ??
      0
    ) > 0;

  /*
   * -------------------------------------------------------
   * LIVE FILES FOR CURRENT QUESTION
   *
   * This is the second critical part of the fix.
   *
   * The uploader must receive the files from
   * solutionFiles, NOT only from server props.
   * -------------------------------------------------------
   */

  const currentSolutionFiles =
    solutionFiles[
      currentQuestion.id
    ] ??
    currentQuestion.submission?.files ??
    [];

  /*
   * -------------------------------------------------------
   * Render
   * -------------------------------------------------------
   */

  return (
    <>
      <div
        className="
          mx-auto
          w-full
          max-w-6xl
          pb-12
        "
      >
        {/* -------------------------------------------------
            Header
        ------------------------------------------------- */}

        <div
          className="
            rounded-3xl
            border
            border-slate-200
            bg-white
            p-5
            shadow-sm
            dark:border-slate-800
            dark:bg-slate-900
            sm:p-6
          "
        >
          <div
            className="
              flex
              flex-col
              gap-5
              lg:flex-row
              lg:items-center
              lg:justify-between
            "
          >
            <div>
              <div
                className="
                  flex
                  flex-wrap
                  items-center
                  gap-2
                "
              >
                <span
                  className="
                    rounded-full
                    bg-blue-50
                    px-3
                    py-1
                    text-xs
                    font-semibold
                    text-blue-700
                    dark:bg-blue-950/50
                    dark:text-blue-300
                  "
                >
                  Subjective Practice
                </span>

                <span
                  className="
                    rounded-full
                    bg-slate-100
                    px-3
                    py-1
                    text-xs
                    font-semibold
                    text-slate-600
                    dark:bg-slate-800
                    dark:text-slate-300
                  "
                >
                  Attempt{" "}
                  {attemptNumber}
                </span>

                {isLocked && (
                  <span
                    className="
                      rounded-full
                      bg-emerald-50
                      px-3
                      py-1
                      text-xs
                      font-semibold
                      text-emerald-700
                      dark:bg-emerald-950/40
                      dark:text-emerald-300
                    "
                  >
                    Locked
                  </span>
                )}
              </div>

              <h1
                className="
                  mt-3
                  text-xl
                  font-semibold
                  tracking-tight
                  text-slate-900
                  dark:text-slate-100
                  sm:text-2xl
                "
              >
                {setTitle}
              </h1>

              <p
                className="
                  mt-2
                  text-sm
                  leading-6
                  text-slate-500
                  dark:text-slate-400
                "
              >
                Work through each question
                thoughtfully. Your solution is
                submitted as a photograph or PDF.
              </p>
            </div>

            <div
              className="
                flex
                flex-wrap
                items-center
                gap-3
              "
            >
              <div
                className="
                  rounded-2xl
                  border
                  border-blue-100
                  bg-blue-50/70
                  px-4
                  py-3
                  dark:border-blue-950
                  dark:bg-blue-950/30
                "
              >
                <p
                  className="
                    text-xs
                    font-medium
                    text-blue-600
                    dark:text-blue-400
                  "
                >
                  Solutions Added
                </p>

                <p
                  className="
                    mt-1
                    text-lg
                    font-semibold
                    text-blue-800
                    dark:text-blue-200
                  "
                >
                  {submittedSolutionCount}{" "}
                  /{" "}
                  {questionCount}
                </p>
              </div>

              <div
                className="
                  rounded-2xl
                  border
                  border-slate-200
                  bg-slate-50
                  px-4
                  py-3
                  dark:border-slate-700
                  dark:bg-slate-800
                "
              >
                <p
                  className="
                    text-xs
                    font-medium
                    text-slate-500
                    dark:text-slate-400
                  "
                >
                  Reflections
                </p>

                <p
                  className="
                    mt-1
                    text-lg
                    font-semibold
                    text-slate-800
                    dark:text-slate-200
                  "
                >
                  {reflectionCount}{" "}
                  /{" "}
                  {questionCount}
                </p>
              </div>
            </div>
          </div>

          {/* Progress bar */}

          <div className="mt-5">
            <div
              className="
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
                  bg-blue-700
                  transition-all
                  duration-300
                  dark:bg-blue-500
                "
                style={{
                  width: `${
                    questionCount === 0
                      ? 0
                      : (
                          submittedSolutionCount /
                          questionCount
                        ) *
                        100
                  }%`,
                }}
              />
            </div>

            <div
              className="
                mt-2
                flex
                items-center
                justify-between
                text-xs
                text-slate-500
                dark:text-slate-400
              "
            >
              <span>
                Solution progress
              </span>

              <span>
                {Math.round(
                  questionCount === 0
                    ? 0
                    : (
                        submittedSolutionCount /
                        questionCount
                      ) *
                      100
                )}
                %
              </span>
            </div>
          </div>
        </div>

        {/* -------------------------------------------------
            Question Navigation
        ------------------------------------------------- */}

        <div
          className="
            mt-5
            rounded-3xl
            border
            border-slate-200
            bg-white
            p-4
            shadow-sm
            dark:border-slate-800
            dark:bg-slate-900
            sm:p-5
          "
        >
          <div
            className="
              flex
              items-center
              justify-between
              gap-3
            "
          >
            <div>
              <p
                className="
                  text-sm
                  font-semibold
                  text-slate-900
                  dark:text-slate-100
                "
              >
                Questions
              </p>

              <p
                className="
                  mt-1
                  text-xs
                  text-slate-500
                  dark:text-slate-400
                "
              >
                You may solve the questions
                in any order.
              </p>
            </div>

            {isRefreshingSolutions && (
              <span
                className="
                  text-xs
                  font-medium
                  text-blue-600
                  dark:text-blue-400
                "
              >
                Updating...
              </span>
            )}
          </div>

          <div
            className="
              mt-4
              grid
              grid-cols-5
              gap-2
              sm:grid-cols-8
              md:grid-cols-10
            "
          >
            {questions.map(
              (
                question,
                index
              ) => {
                const hasSolution =
                  (
                    solutionStates[
                      question.id
                    ]?.fileCount ??
                    0
                  ) > 0;

                const isCurrent =
                  index ===
                  currentIndex;

                return (
                  <button
                    key={question.id}
                    type="button"
                    onClick={() =>
                      navigateToQuestion(
                        index
                      )
                    }
                    className={`
                      relative
                      flex
                      h-11
                      items-center
                      justify-center
                      rounded-xl
                      border
                      text-sm
                      font-semibold
                      transition
                      ${
                        isCurrent
                          ? "border-blue-700 bg-blue-700 text-white shadow-sm dark:border-blue-500 dark:bg-blue-600"
                          : hasSolution
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
                            : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-blue-950/30"
                      }
                    `}
                  >
                    {index + 1}

                    {hasSolution && (
                      <span
                        className={`
                          absolute
                          right-1
                          top-1
                          h-1.5
                          w-1.5
                          rounded-full
                          ${
                            isCurrent
                              ? "bg-white"
                              : "bg-emerald-500"
                          }
                        `}
                      />
                    )}
                  </button>
                );
              }
            )}
          </div>

          <div
            className="
              mt-4
              flex
              flex-wrap
              gap-4
              text-xs
              text-slate-500
              dark:text-slate-400
            "
          >
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-700 dark:bg-blue-500" />
              Current
            </span>

            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              Solution added
            </span>

            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
              Not yet added
            </span>
          </div>
        </div>

        {/* -------------------------------------------------
            Current Question
        ------------------------------------------------- */}

        <div
          className="
            mt-5
            rounded-3xl
            border
            border-slate-200
            bg-white
            p-5
            shadow-sm
            dark:border-slate-800
            dark:bg-slate-900
            sm:p-7
          "
        >
          <div
            className="
              flex
              flex-col
              gap-4
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
                  tracking-[0.16em]
                  text-blue-600
                  dark:text-blue-400
                "
              >
                Question{" "}
                {currentIndex + 1}{" "}
                of{" "}
                {questionCount}
              </p>

              <div
                className="
                  mt-3
                  text-lg
                  font-semibold
                  leading-8
                  text-slate-900
                  dark:text-slate-100
                  sm:text-xl
                "
              >
                <MathTextPreview
                  value={
                    currentQuestion.question_text
                  }
                />
              </div>
            </div>

            <span
              className="
                inline-flex
                shrink-0
                items-center
                rounded-full
                bg-blue-50
                px-3
                py-1.5
                text-xs
                font-semibold
                text-blue-700
                dark:bg-blue-950/40
                dark:text-blue-300
              "
            >
              {currentQuestion.marks}{" "}
              {currentQuestion.marks ===
              1
                ? "mark"
                : "marks"}
            </span>
          </div>

          {/* Solution uploader */}

          <SubjectiveSolutionUploader
            attemptId={attemptId}
            attemptQuestionId={
              currentQuestion.id
            }
            submissionId={
              currentSolutionState?.submissionId ??
              currentQuestion.submission?.id ??
              null
            }
            attemptStatus={
              attemptStatus
            }
            existingFiles={
              currentSolutionFiles
            }
            onFilesChange={(
              files
            ) => {
              /*
               * ---------------------------------------------
               * LIVE FILE SYNC
               *
               * The uploader has already changed the DB.
               * We immediately mirror its current files
               * into Workspace state.
               *
               * Therefore:
               *
               * Q9 upload
               * -> Q9 files stored here
               * -> Q3
               * -> Q9
               * -> same files are passed back to uploader
               * ---------------------------------------------
               */

              setSolutionFiles(
                (previous) => ({
                  ...previous,
                  [currentQuestion.id]:
                    files,
                })
              );

              setSolutionStates(
                (previous) => ({
                  ...previous,
                  [currentQuestion.id]: {
                    submissionId:
                      previous[
                        currentQuestion.id
                      ]?.submissionId ??
                      currentQuestion.submission?.id ??
                      null,
                    fileCount:
                      files.length,
                  },
                })
              );
            }}
          />

          {/* -------------------------------------------------
              Reflection / Difficulty Note
          ------------------------------------------------- */}

          <div
            className="
              mt-8
              rounded-3xl
              border
              border-slate-200
              bg-slate-50/70
              p-5
              dark:border-slate-700
              dark:bg-slate-800/50
              sm:p-6
            "
          >
            <div
              className="
                flex
                items-start
                justify-between
                gap-4
              "
            >
              <div>
                <p
                  className="
                    text-sm
                    font-semibold
                    text-slate-900
                    dark:text-slate-100
                  "
                >
                  Reflection / Difficulty Note
                </p>

                <p
                  className="
                    mt-1.5
                    text-xs
                    leading-5
                    text-slate-500
                    dark:text-slate-400
                  "
                >
                  Optional. Tell us briefly how
                  you experienced this question.
                  This note is separate from your
                  submitted solution.
                </p>
              </div>

              {saveState[
                currentQuestion.id
              ] === "saved" && (
                <span
                  className="
                    shrink-0
                    text-xs
                    font-medium
                    text-emerald-600
                    dark:text-emerald-400
                  "
                >
                  Saved
                </span>
              )}
            </div>

            <textarea
              value={
                currentAnswer
              }
              onChange={(event) =>
                handleAnswerChange(
                  currentQuestion.id,
                  event.target.value
                )
              }
              onKeyDown={
                handleReflectionKeyDown
              }
              disabled={
                isLocked ||
                isPending
              }
              placeholder="For example: This question was easy to understand, but I was unsure about the final step..."
              rows={4}
              className="
                mt-4
                w-full
                resize-y
                rounded-2xl
                border
                border-slate-200
                bg-white
                px-4
                py-3
                text-sm
                leading-6
                text-slate-800
                outline-none
                transition
                placeholder:text-slate-400
                focus:border-blue-400
                focus:ring-2
                focus:ring-blue-100
                disabled:cursor-not-allowed
                disabled:opacity-60
                dark:border-slate-700
                dark:bg-slate-900
                dark:text-slate-200
                dark:placeholder:text-slate-500
                dark:focus:border-blue-600
                dark:focus:ring-blue-950
              "
            />

            <div
              className="
                mt-3
                flex
                flex-col
                gap-3
                sm:flex-row
                sm:items-center
                sm:justify-between
              "
            >
              <p
                className="
                  text-xs
                  text-slate-400
                  dark:text-slate-500
                "
              >
                Tip: Press Ctrl + Enter
                or Cmd + Enter to save.
              </p>

              <button
                type="button"
                disabled={
                  isLocked ||
                  isPending ||
                  saveState[
                    currentQuestion.id
                  ] === "saving"
                }
                onClick={() =>
                  startTransition(
                    async () => {
                      await handleSaveReflection(
                        currentQuestion.id
                      );
                    }
                  )
                }
                className="
                  inline-flex
                  items-center
                  justify-center
                  rounded-xl
                  bg-slate-900
                  px-4
                  py-2.5
                  text-xs
                  font-semibold
                  text-white
                  transition
                  hover:bg-slate-800
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                  dark:bg-slate-100
                  dark:text-slate-900
                  dark:hover:bg-white
                "
              >
                {saveState[
                  currentQuestion.id
                ] === "saving"
                  ? "Saving..."
                  : "Save Reflection"}
              </button>
            </div>

            {saveError[
              currentQuestion.id
            ] && (
              <div
                className="
                  mt-3
                  rounded-xl
                  border
                  border-red-200
                  bg-red-50
                  px-4
                  py-3
                  text-xs
                  leading-5
                  text-red-700
                  dark:border-red-900
                  dark:bg-red-950/30
                  dark:text-red-300
                "
              >
                {
                  saveError[
                    currentQuestion.id
                  ]
                }
              </div>
            )}
          </div>

          {/* Current solution status */}

          <div
            className={`
              mt-5
              rounded-2xl
              border
              px-4
              py-3
              ${
                currentHasSolution
                  ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30"
                  : "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30"
              }
            `}
          >
            <div
              className="
                flex
                items-center
                gap-3
              "
            >
              <span
                className="
                  text-lg
                "
              >
                {currentHasSolution
                  ? "✓"
                  : "○"}
              </span>

              <div>
                <p
                  className={`
                    text-sm
                    font-semibold
                    ${
                      currentHasSolution
                        ? "text-emerald-800 dark:text-emerald-300"
                        : "text-amber-800 dark:text-amber-300"
                    }
                  `}
                >
                  {currentHasSolution
                    ? "Solution added"
                    : "Solution not added yet"}
                </p>

                <p
                  className="
                    mt-0.5
                    text-xs
                    text-slate-500
                    dark:text-slate-400
                  "
                >
                  {currentHasSolution
                    ? `${
                        currentSolutionState?.fileCount ??
                        0
                      } solution file${
                        (
                          currentSolutionState?.fileCount ??
                          0
                        ) === 1
                          ? ""
                          : "s"
                      } attached.`
                    : "Add a clear photo or PDF of your working above."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* -------------------------------------------------
            Navigation
        ------------------------------------------------- */}

        <div
          className="
            mt-5
            flex
            flex-col-reverse
            gap-3
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <button
            type="button"
            disabled={
              currentIndex === 0 ||
              isPending
            }
            onClick={() =>
              navigateToQuestion(
                currentIndex - 1
              )
            }
            className="
              inline-flex
              items-center
              justify-center
              rounded-2xl
              border
              border-slate-200
              bg-white
              px-5
              py-3
              text-sm
              font-semibold
              text-slate-700
              transition
              hover:border-blue-300
              hover:bg-blue-50
              hover:text-blue-700
              disabled:cursor-not-allowed
              disabled:opacity-40
              dark:border-slate-700
              dark:bg-slate-900
              dark:text-slate-200
              dark:hover:bg-blue-950/30
            "
          >
            ← Previous
          </button>

          <div
            className="
              flex
              flex-col
              gap-3
              sm:flex-row
            "
          >
            {!isLocked && (
              <button
                type="button"
                disabled={
                  isRefreshingSolutions ||
                  isSubmitting
                }
                onClick={
                  handleOpenReview
                }
                className="
                  inline-flex
                  items-center
                  justify-center
                  rounded-2xl
                  border
                  border-blue-200
                  bg-blue-50
                  px-5
                  py-3
                  text-sm
                  font-semibold
                  text-blue-700
                  transition
                  hover:border-blue-400
                  hover:bg-blue-100
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                  dark:border-blue-900
                  dark:bg-blue-950/40
                  dark:text-blue-300
                "
              >
                Review Before Submit
              </button>
            )}

            <button
              type="button"
              disabled={
                currentIndex ===
                  questionCount - 1 ||
                isPending
              }
              onClick={() =>
                navigateToQuestion(
                  currentIndex + 1
                )
              }
              className="
                inline-flex
                items-center
                justify-center
                rounded-2xl
                bg-blue-700
                px-5
                py-3
                text-sm
                font-semibold
                text-white
                transition
                hover:bg-blue-800
                disabled:cursor-not-allowed
                disabled:opacity-40
                dark:bg-blue-600
                dark:hover:bg-blue-500
              "
            >
              Next →
            </button>
          </div>
        </div>

        {/* -------------------------------------------------
            Locked notice
        ------------------------------------------------- */}

        {isLocked && (
          <div
            className="
              mt-5
              rounded-2xl
              border
              border-emerald-200
              bg-emerald-50
              px-5
              py-4
              dark:border-emerald-900
              dark:bg-emerald-950/30
            "
          >
            <p
              className="
                text-sm
                font-semibold
                text-emerald-800
                dark:text-emerald-300
              "
            >
              ✓ This attempt is locked.
            </p>

            <p
              className="
                mt-1
                text-xs
                leading-5
                text-emerald-700
                dark:text-emerald-400
              "
            >
              Your submitted work can no longer
              be changed.
            </p>
          </div>
        )}
      </div>

      {/* =====================================================
          REVIEW MODAL
      ===================================================== */}

      {isReviewOpen && (
        <div
          className="
            fixed
            inset-0
            z-[90]
            flex
            items-center
            justify-center
            bg-slate-950/70
            p-3
            backdrop-blur-sm
            sm:p-6
          "
          role="dialog"
          aria-modal="true"
          aria-label="Review Subjective submission"
        >
          <div
            className="
              flex
              max-h-[94vh]
              w-full
              max-w-4xl
              flex-col
              overflow-hidden
              rounded-3xl
              bg-white
              shadow-2xl
              dark:bg-slate-900
            "
          >
            {/* Review header */}

            <div
              className="
                flex
                shrink-0
                items-start
                justify-between
                gap-4
                border-b
                border-slate-200
                px-5
                py-5
                dark:border-slate-700
                sm:px-6
              "
            >
              <div>
                <p
                  className="
                    text-xs
                    font-semibold
                    uppercase
                    tracking-[0.16em]
                    text-blue-600
                    dark:text-blue-400
                  "
                >
                  Final Review
                </p>

                <h2
                  className="
                    mt-1
                    text-xl
                    font-semibold
                    text-slate-900
                    dark:text-slate-100
                  "
                >
                  Review your submission
                </h2>

                <p
                  className="
                    mt-1.5
                    text-sm
                    text-slate-500
                    dark:text-slate-400
                  "
                >
                  Make sure every solution you
                  want evaluated has been attached.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  handleCloseReview
                }
                className="
                  inline-flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-slate-200
                  bg-white
                  text-lg
                  text-slate-600
                  transition
                  hover:bg-slate-100
                  dark:border-slate-700
                  dark:bg-slate-800
                  dark:text-slate-300
                  dark:hover:bg-slate-700
                "
                aria-label="Close review"
              >
                ×
              </button>
            </div>

            {/* Review body */}

            <div
              className="
                min-h-0
                flex-1
                overflow-y-auto
                px-5
                py-5
                sm:px-6
              "
            >
              <div
                className="
                  rounded-2xl
                  border
                  border-blue-100
                  bg-blue-50/60
                  p-4
                  dark:border-blue-950
                  dark:bg-blue-950/30
                "
              >
                <div
                  className="
                    flex
                    flex-col
                    gap-3
                    sm:flex-row
                    sm:items-center
                    sm:justify-between
                  "
                >
                  <div>
                    <p
                      className="
                        text-sm
                        font-semibold
                        text-blue-900
                        dark:text-blue-200
                      "
                    >
                      Solutions Added
                    </p>

                    <p
                      className="
                        mt-1
                        text-xs
                        text-blue-700
                        dark:text-blue-400
                      "
                    >
                      {submittedSolutionCount}{" "}
                      of{" "}
                      {questionCount}{" "}
                      questions have a solution
                      file.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={
                      isRefreshingSolutions
                    }
                    onClick={() =>
                      void refreshSolutionStates()
                    }
                    className="
                      inline-flex
                      items-center
                      justify-center
                      rounded-xl
                      border
                      border-blue-200
                      bg-white
                      px-3
                      py-2
                      text-xs
                      font-semibold
                      text-blue-700
                      transition
                      hover:bg-blue-50
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                      dark:border-blue-900
                      dark:bg-slate-900
                      dark:text-blue-300
                    "
                  >
                    {isRefreshingSolutions
                      ? "Refreshing..."
                      : "Refresh"}
                  </button>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {questions.map(
                  (
                    question,
                    index
                  ) => {
                    const fileCount =
                      solutionStates[
                        question.id
                      ]?.fileCount ??
                      0;

                    const hasSolution =
                      fileCount > 0;

                    return (
                      <button
                        key={question.id}
                        type="button"
                        onClick={() =>
                          handleReviewQuestionClick(
                            index
                          )
                        }
                        className="
                          w-full
                          rounded-2xl
                          border
                          border-slate-200
                          bg-white
                          p-4
                          text-left
                          transition
                          hover:border-blue-300
                          hover:bg-blue-50/40
                          dark:border-slate-700
                          dark:bg-slate-900
                          dark:hover:border-blue-800
                          dark:hover:bg-blue-950/20
                        "
                      >
                        <div
                          className="
                            flex
                            items-start
                            gap-4
                          "
                        >
                          <div
                            className={`
                              flex
                              h-10
                              w-10
                              shrink-0
                              items-center
                              justify-center
                              rounded-xl
                              text-sm
                              font-bold
                              ${
                                hasSolution
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                                  : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                              }
                            `}
                          >
                            {index + 1}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div
                              className="
                                flex
                                flex-col
                                gap-2
                                sm:flex-row
                                sm:items-center
                                sm:justify-between
                              "
                            >
                              <p
                                className="
                                  text-sm
                                  font-semibold
                                  text-slate-900
                                  dark:text-slate-100
                                "
                              >
                                Question{" "}
                                {index + 1}
                              </p>

                              <span
                                className={`
                                  inline-flex
                                  w-fit
                                  rounded-full
                                  px-2.5
                                  py-1
                                  text-[11px]
                                  font-semibold
                                  ${
                                    hasSolution
                                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                                      : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                                  }
                                `}
                              >
                                {hasSolution
                                  ? `${fileCount} file${
                                      fileCount ===
                                      1
                                        ? ""
                                        : "s"
                                    } added`
                                  : "No solution added"}
                              </span>
                            </div>

                            <div
                              className="
                                mt-2
                                line-clamp-2
                                text-xs
                                leading-5
                                text-slate-500
                                dark:text-slate-400
                              "
                            >
                              <MathTextPreview
                                value={
                                  question.question_text
                                }
                              />
                            </div>

                            <p
                              className="
                                mt-2
                                text-xs
                                font-medium
                                text-blue-600
                                dark:text-blue-400
                              "
                            >
                              Click to review this
                              question →
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  }
                )}
              </div>

              {/* Incomplete submission explanation */}

              {!allSolutionsSubmitted && (
                <div
                  className="
                    mt-5
                    rounded-2xl
                    border
                    border-amber-200
                    bg-amber-50
                    p-4
                    dark:border-amber-900
                    dark:bg-amber-950/30
                  "
                >
                  <p
                    className="
                      text-sm
                      font-semibold
                      text-amber-800
                      dark:text-amber-300
                    "
                  >
                    Some questions do not have
                    solution files yet.
                  </p>

                  <p
                    className="
                      mt-1
                      text-xs
                      leading-5
                      text-amber-700
                      dark:text-amber-400
                    "
                  >
                    You may still submit the set.
                    Questions without a submitted
                    solution will simply remain
                    unattempted.
                  </p>
                </div>
              )}
            </div>

            {/* Review footer */}

            <div
              className="
                flex
                shrink-0
                flex-col
                gap-3
                border-t
                border-slate-200
                bg-white
                px-5
                py-4
                dark:border-slate-700
                dark:bg-slate-900
                sm:flex-row
                sm:items-center
                sm:justify-between
                sm:px-6
              "
            >
              <button
                type="button"
                onClick={
                  handleCloseReview
                }
                className="
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  px-4
                  py-2.5
                  text-xs
                  font-semibold
                  text-slate-700
                  transition
                  hover:bg-slate-100
                  dark:border-slate-700
                  dark:bg-slate-800
                  dark:text-slate-200
                  dark:hover:bg-slate-700
                "
              >
                Continue Working
              </button>

              <button
                type="button"
                disabled={
                  isRefreshingSolutions
                }
                onClick={
                  handlePrepareFinalSubmit
                }
                className="
                  rounded-xl
                  bg-blue-700
                  px-5
                  py-2.5
                  text-xs
                  font-semibold
                  text-white
                  transition
                  hover:bg-blue-800
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                  dark:bg-blue-600
                  dark:hover:bg-blue-500
                "
              >
                Submit This Set
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
    FINAL SUBMISSION CONFIRMATION
===================================================== */}

{isSubmitDialogOpen && (
  <div
    className="
      fixed
      inset-0
      z-[100]
      flex
      items-center
      justify-center
      bg-slate-950/70
      p-4
      backdrop-blur-sm
    "
    role="dialog"
    aria-modal="true"
    aria-label="Confirm final submission"
  >
    <div
      className="
        w-full
        max-w-lg
        rounded-3xl
        bg-white
        p-6
        shadow-2xl
        dark:bg-slate-900
        sm:p-7
      "
    >
      {/* Confirmation icon */}

      <div
        className={`
          flex
          h-12
          w-12
          items-center
          justify-center
          rounded-2xl
          ${
            allSolutionsSubmitted
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
              : "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
          }
        `}
      >
        ✓
      </div>

      {/* Title */}

      <h2
        className="
          mt-5
          text-xl
          font-semibold
          text-slate-900
          dark:text-slate-100
        "
      >
        Submit this set?
      </h2>

      {/* Submission status message */}

      {!allSolutionsSubmitted ? (
        <p
          className="
            mt-3
            text-sm
            leading-6
            text-slate-600
            dark:text-slate-300
          "
        >
          {submittedSolutionCount === 0 ? (
            <>
              You have not submitted a solution for any
              of the{" "}
              <strong>
                {questionCount}
              </strong>{" "}
              questions. Do you still want to submit
              this set?
            </>
          ) : (
            <>
              You have submitted solutions for only{" "}
              <strong>
                {submittedSolutionCount}
              </strong>{" "}
              out of{" "}
              <strong>
                {questionCount}
              </strong>{" "}
              questions. Do you still want to submit
              this set?
            </>
          )}
        </p>
      ) : (
        <p
          className="
            mt-3
            text-sm
            leading-6
            text-slate-600
            dark:text-slate-300
          "
        >
          You have submitted solutions for all{" "}
          <strong>
            {questionCount}
          </strong>{" "}
          questions. Are you ready to submit this set?
        </p>
      )}

      {/* Incomplete submission warning */}

      {!allSolutionsSubmitted && (
        <div
          className="
            mt-4
            rounded-2xl
            border
            border-amber-200
            bg-amber-50
            p-4
            dark:border-amber-900
            dark:bg-amber-950/30
          "
        >
          <p
            className="
              text-xs
              font-semibold
              text-amber-800
              dark:text-amber-300
            "
          >
            Incomplete Submission
          </p>

          <p
            className="
              mt-1
              text-xs
              leading-5
              text-amber-700
              dark:text-amber-400
            "
          >
            Some questions do not have a submitted
            solution. You can still submit this set,
            but those questions will remain unattempted.
          </p>
        </div>
      )}

      {/* Final lock warning */}

      <div
        className="
          mt-4
          rounded-2xl
          border
          border-red-100
          bg-red-50
          p-4
          dark:border-red-950
          dark:bg-red-950/20
        "
      >
        <p
          className="
            text-xs
            font-semibold
            text-red-700
            dark:text-red-300
          "
        >
          Important
        </p>

        <p
          className="
            mt-1
            text-xs
            leading-5
            text-red-600
            dark:text-red-400
          "
        >
          After you submit this set, your attempt will
          be locked and you will not be able to add,
          remove, or reorder solution files.
        </p>
      </div>

      {/* Submit error */}

      {submitError && (
        <div
          className="
            mt-4
            rounded-2xl
            border
            border-red-200
            bg-red-50
            p-4
            text-xs
            leading-5
            text-red-700
            dark:border-red-900
            dark:bg-red-950/30
            dark:text-red-300
          "
        >
          {submitError}
        </div>
      )}

      {/* Actions */}

      <div
        className="
          mt-6
          flex
          flex-col-reverse
          gap-3
          sm:flex-row
          sm:justify-end
        "
      >
        {/* Go Back */}

        <button
          type="button"
          disabled={isSubmitting}
          onClick={handleCancelFinalSubmit}
          className="
            rounded-xl
            border
            border-slate-200
            bg-white
            px-5
            py-2.5
            text-xs
            font-semibold
            text-slate-700
            transition
            hover:bg-slate-100
            disabled:cursor-not-allowed
            disabled:opacity-50
            dark:border-slate-700
            dark:bg-slate-800
            dark:text-slate-200
            dark:hover:bg-slate-700
          "
        >
          Go Back
        </button>

        {/* Conditional final action */}

        <button
          type="button"
          disabled={isSubmitting}
          onClick={handleConfirmFinalSubmit}
          className="
            rounded-xl
            bg-blue-700
            px-5
            py-2.5
            text-xs
            font-semibold
            text-white
            transition
            hover:bg-blue-800
            disabled:cursor-not-allowed
            disabled:opacity-50
            dark:bg-blue-600
            dark:hover:bg-blue-500
          "
        >
          {isSubmitting
            ? "Submitting..."
            : allSolutionsSubmitted
              ? "Submit This Set"
              : "Submit Anyway"}
        </button>
      </div>
    </div>
  </div>
)}
    </>
  );
}