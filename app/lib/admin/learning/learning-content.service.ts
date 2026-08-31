import "server-only";

import { createAdminSupabaseClient } from "@/app/lib/admin/supabase-admin";

export type ResourceContentDocument = {
  type: "doc";
  content: Array<{
    type: string;
    [key: string]: unknown;
  }>;
};

export async function getAdminLearningResourceContent(
  resourceId: string
) {
  const supabase = createAdminSupabaseClient();

  /*
   * ---------------------------------------------------------
   * 1. Load the resource
   * ---------------------------------------------------------
   */

  const { data: resource, error: resourceError } =
    await supabase
      .from("resources")
      .select(
        `
          id,
          title,
          slug,
          resource_type,
          access_type,
          status,
          description,
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
    return null;
  }

  /*
   * ---------------------------------------------------------
   * 2. Find the curriculum mapping
   * ---------------------------------------------------------
   */

  const {
    data: curriculumMapping,
    error: curriculumMappingError,
  } = await supabase
    .from("resource_curriculum_nodes")
    .select("curriculum_node_id")
    .eq("resource_id", resourceId)
    .maybeSingle();

  if (curriculumMappingError) {
    throw new Error(
      `Failed to load resource curriculum mapping: ${curriculumMappingError.message}`
    );
  }

  /*
   * ---------------------------------------------------------
   * 3. Resolve curriculum separately
   * ---------------------------------------------------------
   */

  let curriculum = null;

  if (curriculumMapping?.curriculum_node_id) {
    const {
      data: curriculumNode,
      error: curriculumNodeError,
    } = await supabase
      .from("curriculum_nodes")
      .select(
        `
          id,
          display_name,
          sequence_order,
          curriculum_version_id
        `
      )
      .eq("id", curriculumMapping.curriculum_node_id)
      .maybeSingle();

    if (curriculumNodeError) {
      throw new Error(
        `Failed to load curriculum chapter: ${curriculumNodeError.message}`
      );
    }

    if (curriculumNode) {
      const {
        data: curriculumVersion,
        error: curriculumVersionError,
      } = await supabase
        .from("curriculum_versions")
        .select(
          `
            id,
            session,
            slug,
            status,
            program_id
          `
        )
        .eq("id", curriculumNode.curriculum_version_id)
        .maybeSingle();

      if (curriculumVersionError) {
        throw new Error(
          `Failed to load curriculum version: ${curriculumVersionError.message}`
        );
      }

      let program = null;

      if (curriculumVersion?.program_id) {
        const {
          data: programData,
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
          .eq("id", curriculumVersion.program_id)
          .maybeSingle();

        if (programError) {
          throw new Error(
            `Failed to load curriculum program: ${programError.message}`
          );
        }

        program = programData;
      }

      curriculum = {
        node: curriculumNode,
        version: curriculumVersion,
        program,
      };
    }
  }

  /*
   * ---------------------------------------------------------
   * 4. Load content versions
   * ---------------------------------------------------------
   */

  const { data: versions, error: versionsError } =
    await supabase
      .from("resource_content_versions")
      .select(
        `
          id,
          resource_id,
          version_number,
          content_json,
          content_format,
          status,
          published_at,
          created_at,
          updated_at
        `
      )
      .eq("resource_id", resourceId)
      .order("version_number", {
        ascending: false,
      });

  if (versionsError) {
    throw new Error(
      `Failed to load resource content: ${versionsError.message}`
    );
  }

  const latestDraft =
    versions?.find(
      (version) => version.status === "DRAFT"
    ) ?? null;

  const latestPublished =
    versions?.find(
      (version) => version.status === "PUBLISHED"
    ) ?? null;

  return {
    resource,
    curriculum,
    versions: versions ?? [],
    latestDraft,
    latestPublished,
  };
}