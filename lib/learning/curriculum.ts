import { createLearningSupabaseClient } from "./supabase-learning";
import { requireLearningAuth } from "./learning-auth";

/* =========================================================
 * Get Learning Curriculum
 * =========================================================
 *
 * The curriculum is resolved dynamically:
 *
 * class-slug
 *   ↓
 * programs
 *   ↓
 * published curriculum version
 *   ↓
 * active subject/root nodes
 *   ↓
 * active chapter nodes
 *   ↓
 * mapped resources
 *
 * No class-specific UUIDs are hardcoded here.
 *
 * Student-facing learning queries intentionally do not
 * depend on canonical_nodes. The curriculum hierarchy
 * itself determines the chapter nodes.
 * ========================================================= */

export async function getLearningCurriculum(
  classSlug: string
) {
  await requireLearningAuth();

  const normalizedClassSlug =
    classSlug.trim().toLowerCase();

  if (!normalizedClassSlug) {
    throw new Error(
      "Class slug is required."
    );
  }

  const supabase =
    await createLearningSupabaseClient();

  /* -------------------------------------------------------
   * 1. Resolve the class/program
   * ------------------------------------------------------- */

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
      "slug",
      normalizedClassSlug
    )
    .eq(
      "status",
      "PUBLISHED"
    )
    .maybeSingle();

  if (programError) {
    throw new Error(
      `Failed to load learning program: ${programError.message}`
    );
  }

  if (!program) {
    throw new Error(
      "The requested class is not available."
    );
  }

  /* -------------------------------------------------------
   * 2. Resolve the published curriculum version
   * -------------------------------------------------------
   *
   * We deliberately do not hardcode a curriculum-version
   * UUID.
   *
   * If multiple published versions somehow exist for the
   * same program, we fail rather than silently choosing
   * the wrong curriculum.
   * ------------------------------------------------------- */

  const {
    data: curriculumVersions,
    error: versionError,
  } = await supabase
    .from("curriculum_versions")
    .select(
      `
        id,
        session,
        slug,
        status,
        created_at
      `
    )
    .eq(
      "program_id",
      program.id
    )
    .eq(
      "status",
      "PUBLISHED"
    )
    .order(
      "created_at",
      {
        ascending: false,
      }
    );

  if (versionError) {
    throw new Error(
      `Failed to load curriculum version: ${versionError.message}`
    );
  }

  if (
    !curriculumVersions ||
    curriculumVersions.length === 0
  ) {
    throw new Error(
      "No published curriculum is available for this class."
    );
  }

  if (
    curriculumVersions.length > 1
  ) {
    throw new Error(
      `Multiple published curriculum versions found for ${program.name}.`
    );
  }

  const curriculumVersion =
    curriculumVersions[0];

  /* -------------------------------------------------------
   * 3. Resolve active subject/root nodes
   * -------------------------------------------------------
   *
   * Root curriculum nodes have no parent.
   *
   * We use the curriculum hierarchy itself instead of
   * reading canonical_nodes. This keeps the student-facing
   * learning layer independent from admin-only canonical
   * node permissions.
   * ------------------------------------------------------- */

  const {
    data: rootNodes,
    error: rootNodesError,
  } = await supabase
    .from("curriculum_nodes")
    .select(
      `
        id,
        display_name,
        description,
        sequence_order,
        canonical_node_id
      `
    )
    .eq(
      "curriculum_version_id",
      curriculumVersion.id
    )
    .eq(
      "status",
      "ACTIVE"
    )
    .is(
      "parent_node_id",
      null
    )
    .order(
      "sequence_order",
      {
        ascending: true,
      }
    );

  if (rootNodesError) {
    throw new Error(
      `Failed to load ${program.name} curriculum structure: ${rootNodesError.message}`
    );
  }

  if (
    !rootNodes ||
    rootNodes.length === 0
  ) {
    throw new Error(
      `No active curriculum subject found for ${program.name}.`
    );
  }

  /* -------------------------------------------------------
   * 4. Load active chapter nodes
   * -------------------------------------------------------
   *
   * A chapter is represented by an active node whose
   * parent is one of the active root/subject nodes.
   *
   * This preserves the database-driven hierarchy without
   * requiring access to canonical_nodes.
   * ------------------------------------------------------- */

  const rootNodeIds =
    rootNodes.map(
      (node) => node.id
    );

  const {
    data,
    error,
  } = await supabase
    .from("curriculum_nodes")
    .select(
      `
        id,
        display_name,
        description,
        sequence_order,
        canonical_node_id,
        parent_node_id,

        resource_curriculum_nodes (
          resource_id,

          resources (
            id,
            title,
            slug,
            resource_type,
            access_type,
            status,
            display_order,
            content_source
          )
        )
      `
    )
    .eq(
      "curriculum_version_id",
      curriculumVersion.id
    )
    .eq(
      "status",
      "ACTIVE"
    )
    .in(
      "parent_node_id",
      rootNodeIds
    )
    .order(
      "sequence_order",
      {
        ascending: true,
      }
    );

  if (error) {
    throw new Error(
      `Failed to load ${program.name} learning curriculum: ${error.message}`
    );
  }

  return data ?? [];
}