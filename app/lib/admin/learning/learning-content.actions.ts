"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/app/lib/auth/admin";
import { createAdminSupabaseClient } from "@/app/lib/admin/supabase-admin";

type ResourceContentNode = {
  type: string;
  [key: string]: unknown;
};

type ResourceContentDocument = {
  type: "doc";
  content: ResourceContentNode[];
};

function parseContent(
  value: FormDataEntryValue | null
): ResourceContentDocument {
  if (typeof value !== "string") {
    throw new Error("Content is required.");
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error("Invalid content JSON.");
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    Array.isArray(parsed)
  ) {
    throw new Error(
      "Invalid content document."
    );
  }

  const document =
    parsed as Record<string, unknown>;

  if (document.type !== "doc") {
    throw new Error(
      "Invalid content document type."
    );
  }

  if (!Array.isArray(document.content)) {
    throw new Error(
      "Invalid content document structure."
    );
  }

  return {
    type: "doc",
    content:
      document.content as ResourceContentNode[],
  };
}

export async function saveLearningResourceDraft(
  formData: FormData
) {
  const adminUserId =
    await requireAdmin();

  const supabase =
    createAdminSupabaseClient();

  const resourceId = String(
    formData.get("resource_id") ?? ""
  ).trim();

  if (!resourceId) {
    throw new Error(
      "Resource ID is required."
    );
  }

  const content =
    parseContent(
      formData.get("content_json")
    );

  /*
   * Verify that the resource exists.
   */

  const {
    data: resource,
    error: resourceError,
  } = await supabase
    .from("resources")
    .select("id")
    .eq("id", resourceId)
    .maybeSingle();

  if (resourceError) {
    throw new Error(
      `Failed to validate resource: ${resourceError.message}`
    );
  }

  if (!resource) {
    throw new Error(
      "Learning resource was not found."
    );
  }

  /*
   * Find the latest existing draft.
   *
   * We update the existing draft rather than
   * creating a new version every time Save Draft
   * is clicked.
   */

  const {
    data: existingDraft,
    error: draftError,
  } = await supabase
    .from("resource_content_versions")
    .select(
      `
        id,
        version_number,
        status
      `
    )
    .eq("resource_id", resourceId)
    .eq("status", "DRAFT")
    .order("version_number", {
      ascending: false,
    })
    .limit(1)
    .maybeSingle();

  if (draftError) {
    throw new Error(
      `Failed to load existing draft: ${draftError.message}`
    );
  }

  /*
   * Update existing draft.
   */

  if (existingDraft) {
    const {
      error: updateError,
    } = await supabase
      .from("resource_content_versions")
      .update({
        content_json: content,
        content_format:
          "RICH_TEXT_JSON_V1",
        updated_at:
          new Date().toISOString(),
        created_by: adminUserId,
      })
      .eq("id", existingDraft.id);

    if (updateError) {
      throw new Error(
        `Failed to update learning draft: ${updateError.message}`
      );
    }
  } else {
    /*
     * No draft exists.
     *
     * Create the next version.
     */

    const {
      data: latestVersion,
      error: versionError,
    } = await supabase
      .from("resource_content_versions")
      .select("version_number")
      .eq("resource_id", resourceId)
      .order("version_number", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (versionError) {
      throw new Error(
        `Failed to determine content version: ${versionError.message}`
      );
    }

    const nextVersion =
      (latestVersion?.version_number ?? 0) +
      1;

    const {
      error: insertError,
    } = await supabase
      .from("resource_content_versions")
      .insert({
        resource_id: resourceId,
        version_number: nextVersion,
        content_json: content,
        content_format:
          "RICH_TEXT_JSON_V1",
        status: "DRAFT",
        created_by: adminUserId,
      });

    if (insertError) {
      throw new Error(
        `Failed to create learning draft: ${insertError.message}`
      );
    }
  }

  /*
   * Refresh both the editor page and
   * the resource listing.
   */

  revalidatePath(
    `/admin/learning/${resourceId}`
  );

  revalidatePath(
    "/admin/learning"
  );
}

// 👇 नया function यहाँ add किया गया है 👇
export async function publishLearningResource(
  formData: FormData
) {
  const adminUserId = await requireAdmin();
  const supabase = createAdminSupabaseClient();

  const resourceId = String(
    formData.get("resource_id") ?? ""
  ).trim();

  if (!resourceId) {
    throw new Error(
      "Resource ID is required."
    );
  }

  /*
   * Make sure the resource exists before
   * attempting to publish it.
   */
  const {
    data: resource,
    error: resourceError,
  } = await supabase
    .from("resources")
    .select("id, title, status")
    .eq("id", resourceId)
    .maybeSingle();

  if (resourceError) {
    throw new Error(
      `Failed to validate resource: ${resourceError.message}`
    );
  }

  if (!resource) {
    throw new Error(
      "Learning resource was not found."
    );
  }

  /*
   * Publish the latest draft through the
   * atomic database function.
   */
  const {
    error: publishError,
  } = await supabase.rpc(
    "publish_learning_resource",
    {
      p_resource_id: resourceId,
    }
  );

  if (publishError) {
    throw new Error(
      `Failed to publish learning resource: ${publishError.message}`
    );
  }

  /*
   * Refresh the admin resource pages.
   */
  revalidatePath(
    `/admin/learning/${resourceId}`
  );

  revalidatePath(
    "/admin/learning"
  );
}