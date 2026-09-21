"use server";

import { createLearningSupabaseClient } from "@/lib/learning/supabase-learning";
import { requireLearningAuth } from "@/lib/learning/learning-auth";

export type SaveSubjectiveDraftResult =
  | {
      success: true;
      submissionId: string;
      attemptQuestionId: string;
      status: string;
      updatedAt: string;
    }
  | {
      success: false;
      error: string;
    };

/* =========================================================
 * Save Subjective Draft
 *
 * Important:
 * - user_id is NEVER accepted from the client.
 * - The database resolves the authenticated user.
 * - The RPC verifies ownership of the attempt question.
 * - Answers can only be saved while the attempt is
 *   IN_PROGRESS.
 * ========================================================= */

export async function saveSubjectiveDraft(
  attemptQuestionId: string,
  answerText: string
): Promise<SaveSubjectiveDraftResult> {
  try {
    await requireLearningAuth();

    const normalizedAttemptQuestionId =
      attemptQuestionId?.trim();

    if (!normalizedAttemptQuestionId) {
      return {
        success: false,
        error: "Attempt question ID is required.",
      };
    }

    const supabase =
      await createLearningSupabaseClient();

    const {
      data,
      error,
    } = await supabase.rpc(
      "save_subjective_draft",
      {
        p_attempt_question_id:
          normalizedAttemptQuestionId,

        p_answer_text:
          answerText ?? "",
      }
    );

    if (error) {
      console.error(
        "Failed to save Subjective draft:",
        error
      );

      return {
        success: false,
        error:
          error.message ||
          "Unable to save your answer.",
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
          "The answer could not be saved.",
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

      updatedAt:
        submission.updated_at,
    };
  } catch (error) {
    console.error(
      "Unexpected Subjective draft error:",
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