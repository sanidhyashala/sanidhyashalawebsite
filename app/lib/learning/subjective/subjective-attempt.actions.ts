"use server";

import { redirect } from "next/navigation";

import { createLearningSupabaseClient } from "@/lib/learning/supabase-learning";
import { requireLearningAuth } from "@/lib/learning/learning-auth";

type SubjectiveAttemptRow = {
  id: string;
  set_id: string;
  attempt_number: number;
  attempt_type: "INITIAL" | "PREMIUM_RETRY";
  status:
    | "IN_PROGRESS"
    | "SUBMITTED"
    | "LOCKED"
    | "EVALUATED"
    | "ABANDONED";
};

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

export async function startSubjectiveAttempt(
  setId: string
) {
  const { userId } =
    await requireLearningAuth();

  const normalizedSetId =
    setId?.trim();

  if (!normalizedSetId) {
    throw new Error(
      "Subjective set ID is required."
    );
  }

  const supabase =
    await createLearningSupabaseClient();

  // ---------------------------------------------------------
  // Load the Subjective Set
  // ---------------------------------------------------------

  const {
    data: subjectiveSet,
    error: subjectiveSetError,
  } = await supabase
    .from("subjective_sets")
    .select(
      `
        id,
        access_type,
        status
      `
    )
    .eq(
      "id",
      normalizedSetId
    )
    .eq(
      "status",
      "PUBLISHED"
    )
    .maybeSingle();

  if (subjectiveSetError) {
    console.error(
      "Failed to load Subjective set:",
      subjectiveSetError
    );

    throw new Error(
      subjectiveSetError.message ||
        "Unable to load the Subjective set."
    );
  }

  if (!subjectiveSet) {
    throw new Error(
      "Subjective set is not available."
    );
  }

  // ---------------------------------------------------------
  // Load ALL existing attempts for this user + set
  // ---------------------------------------------------------

  const {
    data: existingAttempts,
    error: existingAttemptsError,
  } = await supabase
    .from("subjective_attempts")
    .select(
      `
        id,
        set_id,
        attempt_number,
        attempt_type,
        status
      `
    )
    .eq(
      "set_id",
      normalizedSetId
    )
    .eq(
      "user_id",
      userId
    )
    .order(
      "attempt_number",
      {
        ascending: false,
      }
    );

  if (existingAttemptsError) {
    console.error(
      "Failed to check existing Subjective attempts:",
      existingAttemptsError
    );

    throw new Error(
      existingAttemptsError.message ||
        "Unable to check your existing Subjective attempts."
    );
  }

  const attempts =
    (existingAttempts ??
      []) as SubjectiveAttemptRow[];

  const latestAttempt =
    attempts[0] ?? null;

  // ---------------------------------------------------------
  // Case 1:
  // An attempt is already IN_PROGRESS.
  //
  // Never create another attempt.
  // Simply continue the existing attempt.
  // ---------------------------------------------------------

  if (
    latestAttempt?.status ===
    "IN_PROGRESS"
  ) {
    redirect(
      `/learning/subjective/attempt/${encodeURIComponent(
        latestAttempt.id
      )}`
    );
  }

  // ---------------------------------------------------------
  // Determine how many attempts already exist.
  // ---------------------------------------------------------

  const attemptCount =
    attempts.length;

  // ---------------------------------------------------------
  // Case 2:
  // FREE set
  //
  // Free students get only Attempt 1.
  // If Attempt 1 already exists and is no longer
  // in progress, do not create another attempt.
  //
  // Redirect to the existing attempt so it can be
  // reviewed.
  // ---------------------------------------------------------

  if (
    subjectiveSet.access_type ===
      "FREE" &&
    attemptCount >= 1
  ) {
    redirect(
      `/learning/subjective/attempt/${encodeURIComponent(
        latestAttempt!.id
      )}`
    );
  }

  // ---------------------------------------------------------
  // Case 3:
  // PREMIUM set
  //
  // Premium students can have:
  //
  // Attempt 1 -> INITIAL
  // Attempt 2 -> PREMIUM_RETRY
  //
  // If both already exist, open the latest attempt
  // for review instead of trying to create Attempt 3.
  // ---------------------------------------------------------

  if (
    subjectiveSet.access_type ===
      "PREMIUM" &&
    attemptCount >= 2
  ) {
    redirect(
      `/learning/subjective/attempt/${encodeURIComponent(
        latestAttempt!.id
      )}`
    );
  }

  // ---------------------------------------------------------
  // Determine the next attempt type.
  //
  // No previous attempt -> INITIAL
  // One previous attempt on PREMIUM -> PREMIUM_RETRY
  // ---------------------------------------------------------

  const nextAttemptNumber =
    attemptCount + 1;

  const nextAttemptType =
    nextAttemptNumber === 1
      ? "INITIAL"
      : "PREMIUM_RETRY";

  // ---------------------------------------------------------
  // Ask the database to create the attempt.
  //
  // The RPC remains the final authority for:
  // - access
  // - entitlement
  // - attempt limits
  // - attempt numbering
  // - question freezing
  // ---------------------------------------------------------

  const {
    data,
    error,
  } = await supabase.rpc(
    "start_subjective_attempt",
    {
      p_set_id:
        normalizedSetId,
      p_attempt_type:
        nextAttemptType,
    }
  );

  if (error) {
    console.error(
      "Failed to start Subjective attempt:",
      error
    );

    throw new Error(
      error.message ||
        "Unable to start the Subjective practice."
    );
  }

  const attempt =
    Array.isArray(data)
      ? data[0]
      : data;

  if (
    !attempt?.attempt_id
  ) {
    throw new Error(
      "Subjective attempt was not created."
    );
  }

  redirect(
    `/learning/subjective/attempt/${encodeURIComponent(
      attempt.attempt_id
    )}`
  );
}


/**
 * Final submission of the complete Subjective attempt.
 *
 * This submits the WHOLE SET at once.
 *
 * Incomplete attempts are allowed.
 * The frontend is responsible for showing the
 * incomplete-submission confirmation before
 * calling this action.
 */
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
        error:
          "Subjective attempt ID is required.",
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
          "Unable to submit the Subjective set.",
      };
    }

    const result =
      Array.isArray(data)
        ? data[0]
        : data;

    if (
      !result?.attempt_id
    ) {
      return {
        success: false,
        error:
          "The Subjective set could not be submitted.",
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
          result.question_count ??
            0
        ),
      submittedCount:
        Number(
          result.submitted_count ??
            0
        ),
    };
  } catch (error) {
    console.error(
      "Unexpected Subjective final submission error:",
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