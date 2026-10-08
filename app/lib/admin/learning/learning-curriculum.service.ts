import "server-only";

import { createAdminSupabaseClient } from "@/app/lib/admin/supabase-admin";

export async function getAdminLearningCurriculum() {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from("curriculum_nodes")
    .select(
      `
        id,
        parent_node_id,
        display_name,
        description,
        sequence_order,
        status,

        canonical_nodes!inner (
          node_type,
          status
        ),

        curriculum_versions!inner (
          id,
          session,
          slug,
          status,
          program_id,

          programs!inner (
            id,
            name,
            slug,
            status
          )
        )
      `
    )
    .eq("canonical_nodes.status", "ACTIVE")
    .eq("curriculum_versions.status", "PUBLISHED")
    .eq("curriculum_versions.programs.status", "PUBLISHED")
    .order("sequence_order", {
      ascending: true,
    });

  if (error) {
    throw new Error(
      `Failed to load admin learning curriculum: ${error.message}`
    );
  }

  /*
   * ---------------------------------------------------------
   * Normalize Supabase relation data
   * ---------------------------------------------------------
   *
   * We intentionally keep the complete curriculum hierarchy:
   *
   * Mathematics
   *   └── Chapter
   *
   * Science
   *   ├── Physics
   *   │   └── Chapter
   *   ├── Chemistry
   *   │   └── Chapter
   *   └── Biology
   *       └── Chapter
   *
   * The UI can therefore build the correct hierarchy
   * without hardcoding subject names.
   * ---------------------------------------------------------
   */

  const normalized = (data ?? [])
    .map((node) => {
      const version = Array.isArray(node.curriculum_versions)
        ? node.curriculum_versions[0]
        : node.curriculum_versions;

      if (!version) {
        return null;
      }

      const program = Array.isArray(version.programs)
        ? version.programs[0]
        : version.programs;

      if (!program) {
        return null;
      }

      const canonicalNode = Array.isArray(node.canonical_nodes)
        ? node.canonical_nodes[0]
        : node.canonical_nodes;

      if (!canonicalNode) {
        return null;
      }

      return {
        id: node.id,
        parent_node_id: node.parent_node_id,
        display_name: node.display_name,
        description: node.description,
        sequence_order: node.sequence_order,
        status: node.status,

        node_type: canonicalNode.node_type,

        curriculum_version: {
          id: version.id,
          session: version.session,
          slug: version.slug,
          status: version.status,
        },

        program: {
          id: program.id,
          name: program.name,
          slug: program.slug,
          status: program.status,
        },
      };
    })
    .filter(
      (
        node
      ): node is NonNullable<typeof node> =>
        node !== null
    );

  /*
   * ---------------------------------------------------------
   * Sort
   * ---------------------------------------------------------
   *
   * First by class/program,
   * then by curriculum hierarchy sequence.
   * ---------------------------------------------------------
   */

  normalized.sort((a, b) => {
    const programCompare = a.program.name.localeCompare(
      b.program.name,
      undefined,
      {
        numeric: true,
        sensitivity: "base",
      }
    );

    if (programCompare !== 0) {
      return programCompare;
    }

    const sessionCompare =
      a.curriculum_version.session.localeCompare(
        b.curriculum_version.session
      );

    if (sessionCompare !== 0) {
      return sessionCompare;
    }

    return (
      (a.sequence_order ?? 0) -
      (b.sequence_order ?? 0)
    );
  });

  return normalized;
}