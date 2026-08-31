"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/app/lib/auth/admin";
import { createAdminSupabaseClient } from "@/app/lib/admin/supabase-admin";

/* =========================================================
 * Types
 * ========================================================= */

export type BulkMcqOption = {
  optionKey: "A" | "B" | "C" | "D";
  optionText: string;
  displayOrder: number;
  isCorrect: boolean;
};

export type BulkMcqInput = {
  questionText: string;
  sourceType: "ORIGINAL" | "PYQ" | "PRACTICE";
  sourceReference?: string;
  difficulty?: "EASY" | "MEDIUM" | "HARD";
  marks?: number;
  estimatedTimeMinutes?: number;

  /*
   * V1 learning fields.
   * Optional because existing imports do not need them.
   */
  solutionText?: string;
  mistakeInsight?: string;

  options: BulkMcqOption[];
};

export type BulkCreateMcqsResult = {
  success: boolean;
  message: string;
  importedCount: number;
  firstQuestionNumber: number | null;
  lastQuestionNumber: number | null;
};

/* =========================================================
 * Bulk Create MCQs
 *
 * The database RPC remains the atomic bulk-creation boundary.
 * Each individual MCQ is still created through the canonical
 * create_admin_mcq() RPC inside the database.
 * ========================================================= */

export async function bulkCreateAdminMcqs(
  curriculumNodeId: string,
  questions: BulkMcqInput[]
): Promise<BulkCreateMcqsResult> {
  /* -------------------------------------------------------
   * 1. Admin authentication
   * ------------------------------------------------------- */

  await requireAdmin();

  /* -------------------------------------------------------
   * 2. Basic validation
   * ------------------------------------------------------- */

  const nodeId = curriculumNodeId.trim();

  if (!nodeId) {
    throw new Error(
      "Curriculum chapter is required."
    );
  }

  if (!Array.isArray(questions)) {
    throw new Error(
      "Bulk MCQ import requires a question array."
    );
  }

  if (questions.length === 0) {
    throw new Error(
      "At least one MCQ is required."
    );
  }

  /* -------------------------------------------------------
   * 3. Validate every MCQ before touching the database
   *
   * This prevents a malformed import from reaching the RPC.
   * The database remains the final authority.
   * ------------------------------------------------------- */

  const expectedKeys = [
    "A",
    "B",
    "C",
    "D",
  ] as const;

  for (
    let questionIndex = 0;
    questionIndex < questions.length;
    questionIndex++
  ) {
    const question =
      questions[questionIndex];

    const rowNumber =
      questionIndex + 1;

    if (
      !question ||
      typeof question.questionText !==
        "string" ||
      !question.questionText.trim()
    ) {
      throw new Error(
        `MCQ ${rowNumber}: question text is required.`
      );
    }

    if (
      !Array.isArray(question.options) ||
      question.options.length !== 4
    ) {
      throw new Error(
        `MCQ ${rowNumber}: exactly 4 options are required.`
      );
    }

    let correctCount = 0;

    for (
      let optionIndex = 0;
      optionIndex < expectedKeys.length;
      optionIndex++
    ) {
      const option =
        question.options[optionIndex];

      const expectedKey =
        expectedKeys[optionIndex];

      if (
        option.optionKey !==
        expectedKey
      ) {
        throw new Error(
          `MCQ ${rowNumber}: options must be ordered A, B, C and D.`
        );
      }

      if (
        !option.optionText ||
        !option.optionText.trim()
      ) {
        throw new Error(
          `MCQ ${rowNumber}: Option ${expectedKey} cannot be empty.`
        );
      }

      if (
        option.displayOrder !==
        optionIndex + 1
      ) {
        throw new Error(
          `MCQ ${rowNumber}: invalid display order for Option ${expectedKey}.`
        );
      }

      if (option.isCorrect) {
        correctCount++;
      }
    }

    if (correctCount !== 1) {
      throw new Error(
        `MCQ ${rowNumber}: exactly one correct option is required.`
      );
    }

    if (
      question.marks !== undefined &&
      (
        !Number.isFinite(
          question.marks
        ) ||
        question.marks <= 0
      )
    ) {
      throw new Error(
        `MCQ ${rowNumber}: marks must be greater than 0.`
      );
    }

    if (
      question.estimatedTimeMinutes !==
        undefined &&
      (
        !Number.isInteger(
          question.estimatedTimeMinutes
        ) ||
        question.estimatedTimeMinutes < 0
      )
    ) {
      throw new Error(
        `MCQ ${rowNumber}: estimated time must be a valid non-negative integer.`
      );
    }

    /*
     * Optional learning fields:
     *
     * Empty strings are allowed from the input layer,
     * but they will be normalized to null before reaching
     * the database.
     */
    if (
      question.solutionText !==
        undefined &&
      typeof question.solutionText !==
        "string"
    ) {
      throw new Error(
        `MCQ ${rowNumber}: solution text must be a string.`
      );
    }

    if (
      question.mistakeInsight !==
        undefined &&
      typeof question.mistakeInsight !==
        "string"
    ) {
      throw new Error(
        `MCQ ${rowNumber}: mistake insight must be a string.`
      );
    }
  }

  /* -------------------------------------------------------
   * 4. Trusted admin Supabase client
   * ------------------------------------------------------- */

  const supabase =
    createAdminSupabaseClient();

  /* -------------------------------------------------------
   * 5. Convert application model → database JSON model
   * ------------------------------------------------------- */

  const payload =
    questions.map(
      (question) => ({
        question_text:
          question.questionText.trim(),

        source_type:
          question.sourceType,

        source_reference:
          question.sourceReference?.trim() ||
          null,

        difficulty:
          question.difficulty ||
          null,

        marks:
          question.marks ??
          null,

        estimated_time_minutes:
          question.estimatedTimeMinutes ??
          null,

        /*
         * V1 learning fields
         *
         * These are optional. Empty values become null.
         */
        solution_text:
          question.solutionText?.trim() ||
          null,

        mistake_insight:
          question.mistakeInsight?.trim() ||
          null,

        options:
          question.options.map(
            (option) => ({
              option_key:
                option.optionKey,

              option_text:
                option.optionText.trim(),

              display_order:
                option.displayOrder,

              is_correct:
                option.isCorrect,
            })
          ),
      })
    );

  /* -------------------------------------------------------
   * 6. Atomic bulk creation
   * ------------------------------------------------------- */

  const {
    data,
    error,
  } = await supabase.rpc(
    "bulk_create_admin_mcqs",
    {
      p_curriculum_node_id:
        nodeId,

      p_questions:
        payload,
    }
  );

  if (error) {
    throw new Error(
      `Failed to import MCQs: ${error.message}`
    );
  }

  if (
    !data ||
    data.length === 0
  ) {
    throw new Error(
      "MCQ import completed without a result."
    );
  }

  const result =
    data[0];

  /* -------------------------------------------------------
   * 7. Validate database response
   * ------------------------------------------------------- */

  if (
    result.imported_count ===
      null ||
    result.imported_count ===
      undefined
  ) {
    throw new Error(
      "MCQ import completed but imported count was not returned."
    );
  }

  /* -------------------------------------------------------
   * 8. Refresh admin MCQ pages
   * ------------------------------------------------------- */

  revalidatePath(
    "/admin/mcq-bank"
  );

  revalidatePath(
    "/admin/mcq-bank/new"
  );

  /* -------------------------------------------------------
   * 9. Return safe result
   * ------------------------------------------------------- */

  return {
    success: true,

    message:
      `${result.imported_count} MCQ(s) imported successfully as Draft.`,

    importedCount:
      result.imported_count,

    firstQuestionNumber:
      result.first_question_number ??
      null,

    lastQuestionNumber:
      result.last_question_number ??
      null,
  };
}