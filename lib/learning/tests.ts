import { createLearningSupabaseClient } from "./supabase-learning";
import { requireLearningAuth } from "./learning-auth";

export async function getLearningTests(resourceId: string) {
  await requireLearningAuth();

  const supabase = await createLearningSupabaseClient();

  const { data, error } = await supabase
    .from("tests")
    .select(
      `
        id,
        resource_id,
        title,
        test_type,
        duration_minutes,
        max_attempts,
        passing_percentage,
        shuffle_questions,
        shuffle_options,
        status
      `
    )
    .eq("resource_id", resourceId)
    .eq("status", "PUBLISHED")
    .order("title", { ascending: true });

  if (error) {
    throw new Error(
      `Failed to load learning tests: ${error.message}`
    );
  }

  return data;
}