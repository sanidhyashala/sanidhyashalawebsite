
import "server-only";

import { createAdminSupabaseClient } from "@/app/lib/admin/supabase-admin";
import { createLearningSupabaseClient } from "./supabase-learning";
import { requireLearningAuth } from "./learning-auth";

/* =========================================================
 * Types
 * ========================================================= */

export type LearningPracticeOption = {
  id: string;
  option_key: string;
  option_text: string;
  display_order: number;
};

export type LearningPracticeRevision = {
  id: string;
  revision_number: number;
  question_text: string;
  status: string;
  question_revision_options: LearningPracticeOption[];
};

export type LearningPracticeQuestion = {
  question_id: string;
  question_order: number;
  marks: number | null;
  question_revision_id: string;
  question_revisions: LearningPracticeRevision[];
};

/* =========================================================
 * Get questions for an authenticated active attempt
 *
 * Security:
 * - Verify current user owns the attempt.
 * - Require IN_PROGRESS status.
 * - Derive testId from the verified attempt.
 * - Never return solution_text, mistake_insight or is_correct.
 * ========================================================= */

export async function getLearningTestQuestions(
  attemptId: string
): Promise<LearningPracticeQuestion[]> {
  const { userId } = await requireLearningAuth();

  const normalizedAttemptId = attemptId.trim();

  if (!normalizedAttemptId) {
    return [];
  }

  /* -------------------------------------------------------
   * 1. Verify attempt through the authenticated client
   * ------------------------------------------------------- */

  const learningSupabase =
    await createLearningSupabaseClient();

  const {
    data: attempt,
    error: attemptError,
  } = await learningSupabase
    .from("test_attempts")
    .select("id, test_id, user_id, status")
    .eq("id", normalizedAttemptId)
    .eq("user_id", userId)
    .maybeSingle();

  if (attemptError) {
    throw new Error(
      `Failed to verify learning attempt: ${attemptError.message}`
    );
  }

  if (
    !attempt ||
    attempt.user_id !== userId ||
    attempt.status !== "IN_PROGRESS"
  ) {
    return [];
  }

  /* -------------------------------------------------------
   * 2. Derive test ID from the verified attempt
   * ------------------------------------------------------- */

  const verifiedTestId = attempt.test_id;

  const adminSupabase =
    createAdminSupabaseClient();

  /* -------------------------------------------------------
   * 3. Load questions for this exact test
   * ------------------------------------------------------- */

  const {
    data: testQuestions,
    error: testQuestionsError,
  } = await adminSupabase
    .from("test_questions")
    .select(
      `
        question_id,
        question_order,
        marks,
        question_revision_id
      `
    )
    .eq("test_id", verifiedTestId)
    .order("question_order", {
      ascending: true,
    });

  if (testQuestionsError) {
    throw new Error(
      `Failed to load learning test questions: ${testQuestionsError.message}`
    );
  }

  if (!testQuestions || testQuestions.length === 0) {
    return [];
  }

  /* -------------------------------------------------------
   * 4. Collect exact revision IDs
   * ------------------------------------------------------- */

  const revisionIds = [
    ...new Set(
      testQuestions.map(
        (row) => row.question_revision_id
      )
    ),
  ];

  /* -------------------------------------------------------
   * 5. Load exact published revisions
   *
   * Deliberately exclude solution_text and mistake_insight.
   * ------------------------------------------------------- */

  const {
    data: revisions,
    error: revisionsError,
  } = await adminSupabase
    .from("question_revisions")
    .select(
      `
        id,
        revision_number,
        question_id,
        question_text,
        status
      `
    )
    .in("id", revisionIds)
    .eq("status", "PUBLISHED");

  if (revisionsError) {
    throw new Error(
      `Failed to load question revisions: ${revisionsError.message}`
    );
  }

  if (!revisions || revisions.length === 0) {
    return [];
  }

  /* -------------------------------------------------------
   * 6. Load options for exact revisions
   *
   * Do not select is_correct.
   * ------------------------------------------------------- */

  const {
    data: revisionOptions,
    error: revisionOptionsError,
  } = await adminSupabase
    .from("question_revision_options")
    .select(
      `
        id,
        revision_id,
        option_key,
        option_text,
        display_order
      `
    )
    .in("revision_id", revisionIds)
    .order("display_order", {
      ascending: true,
    });

  if (revisionOptionsError) {
    throw new Error(
      `Failed to load question options: ${revisionOptionsError.message}`
    );
  }

  /* -------------------------------------------------------
   * 7. Typed local structures
   * ------------------------------------------------------- */

  type RevisionRow = {
    id: string;
    revision_number: number;
    question_id: string;
    question_text: string;
    status: string;
  };

  type RevisionOptionRow = {
    id: string;
    revision_id: string;
    option_key: string;
    option_text: string;
    display_order: number;
  };

  const typedRevisions =
    revisions as RevisionRow[];

  const typedRevisionOptions =
    (revisionOptions ?? []) as RevisionOptionRow[];

  /* -------------------------------------------------------
   * 8. Build revision lookup
   * ------------------------------------------------------- */

  const revisionById = new Map<string, RevisionRow>(
    typedRevisions.map((revision) => [
      revision.id,
      revision,
    ])
  );

  /* -------------------------------------------------------
   * 9. Build options lookup
   * ------------------------------------------------------- */

  const optionsByRevisionId = new Map<
    string,
    RevisionOptionRow[]
  >();

  for (const option of typedRevisionOptions) {
    const existing =
      optionsByRevisionId.get(option.revision_id) ?? [];

    existing.push(option);
    optionsByRevisionId.set(option.revision_id, existing);
  }

  /* -------------------------------------------------------
   * 10. Normalize questions
   * ------------------------------------------------------- */

  const result: LearningPracticeQuestion[] = [];

  for (const testQuestion of testQuestions) {
    const revision = revisionById.get(
      testQuestion.question_revision_id
    );

    if (!revision) {
      continue;
    }

    if (
      revision.question_id !== testQuestion.question_id
    ) {
      continue;
    }

    const revisionOptions =
      optionsByRevisionId.get(
        testQuestion.question_revision_id
      ) ?? [];

    if (revisionOptions.length !== 4) {
      continue;
    }

    const normalizedOptions: LearningPracticeOption[] =
      revisionOptions.map((option) => ({
        id: option.id,
        option_key: option.option_key,
        option_text: option.option_text,
        display_order: option.display_order,
      }));

    result.push({
      question_id: testQuestion.question_id,
      question_order: testQuestion.question_order,
      marks: testQuestion.marks,
      question_revision_id:
        testQuestion.question_revision_id,

      question_revisions: [
        {
          id: revision.id,
          revision_number: revision.revision_number,
          question_text: revision.question_text,
          status: revision.status,
          question_revision_options: normalizedOptions,
        },
      ],
    });
  }

  return result;
}
