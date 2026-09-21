import "server-only";

import { createAdminSupabaseClient } from "@/app/lib/admin/supabase-admin";

export async function getAdminLearningResources() {
  const supabase = createAdminSupabaseClient();

  /*
   * -------------------------------------------------------
   * 1. Load all resources
   * -------------------------------------------------------
   */

  const { data: resources, error: resourcesError } = await supabase
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
   * -------------------------------------------------------
   * 2. Load resource → curriculum mappings
   * -------------------------------------------------------
   *
   * IMPORTANT:
   *
   * A resource can have multiple curriculum mappings.
   * Therefore we intentionally do NOT convert these mappings
   * into a Map keyed only by resource_id.
   *
   * That old approach silently discarded all but one mapping.
   */

  const resourceIds = resources.map((resource) => resource.id);

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
   * -------------------------------------------------------
   * 3. Load curriculum nodes
   * -------------------------------------------------------
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
    const { data, error } = await supabase
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
   * -------------------------------------------------------
   * 4. Load curriculum versions
   * -------------------------------------------------------
   */

  const curriculumVersionIds = curriculumNodes
    .map((node) => node.curriculum_version_id)
    .filter(Boolean);

  let curriculumVersions: Array<{
    id: string;
    session: string;
    slug: string;
    status: string;
    program_id: string;
  }> = [];

  if (curriculumVersionIds.length > 0) {
    const { data, error } = await supabase
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
   * -------------------------------------------------------
   * 5. Load programs
   * -------------------------------------------------------
   */

  const programIds = curriculumVersions
    .map((version) => version.program_id)
    .filter(Boolean);

  let programs: Array<{
    id: string;
    name: string;
    slug: string;
    status: string;
  }> = [];

  if (programIds.length > 0) {
    const { data, error } = await supabase
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
   * -------------------------------------------------------
   * 6. Build lookup maps
   * -------------------------------------------------------
   */

  const mappingsByResourceId = new Map<
    string,
    Array<{
      resource_id: string;
      curriculum_node_id: string;
    }>
  >();

  for (const mapping of curriculumMappings ?? []) {
    const existing =
      mappingsByResourceId.get(mapping.resource_id) ?? [];

    existing.push(mapping);

    mappingsByResourceId.set(
      mapping.resource_id,
      existing
    );
  }

  const nodeById = new Map(
    curriculumNodes.map((node) => [
      node.id,
      node,
    ])
  );

  const versionById = new Map(
    curriculumVersions.map((version) => [
      version.id,
      version,
    ])
  );

  const programById = new Map(
    programs.map((program) => [
      program.id,
      program,
    ])
  );

  /*
   * -------------------------------------------------------
   * 7. Attach normalized curriculum data
   * -------------------------------------------------------
   *
   * Backward compatibility:
   *
   * curriculum.node
   * curriculum.version
   * curriculum.program
   *
   * are intentionally preserved because existing admin
   * consumers already use them.
   *
   * New:
   *
   * curriculum.mappings
   *
   * contains every curriculum mapping for the resource.
   */

  const resourcesWithCurriculum = resources.map(
    (resource) => {
      const mappings =
        mappingsByResourceId.get(resource.id) ?? [];

      const normalizedMappings = mappings
        .map((mapping) => {
          const node = nodeById.get(
            mapping.curriculum_node_id
          );

          const version = node
            ? versionById.get(
                node.curriculum_version_id
              )
            : undefined;

          const program = version
            ? programById.get(
                version.program_id
              )
            : undefined;

          return {
            curriculum_node_id:
              mapping.curriculum_node_id,
            node: node ?? null,
            version: version ?? null,
            program: program ?? null,
          };
        })
        .filter(
          (mapping) =>
            mapping.node !== null ||
            mapping.version !== null ||
            mapping.program !== null
        );

      /*
       * Preserve the existing single-mapping fields.
       *
       * Existing pages continue to behave exactly as before.
       */
      const primaryMapping =
        normalizedMappings[0];

      return {
        ...resource,

        curriculum: {
          node:
            primaryMapping?.node ?? null,

          version:
            primaryMapping?.version ?? null,

          program:
            primaryMapping?.program ?? null,

          mappings: normalizedMappings,
        },
      };
    }
  );

  /*
   * -------------------------------------------------------
   * 8. Sort by chapter → display order → title
   * -------------------------------------------------------
   *
   * Preserve the existing sorting behavior by using the
   * backward-compatible primary curriculum node.
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
        return (
          aSequence - bSequence
        );
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