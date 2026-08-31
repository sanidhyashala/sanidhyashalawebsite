import { createLearningSupabaseClient } from "./supabase-learning";
import { requireLearningAuth } from "./learning-auth";

export async function getPublishedResourceContent(resourceId: string) {
  await requireLearningAuth();

  const supabase = await createLearningSupabaseClient();

  const { data, error } = await supabase
    .from("resource_content_versions")
    .select(
      `
        id,
        resource_id,
        version_number,
        content_json,
        content_format,
        status,
        published_at
      `
    )
    .eq("resource_id", resourceId)
    .eq("status", "PUBLISHED")
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to load published resource content: ${error.message}`
    );
  }

  return data;
}