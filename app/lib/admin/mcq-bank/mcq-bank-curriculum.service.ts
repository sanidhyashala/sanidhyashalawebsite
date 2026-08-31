import { requireAdmin } from "@/app/lib/auth/admin";
import { createAdminSupabaseClient } from "@/app/lib/admin/supabase-admin";

/* =========================================================
 * Types
 * ========================================================= */

export type AdminMcqCurriculumChapter = {
  id: string;
  display_name: string;
  description: string | null;
  sequence_order: number | null;
};

export type AdminMcqCurriculumNode =
  AdminMcqCurriculumChapter;

export type AdminMcqCurriculumClass = {
  id: string;
  name: string;
  slug: string;
  session: string | null;
  curriculum_version_id: string;
  chapters: AdminMcqCurriculumChapter[];
};


/* =========================================================
 * Get flat curriculum nodes
 *
 * Used by MCQ Set creation.
 * ========================================================= */

export async function getAdminMcqCurriculumNodes(): Promise<
  AdminMcqCurriculumNode[]
> {
  await requireAdmin();

  const supabase =
    createAdminSupabaseClient();

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
        parent_node_id
      `
    )
    .eq(
      "status",
      "ACTIVE"
    )
    .not(
      "parent_node_id",
      "is",
      null
    )
    .order(
      "sequence_order",
      {
        ascending: true,
      }
    );

  if (error) {
    throw new Error(
      `Failed to load MCQ curriculum nodes: ${error.message}`
    );
  }

  return data ?? [];
}


/* =========================================================
 * Get Class → Chapters structure
 *
 * Used by MCQ question creation.
 * ========================================================= */

export async function getAdminMcqCurriculumClasses(): Promise<
  AdminMcqCurriculumClass[]
> {
  await requireAdmin();

  const supabase =
    createAdminSupabaseClient();


  /* -------------------------------------------------------
   * 1. Load published curriculum versions
   * ------------------------------------------------------- */

  const {
    data: curriculumVersions,
    error: curriculumVersionsError,
  } = await supabase
    .from("curriculum_versions")
    .select(
      `
        id,
        program_id,
        session
      `
    )
    .eq(
      "status",
      "PUBLISHED"
    );

  if (curriculumVersionsError) {
    throw new Error(
      `Failed to load curriculum versions: ${curriculumVersionsError.message}`
    );
  }

  if (
    !curriculumVersions ||
    curriculumVersions.length === 0
  ) {
    return [];
  }


  /* -------------------------------------------------------
   * 2. Load programs
   * ------------------------------------------------------- */

  const programIds = [
    ...new Set(
      curriculumVersions.map(
        (version) =>
          version.program_id
      )
    ),
  ];

  const {
    data: programs,
    error: programsError,
  } = await supabase
    .from("programs")
    .select(
      `
        id,
        name,
        slug
      `
    )
    .in(
      "id",
      programIds
    );

  if (programsError) {
    throw new Error(
      `Failed to load programs: ${programsError.message}`
    );
  }

  if (
    !programs ||
    programs.length === 0
  ) {
    return [];
  }


  /* -------------------------------------------------------
   * 3. Program lookup
   * ------------------------------------------------------- */

  const programById =
    new Map<
      string,
      (typeof programs)[number]
    >();

  for (
    const program of programs
  ) {
    programById.set(
      program.id,
      program
    );
  }


  /* -------------------------------------------------------
   * 4. Keep only valid curriculum versions
   * ------------------------------------------------------- */

  const validVersions =
    curriculumVersions.filter(
      (version) =>
        programById.has(
          version.program_id
        )
    );

  if (
    validVersions.length === 0
  ) {
    return [];
  }

  const versionIds =
    validVersions.map(
      (version) =>
        version.id
    );


  /* -------------------------------------------------------
   * 5. Load active chapter nodes
   *
   * IMPORTANT:
   *
   * In the database:
   *
   *   Mathematics
   *      ├── Chapter 1
   *      ├── Chapter 2
   *      └── ...
   *
   * Mathematics is the root node
   * (parent_node_id = NULL).
   *
   * Actual chapters have
   * parent_node_id != NULL.
   * ------------------------------------------------------- */

  const {
    data: curriculumNodes,
    error: curriculumNodesError,
  } = await supabase
    .from("curriculum_nodes")
    .select(
      `
        id,
        display_name,
        description,
        sequence_order,
        curriculum_version_id,
        parent_node_id
      `
    )
    .in(
      "curriculum_version_id",
      versionIds
    )
    .eq(
      "status",
      "ACTIVE"
    )
    .not(
      "parent_node_id",
      "is",
      null
    )
    .order(
      "sequence_order",
      {
        ascending: true,
      }
    );

  if (curriculumNodesError) {
    throw new Error(
      `Failed to load curriculum chapters: ${curriculumNodesError.message}`
    );
  }


  /* -------------------------------------------------------
   * 6. Group chapters by curriculum version
   * ------------------------------------------------------- */

  const chaptersByVersion =
    new Map<
      string,
      AdminMcqCurriculumChapter[]
    >();

  for (
    const node of curriculumNodes ?? []
  ) {
    const chapter:
      AdminMcqCurriculumChapter = {
      id:
        node.id,

      display_name:
        node.display_name ?? "",

      description:
        node.description,

      sequence_order:
        node.sequence_order,
    };

    const existing =
      chaptersByVersion.get(
        node.curriculum_version_id
      );

    if (existing) {
      existing.push(
        chapter
      );
    } else {
      chaptersByVersion.set(
        node.curriculum_version_id,
        [chapter]
      );
    }
  }


  /* -------------------------------------------------------
   * 7. Build Class → Chapters structure
   * ------------------------------------------------------- */

  const result:
    AdminMcqCurriculumClass[] =
    [];

  for (
    const version of validVersions
  ) {
    const program =
      programById.get(
        version.program_id
      );

    if (!program) {
      continue;
    }

    const chapters =
      chaptersByVersion.get(
        version.id
      ) ?? [];

    if (
      chapters.length === 0
    ) {
      continue;
    }

    chapters.sort(
      (a, b) =>
        (a.sequence_order ?? 0) -
        (b.sequence_order ?? 0)
    );

    result.push({
      id:
        program.id,

      name:
        program.name,

      slug:
        program.slug,

      session:
        version.session,

      curriculum_version_id:
        version.id,

      chapters,
    });
  }


  /* -------------------------------------------------------
   * 8. Stable class ordering
   * ------------------------------------------------------- */

  result.sort(
    (a, b) =>
      a.name.localeCompare(
        b.name,
        undefined,
        {
          numeric: true,
          sensitivity: "base",
        }
      )
  );

  return result;
}