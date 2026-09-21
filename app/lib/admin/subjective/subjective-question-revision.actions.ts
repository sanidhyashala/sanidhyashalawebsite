"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import { createAdminSupabaseClient } from "@/app/lib/admin/supabase-admin";

type CreateSubjectiveQuestionRevisionInput = {
  questionId: string;
  questionText: string;
  solutionText: string;
  mistakeInsight: string;
};

type CreateSubjectiveQuestionRevisionResult =
  | {
      success: true;
      revisionId: string;
      questionId: string;
      revisionNumber: number;
      status: string;
    }
  | {
      success: false;
      error: string;
    };

export async function createSubjectiveQuestionRevision(
  input: CreateSubjectiveQuestionRevisionInput
): Promise<CreateSubjectiveQuestionRevisionResult> {
  try {
    /* =====================================================
     * 1. Authentication
     * ===================================================== */

    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: "You must be signed in to create a revision.",
      };
    }

    /* =====================================================
     * 2. Basic validation
     * ===================================================== */

    const questionId = input.questionId?.trim();
    const questionText = input.questionText?.trim();
    const solutionText = input.solutionText?.trim() ?? "";
    const mistakeInsight = input.mistakeInsight?.trim() ?? "";

    if (!questionId) {
      return {
        success: false,
        error: "Question ID is required.",
      };
    }

    if (!questionText) {
      return {
        success: false,
        error: "Question text is required.",
      };
    }

    /* =====================================================
     * 3. Trusted admin Supabase client
     * ===================================================== */

    const supabase = createAdminSupabaseClient();

    /* =====================================================
     * 4. Authorization
     *
     * ADMIN has teacher capabilities.
     * Only active ADMIN can create Subjective revisions
     * in the current locked architecture.
     * ===================================================== */

    const { data: access, error: accessError } = await supabase
      .from("teacher_access")
      .select("user_id, role, is_active")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();

    if (accessError) {
      console.error(
        "Subjective revision authorization lookup failed:",
        accessError
      );

      return {
        success: false,
        error: "Unable to verify admin access.",
      };
    }

    if (!access || access.role !== "ADMIN") {
      return {
        success: false,
        error: "You do not have permission to create Subjective revisions.",
      };
    }

    /* =====================================================
     * 5. Exact Subjective revision RPC
     *
     * IMPORTANT:
     * This creates a NEW DRAFT revision.
     * It does NOT mutate the current published revision.
     * ===================================================== */

    const { data, error } = await supabase.rpc(
      "create_admin_subjective_question_revision",
      {
        p_question_id: questionId,
        p_question_text: questionText,
        p_solution_text: solutionText || null,
        p_mistake_insight: mistakeInsight || null,
        p_created_by: userId,
      }
    );

    if (error) {
      console.error(
        "create_admin_subjective_question_revision RPC failed:",
        error
      );

      return {
        success: false,
        error:
          error.message ||
          "Failed to create the new Subjective question revision.",
      };
    }

    /* =====================================================
     * 6. Validate RPC response
     * ===================================================== */

    const revision = Array.isArray(data) ? data[0] : data;

    if (!revision) {
      return {
        success: false,
        error: "Revision was not created.",
      };
    }

    if (
      !revision.revision_id ||
      !revision.question_id ||
      typeof revision.revision_number !== "number"
    ) {
      console.error(
        "Unexpected Subjective revision RPC response:",
        data
      );

      return {
        success: false,
        error: "The revision was created but the response was invalid.",
      };
    }

    /* =====================================================
     * 7. Revalidate affected admin pages
     * ===================================================== */

    revalidatePath(`/admin/subjective/${questionId}`);
    revalidatePath(`/admin/subjective/${questionId}/edit`);
    revalidatePath("/admin/subjective/questions");

    return {
      success: true,
      revisionId: revision.revision_id,
      questionId: revision.question_id,
      revisionNumber: revision.revision_number,
      status: revision.status,
    };
  } catch (error) {
    console.error(
      "Unexpected error while creating Subjective revision:",
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while creating the revision.",
    };
  }
}