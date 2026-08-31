import "server-only";

import { createAdminSupabaseClient } from "@/app/lib/admin/supabase-admin";
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
  solution_text: string | null;
  mistake_insight: string | null;
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
 * Get questions for authenticated learning attempt
 * ========================================================= */

export async function getLearningTestQuestions(
  testId: string
): Promise<LearningPracticeQuestion[]> {
  await requireLearningAuth();

  const normalizedTestId = testId.trim();

  if (!normalizedTestId) {
    return [];
  }

  const supabase = createAdminSupabaseClient();

  /* -------------------------------------------------------
   * 1. Load test questions
   * ------------------------------------------------------- */

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
    .eq("test_id", normalizedTestId)
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
   * 2. Collect exact revision IDs
   * ------------------------------------------------------- */

  const revisionIds = [
    ...new Set(
      testQuestions.map(
        (row) => row.question_revision_id
      )
    ),
  ];

  /* -------------------------------------------------------
   * 3. Load exact published revisions
   * ------------------------------------------------------- */

  const {
    data: revisions,
    error: revisionsError,
  } = await supabase
    .from("question_revisions")
    .select(
      `
        id,
        revision_number,
        question_id,
        question_text,
        solution_text,
        mistake_insight,
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
   * 4. Load options for exact revisions
   * ------------------------------------------------------- */

  const {
    data: revisionOptions,
    error: revisionOptionsError,
  } = await supabase
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
   * 5. Typed local structures
   * ------------------------------------------------------- */

  type RevisionRow = {
    id: string;
    revision_number: number;
    question_id: string;
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
  };

  const typedRevisions =
    (revisions ?? []) as RevisionRow[];

  const typedRevisionOptions =
    (revisionOptions ?? []) as RevisionOptionRow[];

  /* -------------------------------------------------------
   * 6. Build revision lookup
   * ------------------------------------------------------- */

  const revisionById = new Map<
    string,
    RevisionRow
  >(
    typedRevisions.map((revision) => [
      revision.id,
      revision,
    ])
  );

  /* -------------------------------------------------------
   * 7. Build revision-option lookup
   * ------------------------------------------------------- */

  const optionsByRevisionId = new Map<
    string,
    RevisionOptionRow[]
  >();

  for (const option of typedRevisionOptions) {
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
   * 8. Normalize test questions
   * ------------------------------------------------------- */

  const result: LearningPracticeQuestion[] = [];

  for (const testQuestion of testQuestions) {
    const revision = revisionById.get(
      testQuestion.question_revision_id
    );

    /*
     * The test_questions row explicitly points
     * to the revision belonging to this test.
     *
     * Never silently fall back to another revision.
     */

    if (!revision) {
      continue;
    }

    /*
     * Make sure the revision belongs to
     * the same question attached to the test.
     */

    if (
      revision.question_id !==
      testQuestion.question_id
    ) {
      continue;
    }

    const revisionOptions =
      optionsByRevisionId.get(
        testQuestion.question_revision_id
      ) ?? [];

    /*
     * MCQ practice requires exactly four options.
     */

    if (revisionOptions.length !== 4) {
      continue;
    }

    /*
     * IMPORTANT:
     *
     * attempt_answers.selected_option_id
     * references:
     *
     *     question_revision_options.id
     *
     * Therefore we preserve the exact
     * question_revision_options.id here.
     *
     * Do NOT replace it with
     * question_mcq_options.id.
     */

    const normalizedOptions: LearningPracticeOption[] =
      revisionOptions.map((option) => ({
        id: option.id,

        option_key:
          option.option_key,

        option_text:
          option.option_text,

        display_order:
          option.display_order,
      }));

    result.push({
      question_id:
        testQuestion.question_id,

      question_order:
        testQuestion.question_order,

      marks:
        testQuestion.marks,

      question_revision_id:
        testQuestion.question_revision_id,

      question_revisions: [
        {
          id:
            revision.id,

          revision_number:
            revision.revision_number,

          question_text:
            revision.question_text,

          solution_text:
            revision.solution_text,

          mistake_insight:
            revision.mistake_insight,

          status:
            revision.status,

          question_revision_options:
            normalizedOptions,
        },
      ],
    });
  }

  return result;
}