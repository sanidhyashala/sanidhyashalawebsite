"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/app/lib/auth/admin";
import { createAdminSupabaseClient } from "@/app/lib/admin/supabase-admin";

/* =========================================================
 * Add selected MCQs to an MCQ Set
 * ========================================================= */

export async function addMcqsToAdminMcqSet(
  formData: FormData
): Promise<void> {
  /* -------------------------------------------------------
   * 1. Admin authentication
   * ------------------------------------------------------- */

  await requireAdmin();

  /* -------------------------------------------------------
   * 2. Read Test ID
   *
   * The UI sends the MCQ Set's associated Test ID.
   * ------------------------------------------------------- */

  const testId = formData
    .get("test_id")
    ?.toString()
    .trim();

  if (!testId) {
    throw new Error(
      "MCQ Set test ID is required."
    );
  }

  /* -------------------------------------------------------
   * 3. Read selected question IDs
   * ------------------------------------------------------- */

  const questionIds = formData
    .getAll("question_ids")
    .map((value) =>
      value.toString().trim()
    )
    .filter(Boolean);

  if (questionIds.length === 0) {
    throw new Error(
      "Please select at least one MCQ."
    );
  }

  /* -------------------------------------------------------
   * 4. Remove duplicate question IDs
   * ------------------------------------------------------- */

  const uniqueQuestionIds = Array.from(
    new Set(questionIds)
  );

  /* -------------------------------------------------------
   * 5. Trusted admin Supabase client
   * ------------------------------------------------------- */

  const supabase =
    createAdminSupabaseClient();

  /* -------------------------------------------------------
   * 6. Verify target Test
   * ------------------------------------------------------- */

  const {
    data: test,
    error: testError,
  } = await supabase
    .from("tests")
    .select(
      `
        id,
        resource_id,
        test_type,
        status,
        resources (
          id,
          status
        )
      `
    )
    .eq(
      "id",
      testId
    )
    .maybeSingle();

  if (testError) {
    throw new Error(
      `Failed to validate MCQ Set test: ${testError.message}`
    );
  }

  if (!test) {
    throw new Error(
      "MCQ Set test not found."
    );
  }

  /* -------------------------------------------------------
   * 7. Verify Test type
   * ------------------------------------------------------- */

  if (
    test.test_type !==
    "MCQ"
  ) {
    throw new Error(
      "The selected Test is not an MCQ test."
    );
  }

  /* -------------------------------------------------------
   * 8. Verify Resource
   * ------------------------------------------------------- */

  if (!test.resource_id) {
    throw new Error(
      "The MCQ Set resource could not be identified."
    );
  }

  /* -------------------------------------------------------
   * 9. Resolve Resource status
   * ------------------------------------------------------- */

  const resource =
    Array.isArray(test.resources)
      ? test.resources[0]
      : test.resources;

  /* -------------------------------------------------------
   * 10. Published Set protection
   *
   * Published MCQ Sets are immutable.
   * ------------------------------------------------------- */

  if (
    test.status ===
      "PUBLISHED" ||
    resource?.status ===
      "PUBLISHED"
  ) {
    throw new Error(
      "Published MCQ Sets cannot be modified. Create a new Test/Set instead."
    );
  }

  /* -------------------------------------------------------
   * 11. Load question marks
   *
   * The question's marks are the authoritative source
   * for the marks assigned when the MCQ is attached
   * to a Test.
   *
   * Example:
   *
   * questions.marks = 1
   *          ↓
   * test_questions.marks = 1
   * ------------------------------------------------------- */

  const {
    data: selectedQuestions,
    error: selectedQuestionsError,
  } = await supabase
    .from("questions")
    .select(
      `
        id,
        marks
      `
    )
    .in(
      "id",
      uniqueQuestionIds
    )
    .eq(
      "question_type",
      "MCQ"
    );

  if (selectedQuestionsError) {
    throw new Error(
      `Failed to load MCQ marks: ${selectedQuestionsError.message}`
    );
  }

  const marksByQuestionId =
    new Map<
      string,
      number
    >();

  for (
    const question of
      selectedQuestions ?? []
  ) {
    /*
     * Only valid numeric marks are copied.
     *
     * If marks are NULL on the question,
     * we leave the Test Question marks unchanged.
     */
    if (
      typeof question.marks ===
        "number" &&
      Number.isFinite(
        question.marks
      )
    ) {
      marksByQuestionId.set(
        question.id,
        question.marks
      );
    }
  }

  /* -------------------------------------------------------
   * 12. Add MCQs through database RPC
   *
   * IMPORTANT:
   *
   * The database function remains the final authority.
   *
   * It verifies:
   *
   * - target Test is an MCQ Test
   * - target Test/Resource is not published
   * - question exists
   * - question is an MCQ
   * - question status is PUBLISHED
   * - current question revision exists
   * - current revision is PUBLISHED
   * - current revision has exactly four options
   * - current revision has exactly one correct option
   * - question belongs to the same curriculum node
   * - duplicate attachment is prevented
   * ------------------------------------------------------- */

  const {
    data,
    error,
  } = await supabase.rpc(
    "add_mcqs_to_test",
    {
      p_test_id:
        testId,

      p_question_ids:
        uniqueQuestionIds,
    }
  );

  /* -------------------------------------------------------
   * 13. Handle database mutation error
   * ------------------------------------------------------- */

  if (error) {
    throw new Error(
      `Failed to add MCQs to Set: ${error.message}`
    );
  }

  /* -------------------------------------------------------
   * 14. Validate RPC result
   *
   * The database function returns the number of newly
   * attached MCQs.
   * ------------------------------------------------------- */

  if (
    typeof data !==
      "number" ||
    !Number.isInteger(data) ||
    data < 0
  ) {
    throw new Error(
      "MCQs could not be added to the Set."
    );
  }

  /* -------------------------------------------------------
   * 15. Synchronize Test Question marks
   *
   * IMPORTANT:
   *
   * The RPC is responsible for creating the
   * test_questions relationship.
   *
   * This step makes sure that the question's
   * authoritative marks are also present on
   * test_questions.
   *
   * This also repairs an already-attached MCQ
   * whose test_questions.marks is currently NULL.
   * ------------------------------------------------------- */

  for (
    const questionId of
      uniqueQuestionIds
  ) {
    const marks =
      marksByQuestionId.get(
        questionId
      );

    if (
      marks === undefined
    ) {
      continue;
    }

    const {
      error:
        marksUpdateError,
    } = await supabase
      .from("test_questions")
      .update({
        marks,
      })
      .eq(
        "test_id",
        testId
      )
      .eq(
        "question_id",
        questionId
      );

    if (marksUpdateError) {
      throw new Error(
        `MCQ was attached, but its marks could not be synchronized: ${marksUpdateError.message}`
      );
    }
  }

  /* -------------------------------------------------------
   * 16. Resolve Resource ID
   * ------------------------------------------------------- */

  const resourceId =
    test.resource_id;

  /* -------------------------------------------------------
   * 17. Refresh affected admin pages
   * ------------------------------------------------------- */

  revalidatePath(
    `/admin/mcq-bank/sets/${resourceId}`
  );

  revalidatePath(
    `/admin/mcq-bank/sets/${resourceId}/questions`
  );

  revalidatePath(
    "/admin/mcq-bank"
  );

  /* -------------------------------------------------------
   * 18. Mutation complete
   *
   * No redirect is performed here.
   * The current page remains responsible for navigation.
   * ------------------------------------------------------- */

  return;
}