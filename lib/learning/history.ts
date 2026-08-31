import { createLearningSupabaseClient } from "./supabase-learning";
import { requireLearningAuth } from "./learning-auth";

export async function getLearningTestAttempts() {
  await requireLearningAuth();

  const supabase = await createLearningSupabaseClient();

  const { data, error } = await supabase.rpc(
    "get_my_test_attempts"
  );

  if (error) {
    throw new Error(
      `Failed to load test attempt history: ${error.message}`
    );
  }

  return data;
}