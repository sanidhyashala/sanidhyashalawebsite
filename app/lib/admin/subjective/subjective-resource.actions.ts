"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/app/lib/auth/admin";
import { createAdminSupabaseClient } from "@/app/lib/admin/supabase-admin";

const ACCESS_TYPES = [
  "FREE",
  "PREMIUM",
] as const;

type AccessType =
  (typeof ACCESS_TYPES)[number];

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function createSubjectiveResource(
  formData: FormData
) {
  /*
   * ---------------------------------------------------------
   * 1. Admin authentication
   * ---------------------------------------------------------
   */

  await requireAdmin();

  const supabase =
    createAdminSupabaseClient();

  /*
   * ---------------------------------------------------------
   * 2. Read form values
   * ---------------------------------------------------------
   */

  const title = String(
    formData.get("title") ?? ""
  ).trim();

  const description = String(
    formData.get("description") ?? ""
  ).trim();

  const accessType = String(
    formData.get("access_type") ?? ""
  ).trim();

  const curriculumNodeId = String(
    formData.get("curriculum_node_id") ?? ""
  ).trim();

  /*
   * ---------------------------------------------------------
   * 3. Basic validation
   * ---------------------------------------------------------
   */

  if (!title) {
    throw new Error(
      "Subjective resource title is required."
    );
  }

  if (
    !ACCESS_TYPES.includes(
      accessType as AccessType
    )
  ) {
    throw new Error(
      "Invalid access type."
    );
  }

  if (!curriculumNodeId) {
    throw new Error(
      "A curriculum chapter is required."
    );
  }

  /*
   * ---------------------------------------------------------
   * 4. Validate curriculum node
   * ---------------------------------------------------------
   *
   * The Subjective resource must always belong
   * to a real curriculum chapter.
   */

  const {
    data: curriculumNode,
    error: curriculumError,
  } = await supabase
    .from("curriculum_nodes")
    .select(
      `
        id,
        curriculum_version_id,
        canonical_node_id,
        display_name,
        status
      `
    )
    .eq(
      "id",
      curriculumNodeId
    )
    .maybeSingle();

  if (curriculumError) {
    throw new Error(
      `Failed to validate curriculum chapter: ${curriculumError.message}`
    );
  }

  if (!curriculumNode) {
    throw new Error(
      "Selected curriculum chapter was not found."
    );
  }

  if (
    curriculumNode.status !==
    "ACTIVE"
  ) {
    throw new Error(
      "Selected curriculum chapter is not active."
    );
  }

  /*
   * ---------------------------------------------------------
   * 5. Validate canonical node
   * ---------------------------------------------------------
   */

  const {
    data: canonicalNode,
    error: canonicalError,
  } = await supabase
    .from("canonical_nodes")
    .select(
      `
        id,
        node_type,
        status
      `
    )
    .eq(
      "id",
      curriculumNode.canonical_node_id
    )
    .maybeSingle();

  if (canonicalError) {
    throw new Error(
      `Failed to validate curriculum node: ${canonicalError.message}`
    );
  }

  if (!canonicalNode) {
    throw new Error(
      "Selected curriculum chapter has no valid canonical node."
    );
  }

  if (
    canonicalNode.status !==
    "ACTIVE"
  ) {
    throw new Error(
      "Selected curriculum chapter is not active."
    );
  }

  if (
    canonicalNode.node_type !==
    "CHAPTER"
  ) {
    throw new Error(
      "Subjective resources can only be created for chapter nodes."
    );
  }

  /*
   * ---------------------------------------------------------
   * 6. Validate curriculum version
   * ---------------------------------------------------------
   *
   * Only published curriculum versions should
   * receive student-facing resources.
   */

  const {
    data: curriculumVersion,
    error: versionError,
  } = await supabase
    .from("curriculum_versions")
    .select(
      `
        id,
        session,
        status,
        program_id
      `
    )
    .eq(
      "id",
      curriculumNode.curriculum_version_id
    )
    .maybeSingle();

  if (versionError) {
    throw new Error(
      `Failed to validate curriculum version: ${versionError.message}`
    );
  }

  if (!curriculumVersion) {
    throw new Error(
      "Curriculum version was not found."
    );
  }

  if (
    curriculumVersion.status !==
    "PUBLISHED"
  ) {
    throw new Error(
      "The selected curriculum version is not published."
    );
  }

  /*
   * ---------------------------------------------------------
   * 7. Prevent duplicate Subjective resources
   * ---------------------------------------------------------
   *
   * One chapter should have one primary Subjective
   * resource. Multiple practice sets will live inside
   * that resource.
   */

  const {
    data: existingMappings,
    error: existingMappingError,
  } = await supabase
    .from("resource_curriculum_nodes")
    .select(
      `
        resource_id
      `
    )
    .eq(
      "curriculum_node_id",
      curriculumNodeId
    );

  if (existingMappingError) {
    throw new Error(
      `Failed to check existing curriculum resources: ${existingMappingError.message}`
    );
  }

  const existingResourceIds =
    existingMappings?.map(
      (mapping) =>
        mapping.resource_id
    ) ?? [];

  if (
    existingResourceIds.length > 0
  ) {
    const {
      data: existingSubjectiveResources,
      error: existingResourceError,
    } = await supabase
      .from("resources")
      .select(
        `
          id,
          title,
          resource_type,
          status
        `
      )
      .in(
        "id",
        existingResourceIds
      )
      .eq(
        "resource_type",
        "SUBJECTIVE"
      );

    if (existingResourceError) {
      throw new Error(
        `Failed to check existing Subjective resources: ${existingResourceError.message}`
      );
    }

    if (
      existingSubjectiveResources &&
      existingSubjectiveResources.length >
        0
    ) {
      throw new Error(
        `A Subjective resource already exists for "${curriculumNode.display_name}".`
      );
    }
  }

  /*
   * ---------------------------------------------------------
   * 8. Generate slug
   * ---------------------------------------------------------
   */

  const baseSlug =
    slugify(title);

  if (!baseSlug) {
    throw new Error(
      "Unable to generate a valid resource slug."
    );
  }

  /*
   * ---------------------------------------------------------
   * 9. Calculate display order
   * ---------------------------------------------------------
   */

  const {
    data: displayOrderRows,
    error: displayOrderError,
  } = await supabase
    .from("resources")
    .select(
      `
        display_order
      `
    )
    .order(
      "display_order",
      {
        ascending: false,
      }
    )
    .limit(1);

  if (displayOrderError) {
    throw new Error(
      `Failed to determine resource display order: ${displayOrderError.message}`
    );
  }

  const nextDisplayOrder =
    (displayOrderRows?.[0]
      ?.display_order ?? 0) + 1;

  /*
   * ---------------------------------------------------------
   * 10. Create Subjective resource
   * ---------------------------------------------------------
   */

  const {
    data: resource,
    error: resourceError,
  } = await supabase
    .from("resources")
    .insert({
      title,
      slug: baseSlug,
      description:
        description || null,
      resource_type:
        "SUBJECTIVE",
      access_type:
        accessType,
      status: "DRAFT",
      display_order:
        nextDisplayOrder,
    })
    .select(
      "id"
    )
    .single();

  if (
    resourceError ||
    !resource
  ) {
    throw new Error(
      `Failed to create Subjective resource: ${
        resourceError?.message ??
        "Unknown error"
      }`
    );
  }

  /*
   * ---------------------------------------------------------
   * 11. Connect resource to curriculum chapter
   * ---------------------------------------------------------
   */

  const {
    error: mappingError,
  } = await supabase
    .from(
      "resource_curriculum_nodes"
    )
    .insert({
      resource_id:
        resource.id,
      curriculum_node_id:
        curriculumNodeId,
    });

  if (mappingError) {
    /*
     * Cleanup the resource if mapping fails.
     */

    await supabase
      .from("resources")
      .delete()
      .eq(
        "id",
        resource.id
      );

    throw new Error(
      `Failed to connect Subjective resource to curriculum: ${mappingError.message}`
    );
  }

  /*
   * ---------------------------------------------------------
   * 12. Refresh Subjective admin pages
   * ---------------------------------------------------------
   */

  revalidatePath(
    "/admin/subjective"
  );

  revalidatePath(
    `/admin/subjective/${resource.id}`
  );

  /*
   * ---------------------------------------------------------
   * 13. Open the Subjective Sets page
   * ---------------------------------------------------------
   */

  redirect(
    `/admin/learning/subjective/${resource.id}`
  );
}