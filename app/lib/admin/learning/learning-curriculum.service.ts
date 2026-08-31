import "server-only";

import { createAdminSupabaseClient } from "@/app/lib/admin/supabase-admin";

export async function getAdminLearningCurriculum() {
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from("curriculum_nodes")
    .select(
      `
        id,
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
    .eq(
      "canonical_nodes.node_type",
      "CHAPTER"
    )
    .eq(
      "canonical_nodes.status",
      "ACTIVE"
    )
    .eq(
      "curriculum_versions.status",
      "PUBLISHED"
    )
    .eq(
      "curriculum_versions.programs.status",
      "PUBLISHED"
    )
    .order(
      "sequence_order",
      {
        ascending: true,
      }
    );

  if (error) {
    throw new Error(
      `Failed to load admin learning curriculum: ${error.message}`
    );
  }

  /*
   * -------------------------------------------------------
   * Normalize Supabase relation data
   * -------------------------------------------------------
   *
   * curriculum_versions is a collection.
   * programs is a related single program.
   *
   * The admin UI should not have to know or depend on
   * Supabase's nested relation shape.
   */

  const normalized =
    (data ?? [])
      .map((node) => {
        const version =
          Array.isArray(node.curriculum_versions)
            ? node.curriculum_versions[0]
            : node.curriculum_versions;

        if (!version) {
          return null;
        }

        const program =
          Array.isArray(version.programs)
            ? version.programs[0]
            : version.programs;

        if (!program) {
          return null;
        }

        return {
          id: node.id,
          display_name: node.display_name,
          description: node.description,
          sequence_order: node.sequence_order,
          status: node.status,

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
   * -------------------------------------------------------
   * Sort
   * -------------------------------------------------------
   *
   * First by class/program,
   * then by chapter sequence.
   */

  normalized.sort((a, b) => {
    const programCompare =
      a.program.name.localeCompare(
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

    return (
      (a.sequence_order ?? 0) -
      (b.sequence_order ?? 0)
    );
  });

  return normalized;
}