import "server-only";

import { createAdminSupabaseClient } from "@/app/lib/admin/supabase-admin";

export async function getAdminLearningResources() {
  const supabase = createAdminSupabaseClient();

  /*
   * ---------------------------------------------------------
   * 1. Load all resources
   * ---------------------------------------------------------
   */

  const {
    data: resources,
    error: resourcesError,
  } = await supabase
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
   *
   * A resource may have multiple curriculum mappings.
   * Therefore we preserve ALL mappings.
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
   *
   * We also load:
   *
   * - parent_node_id
   * - node_type
   *
   * These are required to understand:
   *
   * Mathematics
   *   └── Chapter
   *
   * Science
   *   └── Physics
   *       └── Chapter
   *
   * etc.
   * ---------------------------------------------------------
   */

  const curriculumNodeIds =
    curriculumMappings?.map(
      (mapping) => mapping.curriculum_node_id
    ) ?? [];

  let curriculumNodes: Array<{
    id: string;
    parent_node_id: string | null;
    display_name: string;
    description: string | null;
    sequence_order: number | null;
    status: string;
    node_type: string;
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
          parent_node_id,
          display_name,
          description,
          sequence_order,
          status,
          curriculum_version_id,

          canonical_nodes!inner (
            node_type,
            status
          )
        `
      )
      .in("id", curriculumNodeIds);

    if (error) {
      throw new Error(
        `Failed to load curriculum chapters: ${error.message}`
      );
    }

    curriculumNodes = (data ?? [])
      .map((node) => {
        const canonicalNode =
          Array.isArray(node.canonical_nodes)
            ? node.canonical_nodes[0]
            : node.canonical_nodes;

        if (!canonicalNode) {
          return null;
        }

        return {
          id: node.id,
          parent_node_id:
            node.parent_node_id ?? null,
          display_name: node.display_name,
          description: node.description,
          sequence_order:
            node.sequence_order,
          status: node.status,
          node_type:
            canonicalNode.node_type,
          curriculum_version_id:
            node.curriculum_version_id,
        };
      })
      .filter(
        (
          node
        ): node is NonNullable<typeof node> =>
          node !== null
      );
  }

  /*
   * ---------------------------------------------------------
   * 4. Load parent curriculum nodes
   * ---------------------------------------------------------
   *
   * For a chapter like:
   *
   * Motion
   *   parent → Physics
   *
   * we need Physics available to the admin UI.
   *
   * For Mathematics:
   *
   * Chapter
   *   parent → Mathematics
   *
   * the same mechanism works.
   * ---------------------------------------------------------
   */

  const parentNodeIds = Array.from(
    new Set(
      curriculumNodes
        .map((node) => node.parent_node_id)
        .filter(
          (id): id is string => Boolean(id)
        )
    )
  );

  let parentCurriculumNodes: Array<{
    id: string;
    parent_node_id: string | null;
    display_name: string;
    description: string | null;
    sequence_order: number | null;
    status: string;
    node_type: string;
    curriculum_version_id: string;
  }> = [];

  if (parentNodeIds.length > 0) {
    const {
      data,
      error,
    } = await supabase
      .from("curriculum_nodes")
      .select(
        `
          id,
          parent_node_id,
          display_name,
          description,
          sequence_order,
          status,
          curriculum_version_id,

          canonical_nodes!inner (
            node_type,
            status
          )
        `
      )
      .in("id", parentNodeIds);

    if (error) {
      throw new Error(
        `Failed to load parent curriculum nodes: ${error.message}`
      );
    }

    parentCurriculumNodes = (data ?? [])
      .map((node) => {
        const canonicalNode =
          Array.isArray(node.canonical_nodes)
            ? node.canonical_nodes[0]
            : node.canonical_nodes;

        if (!canonicalNode) {
          return null;
        }

        return {
          id: node.id,
          parent_node_id:
            node.parent_node_id ?? null,
          display_name: node.display_name,
          description: node.description,
          sequence_order:
            node.sequence_order,
          status: node.status,
          node_type:
            canonicalNode.node_type,
          curriculum_version_id:
            node.curriculum_version_id,
        };
      })
      .filter(
        (
          node
        ): node is NonNullable<typeof node> =>
          node !== null
      );
  }

  /*
   * ---------------------------------------------------------
   * 5. Merge chapter + parent nodes
   * ---------------------------------------------------------
   */

  const allCurriculumNodes = [
    ...curriculumNodes,
    ...parentCurriculumNodes,
  ];

  const nodeById = new Map(
    allCurriculumNodes.map((node) => [
      node.id,
      node,
    ])
  );

  /*
   * ---------------------------------------------------------
   * 6. Load curriculum versions
   * ---------------------------------------------------------
   */

  const curriculumVersionIds =
    curriculumNodes
      .map(
        (node) =>
          node.curriculum_version_id
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
      .in(
        "id",
        curriculumVersionIds
      );

    if (error) {
      throw new Error(
        `Failed to load curriculum versions: ${error.message}`
      );
    }

    curriculumVersions = data ?? [];
  }

  /*
   * ---------------------------------------------------------
   * 7. Load programs
   * ---------------------------------------------------------
   */

  const programIds =
    curriculumVersions
      .map(
        (version) =>
          version.program_id
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
   * 8. Build lookup maps
   * ---------------------------------------------------------
   */

  const mappingsByResourceId =
    new Map<
      string,
      Array<{
        resource_id: string;
        curriculum_node_id: string;
      }>
    >();

  for (const mapping of
    curriculumMappings ?? []) {
    const existing =
      mappingsByResourceId.get(
        mapping.resource_id
      ) ?? [];

    existing.push(mapping);

    mappingsByResourceId.set(
      mapping.resource_id,
      existing
    );
  }

  const versionById = new Map(
    curriculumVersions.map(
      (version) => [
        version.id,
        version,
      ]
    )
  );

  const programById = new Map(
    programs.map((program) => [
      program.id,
      program,
    ])
  );

  /*
   * ---------------------------------------------------------
   * 9. Normalize resource curriculum data
   * ---------------------------------------------------------
   */

  const resourcesWithCurriculum =
    resources.map((resource) => {
      const mappings =
        mappingsByResourceId.get(
          resource.id
        ) ?? [];

      const normalizedMappings =
        mappings
          .map((mapping) => {
            const node =
              nodeById.get(
                mapping.curriculum_node_id
              );

            if (!node) {
              return null;
            }

            const version =
              versionById.get(
                node.curriculum_version_id
              );

            const program =
              version
                ? programById.get(
                    version.program_id
                  )
                : undefined;

            /*
             * Resolve the immediate parent.
             *
             * For:
             * Motion → Physics
             *
             * subject becomes Physics.
             *
             * For:
             * Mathematics Chapter → Mathematics
             *
             * subject becomes Mathematics.
             */
            const parentNode =
              node.parent_node_id
                ? nodeById.get(
                    node.parent_node_id
                  )
                : null;

            return {
              curriculum_node_id:
                mapping.curriculum_node_id,

              node,

              version:
                version ?? null,

              program:
                program ?? null,

              parent_node:
                parentNode ?? null,
            };
          })
          .filter(
            (
              mapping
            ): mapping is NonNullable<
              typeof mapping
            > =>
              mapping !== null
          );

      /*
       * Preserve backward compatibility.
       *
       * Existing consumers continue to receive:
       *
       * curriculum.node
       * curriculum.version
       * curriculum.program
       *
       * New:
       *
       * curriculum.mappings
       * curriculum.subject
       */

      const primaryMapping =
        normalizedMappings[0];

      return {
        ...resource,

        curriculum: {
          node:
            primaryMapping?.node ??
            null,

          version:
            primaryMapping?.version ??
            null,

          program:
            primaryMapping?.program ??
            null,

          subject:
            primaryMapping?.parent_node ??
            null,

          mappings:
            normalizedMappings,
        },
      };
    });

  /*
   * ---------------------------------------------------------
   * 10. Sort
   * ---------------------------------------------------------
   *
   * Preserve the existing sorting behavior:
   *
   * chapter → display order → title
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

      if (
        aSequence !== bSequence
      ) {
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