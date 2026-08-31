import "server-only";

import { createAdminSupabaseClient } from "@/app/lib/admin/supabase-admin";
import { createLearningSupabaseClient } from "./supabase-learning";
import { requireLearningAuth } from "./learning-auth";

/* =========================================================
 * Types
 * ========================================================= */

export type LearningResultOption = {
  id: string;
  optionKey: string;
  optionText: string;
  isCorrect: boolean;
};

export type LearningResultQuestion = {
  questionId: string;
  questionOrder: number;
  questionNumber: number;

  marks: number | null;
  questionRevisionId: string;

  questionText: string;
  solutionText: string | null;
  mistakeInsight: string | null;

  options: LearningResultOption[];

  selectedOptionId: string | null;
  selectedOptionText: string | null;

  correctOptionId: string | null;
  correctOptionText: string | null;

  answerText: string | null;

  isCorrect: boolean | null;

  marksAwarded: number | null;
  timeSpentSeconds: number | null;

  status:
    | "CORRECT"
    | "INCORRECT"
    | "UNANSWERED";

  resultStatus:
    | "CORRECT"
    | "INCORRECT"
    | "UNANSWERED";
};

export type LearningTestResult = {
  id: string;
  testId: string;

  attemptNumber: number;
  status: string;

  startedAt: string;
  submittedAt: string | null;

  score: number | null;
  percentage: number | null;

  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;

  test: {
    id: string;
    title: string;
    testType: string;
    resourceId: string;
  } | null;

  resource: {
    id: string;
    title: string;
    slug: string;
    setNumber: number | null;
  } | null;

  /* -------------------------------------------------------
   * Convenience fields for result page
   * ------------------------------------------------------- */

  testTitle: string | null;
  resourceId: string | null;
  resourceTitle: string | null;
  resourceSetNumber: number | null;
  chapterName: string | null;

  questions: LearningResultQuestion[];
};

/* =========================================================
 * Get complete result for authenticated student's attempt
 * ========================================================= */

export async function getLearningTestResult(
  attemptId: string
): Promise<LearningTestResult | null> {
  const { userId } = await requireLearningAuth();

  const normalizedAttemptId = attemptId.trim();

  if (!normalizedAttemptId) {
    return null;
  }

  /* =======================================================
   * 1. Verify attempt ownership
   *
   * IMPORTANT:
   * This check intentionally uses the authenticated
   * learning Supabase client.
   *
   * We NEVER trust a URL attemptId by itself.
   * ======================================================= */

  const learningSupabase =
    await createLearningSupabaseClient();

  const {
    data: attempt,
    error: attemptError,
  } = await learningSupabase
    .from("test_attempts")
    .select(
      `
        id,
        test_id,
        attempt_number,
        status,
        started_at,
        submitted_at,
        score,
        percentage,
        correct_count,
        incorrect_count,
        unanswered_count
      `
    )
    .eq("id", normalizedAttemptId)
    .eq("user_id", userId)
    .maybeSingle();

  if (attemptError) {
    throw new Error(
      `Failed to load test result: ${attemptError.message}`
    );
  }

  if (!attempt) {
    return null;
  }

  /* =======================================================
   * From this point onward:
   *
   * The attempt has already been verified to belong to
   * the authenticated student.
   *
   * Use the server-side admin client to read the exact
   * question/revision/answer data required for the result.
   * ======================================================= */

  const supabase =
    createAdminSupabaseClient();

  /* =======================================================
   * 2. Load test
   * ======================================================= */

  const {
    data: test,
    error: testError,
  } = await supabase
    .from("tests")
    .select(
      `
        id,
        title,
        test_type,
        resource_id
      `
    )
    .eq("id", attempt.test_id)
    .maybeSingle();

  if (testError) {
    throw new Error(
      `Failed to load result test: ${testError.message}`
    );
  }

  if (!test) {
    throw new Error(
      "The test associated with this attempt could not be found."
    );
  }

  /* =======================================================
   * 3. Load resource
   * ======================================================= */

  const {
    data: resource,
    error: resourceError,
  } = await supabase
    .from("resources")
    .select(
      `
        id,
        title,
        slug,
        set_number
      `
    )
    .eq("id", test.resource_id)
    .maybeSingle();

  if (resourceError) {
    throw new Error(
      `Failed to load result resource: ${resourceError.message}`
    );
  }

  /* =======================================================
   * 4. Load test questions
   *
   * test_questions tells us:
   *
   * question_id
   * question_order
   * marks
   * exact question_revision_id
   * ======================================================= */

  const {
    data: testQuestions,
    error: testQuestionsError,
  } = await supabase
    .from("test_questions")
    .select(
      `
        question_id,
        question_order,
        marks,
        question_revision_id
      `
    )
    .eq("test_id", attempt.test_id)
    .order("question_order", {
      ascending: true,
    });

  if (testQuestionsError) {
    throw new Error(
      `Failed to load result questions: ${testQuestionsError.message}`
    );
  }

  /* =======================================================
   * 5. Load student's answers
   * ======================================================= */

  const {
    data: attemptAnswers,
    error: attemptAnswersError,
  } = await supabase
    .from("attempt_answers")
    .select(
      `
        id,
        question_id,
        selected_option_id,
        answer_text,
        is_correct,
        marks_awarded,
        time_spent_seconds,
        question_revision_id
      `
    )
    .eq("attempt_id", attempt.id);

  if (attemptAnswersError) {
    throw new Error(
      `Failed to load attempt answers: ${attemptAnswersError.message}`
    );
  }

  /* =======================================================
   * 6. Collect exact revision IDs
   * ======================================================= */

  const revisionIds = [
    ...new Set(
      (testQuestions ?? []).map(
        (question) =>
          question.question_revision_id
      )
    ),
  ];

  /* =======================================================
   * 7. Load exact question revisions
   * ======================================================= */

  let revisions: Array<{
    id: string;
    question_id: string;
    revision_number: number;
    question_text: string;
    solution_text: string | null;
    mistake_insight: string | null;
    status: string;
  }> = [];

  if (revisionIds.length > 0) {
    const {
      data,
      error,
    } = await supabase
      .from("question_revisions")
      .select(
        `
          id,
          question_id,
          revision_number,
          question_text,
          solution_text,
          mistake_insight,
          status
        `
      )
      .in("id", revisionIds);

    if (error) {
      throw new Error(
        `Failed to load result question revisions: ${error.message}`
      );
    }

    revisions = data ?? [];
  }

  /* =======================================================
   * 8. Load options for exact revisions
   *
   * IMPORTANT:
   *
   * Correct answer comes from:
   * question_revision_options.is_correct
   *
   * Selected answer comes from:
   * attempt_answers.selected_option_id
   * ======================================================= */

  let revisionOptions: Array<{
    id: string;
    revision_id: string;
    option_key: string;
    option_text: string;
    display_order: number;
    is_correct: boolean;
  }> = [];

  if (revisionIds.length > 0) {
    const {
      data,
      error,
    } = await supabase
      .from("question_revision_options")
      .select(
        `
          id,
          revision_id,
          option_key,
          option_text,
          display_order,
          is_correct
        `
      )
      .in("revision_id", revisionIds)
      .order("display_order", {
        ascending: true,
      });

    if (error) {
      throw new Error(
        `Failed to load result question options: ${error.message}`
      );
    }

    revisionOptions = data ?? [];
  }

  /* =======================================================
   * 9. Build lookup maps
   * ======================================================= */

  const revisionById = new Map<
    string,
    (typeof revisions)[number]
  >();

  for (const revision of revisions) {
    revisionById.set(
      revision.id,
      revision
    );
  }

  const optionsByRevisionId = new Map<
    string,
    (typeof revisionOptions)
  >();

  for (const option of revisionOptions) {
    const existing =
      optionsByRevisionId.get(
        option.revision_id
      ) ?? [];

    existing.push(option);

    optionsByRevisionId.set(
      option.revision_id,
      existing
    );
  }

  /* -------------------------------------------------------
   * Answer lookup
   *
   * One attempt should normally have one answer per
   * question. We keep the latest row if duplicates ever
   * exist.
   * ------------------------------------------------------- */

  const answerByQuestionId = new Map<
    string,
    (typeof attemptAnswers)[number]
  >();

  for (const answer of attemptAnswers ?? []) {
    answerByQuestionId.set(
      answer.question_id,
      answer
    );
  }

  /* =======================================================
   * 10. Build question-wise result
   * ======================================================= */

  const questions: LearningResultQuestion[] =
    [];

  for (
    const testQuestion of testQuestions ?? []
  ) {
    const revision =
      revisionById.get(
        testQuestion.question_revision_id
      );

    /*
     * The test_question row explicitly tells us which
     * revision was used.
     *
     * Never fall back to another revision.
     */
    if (!revision) {
      continue;
    }

    /*
     * Safety check:
     *
     * The revision must belong to the same question.
     */
    if (
      revision.question_id !==
      testQuestion.question_id
    ) {
      continue;
    }

    const options =
      optionsByRevisionId.get(
        testQuestion.question_revision_id
      ) ?? [];

    const answer =
      answerByQuestionId.get(
        testQuestion.question_id
      );

    /* -----------------------------------------------------
     * Normalize options
     * ----------------------------------------------------- */

    const normalizedOptions:
      LearningResultOption[] =
      options.map((option) => ({
        id: option.id,
        optionKey: option.option_key,
        optionText: option.option_text,
        isCorrect: option.is_correct,
      }));

    /* -----------------------------------------------------
     * Selected option
     * ----------------------------------------------------- */

    const selectedOption =
      answer?.selected_option_id
        ? options.find(
            (option) =>
              option.id ===
              answer.selected_option_id
          ) ?? null
        : null;

    /* -----------------------------------------------------
     * Correct option
     * ----------------------------------------------------- */

    const correctOption =
      options.find(
        (option) =>
          option.is_correct === true
      ) ?? null;

    /* -----------------------------------------------------
     * Result status
     * ----------------------------------------------------- */

    let resultStatus:
      | "CORRECT"
      | "INCORRECT"
      | "UNANSWERED";

    if (!answer) {
      resultStatus = "UNANSWERED";
    } else if (
      answer.selected_option_id === null &&
      !answer.answer_text
    ) {
      resultStatus = "UNANSWERED";
    } else if (
      answer.is_correct === true
    ) {
      resultStatus = "CORRECT";
    } else {
      resultStatus = "INCORRECT";
    }

    /* -----------------------------------------------------
     * Push final question
     * ----------------------------------------------------- */

    questions.push({
      questionId:
        testQuestion.question_id,

      questionOrder:
        testQuestion.question_order,

      questionNumber:
        testQuestion.question_order,

      marks:
        testQuestion.marks,

      questionRevisionId:
        testQuestion.question_revision_id,

      questionText:
        revision.question_text,

      solutionText:
        revision.solution_text,

      mistakeInsight:
        revision.mistake_insight,

      options:
        normalizedOptions,

      selectedOptionId:
        answer?.selected_option_id ??
        null,

      selectedOptionText:
        selectedOption?.option_text ??
        null,

      correctOptionId:
        correctOption?.id ??
        null,

      correctOptionText:
        correctOption?.option_text ??
        null,

      answerText:
        answer?.answer_text ??
        null,

      isCorrect:
        answer?.is_correct ??
        null,

      marksAwarded:
        answer?.marks_awarded ??
        null,

      timeSpentSeconds:
        answer?.time_spent_seconds ??
        null,

      status:
        resultStatus,

      resultStatus:
        resultStatus,
    });
  }

  /* =======================================================
   * 11. Return complete result model
   * ======================================================= */

  return {
    id: attempt.id,

    testId:
      attempt.test_id,

    attemptNumber:
      attempt.attempt_number,

    status:
      attempt.status,

    startedAt:
      attempt.started_at,

    submittedAt:
      attempt.submitted_at,

    score:
      attempt.score,

    percentage:
      attempt.percentage,

    correctCount:
      attempt.correct_count,

    incorrectCount:
      attempt.incorrect_count,

    unansweredCount:
      attempt.unanswered_count,

    /* -----------------------------------------------------
     * Structured test data
     * ----------------------------------------------------- */

    test: {
      id: test.id,
      title: test.title,
      testType: test.test_type,
      resourceId: test.resource_id,
    },

    /* -----------------------------------------------------
     * Structured resource data
     * ----------------------------------------------------- */

    resource: resource
      ? {
          id: resource.id,
          title: resource.title,
          slug: resource.slug,
          setNumber:
            resource.set_number,
        }
      : null,

    /* -----------------------------------------------------
     * Flattened fields used by result page
     * ----------------------------------------------------- */

    testTitle:
      test.title ?? null,

    resourceId:
      resource?.id ??
      test.resource_id ??
      null,

    resourceTitle:
      resource?.title ??
      null,

    resourceSetNumber:
      resource?.set_number ??
      null,

    /*
     * Chapter name is not directly stored on the tables
     * currently loaded here.
     *
     * Keep null rather than inventing a chapter name.
     */
    chapterName:
      null,

    /* -----------------------------------------------------
     * Question-wise review
     * ----------------------------------------------------- */

    questions,
  };
}