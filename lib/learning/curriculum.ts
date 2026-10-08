import { createAdminSupabaseClient } from "@/app/lib/admin/supabase-admin";

import { createLearningSupabaseClient } from "./supabase-learning";

import { requireLearningAuth } from "./learning-auth";

type GetLearningCurriculumOptions = {
  /**
   * When true, premium Notes which are hidden by RLS
   * are also discovered and returned with has_access=false.
   */
  includeLockedNotes?: boolean;

  /**
   * Optional parent curriculum node.
   *
   * When omitted:
   *   Root Subject -> Direct Children
   *
   * Example Mathematics:
   *   Mathematics -> Chapters
   *
   * When provided:
   *   Parent Node -> Direct Children
   *
   * Example Science:
   *   Science -> Physics / Chemistry / Biology
   *
   * Example Physics:
   *   Physics -> Physics Chapters
   */
  parentNodeId?: string;
};

type Resource = {
  id: string;
  title: string;
  slug: string;
  resource_type: string;
  access_type: "FREE" | "PREMIUM";
  status: string;
  display_order: number | null;
  content_source: string | null;
  has_access: boolean;
};

type SupabaseResource = Omit<Resource, "has_access">;

type ResourceMapping = {
  resource_id: string;
  resources: SupabaseResource | SupabaseResource[] | null;
};

type LearningSubject = {
  id: string;
  display_name: string;
  description: string | null;
  sequence_order: number | null;
  canonical_node_id: string;
};

type LearningProgram = {
  id: string;
  name: string;
  slug: string;
  status: string;
};

type LearningCurriculumVersion = {
  id: string;
  session: string;
  slug: string;
  status: string;
  created_at: string;
};

function getSingleResource(
  resources:
    | SupabaseResource
    | SupabaseResource[]
    | null
    | undefined,
): Resource | null {
  if (!resources) {
    return null;
  }

  const resource = Array.isArray(resources)
    ? resources[0]
    : resources;

  if (!resource) {
    return null;
  }

  return {
    ...resource,
    has_access: false,
  };
}

/**
 * Resolve the published learning program and its single published
 * curriculum version.
 *
 * This keeps the existing Mathematics behaviour intact:
 * - program must be PUBLISHED
 * - exactly one curriculum version must be PUBLISHED
 */
async function resolvePublishedLearningContext(
  classSlug: string,
): Promise<{
  supabase: Awaited<
    ReturnType<typeof createLearningSupabaseClient>
  >;
  program: LearningProgram;
  curriculumVersion: LearningCurriculumVersion;
}> {
  const normalizedClassSlug =
    classSlug.trim().toLowerCase();

  if (!normalizedClassSlug) {
    throw new Error("Class slug is required.");
  }

  const supabase =
    await createLearningSupabaseClient();

  // ------------------------------------------------------------
  // 1. Resolve Program
  // ------------------------------------------------------------

  const {
    data: program,
    error: programError,
  } = await supabase
    .from("programs")
    .select(`
      id,
      name,
      slug,
      status
    `)
    .eq("slug", normalizedClassSlug)
    .eq("status", "PUBLISHED")
    .maybeSingle();

  if (programError) {
    throw new Error(
      `Failed to load learning program: ${programError.message}`,
    );
  }

  if (!program) {
    throw new Error(
      "The requested class is not available.",
    );
  }

  // ------------------------------------------------------------
  // 2. Resolve Published Curriculum Version
  // ------------------------------------------------------------

  const {
    data: curriculumVersions,
    error: versionError,
  } = await supabase
    .from("curriculum_versions")
    .select(`
      id,
      session,
      slug,
      status,
      created_at
    `)
    .eq("program_id", program.id)
    .eq("status", "PUBLISHED")
    .order("created_at", {
      ascending: false,
    });

  if (versionError) {
    throw new Error(
      `Failed to load curriculum version: ${versionError.message}`,
    );
  }

  if (
    !curriculumVersions ||
    curriculumVersions.length === 0
  ) {
    throw new Error(
      "No published curriculum is available for this class.",
    );
  }

  /**
   * Keep the current safety rule.
   *
   * We are NOT changing session/version architecture here.
   * Session rollover will be handled separately.
   */
  if (curriculumVersions.length > 1) {
    throw new Error(
      `Multiple published curriculum versions found for ${program.name}.`,
    );
  }

  return {
    supabase,
    program,
    curriculumVersion: curriculumVersions[0],
  };
}

/**
 * Get the root subjects of a class.
 *
 * Example:
 *
 * Class IX
 * ├── Mathematics
 * └── Science
 *
 * Science is returned as a root subject here.
 *
 * This function does NOT read canonical_nodes, so the existing
 * curriculum layer remains dependent only on curriculum_nodes.
 */
export async function getLearningSubjects(
  classSlug: string,
): Promise<{
  program: LearningProgram;
  curriculumVersion: LearningCurriculumVersion;
  subjects: LearningSubject[];
}> {
  await requireLearningAuth();

  const {
    supabase,
    program,
    curriculumVersion,
  } = await resolvePublishedLearningContext(
    classSlug,
  );

  // ------------------------------------------------------------
  // Root Subject Nodes
  // ------------------------------------------------------------

  const {
    data: rootNodes,
    error: rootNodesError,
  } = await supabase
    .from("curriculum_nodes")
    .select(`
      id,
      display_name,
      description,
      sequence_order,
      canonical_node_id
    `)
    .eq(
      "curriculum_version_id",
      curriculumVersion.id,
    )
    .eq("status", "ACTIVE")
    .is("parent_node_id", null)
    .order("sequence_order", {
      ascending: true,
    });

  if (rootNodesError) {
    throw new Error(
      `Failed to load ${program.name} subjects: ${rootNodesError.message}`,
    );
  }

  if (!rootNodes || rootNodes.length === 0) {
    throw new Error(
      `No active curriculum subject found for ${program.name}.`,
    );
  }

  return {
    program,
    curriculumVersion,
    subjects: rootNodes,
  };
}

/**
 * Get curriculum children for a class.
 *
 * Existing behaviour:
 *
 *   getLearningCurriculum("class-9")
 *
 * continues to mean:
 *
 *   Mathematics -> Mathematics Chapters
 *
 * New behaviour:
 *
 *   getLearningCurriculum("class-9", {
 *     parentNodeId: scienceNodeId
 *   })
 *
 * means:
 *
 *   Science -> Physics / Chemistry / Biology
 *
 * And:
 *
 *   getLearningCurriculum("class-9", {
 *     parentNodeId: physicsNodeId
 *   })
 *
 * means:
 *
 *   Physics -> Physics Chapters
 */
export async function getLearningCurriculum(
  classSlug: string,
  options: GetLearningCurriculumOptions = {},
) {
  await requireLearningAuth();

  const includeLockedNotes =
    options.includeLockedNotes === true;

  const parentNodeId =
    options.parentNodeId?.trim() || null;

  const {
    supabase,
    program,
    curriculumVersion,
  } = await resolvePublishedLearningContext(
    classSlug,
  );

  // ------------------------------------------------------------
  // 3. Resolve Parent Nodes
  //
  // Existing behaviour:
  //   parentNodeId absent
  //   -> use root nodes
  //
  // New behaviour:
  //   parentNodeId provided
  //   -> use that node as the parent
  // ------------------------------------------------------------

  let parentNodes:
    | {
        id: string;
        display_name: string;
        description: string | null;
        sequence_order: number | null;
        canonical_node_id: string;
      }[]
    | null = null;

  if (parentNodeId) {
    const {
      data: parentNode,
      error: parentNodeError,
    } = await supabase
      .from("curriculum_nodes")
      .select(`
        id,
        display_name,
        description,
        sequence_order,
        canonical_node_id
      `)
      .eq("id", parentNodeId)
      .eq(
        "curriculum_version_id",
        curriculumVersion.id,
      )
      .eq("status", "ACTIVE")
      .maybeSingle();

    if (parentNodeError) {
      throw new Error(
        `Failed to load curriculum parent node: ${parentNodeError.message}`,
      );
    }

    if (!parentNode) {
      throw new Error(
        "The requested curriculum node is not available.",
      );
    }

    parentNodes = [parentNode];
  } else {
    const {
      data: rootNodes,
      error: rootNodesError,
    } = await supabase
      .from("curriculum_nodes")
      .select(`
        id,
        display_name,
        description,
        sequence_order,
        canonical_node_id
      `)
      .eq(
        "curriculum_version_id",
        curriculumVersion.id,
      )
      .eq("status", "ACTIVE")
      .is("parent_node_id", null)
      .order("sequence_order", {
        ascending: true,
      });

    if (rootNodesError) {
      throw new Error(
        `Failed to load ${program.name} curriculum structure: ${rootNodesError.message}`,
      );
    }

    if (!rootNodes || rootNodes.length === 0) {
      throw new Error(
        `No active curriculum subject found for ${program.name}.`,
      );
    }

    parentNodes = rootNodes;
  }

  const parentNodeIds = parentNodes.map(
    (node) => node.id,
  );

  // ------------------------------------------------------------
  // 4. Load Active Children + Visible Resources
  // ------------------------------------------------------------

  const {
    data,
    error,
  } = await supabase
    .from("curriculum_nodes")
    .select(`
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
    `)
    .eq(
      "curriculum_version_id",
      curriculumVersion.id,
    )
    .eq("status", "ACTIVE")
    .in("parent_node_id", parentNodeIds)
    .order("sequence_order", {
      ascending: true,
    });

  if (error) {
    throw new Error(
      `Failed to load ${program.name} learning curriculum: ${error.message}`,
    );
  }

  const chapters = data ?? [];

  // ------------------------------------------------------------
  // 5. Normal behaviour
  //
  // RLS decides which resources are visible.
  //
  // This is exactly the existing behaviour when
  // includeLockedNotes=false.
  // ------------------------------------------------------------

  if (!includeLockedNotes) {
    return chapters.map((chapter) => ({
      ...chapter,

      resource_curriculum_nodes: (
        chapter.resource_curriculum_nodes ?? []
      ).map((mapping) => {
        const resource = getSingleResource(
          mapping.resources,
        );

        return {
          ...mapping,

          resources: resource
            ? {
                ...resource,
                has_access: true,
              }
            : null,
        };
      }),
    }));
  }

  // ------------------------------------------------------------
  // 6. Find published Notes which may be hidden by RLS
  //
  // Admin client is used ONLY for metadata discovery.
  // Actual access is still checked through the authenticated
  // client.
  // ------------------------------------------------------------

  const adminSupabase =
    createAdminSupabaseClient();

  const chapterIds = chapters.map(
    (chapter) => chapter.id,
  );

  if (chapterIds.length === 0) {
    return chapters;
  }

  const {
    data: publishedNoteMappings,
    error: publishedNoteMappingsError,
  } = await adminSupabase
    .from("resource_curriculum_nodes")
    .select(`
      curriculum_node_id,
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
    `)
    .in(
      "curriculum_node_id",
      chapterIds,
    );

  if (publishedNoteMappingsError) {
    throw new Error(
      `Failed to load published Notes: ${publishedNoteMappingsError.message}`,
    );
  }

  // ------------------------------------------------------------
  // 7. Resources already visible through authenticated RLS
  // ------------------------------------------------------------

  const visibleResourceIds =
    new Set<string>();

  for (const chapter of chapters) {
    for (const mapping of
      chapter.resource_curriculum_nodes ?? []) {
      const resource = getSingleResource(
        mapping.resources,
      );

      if (
        resource &&
        resource.resource_type === "NOTE" &&
        resource.status === "PUBLISHED"
      ) {
        visibleResourceIds.add(resource.id);
      }
    }
  }

  // ------------------------------------------------------------
  // 8. Collect unique published Notes
  // ------------------------------------------------------------

  const uniqueNoteResources =
    new Map<string, Resource>();

  for (const mapping of
    publishedNoteMappings ?? []) {
    const resource = getSingleResource(
      mapping.resources,
    );

    if (
      !resource ||
      resource.resource_type !== "NOTE" ||
      resource.status !== "PUBLISHED"
    ) {
      continue;
    }

    uniqueNoteResources.set(
      resource.id,
      resource,
    );
  }

  // ------------------------------------------------------------
  // 9. Determine access for every published Note
  // ------------------------------------------------------------

  const noteAccessMap =
    new Map<string, boolean>();

  for (const resource of
    uniqueNoteResources.values()) {
    // FREE Notes are accessible.
    if (resource.access_type === "FREE") {
      noteAccessMap.set(
        resource.id,
        true,
      );

      continue;
    }

    // If RLS already returned the resource,
    // the user has access.
    if (visibleResourceIds.has(resource.id)) {
      noteAccessMap.set(
        resource.id,
        true,
      );

      continue;
    }

    // Premium Note hidden by RLS ->
    // explicitly check entitlement.
    const {
      data: hasAccess,
      error: accessError,
    } = await supabase.rpc(
      "user_has_learning_product_access",
      {
        p_resource_id: resource.id,
      },
    );

    if (accessError) {
      throw new Error(
        `Failed to verify Note access: ${accessError.message}`,
      );
    }

    noteAccessMap.set(
      resource.id,
      hasAccess === true,
    );
  }

  // ------------------------------------------------------------
  // 10. Merge locked Premium Notes into child resources
  // ------------------------------------------------------------

  return chapters.map((chapter) => {
    const existingMappings =
      chapter.resource_curriculum_nodes ?? [];

    const existingResourceIds =
      new Set<string>();

    for (const mapping of existingMappings) {
      const resource = getSingleResource(
        mapping.resources,
      );

      if (resource?.id) {
        existingResourceIds.add(
          resource.id,
        );
      }
    }

    const additionalMappings =
      (publishedNoteMappings ?? [])
        .filter((mapping) => {
          const resource =
            getSingleResource(
              mapping.resources,
            );

          return (
            mapping.curriculum_node_id ===
              chapter.id &&
            resource &&
            resource.resource_type ===
              "NOTE" &&
            resource.status ===
              "PUBLISHED" &&
            !existingResourceIds.has(
              mapping.resource_id,
            )
          );
        })
        .map((mapping) => {
          const resource =
            getSingleResource(
              mapping.resources,
            );

          return {
            resource_id:
              mapping.resource_id,

            resources: resource,
          };
        })
        .filter(
          (
            mapping,
          ): mapping is {
            resource_id: string;
            resources: Resource;
          } =>
            mapping.resources !== null,
        );

    const mergedMappings = [
      ...existingMappings.map(
        (mapping) => ({
          ...mapping,

          resources:
            getSingleResource(
              mapping.resources,
            ),
        }),
      ),

      ...additionalMappings,
    ];

    return {
      ...chapter,

      resource_curriculum_nodes:
        mergedMappings.map((mapping) => {
          const resource =
            mapping.resources;

          if (
            resource &&
            resource.resource_type ===
              "NOTE" &&
            resource.status ===
              "PUBLISHED"
          ) {
            return {
              ...mapping,

              resources: {
                ...resource,

                has_access:
                  noteAccessMap.get(
                    resource.id,
                  ) ?? false,
              },
            };
          }

          return mapping;
        }),
    };
  });
}