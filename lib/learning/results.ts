
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
  status: "CORRECT" | "INCORRECT" | "UNANSWERED";
  resultStatus: "CORRECT" | "INCORRECT" | "UNANSWERED";
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

  testTitle: string | null;
  resourceId: string | null;
  resourceTitle: string | null;
  resourceSetNumber: number | null;
  chapterName: string | null;
  questions: LearningResultQuestion[];
};

/* =========================================================
 * Internal database row types
 * ========================================================= */

type RevisionRow = {
  id: string;
  question_id: string;
  revision_number: number;
  question_text: string;
  solution_text: string | null;
  mistake_insight: string | null;
  status: string;
};

type RevisionOptionRow = {
  id: string;
  revision_id: string;
  option_key: string;
  option_text: string;
  display_order: number;
  is_correct: boolean;
};

/* =========================================================
 * Get result for the authenticated student's submitted MCQ
 * ========================================================= */

export async function getLearningTestResult(
  attemptId: string
): Promise<LearningTestResult | null> {
  const { userId } = await requireLearningAuth();

  const normalizedAttemptId = attemptId.trim();

  if (!normalizedAttemptId) {
    return null;
  }

  /* -------------------------------------------------------
   * 1. Verify attempt ownership using authenticated client
   * ------------------------------------------------------- */

  const learningSupabase =
    await createLearningSupabaseClient();

  const {
    data: attempt,
    error: attemptError,
  } = await learningSupabase
    .from("test_attempts")
    .select(`
      id,
      user_id,
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
    `)
    .eq("id", normalizedAttemptId)
    .eq("user_id", userId)
    .maybeSingle();

  if (attemptError) {
    throw new Error(
      `Failed to load test result: ${attemptError.message}`
    );
  }

  if (!attempt || attempt.user_id !== userId) {
    return null;
  }

  // Never expose answer keys for unfinished attempts.
  if (attempt.status !== "SUBMITTED") {
    return null;
  }

  /* -------------------------------------------------------
   * 2. Load trusted test metadata
   * ------------------------------------------------------- */

  const supabase = createAdminSupabaseClient();

  const {
    data: test,
    error: testError,
  } = await supabase
    .from("tests")
    .select(`
      id,
      title,
      test_type,
      resource_id
    `)
    .eq("id", attempt.test_id)
    .maybeSingle();

  if (testError) {
    throw new Error(
      `Failed to load result test: ${testError.message}`
    );
  }

  if (!test) {
    return null;
  }

  if (test.test_type !== "MCQ") {
    return null;
  }

  /* -------------------------------------------------------
   * 3. Load the resource linked to this test
   * ------------------------------------------------------- */

  const {
    data: resource,
    error: resourceError,
  } = await supabase
    .from("resources")
    .select(`
      id,
      title,
      slug,
      set_number
    `)
    .eq("id", test.resource_id)
    .maybeSingle();

  if (resourceError) {
    throw new Error(
      `Failed to load result resource: ${resourceError.message}`
    );
  }

  if (!resource) {
    return null;
  }

  /* -------------------------------------------------------
   * 4. Load the test's question snapshots
   * ------------------------------------------------------- */

  const {
    data: testQuestions,
    error: testQuestionsError,
  } = await supabase
    .from("test_questions")
    .select(`
      question_id,
      question_order,
      marks,
      question_revision_id
    `)
    .eq("test_id", attempt.test_id)
    .order("question_order", {
      ascending: true,
    });

  if (testQuestionsError) {
    throw new Error(
      `Failed to load result questions: ${testQuestionsError.message}`
    );
  }

  if (!testQuestions || testQuestions.length === 0) {
    throw new Error(
      "Cannot build result: the submitted MCQ test has no questions."
    );
  }

  // Every test question must reference its exact revision.
  for (const question of testQuestions) {
    if (!question.question_revision_id) {
      throw new Error(
        `Cannot build result: question ${question.question_id} has no revision snapshot.`
      );
    }
  }

  /* -------------------------------------------------------
   * 5. Load answers belonging to this attempt
   * ------------------------------------------------------- */

  const {
    data: attemptAnswers,
    error: attemptAnswersError,
  } = await supabase
    .from("attempt_answers")
    .select(`
      id,
      question_id,
      selected_option_id,
      answer_text,
      is_correct,
      marks_awarded,
      time_spent_seconds,
      question_revision_id
    `)
    .eq("attempt_id", attempt.id);

  if (attemptAnswersError) {
    throw new Error(
      `Failed to load attempt answers: ${attemptAnswersError.message}`
    );
  }

  /* -------------------------------------------------------
   * 6. Validate answer-to-test snapshot relationships
   * ------------------------------------------------------- */

  const testQuestionById = new Map(
    testQuestions.map((question) => [
      question.question_id,
      question,
    ])
  );

  type AttemptAnswerRow =
    NonNullable<typeof attemptAnswers>[number];

  const answerByQuestionId = new Map<
    string,
    AttemptAnswerRow
  >();

  for (const answer of attemptAnswers ?? []) {
    const testQuestion = testQuestionById.get(
      answer.question_id
    );

    if (!testQuestion) {
      throw new Error(
        `Cannot build result: answer ${answer.id} belongs to a question outside this test.`
      );
    }

    if (
      answer.question_revision_id !==
      testQuestion.question_revision_id
    ) {
      throw new Error(
        `Cannot build result: answer revision mismatch for question ${answer.question_id}.`
      );
    }

    if (answerByQuestionId.has(answer.question_id)) {
      throw new Error(
        `Cannot build result: duplicate answer records found for question ${answer.question_id}.`
      );
    }

    answerByQuestionId.set(
      answer.question_id,
      answer
    );
  }

  /* -------------------------------------------------------
   * 7. Collect exact revision IDs
   * ------------------------------------------------------- */

  const revisionIds = [
    ...new Set(
      testQuestions.map(
        (question) => question.question_revision_id!
      )
    ),
  ];

  /* -------------------------------------------------------
   * 8. Load the published revisions used by this test
   * ------------------------------------------------------- */

  let revisions: RevisionRow[] = [];

  if (revisionIds.length > 0) {
    const {
      data,
      error,
    } = await supabase
      .from("question_revisions")
      .select(`
        id,
        question_id,
        revision_number,
        question_text,
        solution_text,
        mistake_insight,
        status
      `)
      .in("id", revisionIds)
      .eq("status", "PUBLISHED");

    if (error) {
      throw new Error(
        `Failed to load result question revisions: ${error.message}`
      );
    }

    revisions = (data ?? []) as RevisionRow[];
  }

  const revisionById = new Map<string, RevisionRow>(
    revisions.map((revision) => [
      revision.id,
      revision,
    ])
  );

  // Do not silently omit a question from a submitted result.
  for (const question of testQuestions) {
    const revision = revisionById.get(
      question.question_revision_id!
    );

    if (!revision) {
      throw new Error(
        `Cannot build result: published revision ${question.question_revision_id} is missing.`
      );
    }

    if (revision.question_id !== question.question_id) {
      throw new Error(
        `Cannot build result: revision does not belong to question ${question.question_id}.`
      );
    }
  }

  /* -------------------------------------------------------
   * 9. Load options for the exact revisions
   * ------------------------------------------------------- */

  let revisionOptions: RevisionOptionRow[] = [];

  if (revisionIds.length > 0) {
    const {
      data,
      error,
    } = await supabase
      .from("question_revision_options")
      .select(`
        id,
        revision_id,
        option_key,
        option_text,
        display_order,
        is_correct
      `)
      .in("revision_id", revisionIds)
      .order("display_order", {
        ascending: true,
      });

    if (error) {
      throw new Error(
        `Failed to load result question options: ${error.message}`
      );
    }

    revisionOptions =
      (data ?? []) as RevisionOptionRow[];
  }

  const optionsByRevisionId = new Map<
    string,
    RevisionOptionRow[]
  >();

  for (const option of revisionOptions) {
    const existing =
      optionsByRevisionId.get(option.revision_id) ?? [];

    existing.push(option);

    optionsByRevisionId.set(
      option.revision_id,
      existing
    );
  }

  /* -------------------------------------------------------
   * 10. Build question-wise result
   * ------------------------------------------------------- */

  const questions: LearningResultQuestion[] = [];

  for (const testQuestion of testQuestions) {
    const revisionId = testQuestion.question_revision_id!;

    const revision = revisionById.get(revisionId);

    // Already validated above; retain a defensive guard.
    if (!revision) {
      throw new Error(
        `Cannot build result: revision ${revisionId} is unavailable.`
      );
    }

    const options =
      optionsByRevisionId.get(revisionId) ?? [];

    const correctOptions = options.filter(
      (option) => option.is_correct
    );

    if (correctOptions.length !== 1) {
      throw new Error(
        `Cannot build result: revision ${revisionId} must have exactly one correct option.`
      );
    }

    const answer = answerByQuestionId.get(
      testQuestion.question_id
    );

    const normalizedOptions: LearningResultOption[] =
      options.map((option) => ({
        id: option.id,
        optionKey: option.option_key,
        optionText: option.option_text,
        isCorrect: option.is_correct,
      }));

    const selectedOption = answer?.selected_option_id
      ? options.find(
          (option) =>
            option.id === answer.selected_option_id
        ) ?? null
      : null;

    // A selected option must belong to this exact revision.
    if (answer?.selected_option_id && !selectedOption) {
      throw new Error(
        `Cannot build result: selected option does not belong to revision ${revisionId}.`
      );
    }

    let resultStatus:
      | "CORRECT"
      | "INCORRECT"
      | "UNANSWERED";

    if (!answer || answer.selected_option_id === null) {
      // This matches the MCQ evaluator's unanswered rule.
      resultStatus = "UNANSWERED";
    } else {
      // A submitted, answered MCQ must have been evaluated.
      if (
        answer.is_correct === null ||
        answer.marks_awarded === null
      ) {
        throw new Error(
          `Cannot build result: answer for question ${testQuestion.question_id} has not been evaluated.`
        );
      }

      resultStatus = answer.is_correct
        ? "CORRECT"
        : "INCORRECT";
    }

    const correctOption = correctOptions[0];

    questions.push({
      questionId: testQuestion.question_id,
      questionOrder: testQuestion.question_order,
      questionNumber: testQuestion.question_order,
      marks: testQuestion.marks,
      questionRevisionId: revisionId,

      questionText: revision.question_text,
      solutionText: revision.solution_text,
      mistakeInsight: revision.mistake_insight,

      options: normalizedOptions,

      selectedOptionId:
        answer?.selected_option_id ?? null,

      selectedOptionText:
        selectedOption?.option_text ?? null,

      correctOptionId: correctOption.id,
      correctOptionText: correctOption.option_text,

      answerText: answer?.answer_text ?? null,
      isCorrect: answer?.is_correct ?? null,
      marksAwarded: answer?.marks_awarded ?? null,
      timeSpentSeconds:
        answer?.time_spent_seconds ?? null,

      status: resultStatus,
      resultStatus,
    });
  }

  /* -------------------------------------------------------
   * 11. Return complete result model
   * ------------------------------------------------------- */

  return {
    id: attempt.id,
    testId: attempt.test_id,
    attemptNumber: attempt.attempt_number,
    status: attempt.status,
    startedAt: attempt.started_at,
    submittedAt: attempt.submitted_at,

    score: attempt.score,
    percentage: attempt.percentage,

    correctCount: attempt.correct_count,
    incorrectCount: attempt.incorrect_count,
    unansweredCount: attempt.unanswered_count,

    test: {
      id: test.id,
      title: test.title,
      testType: test.test_type,
      resourceId: test.resource_id,
    },

    resource: {
      id: resource.id,
      title: resource.title,
      slug: resource.slug,
      setNumber: resource.set_number,
    },

    testTitle: test.title ?? null,
    resourceId: resource.id,
    resourceTitle: resource.title ?? null,
    resourceSetNumber: resource.set_number ?? null,

    chapterName: null,

    questions,
  };
}
