import { createLearningSupabaseClient } from "./supabase-learning";
import { requireLearningAuth } from "./learning-auth";

export async function getPublishedResourceContent(resourceId: string) {
  await requireLearningAuth();

  const supabase = await createLearningSupabaseClient();

  // 1. Resource ko verify karo:
  //    - NOTE hona chahiye
  //    - PUBLISHED hona chahiye
  const { data: resource, error: resourceError } = await supabase
    .from("resources")
    .select("id, resource_type, access_type, status")
    .eq("id", resourceId)
    .eq("resource_type", "NOTE")
    .eq("status", "PUBLISHED")
    .maybeSingle();

  if (resourceError) {
    throw new Error(
      `Failed to load learning resource: ${resourceError.message}`
    );
  }

  if (!resource) {
    return null;
  }

  // 2. FREE resource sab authenticated students ke liye accessible hai.
  //    PREMIUM resource ke liye explicit product entitlement check karo.
  if (resource.access_type === "PREMIUM") {
    const { data: hasAccess, error: accessError } = await supabase.rpc(
      "user_has_learning_product_access",
      {
        p_resource_id: resource.id,
      }
    );

    if (accessError) {
      throw new Error(
        `Failed to verify resource access: ${accessError.message}`
      );
    }

    if (!hasAccess) {
      return null;
    }
  }

  // 3. Access verify hone ke baad hi published content load karo.
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