import "server-only";

import { createAdminSupabaseClient } from "@/app/lib/admin/supabase-admin";

export async function getAdminLearningResources() {
  const supabase = createAdminSupabaseClient();

  /*
   * ---------------------------------------------------------
   * 1. Load all resources
   * ---------------------------------------------------------
   */

  const { data: resources, error: resourcesError } =
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
          display_order,
          created_at,
          updated_at
        `
      )
      .order("created_at", {
        ascending: false,
      });

  if (resourcesError) {
    throw new Error(
      `Failed to load admin learning resources: ${resourcesError.message}`
    );
  }

  if (!resources || resources.length === 0) {
    return [];
  }

  /*
   * ---------------------------------------------------------
   * 2. Load resource → curriculum mappings
   * ---------------------------------------------------------
   */

  const resourceIds = resources.map(
    (resource) => resource.id
  );

  const {
    data: curriculumMappings,
    error: curriculumMappingsError,
  } = await supabase
    .from("resource_curriculum_nodes")
    .select(
      `
        resource_id,
        curriculum_node_id
      `
    )
    .in("resource_id", resourceIds);

  if (curriculumMappingsError) {
    throw new Error(
      `Failed to load resource curriculum mappings: ${curriculumMappingsError.message}`
    );
  }

  /*
   * ---------------------------------------------------------
   * 3. Load curriculum nodes
   * ---------------------------------------------------------
   */

  const curriculumNodeIds =
    curriculumMappings?.map(
      (mapping) => mapping.curriculum_node_id
    ) ?? [];

  let curriculumNodes: Array<{
    id: string;
    display_name: string;
    sequence_order: number | null;
    curriculum_version_id: string;
  }> = [];

  if (curriculumNodeIds.length > 0) {
    const {
      data,
      error,
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
      .in("id", curriculumNodeIds);

    if (error) {
      throw new Error(
        `Failed to load curriculum chapters: ${error.message}`
      );
    }

    curriculumNodes = data ?? [];
  }

  /*
   * ---------------------------------------------------------
   * 4. Load curriculum versions
   * ---------------------------------------------------------
   */

  const curriculumVersionIds =
    curriculumNodes
      .map(
        (node) => node.curriculum_version_id
      )
      .filter(Boolean);

  let curriculumVersions: Array<{
    id: string;
    session: string;
    slug: string;
    status: string;
    program_id: string;
  }> = [];

  if (curriculumVersionIds.length > 0) {
    const {
      data,
      error,
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
      .in("id", curriculumVersionIds);

    if (error) {
      throw new Error(
        `Failed to load curriculum versions: ${error.message}`
      );
    }

    curriculumVersions = data ?? [];
  }

  /*
   * ---------------------------------------------------------
   * 5. Load programs
   * ---------------------------------------------------------
   */

  const programIds =
    curriculumVersions
      .map(
        (version) => version.program_id
      )
      .filter(Boolean);

  let programs: Array<{
    id: string;
    name: string;
    slug: string;
    status: string;
  }> = [];

  if (programIds.length > 0) {
    const {
      data,
      error,
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
      .in("id", programIds);

    if (error) {
      throw new Error(
        `Failed to load curriculum programs: ${error.message}`
      );
    }

    programs = data ?? [];
  }

  /*
   * ---------------------------------------------------------
   * 6. Build lookup maps
   * ---------------------------------------------------------
   */

  const mappingByResourceId = new Map(
    (curriculumMappings ?? []).map(
      (mapping) => [
        mapping.resource_id,
        mapping,
      ]
    )
  );

  const nodeById = new Map(
    curriculumNodes.map(
      (node) => [
        node.id,
        node,
      ]
    )
  );

  const versionById = new Map(
    curriculumVersions.map(
      (version) => [
        version.id,
        version,
      ]
    )
  );

  const programById = new Map(
    programs.map(
      (program) => [
        program.id,
        program,
      ]
    )
  );

  /*
   * ---------------------------------------------------------
   * 7. Attach normalized curriculum data to every resource
   * ---------------------------------------------------------
   */

  const resourcesWithCurriculum =
    resources.map((resource) => {
      const mapping =
        mappingByResourceId.get(
          resource.id
        );

      const node =
        mapping
          ? nodeById.get(
              mapping.curriculum_node_id
            )
          : undefined;

      const version =
        node
          ? versionById.get(
              node.curriculum_version_id
            )
          : undefined;

      const program =
        version
          ? programById.get(
              version.program_id
            )
          : undefined;

      return {
        ...resource,

        curriculum: {
          node: node ?? null,
          version: version ?? null,
          program: program ?? null,
        },
      };
    });

  /*
   * ---------------------------------------------------------
   * 8. Sort by chapter → display order → title
   * ---------------------------------------------------------
   */

  resourcesWithCurriculum.sort(
    (a, b) => {
      const aSequence =
        a.curriculum.node
          ?.sequence_order ??
        Number.MAX_SAFE_INTEGER;

      const bSequence =
        b.curriculum.node
          ?.sequence_order ??
        Number.MAX_SAFE_INTEGER;

      if (aSequence !== bSequence) {
        return aSequence - bSequence;
      }

      const aDisplayOrder =
        a.display_order ?? 0;

      const bDisplayOrder =
        b.display_order ?? 0;

      if (
        aDisplayOrder !==
        bDisplayOrder
      ) {
        return (
          aDisplayOrder -
          bDisplayOrder
        );
      }

      return a.title.localeCompare(
        b.title
      );
    }
  );

  return resourcesWithCurriculum;
}