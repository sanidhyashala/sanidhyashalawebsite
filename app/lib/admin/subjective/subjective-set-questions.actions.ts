"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAdminSupabaseClient } from "@/app/lib/admin/supabase-admin";

export async function addSubjectiveQuestionsToSet(
  formData: FormData
) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error(
      "Authentication required."
    );
  }

  const supabase =
    createAdminSupabaseClient();

  /* -------------------------------------------------------
   * 1. Verify active ADMIN
   * ------------------------------------------------------- */

  const {
    data: access,
    error: accessError,
  } = await supabase
    .from("teacher_access")
    .select(`
      user_id,
      role,
      is_active
    `)
    .eq("user_id", userId)
    .eq("role", "ADMIN")
    .eq("is_active", true)
    .maybeSingle();

  if (accessError) {
    throw new Error(
      `Failed to verify admin access: ${accessError.message}`
    );
  }

  if (!access) {
    throw new Error(
      "You are not authorized to manage Subjective Sets."
    );
  }

  /* -------------------------------------------------------
   * 2. Read Set ID
   * ------------------------------------------------------- */

  const setId = String(
    formData.get("set_id") ?? ""
  ).trim();

  if (!setId) {
    throw new Error(
      "Subjective Set ID is required."
    );
  }

  /* -------------------------------------------------------
   * 3. Read selected question IDs
   * ------------------------------------------------------- */

  const questionIds = formData
    .getAll("question_ids")
    .map((value) =>
      String(value).trim()
    )
    .filter(Boolean);

  if (questionIds.length === 0) {
    throw new Error(
      "Please select at least one question."
    );
  }

  /* -------------------------------------------------------
   * 4. Remove duplicate IDs
   * ------------------------------------------------------- */

  const uniqueQuestionIds = [
    ...new Set(questionIds),
  ];

  /* -------------------------------------------------------
   * 5. Load Set + Resource
   * ------------------------------------------------------- */

  const {
    data: set,
    error: setError,
  } = await supabase
    .from("subjective_sets")
    .select(`
      id,
      resource_id,
      status
    `)
    .eq("id", setId)
    .maybeSingle();

  if (setError) {
    throw new Error(
      `Failed to verify Subjective Set: ${setError.message}`
    );
  }

  if (!set) {
    throw new Error(
      "Subjective Set not found."
    );
  }

  if (set.status !== "DRAFT") {
    throw new Error(
      "Questions can only be added to a DRAFT Subjective Set."
    );
  }

  /* -------------------------------------------------------
   * 6. Resolve Set resource → chapter
   * ------------------------------------------------------- */

  const {
    data: resourceMappings,
    error: resourceMappingsError,
  } = await supabase
    .from("resource_curriculum_nodes")
    .select(`
      curriculum_node_id
    `)
    .eq("resource_id", set.resource_id);

  if (resourceMappingsError) {
    throw new Error(
      `Failed to verify Subjective chapter: ${resourceMappingsError.message}`
    );
  }

  const chapterId =
    resourceMappings?.[0]?.curriculum_node_id;

  if (!chapterId) {
    throw new Error(
      "Subjective resource is not assigned to a chapter."
    );
  }

  /* -------------------------------------------------------
   * 7. Verify every selected question
   *
   * Application-level protection:
   * - correct chapter
   * - SUBJECTIVE
   * - PUBLISHED
   * - current revision exists
   * ------------------------------------------------------- */

  const {
    data: questions,
    error: questionsError,
  } = await supabase
    .from("questions")
    .select(`
      id,
      question_type,
      status,
      current_revision_id
    `)
    .in("id", uniqueQuestionIds);

  if (questionsError) {
    throw new Error(
      `Failed to verify selected questions: ${questionsError.message}`
    );
  }

  if (
    !questions ||
    questions.length !==
      uniqueQuestionIds.length
  ) {
    throw new Error(
      "One or more selected questions could not be found."
    );
  }

  for (const question of questions) {
    if (
      question.question_type !==
      "SUBJECTIVE"
    ) {
      throw new Error(
        "Only Subjective questions can be added to a Subjective Set."
      );
    }

    if (
      question.status !==
      "PUBLISHED"
    ) {
      throw new Error(
        "Only published Subjective questions can be added."
      );
    }

    if (!question.current_revision_id) {
      throw new Error(
        "One or more selected questions has no current revision."
      );
    }
  }

  /* -------------------------------------------------------
   * 8. Verify chapter mapping
   * ------------------------------------------------------- */

  const {
    data: mappings,
    error: mappingsError,
  } = await supabase
    .from("question_curriculum_nodes")
    .select(`
      question_id
    `)
    .eq(
      "curriculum_node_id",
      chapterId
    )
    .in(
      "question_id",
      uniqueQuestionIds
    );

  if (mappingsError) {
    throw new Error(
      `Failed to verify question chapter mapping: ${mappingsError.message}`
    );
  }

  const validQuestionIds =
    new Set(
      (mappings ?? []).map(
        (row) => row.question_id
      )
    );

  const invalidQuestionIds =
    uniqueQuestionIds.filter(
      (questionId) =>
        !validQuestionIds.has(
          questionId
        )
    );

  if (
    invalidQuestionIds.length > 0
  ) {
    throw new Error(
      "One or more selected questions does not belong to this Subjective resource chapter."
    );
  }

  /* -------------------------------------------------------
   * 9. Final authority → DB RPC
   * ------------------------------------------------------- */

  const {
    data: addedCount,
    error: rpcError,
  } = await supabase.rpc(
    "add_subjective_questions_to_set",
    {
      p_set_id: setId,
      p_question_ids:
        uniqueQuestionIds,
    }
  );

  if (rpcError) {
    throw new Error(
      `Failed to add Subjective questions: ${rpcError.message}`
    );
  }

  /* -------------------------------------------------------
   * 10. Revalidate
   * ------------------------------------------------------- */

  revalidatePath(
    `/admin/learning/subjective/${set.resource_id}`
  );

  revalidatePath(
    `/admin/learning/subjective/${set.resource_id}/sets/${setId}`
  );

  revalidatePath(
    `/admin/learning/subjective/${set.resource_id}/sets/${setId}/questions`
  );

  /*
   * RPC returns the number of newly added questions.
   * Redirecting is preferable here because the user
   * should immediately see the updated Set Detail.
   */

  void addedCount;

  redirect(
    `/admin/learning/subjective/${set.resource_id}/sets/${setId}`
  );
}