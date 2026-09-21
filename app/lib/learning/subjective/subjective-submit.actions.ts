"use server";

import { createLearningSupabaseClient } from "@/lib/learning/supabase-learning";
import { requireLearningAuth } from "@/lib/learning/learning-auth";

export type SubmitSubjectiveAttemptResult =
  | {
      success: true;
      attemptId: string;
      status: string;
      submittedAt: string | null;
      questionCount: number;
      submittedCount: number;
    }
  | {
      success: false;
      error: string;
    };

export async function submitSubjectiveAttempt(
  attemptId: string
): Promise<SubmitSubjectiveAttemptResult> {
  try {
    await requireLearningAuth();

    const normalizedAttemptId =
      attemptId?.trim();

    if (!normalizedAttemptId) {
      return {
        success: false,
        error: "Subjective attempt ID is required.",
      };
    }

    const supabase =
      await createLearningSupabaseClient();

    const {
      data,
      error,
    } = await supabase.rpc(
      "submit_subjective_attempt",
      {
        p_attempt_id:
          normalizedAttemptId,
      }
    );

    if (error) {
      console.error(
        "Failed to submit Subjective attempt:",
        error
      );

      return {
        success: false,
        error:
          error.message ||
          "Unable to submit your Subjective practice.",
      };
    }

    const result =
      Array.isArray(data)
        ? data[0]
        : data;

    if (!result?.attempt_id) {
      return {
        success: false,
        error:
          "The Subjective attempt could not be submitted.",
      };
    }

    return {
      success: true,
      attemptId:
        result.attempt_id,
      status:
        result.status,
      submittedAt:
        result.submitted_at ??
        null,
      questionCount:
        Number(
          result.question_count ?? 0
        ),
      submittedCount:
        Number(
          result.submitted_count ?? 0
        ),
    };
  } catch (error) {
    console.error(
      "Unexpected Subjective submit error:",
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while submitting your Subjective practice.",
    };
  }
}