import { createLearningSupabaseClient } from "./supabase-learning";
import { requireLearningAuth } from "./learning-auth";

export async function getLearningResources() {
  await requireLearningAuth();

  const supabase = await createLearningSupabaseClient();

  const { data, error } = await supabase
    .from("resources")
    .select(
      `
        id,
        title,
        slug,
        description,
        resource_type,
        access_type,
        status,
        thumbnail_url,
        display_order
      `
    )
    .eq("status", "PUBLISHED")
    .order("display_order", { ascending: true })
    .order("title", { ascending: true });

  if (error) {
    throw new Error(
      `Failed to load learning resources: ${error.message}`
    );
  }

  return data;
}