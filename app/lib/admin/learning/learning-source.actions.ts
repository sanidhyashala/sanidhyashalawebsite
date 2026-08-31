"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/app/lib/auth/admin";
import { createAdminSupabaseClient } from "@/app/lib/admin/supabase-admin";

const CONTENT_SOURCES = [
  "EDITOR",
  "PDF",
] as const;

type ContentSource =
  (typeof CONTENT_SOURCES)[number];

export async function updateLearningResourceContentSource(
  formData: FormData
) {
  await requireAdmin();

  const supabase =
    createAdminSupabaseClient();

  const resourceId = String(
    formData.get("resource_id") ?? ""
  ).trim();

  const contentSource = String(
    formData.get("content_source") ?? ""
  ).trim() as ContentSource;

  if (!resourceId) {
    throw new Error(
      "Resource ID is required."
    );
  }

  if (
    !CONTENT_SOURCES.includes(
      contentSource
    )
  ) {
    throw new Error(
      "Invalid content source."
    );
  }

  /*
   * Verify the resource exists.
   */

  const {
    data: resource,
    error: resourceError,
  } = await supabase
    .from("resources")
    .select(
      `
        id,
        content_source
      `
    )
    .eq("id", resourceId)
    .maybeSingle();

  if (resourceError) {
    throw new Error(
      `Failed to load learning resource: ${resourceError.message}`
    );
  }

  if (!resource) {
    throw new Error(
      "Learning resource was not found."
    );
  }

  /*
   * No unnecessary database write.
   */

  if (
    resource.content_source ===
    contentSource
  ) {
    return;
  }

  /*
   * Update the selected student-facing source.
   */

  const {
    error: updateError,
  } = await supabase
    .from("resources")
    .update({
      content_source:
        contentSource,
      updated_at:
        new Date().toISOString(),
    })
    .eq("id", resourceId);

  if (updateError) {
    throw new Error(
      `Failed to update content source: ${updateError.message}`
    );
  }

  /*
   * Refresh the resource editor and
   * admin resource listing.
   */

  revalidatePath(
    `/admin/learning/${resourceId}`
  );

  revalidatePath(
    "/admin/learning"
  );
}