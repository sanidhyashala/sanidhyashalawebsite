import { createLearningSupabaseClient } from "./supabase-learning";
import { requireLearningAuth } from "./learning-auth";

/* =========================================================
 * Start Learning Test Attempt
 * ========================================================= */

export async function startLearningTestAttempt(
  testId: string
) {
  await requireLearningAuth();

  const supabase =
    await createLearningSupabaseClient();

  const {
    data,
    error,
  } = await supabase.rpc(
    "start_test_attempt",
    {
      p_test_id: testId,
    }
  );

  if (error) {
    throw new Error(
      `Failed to start test attempt: ${error.message}`
    );
  }

  return data;
}


/* =========================================================
 * Get Current Learning Test Attempt
 * =========================================================
 *
 * Resolves:
 *
 *   attemptId
 *       ↓
 *   current authenticated user's attempt
 *       ↓
 *   testId
 *
 * The authenticated Supabase client is used deliberately.
 * Therefore the database/RLS layer remains responsible for
 * ensuring that a student can only access their own attempt.
 * ========================================================= */

export async function getLearningTestAttempt(
  attemptId: string
) {
  await requireLearningAuth();

  const normalizedAttemptId =
    attemptId.trim();

  if (!normalizedAttemptId) {
    return null;
  }

  const supabase =
    await createLearningSupabaseClient();

  const {
    data,
    error,
  } = await supabase
    .from("test_attempts")
    .select(
      `
        id,
        test_id,
        attempt_number,
        status,
        started_at,
        submitted_at
      `
    )
    .eq(
      "id",
      normalizedAttemptId
    )
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to load test attempt: ${error.message}`
    );
  }

  return data;
}