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

export type AdminMcqCurriculumBranch = {
  id: string;
  display_name: string;
  description: string | null;
  sequence_order: number | null;
  chapters: AdminMcqCurriculumChapter[];
};

export type AdminMcqCurriculumSubject = {
  id: string;
  display_name: string;
  description: string | null;
  sequence_order: number | null;

  /*
   * Mathematics:
   *
   *   Subject
   *     └── chapters
   *
   * Science:
   *
   *   Subject
   *     ├── Physics
   *     ├── Chemistry
   *     └── Biology
   *
   * Therefore:
   *
   * - Mathematics will use chapters directly.
   * - Science will use branches.
   */

  chapters: AdminMcqCurriculumChapter[];

  branches: AdminMcqCurriculumBranch[];
};

export type AdminMcqCurriculumNode =
  AdminMcqCurriculumChapter;

export type AdminMcqCurriculumClass = {
  id: string;
  name: string;
  slug: string;
  session: string | null;
  curriculum_version_id: string;

  /*
   * ---------------------------------------------------------
   * Backward-compatible chapter list
   * ---------------------------------------------------------
   *
   * Existing consumers that still expect:
   *
   *   curriculumClasses[].chapters
   *
   * will continue to receive actual chapter nodes.
   *
   * IMPORTANT:
   *
   * Subject nodes such as Physics/Chemistry/Biology are
   * NOT included here.
   */
  chapters: AdminMcqCurriculumChapter[];

  /*
   * ---------------------------------------------------------
   * Structured curriculum
   * ---------------------------------------------------------
   *
   * Class
   * └── Subject
   *     ├── Chapters
   *     └── Branches
   *         └── Chapters
   *
   * This is what the new MCQ Set creation UI will use.
   */
  subjects: AdminMcqCurriculumSubject[];
};

/* =========================================================
 * Get flat curriculum nodes
 *
 * Used by existing MCQ functionality that still needs a
 * flat list of actual curriculum nodes.
 *
 * This function intentionally remains compatible with the
 * existing behaviour.
 * ========================================================= */

export async function getAdminMcqCurriculumNodes(): Promise<
  AdminMcqCurriculumNode[]
> {
  await requireAdmin();

  const supabase = createAdminSupabaseClient();

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
      `,
    )
    .eq("status", "ACTIVE")
    .not("parent_node_id", "is", null)
    .order("sequence_order", {
      ascending: true,
    });

  if (error) {
    throw new Error(
      `Failed to load MCQ curriculum nodes: ${error.message}`,
    );
  }

  return data ?? [];
}

/* =========================================================
 * Get Class → Subject → Branch → Chapter structure
 *
 * This is the canonical curriculum structure for MCQ
 * Set creation.
 *
 * Mathematics:
 *
 *   Class
 *     └── Mathematics
 *           ├── Chapter 1
 *           ├── Chapter 2
 *           └── ...
 *
 * Science:
 *
 *   Class
 *     └── Science
 *           ├── Physics
 *           │     ├── Chapter 1
 *           │     └── ...
 *           ├── Chemistry
 *           │     ├── Chapter 1
 *           │     └── ...
 *           └── Biology
 *                 ├── Chapter 1
 *                 └── ...
 *
 * No database changes are required.
 * Existing curriculum_nodes.parent_node_id is the source
 * of truth.
 * ========================================================= */

export async function getAdminMcqCurriculumClasses(): Promise<
  AdminMcqCurriculumClass[]
> {
  await requireAdmin();

  const supabase = createAdminSupabaseClient();

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
      `,
    )
    .eq("status", "PUBLISHED");

  if (curriculumVersionsError) {
    throw new Error(
      `Failed to load curriculum versions: ${curriculumVersionsError.message}`,
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
        (version) => version.program_id,
      ),
    ),
  ];

  if (programIds.length === 0) {
    return [];
  }

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
      `,
    )
    .in("id", programIds);

  if (programsError) {
    throw new Error(
      `Failed to load programs: ${programsError.message}`,
    );
  }

  if (!programs || programs.length === 0) {
    return [];
  }

  /* -------------------------------------------------------
   * 3. Program lookup
   * ------------------------------------------------------- */

  const programById = new Map<
    string,
    (typeof programs)[number]
  >();

  for (const program of programs) {
    programById.set(program.id, program);
  }

  /* -------------------------------------------------------
   * 4. Keep only valid curriculum versions
   * ------------------------------------------------------- */

  const validVersions = curriculumVersions.filter(
    (version) =>
      programById.has(version.program_id),
  );

  if (validVersions.length === 0) {
    return [];
  }

  const versionIds = validVersions.map(
    (version) => version.id,
  );

  /* -------------------------------------------------------
   * 5. Load ALL active curriculum nodes
   *
   * We intentionally do NOT flatten them here.
   *
   * parent_node_id gives us the actual hierarchy:
   *
   * root
   *   ↓
   * subject
   *   ↓
   * branch / chapter
   *   ↓
   * chapter
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
      `,
    )
    .in(
      "curriculum_version_id",
      versionIds,
    )
    .eq("status", "ACTIVE")
    .order("sequence_order", {
      ascending: true,
    });

  if (curriculumNodesError) {
    throw new Error(
      `Failed to load curriculum nodes: ${curriculumNodesError.message}`,
    );
  }

  if (
    !curriculumNodes ||
    curriculumNodes.length === 0
  ) {
    return [];
  }

  /* -------------------------------------------------------
   * 6. Group nodes by curriculum version
   * ------------------------------------------------------- */

  const nodesByVersion = new Map<
    string,
    typeof curriculumNodes
  >();

  for (const node of curriculumNodes) {
    const existing =
      nodesByVersion.get(
        node.curriculum_version_id,
      );

    if (existing) {
      existing.push(node);
    } else {
      nodesByVersion.set(
        node.curriculum_version_id,
        [node],
      );
    }
  }

  /* -------------------------------------------------------
   * 7. Build Class → Subject → Branch → Chapter
   * ------------------------------------------------------- */

  const result: AdminMcqCurriculumClass[] = [];

  for (const version of validVersions) {
    const program =
      programById.get(
        version.program_id,
      );

    if (!program) {
      continue;
    }

    const versionNodes =
      nodesByVersion.get(
        version.id,
      ) ?? [];

    if (versionNodes.length === 0) {
      continue;
    }

    /* -----------------------------------------------------
     * 7A. Root nodes = Subjects
     *
     * Example:
     *
     * Mathematics
     * Science
     * ----------------------------------------------------- */

    const rootSubjects =
      versionNodes
        .filter(
          (node) =>
            node.parent_node_id === null,
        )
        .sort(
          (a, b) =>
            (a.sequence_order ?? 0) -
            (b.sequence_order ?? 0),
        );

    const subjects: AdminMcqCurriculumSubject[] =
      [];

    /* All actual chapters for backward compatibility */
    const allChapters: AdminMcqCurriculumChapter[] =
      [];

    for (const subjectNode of rootSubjects) {
      /* ---------------------------------------------------
       * 7B. Direct children of subject
       *
       * Mathematics:
       *
       *   direct children = chapters
       *
       * Science:
       *
       *   direct children = Physics,
       *                     Chemistry,
       *                     Biology
       * --------------------------------------------------- */

      const directChildren =
        versionNodes
          .filter(
            (node) =>
              node.parent_node_id ===
              subjectNode.id,
          )
          .sort(
            (a, b) =>
              (a.sequence_order ?? 0) -
              (b.sequence_order ?? 0),
          );

      const directChapterCandidates: AdminMcqCurriculumChapter[] =
        [];

      const branches: AdminMcqCurriculumBranch[] =
        [];

      for (const child of directChildren) {
        /* -------------------------------------------------
         * Look for children of this node.
         *
         * If the node has children, it is a branch
         * such as Physics / Chemistry / Biology.
         *
         * If it has no children, it is a direct chapter
         * such as Mathematics → Chapter 1.
         * ------------------------------------------------- */

        const grandchildren =
          versionNodes
            .filter(
              (node) =>
                node.parent_node_id ===
                child.id,
            )
            .sort(
              (a, b) =>
                (a.sequence_order ?? 0) -
                (b.sequence_order ?? 0),
            );

        if (grandchildren.length === 0) {
          /* -----------------------------------------------
           * Direct chapter
           * ----------------------------------------------- */

          const chapter: AdminMcqCurriculumChapter =
            {
              id: child.id,
              display_name:
                child.display_name ?? "",
              description:
                child.description,
              sequence_order:
                child.sequence_order,
            };

          directChapterCandidates.push(
            chapter,
          );

          allChapters.push(chapter);

          continue;
        }

        /* -----------------------------------------------
         * Branch
         *
         * Example:
         *
         * Science
         *   └── Physics
         *         ├── Chapter 1
         *         └── Chapter 2
         * ----------------------------------------------- */

        const branchChapters =
          grandchildren.map(
            (chapterNode) => {
              const chapter: AdminMcqCurriculumChapter =
                {
                  id: chapterNode.id,
                  display_name:
                    chapterNode.display_name ??
                    "",
                  description:
                    chapterNode.description,
                  sequence_order:
                    chapterNode.sequence_order,
                };

              allChapters.push(chapter);

              return chapter;
            },
          );

        branches.push({
          id: child.id,
          display_name:
            child.display_name ?? "",
          description:
            child.description,
          sequence_order:
            child.sequence_order,
          chapters:
            branchChapters,
        });
      }

      /* ---------------------------------------------------
       * Subject
       * --------------------------------------------------- */

      subjects.push({
        id: subjectNode.id,
        display_name:
          subjectNode.display_name ?? "",
        description:
          subjectNode.description,
        sequence_order:
          subjectNode.sequence_order,

        /*
         * Mathematics will normally have chapters here.
         *
         * Science will normally have [] here because
         * Physics/Chemistry/Biology are branches.
         */
        chapters:
          directChapterCandidates,

        /*
         * Science will have:
         *
         * Physics
         * Chemistry
         * Biology
         *
         * Mathematics will normally have [] here.
         */
        branches,
      });
    }

    /* -----------------------------------------------------
     * 8. Safety check
     * ----------------------------------------------------- */

    if (
      subjects.length === 0 ||
      allChapters.length === 0
    ) {
      continue;
    }

    /* -----------------------------------------------------
     * 9. Build final class object
     * ----------------------------------------------------- */

    result.push({
      id: program.id,
      name: program.name,
      slug: program.slug,
      session: version.session,
      curriculum_version_id:
        version.id,

      /*
       * Backward-compatible flat list.
       *
       * IMPORTANT:
       *
       * This contains ONLY actual chapters.
       * Physics/Chemistry/Biology are never inserted
       * as chapters.
       */
      chapters: allChapters.sort(
        (a, b) =>
          (a.sequence_order ?? 0) -
          (b.sequence_order ?? 0),
      ),

      /*
       * New structured hierarchy.
       */
      subjects,
    });
  }

  /* -------------------------------------------------------
   * 10. Stable class ordering
   *
   * Class IX
   * Class X
   * Class XI
   * Class XII
   * ------------------------------------------------------- */

  result.sort(
    (a, b) =>
      a.name.localeCompare(
        b.name,
        undefined,
        {
          numeric: true,
          sensitivity: "base",
        },
      ),
  );

  return result;
}