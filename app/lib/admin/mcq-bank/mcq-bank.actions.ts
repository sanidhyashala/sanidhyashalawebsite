"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/app/lib/auth/admin";
import { createAdminSupabaseClient } from "@/app/lib/admin/supabase-admin";

/* =========================================================
 * Types
 * ========================================================= */

type CreateMcqOption = {
  optionKey: "A" | "B" | "C" | "D";
  optionText: string;
  displayOrder: number;
  isCorrect: boolean;
};

type CreateMcqInput = {
  questionText: string;
  sourceType: "ORIGINAL" | "PYQ" | "PRACTICE";
  sourceReference?: string;
  difficulty?: "EASY" | "MEDIUM" | "HARD";
  marks: number;
  estimatedTimeMinutes?: number;
  curriculumNodeId: string;
  options: CreateMcqOption[];
};

type CreateAdminMcqResult = {
  success: boolean;
  message: string;
  mcq?: {
    questionId: string;
    revisionId: string;
    revisionNumber: number;
    questionStatus: string;
    revisionStatus: string;
    adminQuestionNumber: number;
  };
};

/* =========================================================
 * Create MCQ
 * =========================================================
 *
 * The database function is the single atomic creation
 * boundary for:
 *
 *   questions
 *   question_curriculum_nodes
 *   question_revisions
 *   question_revision_options
 *
 * New MCQs do NOT create legacy
 * question_mcq_options rows.
 * ========================================================= */

export async function createAdminMcq(
  input: CreateMcqInput
): Promise<CreateAdminMcqResult> {
  /* -------------------------------------------------------
   * 1. Admin authentication
   * ------------------------------------------------------- */

  await requireAdmin();

  /* -------------------------------------------------------
   * 2. Basic validation
   * ------------------------------------------------------- */

  const questionText =
    input.questionText.trim();

  if (!questionText) {
    throw new Error(
      "Question text is required."
    );
  }

  if (
    !input.curriculumNodeId.trim()
  ) {
    throw new Error(
      "Curriculum chapter is required."
    );
  }

  if (
    !Number.isFinite(input.marks) ||
    input.marks <= 0
  ) {
    throw new Error(
      "Marks must be greater than 0."
    );
  }

  if (
    input.estimatedTimeMinutes !==
      undefined &&
    (
      !Number.isInteger(
        input.estimatedTimeMinutes
      ) ||
      input.estimatedTimeMinutes < 0
    )
  ) {
    throw new Error(
      "Estimated time must be a valid non-negative integer."
    );
  }

  /* -------------------------------------------------------
   * 3. Validate options
   * ------------------------------------------------------- */

  if (
    input.options.length !== 4
  ) {
    throw new Error(
      "An MCQ must contain exactly 4 options."
    );
  }

  const expectedKeys = [
    "A",
    "B",
    "C",
    "D",
  ] as const;

  for (
    let index = 0;
    index < expectedKeys.length;
    index++
  ) {
    const option =
      input.options[index];

    if (
      option.optionKey !==
      expectedKeys[index]
    ) {
      throw new Error(
        "MCQ options must be ordered as A, B, C and D."
      );
    }

    if (
      !option.optionText.trim()
    ) {
      throw new Error(
        `Option ${expectedKeys[index]} cannot be empty.`
      );
    }

    if (
      option.displayOrder !==
      index + 1
    ) {
      throw new Error(
        "MCQ option display order is invalid."
      );
    }
  }

  const correctOptions =
    input.options.filter(
      (option) =>
        option.isCorrect
    );

  if (
    correctOptions.length !== 1
  ) {
    throw new Error(
      "An MCQ must have exactly one correct option."
    );
  }

  /* -------------------------------------------------------
   * 4. Create trusted admin Supabase client
   * ------------------------------------------------------- */

  const supabase =
    createAdminSupabaseClient();

  /* -------------------------------------------------------
   * 5. Call atomic database function
   * ------------------------------------------------------- */

  const {
    data,
    error,
  } = await supabase.rpc(
    "create_admin_mcq",
    {
      p_question_text:
        questionText,

      p_source_type:
        input.sourceType,

      p_source_reference:
        input.sourceReference?.trim() ||
        null,

      p_difficulty:
        input.difficulty ||
        null,

      p_marks:
        input.marks,

      p_estimated_time_minutes:
        input.estimatedTimeMinutes ??
        null,

      p_curriculum_node_id:
        input.curriculumNodeId,

      p_options:
        input.options.map(
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
    }
  );

  if (error) {
    throw new Error(
      `Failed to create MCQ: ${error.message}`
    );
  }

  if (
    !data ||
    data.length === 0
  ) {
    throw new Error(
      "MCQ was not created."
    );
  }

  const createdMcq =
    data[0];

  /* -------------------------------------------------------
   * 6. Validate revision-aware RPC response
   * ------------------------------------------------------- */

  if (
    !createdMcq.question_id ||
    !createdMcq.revision_id
  ) {
    throw new Error(
      "MCQ was created but the question or revision identity was not returned."
    );
  }

  if (
    createdMcq.revision_number ===
      null ||
    createdMcq.revision_number ===
      undefined
  ) {
    throw new Error(
      "MCQ was created but its revision number was not returned."
    );
  }

  if (
    createdMcq.admin_question_number ===
      null ||
    createdMcq.admin_question_number ===
      undefined
  ) {
    throw new Error(
      "MCQ was created but its admin question number was not returned."
    );
  }

  if (
    !createdMcq.revision_status
  ) {
    throw new Error(
      "MCQ was created but its revision status was not returned."
    );
  }

  /* -------------------------------------------------------
   * 7. Refresh MCQ admin pages
   * ------------------------------------------------------- */

  revalidatePath(
    "/admin/mcq-bank"
  );

  revalidatePath(
    "/admin/mcq-bank/new"
  );

  /* -------------------------------------------------------
   * 8. Return revision-aware result
   * ------------------------------------------------------- */

  return {
    success: true,

    message:
      `MCQ ${createdMcq.admin_question_number} created successfully as Draft Revision ${createdMcq.revision_number}.`,

    mcq: {
      questionId:
        createdMcq.question_id,

      revisionId:
        createdMcq.revision_id,

      revisionNumber:
        createdMcq.revision_number,

      questionStatus:
        createdMcq.status,

      revisionStatus:
        createdMcq.revision_status,

      adminQuestionNumber:
        createdMcq.admin_question_number,
    },
  };
}

/* =========================================================
 * Publish MCQ Revision
 * =========================================================
 *
 * Publication is controlled entirely by the database RPC:
 *
 *   publish_admin_question_revision
 *
 * The application does NOT directly update:
 *
 *   questions.status
 *   questions.current_revision_id
 *   question_revisions.status
 *
 * The database performs the complete atomic publication
 * transaction.
 * ========================================================= */

export async function publishAdminMcq(
  formData: FormData
): Promise<void> {
  /* -------------------------------------------------------
   * 1. Admin authentication
   * ------------------------------------------------------- */

  await requireAdmin();

  /* -------------------------------------------------------
   * 2. Read question ID
   * ------------------------------------------------------- */

  const questionId =
    String(
      formData.get("question_id") ?? ""
    ).trim();

  if (!questionId) {
    throw new Error(
      "Question ID is required."
    );
  }

  /* -------------------------------------------------------
   * 3. Read revision ID
   * ------------------------------------------------------- */

  const revisionId =
    String(
      formData.get("revision_id") ?? ""
    ).trim();

  if (!revisionId) {
    throw new Error(
      "Revision ID is required."
    );
  }

  /* -------------------------------------------------------
   * 4. Trusted admin Supabase client
   * ------------------------------------------------------- */

  const supabase =
    createAdminSupabaseClient();

  /* -------------------------------------------------------
   * 5. Publish exact revision through database RPC
   *
   * The database validates:
   *
   *   - question/revision ownership
   *   - revision is DRAFT
   *   - question exists
   *   - revision has exactly 4 options
   *   - exactly one option is correct
   *   - question is MCQ
   *
   * Then atomically:
   *
   *   - archives previous published revision
   *   - publishes this revision
   *   - updates questions.current_revision_id
   *   - updates published question projection
   *   - sets question status to PUBLISHED
   * ------------------------------------------------------- */

  const {
    data,
    error,
  } = await supabase.rpc(
    "publish_admin_question_revision",
    {
      p_question_id:
        questionId,

      p_revision_id:
        revisionId,
    }
  );

  /* -------------------------------------------------------
   * 6. Database error
   * ------------------------------------------------------- */

  if (error) {
    throw new Error(
      `Failed to publish MCQ revision: ${error.message}`
    );
  }

  /* -------------------------------------------------------
   * 7. Validate RPC response
   * ------------------------------------------------------- */

  if (
    !data ||
    data.length === 0
  ) {
    throw new Error(
      "MCQ revision was not published."
    );
  }

  const publishedRevision =
    data[0];

  if (
    !publishedRevision.question_id ||
    !publishedRevision.revision_id
  ) {
    throw new Error(
      "MCQ revision was published but the final publication state was not returned."
    );
  }

  if (
    publishedRevision.revision_number ===
      null ||
    publishedRevision.revision_number ===
      undefined
  ) {
    throw new Error(
      "MCQ revision was published but its revision number was not returned."
    );
  }

  if (
    !publishedRevision.question_status ||
    !publishedRevision.revision_status
  ) {
    throw new Error(
      "MCQ revision was published but its final status was not returned."
    );
  }

  /* -------------------------------------------------------
   * 8. Refresh admin pages
   * ------------------------------------------------------- */

  revalidatePath(
    "/admin/mcq-bank"
  );

  revalidatePath(
    `/admin/mcq-bank/${questionId}`
  );

  revalidatePath(
    "/admin/mcq-bank/sets"
  );

  return;
}

/* =========================================================
 * Archive MCQ
 * =========================================================
 *
 * NOTE:
 *
 * This action is intentionally kept unchanged for now.
 * The revision-aware archive workflow will be migrated
 * separately after the revision publication flow is verified.
 * ========================================================= */

export async function archiveAdminMcq(
  formData: FormData
) {
  /* -------------------------------------------------------
   * 1. Admin authentication
   * ------------------------------------------------------- */

  await requireAdmin();

  /* -------------------------------------------------------
   * 2. Read question ID
   * ------------------------------------------------------- */

  const questionId =
    String(
      formData.get("question_id") ?? ""
    ).trim();

  if (!questionId) {
    throw new Error(
      "Question ID is required."
    );
  }

  /* -------------------------------------------------------
   * 3. Trusted admin Supabase client
   * ------------------------------------------------------- */

  const supabase =
    createAdminSupabaseClient();

  /* -------------------------------------------------------
   * 4. Archive only PUBLISHED MCQs
   * ------------------------------------------------------- */

  const {
    data: updatedQuestion,
    error,
  } = await supabase
    .from("questions")
    .update({
      status: "ARCHIVED",
      updated_at:
        new Date().toISOString(),
    })
    .eq(
      "id",
      questionId
    )
    .eq(
      "question_type",
      "MCQ"
    )
    .eq(
      "status",
      "PUBLISHED"
    )
    .select(
      `
        id,
        question_text,
        question_type,
        status,
        updated_at
      `
    )
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to archive MCQ: ${error.message}`
    );
  }

  if (!updatedQuestion) {
    throw new Error(
      "Only a PUBLISHED MCQ can be archived."
    );
  }

  /* -------------------------------------------------------
   * 5. Refresh admin pages
   * ------------------------------------------------------- */

  revalidatePath(
    "/admin/mcq-bank"
  );

  revalidatePath(
    `/admin/mcq-bank/${questionId}`
  );

  /* -------------------------------------------------------
   * 6. Return safe result
   * ------------------------------------------------------- */

  return {
    success: true,

    message:
      "MCQ archived successfully.",

    mcq: updatedQuestion,
  };
}