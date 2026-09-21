"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import { createAdminSupabaseClient } from "@/app/lib/admin/supabase-admin";

type PublishSubjectiveQuestionResult =
  | {
      success: true;
      questionId: string;
      revisionId: string;
      revisionNumber: number;
      questionStatus: string;
      revisionStatus: string;
    }
  | {
      success: false;
      error: string;
    };

/* =========================================================
 * Publish Subjective Question Revision
 * =========================================================
 *
 * IMPORTANT:
 *
 * The application does NOT directly update:
 *
 *   questions.status
 *   questions.current_revision_id
 *   question_revisions.status
 *
 * Publication is performed atomically by:
 *
 *   publish_admin_subjective_question
 *
 * The database is the final authority for the lifecycle.
 * ========================================================= */

export async function publishSubjectiveQuestionRevision(
  input: {
    questionId: string;
    revisionId: string;
  }
): Promise<PublishSubjectiveQuestionResult> {
  try {
    /* =====================================================
     * 1. Authentication
     * ===================================================== */

    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: "You must be signed in to publish a revision.",
      };
    }

    /* =====================================================
     * 2. Validate input
     * ===================================================== */

    const questionId = input.questionId?.trim();
    const revisionId = input.revisionId?.trim();

    if (!questionId) {
      return {
        success: false,
        error: "Question ID is required.",
      };
    }

    if (!revisionId) {
      return {
        success: false,
        error: "Revision ID is required.",
      };
    }

    /* =====================================================
     * 3. Trusted server-side Supabase client
     * ===================================================== */

    const supabase = createAdminSupabaseClient();

    /* =====================================================
     * 4. ADMIN authorization
     *
     * Current locked Subjective architecture:
     * only active ADMIN can publish Subjective revisions.
     * ===================================================== */

    const { data: access, error: accessError } = await supabase
      .from("teacher_access")
      .select("user_id, role, is_active")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();

    if (accessError) {
      console.error(
        "Subjective revision publish authorization lookup failed:",
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
        error: "You do not have permission to publish Subjective revisions.",
      };
    }

    /* =====================================================
     * 5. Publish through exact database RPC
     *
     * The RPC is responsible for:
     *
     * - verifying question/revision ownership
     * - verifying the revision is DRAFT
     * - verifying the question is SUBJECTIVE
     * - archiving the previous published revision
     * - publishing the selected revision
     * - updating questions.current_revision_id
     * - updating the question projection
     * - changing question status to PUBLISHED
     * ===================================================== */

    const { data, error } = await supabase.rpc(
      "publish_admin_subjective_question",
      {
        p_question_id: questionId,
        p_revision_id: revisionId,
      }
    );

    if (error) {
      console.error(
        "publish_admin_subjective_question RPC failed:",
        error
      );

      return {
        success: false,
        error:
          error.message ||
          "Failed to publish the Subjective question revision.",
      };
    }

    /* =====================================================
     * 6. Validate RPC response
     * ===================================================== */

    const publishedRevision = Array.isArray(data)
      ? data[0]
      : data;

    if (!publishedRevision) {
      return {
        success: false,
        error: "Revision was not published.",
      };
    }

    if (
      !publishedRevision.question_id ||
      !publishedRevision.revision_id
    ) {
      console.error(
        "Unexpected Subjective publish RPC response:",
        data
      );

      return {
        success: false,
        error:
          "The revision may have been published, but the final response was invalid.",
      };
    }

    if (
      publishedRevision.revision_number === null ||
      publishedRevision.revision_number === undefined
    ) {
      return {
        success: false,
        error:
          "The revision was published but its revision number was not returned.",
      };
    }

    if (
      !publishedRevision.revision_status ||
      !publishedRevision.question_status
    ) {
      return {
        success: false,
        error:
          "The revision was published but its final status was not returned.",
      };
    }

    /* =====================================================
     * 7. Revalidate affected Subjective pages
     * ===================================================== */

    revalidatePath(`/admin/subjective/${questionId}`);
    revalidatePath(`/admin/subjective/${questionId}/edit`);
    revalidatePath("/admin/subjective/questions");

    /* =====================================================
     * 8. Return final publication state
     * ===================================================== */

    return {
      success: true,
      questionId: publishedRevision.question_id,
      revisionId: publishedRevision.revision_id,
      revisionNumber: publishedRevision.revision_number,
      questionStatus: publishedRevision.question_status,
      revisionStatus: publishedRevision.revision_status,
    };
  } catch (error) {
    console.error(
      "Unexpected error while publishing Subjective revision:",
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while publishing the revision.",
    };
  }
}