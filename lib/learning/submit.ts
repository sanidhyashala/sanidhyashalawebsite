import { createLearningSupabaseClient } from "./supabase-learning";
import { requireLearningAuth } from "./learning-auth";

export async function submitLearningTestAttempt(
  attemptId: string
) {
  await requireLearningAuth();

  const supabase = await createLearningSupabaseClient();

  const { data, error } = await supabase.rpc(
    "submit_test_attempt",
    {
      p_attempt_id: attemptId,
    }
  );

  if (error) {
    throw new Error(
      `Failed to submit test attempt: ${error.message}`
    );
  }

  return data;
}