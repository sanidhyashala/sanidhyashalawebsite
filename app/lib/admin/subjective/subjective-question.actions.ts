"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createAdminSupabaseClient } from "@/app/lib/admin/supabase-admin";

type CreateSubjectiveQuestionInput = {
  questionText: string;
  sourceType: "ORIGINAL" | "PYQ" | "PRACTICE";
  sourceReference?: string | null;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  marks: number;
  estimatedTimeMinutes: number;
  solutionText?: string | null;
  mistakeInsight?: string | null;
  curriculumNodeId: string;
};

type CreateSubjectiveQuestionResult = {
  question_id: string;
  revision_id: string;
  revision_number: number;
  revision_status: string;
  admin_question_number: number;
};

export async function createAdminSubjectiveQuestion(
  input: CreateSubjectiveQuestionInput
): Promise<CreateSubjectiveQuestionResult> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const supabase = createAdminSupabaseClient();

  // -------------------------------------------------------
  // Subjective Engine authorization
  // Active ADMIN only
  // -------------------------------------------------------

  const { data: teacherAccess, error: accessError } = await supabase
    .from("teacher_access")
    .select("role, is_active")
    .eq("user_id", userId)
    .eq("role", "ADMIN")
    .eq("is_active", true)
    .maybeSingle();

  if (accessError) {
    throw new Error(
      `Authorization check failed: ${accessError.message}`
    );
  }

  if (!teacherAccess) {
    throw new Error(
      "Only an active ADMIN can create Subjective questions."
    );
  }

  // -------------------------------------------------------
  // Input validation
  // -------------------------------------------------------

  const questionText = input.questionText.trim();

  if (!questionText) {
    throw new Error("Question text is required.");
  }

  if (!input.curriculumNodeId) {
    throw new Error("Curriculum chapter is required.");
  }

  if (
    !Number.isFinite(input.marks) ||
    input.marks <= 0
  ) {
    throw new Error("Marks must be greater than 0.");
  }

  if (
    !Number.isInteger(input.estimatedTimeMinutes) ||
    input.estimatedTimeMinutes < 0
  ) {
    throw new Error(
      "Estimated time must be a non-negative integer."
    );
  }

  // -------------------------------------------------------
  // Create Subjective question through trusted RPC
  // -------------------------------------------------------

  const { data, error } = await supabase.rpc(
    "create_admin_subjective_question",
    {
      p_question_text: questionText,
      p_source_type: input.sourceType,
      p_source_reference:
        input.sourceReference?.trim() || null,
      p_difficulty: input.difficulty,
      p_marks: input.marks,
      p_estimated_time_minutes:
        input.estimatedTimeMinutes,
      p_solution_text:
        input.solutionText?.trim() || null,
      p_mistake_insight:
        input.mistakeInsight?.trim() || null,
      p_curriculum_node_id:
        input.curriculumNodeId,
      p_created_by: userId,
    }
  );

  if (error) {
    throw new Error(
      `Failed to create Subjective question: ${error.message}`
    );
  }

  // -------------------------------------------------------
  // Validate RPC response
  // -------------------------------------------------------

  const result = Array.isArray(data)
    ? data[0]
    : data;

  if (!result) {
    throw new Error(
      "Subjective question was not created."
    );
  }

  if (
    typeof result.question_id !== "string" ||
    typeof result.revision_id !== "string" ||
    typeof result.revision_number !== "number" ||
    typeof result.admin_question_number !== "number"
  ) {
    throw new Error(
      "Invalid response received while creating Subjective question."
    );
  }

  if (result.revision_status !== "DRAFT") {
    throw new Error(
      "Unexpected revision status returned by Subjective question creation."
    );
  }

  // -------------------------------------------------------
  // Revalidate Subjective admin pages
  // -------------------------------------------------------

  revalidatePath("/admin/learning/subjective");

  return {
    question_id: result.question_id,
    revision_id: result.revision_id,
    revision_number: result.revision_number,
    revision_status: result.revision_status,
    admin_question_number:
      result.admin_question_number,
  };
}