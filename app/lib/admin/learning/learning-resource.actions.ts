"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/app/lib/auth/admin";
import { createAdminSupabaseClient } from "@/app/lib/admin/supabase-admin";

const ACCESS_TYPES = ["FREE", "PREMIUM"] as const;

const CONTENT_SOURCES = ["EDITOR", "PDF"] as const;

type AccessType = (typeof ACCESS_TYPES)[number];
type ContentSource = (typeof CONTENT_SOURCES)[number];

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function createLearningResource(formData: FormData) {
  /*
   * Only an authenticated admin can create
   * learning resources.
   */
  await requireAdmin();

  const supabase = createAdminSupabaseClient();

  /*
   * This creation pipeline is intentionally NOTE-only.
   *
   * MCQ, Subjective, Case-Based and Mock Test resources
   * are created through their dedicated pipelines.
   *
   * Access starts as FREE and can be changed later
   * from the Resource Editor.
   */
  const resourceType = "NOTE" as const;
  const accessType = "FREE" as const;

  /*
   * Read form values.
   */
  const title = String(
    formData.get("title") ?? ""
  ).trim();

  const description = String(
    formData.get("description") ?? ""
  ).trim();

  const curriculumNodeId = String(
    formData.get("curriculum_node_id") ?? ""
  ).trim();

  /*
   * Basic validation.
   */
  if (!title) {
    throw new Error("Resource title is required.");
  }

  if (!curriculumNodeId) {
    throw new Error("Please select a curriculum chapter.");
  }

  /*
   * --------------------------------------------------
   * 1. Validate the selected curriculum node
   * --------------------------------------------------
   *
   * curriculum_nodes contains the actual chapter entry.
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
        sequence_order,
        status
      `
    )
    .eq("id", curriculumNodeId)
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

  /*
   * The curriculum node itself must be active.
   */
  if (curriculumNode.status !== "ACTIVE") {
    throw new Error(
      "The selected curriculum chapter is not active."
    );
  }

  /*
   * --------------------------------------------------
   * 2. Verify that this node is actually a CHAPTER
   * --------------------------------------------------
   *
   * canonical_nodes contains the semantic identity
   * of the curriculum node.
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
    .eq("id", curriculumNode.canonical_node_id)
    .maybeSingle();

  if (canonicalError) {
    throw new Error(
      `Failed to validate curriculum node type: ${canonicalError.message}`
    );
  }

  if (!canonicalNode) {
    throw new Error(
      "The selected curriculum chapter has no valid canonical node."
    );
  }

  if (canonicalNode.node_type !== "CHAPTER") {
    throw new Error(
      "The selected curriculum node is not a chapter."
    );
  }

  if (canonicalNode.status !== "ACTIVE") {
    throw new Error(
      "The selected curriculum chapter is not active."
    );
  }

  /*
   * --------------------------------------------------
   * 3. Load the curriculum version directly
   * --------------------------------------------------
   *
   * curriculum_nodes.curriculum_version_id
   * -> curriculum_versions.id
   */

  const {
    data: curriculumVersion,
    error: versionError,
  } = await supabase
    .from("curriculum_versions")
    .select(
      `
        id,
        program_id,
        session,
        slug,
        status
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
      "Selected curriculum version was not found."
    );
  }

  /*
   * The curriculum version must be published.
   */
  if (curriculumVersion.status !== "PUBLISHED") {
    throw new Error(
      "The selected curriculum version is not published."
    );
  }

  /*
   * --------------------------------------------------
   * 4. Load the program directly
   * --------------------------------------------------
   *
   * curriculum_versions.program_id
   * -> programs.id
   */

  const {
    data: program,
    error: programError,
  } = await supabase
    .from("programs")
    .select(
      `
        id,
        name,
        slug,
        status
      `
    )
    .eq(
      "id",
      curriculumVersion.program_id
    )
    .maybeSingle();

  if (programError) {
    throw new Error(
      `Failed to validate curriculum program: ${programError.message}`
    );
  }

  if (!program) {
    throw new Error(
      "Selected curriculum program was not found."
    );
  }

  /*
   * The program must be published.
   */
  if (program.status !== "PUBLISHED") {
    throw new Error(
      "The selected curriculum program is not published."
    );
  }

  /*
   * --------------------------------------------------
   * 5. Generate a clean resource slug
   * --------------------------------------------------
   */

  const baseSlug = slugify(title);

  if (!baseSlug) {
    throw new Error(
      "Please provide a title containing usable characters."
    );
  }

  /*
   * Make the slug unique.
   *
   * Example:
   * chapter-1-notes
   * chapter-1-notes-2
   * chapter-1-notes-3
   */

  let slug = baseSlug;
  let suffix = 2;

  while (true) {
    const {
      data: existingResource,
      error: slugCheckError,
    } = await supabase
      .from("resources")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (slugCheckError) {
      throw new Error(
        `Failed to check resource slug: ${slugCheckError.message}`
      );
    }

    if (!existingResource) {
      break;
    }

    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  /*
   * --------------------------------------------------
   * 6. Determine the next display order
   * --------------------------------------------------
   *
   * Resources belonging to the same chapter are
   * ordered independently.
   */

  const {
    data: existingMappings,
    error: mappingError,
  } = await supabase
    .from("resource_curriculum_nodes")
    .select(
      `
        resource_id,
        resources (
          display_order
        )
      `
    )
    .eq(
      "curriculum_node_id",
      curriculumNodeId
    );

  if (mappingError) {
    throw new Error(
      `Failed to load resource ordering: ${mappingError.message}`
    );
  }

  const nextDisplayOrder =
    (existingMappings ?? []).reduce(
      (max, mapping) => {
        const resource = mapping.resources?.[0];

        return Math.max(
          max,
          resource?.display_order ?? 0
        );
      },
      0
    ) + 1;

  /*
   * --------------------------------------------------
   * 7. Create the resource
   * --------------------------------------------------
   *
   * Every newly created Note starts as DRAFT.
   *
   * resource_type is always NOTE.
   * access_type initially starts as FREE.
   *
   * Access can be changed later from the
   * Resource Editor.
   */

  const {
    data: resource,
    error: resourceError,
  } = await supabase
    .from("resources")
    .insert({
      title,
      slug,
      description: description || null,
      resource_type: resourceType,
      access_type: accessType,
      status: "DRAFT",
      display_order: nextDisplayOrder,
    })
    .select("id")
    .single();

  if (resourceError || !resource) {
    throw new Error(
      `Failed to create learning resource: ${
        resourceError?.message ??
        "Unknown error"
      }`
    );
  }

  /*
   * --------------------------------------------------
   * 8. Connect resource to curriculum chapter
   * --------------------------------------------------
   */

  const {
    error: resourceMappingError,
  } = await supabase
    .from("resource_curriculum_nodes")
    .insert({
      resource_id: resource.id,
      curriculum_node_id: curriculumNodeId,
    });

  if (resourceMappingError) {
    /*
     * Cleanup the resource if its curriculum
     * mapping could not be created.
     */

    await supabase
      .from("resources")
      .delete()
      .eq("id", resource.id);

    throw new Error(
      `Failed to connect resource to curriculum: ${resourceMappingError.message}`
    );
  }

  /*
   * Refresh the admin resource list.
   */
  revalidatePath("/admin/learning");

  /*
   * Return to the resource list.
   */
  redirect("/admin/learning");
}

/*
 * --------------------------------------------------
 * Update Resource Content Source
 * --------------------------------------------------
 *
 * Admin can switch the primary student-facing
 * content source between EDITOR and PDF.
 */

export async function updateLearningResourceContentSource(
  formData: FormData
) {
  await requireAdmin();

  const supabase = createAdminSupabaseClient();

  const resourceId = String(
    formData.get("resource_id") ?? ""
  ).trim();

  const contentSource = String(
    formData.get("content_source") ?? ""
  ).trim() as ContentSource;

  if (!resourceId) {
    throw new Error("Resource ID is required.");
  }

  if (!CONTENT_SOURCES.includes(contentSource)) {
    throw new Error("Invalid content source.");
  }

  const {
    data: resource,
    error: resourceError,
  } = await supabase
    .from("resources")
    .select("id, content_source")
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

  if (resource.content_source === contentSource) {
    return;
  }

  const {
    error: updateError,
  } = await supabase
    .from("resources")
    .update({
      content_source: contentSource,
      updated_at: new Date().toISOString(),
    })
    .eq("id", resourceId);

  if (updateError) {
    throw new Error(
      `Failed to update content source: ${updateError.message}`
    );
  }

  revalidatePath(
    `/admin/learning/${resourceId}`
  );

  revalidatePath("/admin/learning");
}

/*
 * --------------------------------------------------
 * Update Resource Access Type
 * --------------------------------------------------
 *
 * Admin can switch a resource between:
 *
 * FREE
 * PREMIUM
 *
 * This is intentionally a resource-level access
 * setting. It does NOT create pricing, purchases,
 * or entitlements.
 */

export async function updateLearningResourceAccessType(
  formData: FormData
) {
  await requireAdmin();

  const supabase = createAdminSupabaseClient();

  const resourceId = String(
    formData.get("resource_id") ?? ""
  ).trim();

  const accessType = String(
    formData.get("access_type") ?? ""
  ).trim() as AccessType;

  if (!resourceId) {
    throw new Error("Resource ID is required.");
  }

  if (!ACCESS_TYPES.includes(accessType)) {
    throw new Error("Invalid access type.");
  }

  const {
    data: resource,
    error: resourceError,
  } = await supabase
    .from("resources")
    .select(
      `
        id,
        resource_type,
        access_type
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

  if (resource.access_type === accessType) {
    return;
  }

  const {
    error: updateError,
  } = await supabase
    .from("resources")
    .update({
      access_type: accessType,
      updated_at: new Date().toISOString(),
    })
    .eq("id", resourceId);

  if (updateError) {
    throw new Error(
      `Failed to update learning resource access type: ${updateError.message}`
    );
  }

  revalidatePath(
    `/admin/learning/${resourceId}`
  );

  revalidatePath("/admin/learning");
}