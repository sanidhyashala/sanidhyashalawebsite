"use server";

import { createLearningSupabaseClient } from "@/lib/learning/supabase-learning";
import { requireLearningAuth } from "@/lib/learning/learning-auth";

export type EnsureSubjectiveSubmissionResult =
  | {
      success: true;
      submissionId: string;
      attemptQuestionId: string;
      status: string;
    }
  | {
      success: false;
      error: string;
    };

/* =========================================================
 * Ensure Subjective Submission
 *
 * Important:
 * - user_id is NEVER accepted from the client.
 * - Clerk authentication identifies the current user.
 * - The database verifies ownership of the attempt question.
 * - The database creates or reuses the DRAFT submission.
 * - A submission can only exist while the attempt is
 *   IN_PROGRESS.
 * ========================================================= */

export async function ensureSubjectiveSubmission(
  attemptQuestionId: string
): Promise<EnsureSubjectiveSubmissionResult> {
  try {
    await requireLearningAuth();

    const normalizedAttemptQuestionId =
      attemptQuestionId?.trim();

    if (!normalizedAttemptQuestionId) {
      return {
        success: false,
        error:
          "Attempt question ID is required.",
      };
    }

    const supabase =
      await createLearningSupabaseClient();

    const {
      data,
      error,
    } = await supabase.rpc(
      "ensure_subjective_submission",
      {
        p_attempt_question_id:
          normalizedAttemptQuestionId,
      }
    );

    if (error) {
      console.error(
        "Failed to ensure Subjective submission:",
        error
      );

      return {
        success: false,
        error:
          error.message ||
          "Unable to prepare your solution space.",
      };
    }

    const submission =
      Array.isArray(data)
        ? data[0]
        : data;

    if (!submission?.submission_id) {
      return {
        success: false,
        error:
          "The solution space could not be prepared.",
      };
    }

    return {
      success: true,

      submissionId:
        submission.submission_id,

      attemptQuestionId:
        submission.attempt_question_id,

      status:
        submission.status,
    };
  } catch (error) {
    console.error(
      "Unexpected Subjective submission error:",
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.",
    };
  }
}