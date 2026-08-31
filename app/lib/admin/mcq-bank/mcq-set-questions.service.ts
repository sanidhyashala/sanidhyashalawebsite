import { requireAdmin } from "@/app/lib/auth/admin";
import { createAdminSupabaseClient } from "@/app/lib/admin/supabase-admin";


/* =========================================================
 * Types
 * ========================================================= */

export type AdminMcqSetQuestion = {
  question_id: string;

  question_order: number;

  marks: number | null;

  question_text: string;

  question_type: string;

  source_type: string;

  source_reference: string | null;

  difficulty: string | null;

  question_marks: number | null;

  status: string;

  created_at: string;
};


export type AdminAvailableMcq = {
  id: string;

  question_text: string;

  source_type: string;

  source_reference: string | null;

  difficulty: string | null;

  marks: number | null;

  status: string;

  created_at: string;
};


/* =========================================================
 * Get Questions already attached to an MCQ Set
 * ========================================================= */

export async function getAdminMcqSetQuestions(
  testId: string
): Promise<AdminMcqSetQuestion[]> {

  /*
   * -------------------------------------------------------
   * 1. Admin authentication
   * -------------------------------------------------------
   */

  await requireAdmin();


  /*
   * -------------------------------------------------------
   * 2. Validate test ID
   * -------------------------------------------------------
   */

  if (!testId.trim()) {
    throw new Error(
      "MCQ Set test ID is required."
    );
  }


  /*
   * -------------------------------------------------------
   * 3. Trusted Supabase client
   * -------------------------------------------------------
   */

  const supabase =
    createAdminSupabaseClient();


  /*
   * -------------------------------------------------------
   * 4. Load questions belonging to this test
   * -------------------------------------------------------
   */

  const {
    data,
    error,
  } = await supabase
    .from("test_questions")
    .select(
      `
        question_id,
        question_order,
        marks,
        questions (
          id,
          question_text,
          question_type,
          source_type,
          source_reference,
          difficulty,
          marks,
          status,
          created_at
        )
      `
    )
    .eq(
      "test_id",
      testId
    )
    .order(
      "question_order",
      {
        ascending: true,
      }
    );


  if (error) {
    throw new Error(
      `Failed to load MCQ Set questions: ${error.message}`
    );
  }


  /*
   * -------------------------------------------------------
   * 5. Normalize Supabase relation result
   * -------------------------------------------------------
   */

  const result:
    AdminMcqSetQuestion[] =
      [];


  for (
    const row of data ?? []
  ) {

    const question =
      Array.isArray(row.questions)
        ? row.questions[0]
        : row.questions;


    if (!question) {
      continue;
    }


    result.push({

      question_id:
        question.id,

      question_order:
        row.question_order,

      marks:
        row.marks,

      question_text:
        question.question_text,

      question_type:
        question.question_type,

      source_type:
        question.source_type,

      source_reference:
        question.source_reference,

      difficulty:
        question.difficulty,

      question_marks:
        question.marks,

      status:
        question.status,

      created_at:
        question.created_at,

    });
  }


  return result;
}


/* =========================================================
 * Get Available MCQs for an MCQ Set
 * =========================================================
 *
 * Only MCQs that are genuinely eligible for attachment
 * are returned.
 *
 * Eligibility:
 *
 * 1. Same curriculum node as the Set
 * 2. Not already attached to the Set
 * 3. question_type = MCQ
 * 4. question status = PUBLISHED
 * 5. current_revision_id exists
 * 6. current revision belongs to the same question
 * 7. current revision status = PUBLISHED
 * 8. Exactly four revision options exist
 * 9. Exactly one option is marked correct
 *
 * These rules intentionally mirror the final validation
 * performed by the add_mcqs_to_test database RPC.
 *
 * The database RPC remains the final authority.
 * ========================================================= */

export async function getAdminAvailableMcqsForSet(
  testId: string,
  curriculumNodeId: string
): Promise<AdminAvailableMcq[]> {

  /*
   * -------------------------------------------------------
   * 1. Admin authentication
   * -------------------------------------------------------
   */

  await requireAdmin();


  /*
   * -------------------------------------------------------
   * 2. Validate IDs
   * -------------------------------------------------------
   */

  if (!testId.trim()) {
    throw new Error(
      "MCQ Set test ID is required."
    );
  }


  if (!curriculumNodeId.trim()) {
    throw new Error(
      "MCQ Set curriculum node ID is required."
    );
  }


  /*
   * -------------------------------------------------------
   * 3. Trusted Supabase client
   * -------------------------------------------------------
   */

  const supabase =
    createAdminSupabaseClient();


  /*
   * -------------------------------------------------------
   * 4. Find questions already inside this Set
   * -------------------------------------------------------
   */

  const {
    data: existingQuestions,
    error: existingError,
  } = await supabase
    .from("test_questions")
    .select(
      "question_id"
    )
    .eq(
      "test_id",
      testId
    );


  if (existingError) {
    throw new Error(
      `Failed to load existing Set questions: ${existingError.message}`
    );
  }


  const existingQuestionIds =
    new Set(
      (existingQuestions ?? []).map(
        (row) =>
          row.question_id
      )
    );


  /*
   * -------------------------------------------------------
   * 5. Find MCQs belonging to this exact chapter
   * -------------------------------------------------------
   */

  const {
    data: curriculumQuestions,
    error: curriculumQuestionsError,
  } = await supabase
    .from(
      "question_curriculum_nodes"
    )
    .select(
      "question_id"
    )
    .eq(
      "curriculum_node_id",
      curriculumNodeId
    );


  if (curriculumQuestionsError) {
    throw new Error(
      `Failed to load chapter MCQs: ${curriculumQuestionsError.message}`
    );
  }


  if (
    !curriculumQuestions ||
    curriculumQuestions.length === 0
  ) {
    return [];
  }


  /*
   * -------------------------------------------------------
   * 6. Remove questions already attached
   * -------------------------------------------------------
   */

  const chapterQuestionIds =
    curriculumQuestions
      .map(
        (row) =>
          row.question_id
      )
      .filter(
        (questionId) =>
          !existingQuestionIds.has(
            questionId
          )
      );


  if (
    chapterQuestionIds.length === 0
  ) {
    return [];
  }


  /*
   * -------------------------------------------------------
   * 7. Load candidate MCQs
   * -------------------------------------------------------
   *
   * Only PUBLISHED MCQs are considered.
   *
   * Draft questions are intentionally excluded because
   * add_mcqs_to_test() requires the question itself to
   * be PUBLISHED before attachment.
   * -------------------------------------------------------
   */

  const {
    data: questions,
    error: questionsError,
  } = await supabase
    .from("questions")
    .select(
      `
        id,
        question_text,
        question_type,
        source_type,
        source_reference,
        difficulty,
        marks,
        status,
        current_revision_id,
        created_at
      `
    )
    .in(
      "id",
      chapterQuestionIds
    )
    .eq(
      "question_type",
      "MCQ"
    )
    .eq(
      "status",
      "PUBLISHED"
    )
    .not(
      "current_revision_id",
      "is",
      null
    )
    .order(
      "created_at",
      {
        ascending: false,
      }
    );


  if (questionsError) {
    throw new Error(
      `Failed to load available MCQs: ${questionsError.message}`
    );
  }


  if (
    !questions ||
    questions.length === 0
  ) {
    return [];
  }


  /*
   * -------------------------------------------------------
   * 8. Collect current revision IDs
   * -------------------------------------------------------
   */

  const revisionIds =
    questions
      .map(
        (question) =>
          question.current_revision_id
      )
      .filter(
        (
          revisionId
        ): revisionId is string =>
          Boolean(revisionId)
      );


  if (
    revisionIds.length === 0
  ) {
    return [];
  }


  /*
   * -------------------------------------------------------
   * 9. Load current revisions
   * -------------------------------------------------------
   */

  const {
    data: revisions,
    error: revisionsError,
  } = await supabase
    .from(
      "question_revisions"
    )
    .select(
      `
        id,
        question_id,
        status
      `
    )
    .in(
      "id",
      revisionIds
    );


  if (revisionsError) {
    throw new Error(
      `Failed to load MCQ revisions: ${revisionsError.message}`
    );
  }


  if (
    !revisions ||
    revisions.length === 0
  ) {
    return [];
  }


  /*
   * -------------------------------------------------------
   * 10. Keep only valid PUBLISHED current revisions
   * -------------------------------------------------------
   *
   * The revision must:
   *
   * - be PUBLISHED
   * - belong to the same question that references it
   * -------------------------------------------------------
   */

  const publishedRevisions =
    revisions.filter(
      (revision) => {

        if (
          revision.status !==
          "PUBLISHED"
        ) {
          return false;
        }


        const question =
          questions.find(
            (item) =>
              item.current_revision_id ===
              revision.id
          );


        if (!question) {
          return false;
        }


        return (
          revision.question_id ===
          question.id
        );
      }
    );


  if (
    publishedRevisions.length === 0
  ) {
    return [];
  }


  /*
   * -------------------------------------------------------
   * 11. Load revision options
   * -------------------------------------------------------
   */

  const publishedRevisionIds =
    publishedRevisions.map(
      (revision) =>
        revision.id
    );


  const {
    data: revisionOptions,
    error: revisionOptionsError,
  } = await supabase
    .from(
      "question_revision_options"
    )
    .select(
      `
        revision_id,
        is_correct
      `
    )
    .in(
      "revision_id",
      publishedRevisionIds
    );


  if (revisionOptionsError) {
    throw new Error(
      `Failed to load MCQ revision options: ${revisionOptionsError.message}`
    );
  }


  /*
   * -------------------------------------------------------
   * 12. Validate revision structure
   * -------------------------------------------------------
   *
   * A revision is attachable only when:
   *
   * - exactly 4 options exist
   * - exactly 1 option is marked correct
   *
   * This mirrors add_mcqs_to_test().
   * -------------------------------------------------------
   */

  const validRevisionIds =
    new Set<string>();


  for (
    const revision of publishedRevisions
  ) {

    const options =
      (revisionOptions ?? []).filter(
        (option) =>
          option.revision_id ===
          revision.id
      );


    const optionCount =
      options.length;


    const correctOptionCount =
      options.filter(
        (option) =>
          option.is_correct === true
      ).length;


    if (
      optionCount === 4 &&
      correctOptionCount === 1
    ) {
      validRevisionIds.add(
        revision.id
      );
    }
  }


  if (
    validRevisionIds.size === 0
  ) {
    return [];
  }


  /*
   * -------------------------------------------------------
   * 13. Build set of attachable question IDs
   * -------------------------------------------------------
   */

  const validQuestionIds =
    new Set<string>();


  for (
    const question of questions
  ) {

    const revisionId =
      question.current_revision_id;


    if (
      revisionId &&
      validRevisionIds.has(
        revisionId
      )
    ) {
      validQuestionIds.add(
        question.id
      );
    }
  }


  /*
   * -------------------------------------------------------
   * 14. Return only genuinely attachable MCQs
   * -------------------------------------------------------
   */

  return questions
    .filter(
      (question) =>
        validQuestionIds.has(
          question.id
        )
    )
    .map(
      (question) => ({

        id:
          question.id,

        question_text:
          question.question_text,

        source_type:
          question.source_type,

        source_reference:
          question.source_reference,

        difficulty:
          question.difficulty,

        marks:
          question.marks,

        status:
          question.status,

        created_at:
          question.created_at,

      })
    );
}