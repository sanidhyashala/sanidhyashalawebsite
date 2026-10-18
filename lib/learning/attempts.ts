
import { createLearningSupabaseClient } from "./supabase-learning";
import { requireLearningAuth } from "./learning-auth";

/* =========================================================
 * Start Learning Test Attempt
 * ========================================================= */

export async function startLearningTestAttempt(
  testId: string
) {
  await requireLearningAuth();

  const normalizedTestId = testId.trim();

  if (!normalizedTestId) {
    throw new Error("Test ID is required.");
  }

  const supabase =
    await createLearningSupabaseClient();

  const {
    data,
    error,
  } = await supabase.rpc(
    "start_test_attempt",
    {
      p_test_id: normalizedTestId,
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
 * ========================================================= */

export async function getLearningTestAttempt(
  attemptId: string
) {
  const { userId } = await requireLearningAuth();

  const normalizedAttemptId = attemptId.trim();

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
        user_id,
        attempt_number,
        status,
        started_at,
        submitted_at
      `
    )
    .eq("id", normalizedAttemptId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to load test attempt: ${error.message}`
    );
  }

  return data;
}
