import "server-only";

import { createAdminSupabaseClient } from "@/app/lib/admin/supabase-admin";

/* =========================================================
 * Types
 * ========================================================= */

export type StudentMcqSet = {
  resourceId: string;

  title: string;

  description: string | null;

  setNumber: number | null;

  accessType: string;

  questionCount: number;

  chapterId: string;

  chapterName: string;

  chapterSequence: number | null;

  subjectName: string;

  branchName: string | null;

  session: string;

  className: string;

  classSlug: string;
};

/* =========================================================
 * Get published MCQ sets for a class
 * =========================================================
 *
 * Student visibility boundary:
 *
 *   Resource
 *      ├── resource_type = MCQ
 *      └── status = PUBLISHED
 *
 *   Curriculum
 *      ├── matching class/program
 *      ├── published curriculum version
 *      └── active chapter
 *
 *   Test
 *      ├── test_type = MCQ
 *      └── status = PUBLISHED
 *
 * Curriculum hierarchy:
 *
 *   Mathematics
 *      └── Chapter
 *
 *   Science
 *      ├── Physics
 *      │    └── Chapter
 *      ├── Chemistry
 *      │    └── Chapter
 *      └── Biology
 *           └── Chapter
 *
 * The service resolves the hierarchy so the student-facing
 * pages know whether a chapter belongs directly to a subject
 * or belongs to a branch inside a subject.
 *
 * DRAFT resources are never returned.
 * ========================================================= */

export async function getStudentMcqSets(
  classSlug: string
): Promise<StudentMcqSet[]> {
  const normalizedClassSlug =
    classSlug.trim().toLowerCase();

  if (!normalizedClassSlug) {
    return [];
  }

  const supabase =
    createAdminSupabaseClient();

  /* -------------------------------------------------------
   * 1. Find published class/program
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
      `Failed to load class: ${programError.message}`
    );
  }

  if (!program) {
    return [];
  }

  /* -------------------------------------------------------
   * 2. Find published curriculum version
   * ------------------------------------------------------- */

  const {
    data: curriculumVersion,
    error: versionError,
  } = await supabase
    .from("curriculum_versions")
    .select(
      `
        id,
        session,
        status
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
      "session",
      {
        ascending: false,
      }
    )
    .limit(1)
    .maybeSingle();

  if (versionError) {
    throw new Error(
      `Failed to load curriculum version: ${versionError.message}`
    );
  }

  if (!curriculumVersion) {
    return [];
  }

  /* -------------------------------------------------------
   * 3. Load the complete active curriculum hierarchy
   * -------------------------------------------------------
   *
   * We intentionally load all active nodes instead of treating
   * every node as a chapter.
   *
   * This is necessary because Science has:
   *
   *   Science
   *      ├── Physics
   *      ├── Chemistry
   *      └── Biology
   *
   * while Mathematics can have:
   *
   *   Mathematics
   *      └── Chapter
   *
   * A real chapter is identified as an active node that has
   * no active child nodes.
   * ------------------------------------------------------- */

  const {
    data: curriculumNodes,
    error: curriculumNodesError,
  } = await supabase
    .from("curriculum_nodes")
    .select(
      `
        id,
        curriculum_version_id,
        parent_node_id,
        display_name,
        sequence_order,
        status
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
    .order(
      "sequence_order",
      {
        ascending: true,
      }
    );

  if (curriculumNodesError) {
    throw new Error(
      `Failed to load curriculum hierarchy: ${curriculumNodesError.message}`
    );
  }

  if (
    !curriculumNodes ||
    curriculumNodes.length === 0
  ) {
    return [];
  }

  /* -------------------------------------------------------
   * 4. Build curriculum lookup maps
   * ------------------------------------------------------- */

  const nodeById =
    new Map(
      curriculumNodes.map(
        (node) => [
          node.id,
          node,
        ]
      )
    );

  const childNodeIds =
    new Set(
      curriculumNodes
        .filter(
          (node) =>
            node.parent_node_id !== null
        )
        .map(
          (node) =>
            node.parent_node_id as string
        )
    );

  /*
   * A chapter is an active node that has no active children.
   *
   * This keeps Science branches such as Physics,
   * Chemistry and Biology from being treated as chapters.
   */
  const chapterIds =
    new Set(
      curriculumNodes
        .filter(
          (node) =>
            !childNodeIds.has(node.id)
        )
        .map(
          (node) =>
            node.id
        )
    );

  /* -------------------------------------------------------
   * 5. Find MCQ resources mapped to actual chapters
   * ------------------------------------------------------- */

  const {
    data: resourceMappings,
    error: resourceMappingsError,
  } = await supabase
    .from("resource_curriculum_nodes")
    .select(
      `
        resource_id,
        curriculum_node_id
      `
    )
    .in(
      "curriculum_node_id",
      Array.from(chapterIds)
    );

  if (resourceMappingsError) {
    throw new Error(
      `Failed to load MCQ resource mappings: ${resourceMappingsError.message}`
    );
  }

  if (
    !resourceMappings ||
    resourceMappings.length === 0
  ) {
    return [];
  }

  const resourceIds =
    Array.from(
      new Set(
        resourceMappings.map(
          (mapping) =>
            mapping.resource_id
        )
      )
    );

  /* -------------------------------------------------------
   * 6. Load only PUBLISHED MCQ resources
   * ------------------------------------------------------- */

  const {
    data: resources,
    error: resourcesError,
  } = await supabase
    .from("resources")
    .select(
      `
        id,
        title,
        description,
        access_type,
        status,
        resource_type,
        set_number
      `
    )
    .in(
      "id",
      resourceIds
    )
    .eq(
      "resource_type",
      "MCQ"
    )
    .eq(
      "status",
      "PUBLISHED"
    )
    .order(
      "set_number",
      {
        ascending: true,
      }
    );

  if (resourcesError) {
    throw new Error(
      `Failed to load published MCQ resources: ${resourcesError.message}`
    );
  }

  if (
    !resources ||
    resources.length === 0
  ) {
    return [];
  }

  /* -------------------------------------------------------
   * 7. Load linked PUBLISHED MCQ tests
   * ------------------------------------------------------- */

  const {
    data: tests,
    error: testsError,
  } = await supabase
    .from("tests")
    .select(
      `
        id,
        resource_id,
        status,
        test_type
      `
    )
    .in(
      "resource_id",
      resources.map(
        (resource) =>
          resource.id
      )
    )
    .eq(
      "test_type",
      "MCQ"
    )
    .eq(
      "status",
      "PUBLISHED"
    );

  if (testsError) {
    throw new Error(
      `Failed to load published MCQ tests: ${testsError.message}`
    );
  }

  if (
    !tests ||
    tests.length === 0
  ) {
    return [];
  }

  const publishedResourceIds =
    new Set(
      tests.map(
        (test) =>
          test.resource_id
      )
    );

  /* -------------------------------------------------------
   * 8. Load questions for each published test
   * -------------------------------------------------------
   *
   * We intentionally fetch the actual test_questions rows
   * instead of using a HEAD/count request.
   *
   * This gives us a direct and reliable question count
   * from the same rows that make up the published test.
   * ------------------------------------------------------- */

  const questionCounts =
    new Map<string, number>();

  for (
    const test of tests
  ) {
    const {
      data: questionRows,
      error: questionRowsError,
    } = await supabase
      .from("test_questions")
      .select(
        "question_id"
      )
      .eq(
        "test_id",
        test.id
      );

    if (questionRowsError) {
      throw new Error(
        `Failed to load MCQ questions: ${questionRowsError.message}`
      );
    }

    const questionCount =
      questionRows?.length ?? 0;

    questionCounts.set(
      test.resource_id,
      questionCount
    );
  }

  /* -------------------------------------------------------
   * 9. Build resource → curriculum mapping
   * ------------------------------------------------------- */

  const mappingByResourceId =
    new Map<
      string,
      {
        resource_id: string;
        curriculum_node_id: string;
      }
    >();

  for (
    const mapping of resourceMappings
  ) {
    /*
     * A resource should normally have one curriculum mapping.
     *
     * We keep the first mapping for backward compatibility
     * with the existing student MCQ structure.
     */
    if (
      !mappingByResourceId.has(
        mapping.resource_id
      )
    ) {
      mappingByResourceId.set(
        mapping.resource_id,
        mapping
      );
    }
  }

  /* -------------------------------------------------------
   * 10. Normalize student-facing data
   * ------------------------------------------------------- */

  return resources
    .filter(
      (resource) =>
        publishedResourceIds.has(
          resource.id
        )
    )
    .map(
      (resource) => {
        const mapping =
          mappingByResourceId.get(
            resource.id
          );

        if (!mapping) {
          return null;
        }

        const chapter =
          nodeById.get(
            mapping.curriculum_node_id
          );

        if (
          !chapter ||
          !chapterIds.has(
            chapter.id
          )
        ) {
          return null;
        }

        const questionCount =
          questionCounts.get(
            resource.id
          ) ?? 0;

        /*
         * Defensive publication boundary.
         *
         * A published MCQ Set without questions should
         * never normally reach the student-facing UI.
         */
        if (
          questionCount <= 0
        ) {
          return null;
        }

        /*
         * Resolve the chapter hierarchy.
         *
         * Mathematics:
         *
         *   Mathematics
         *      └── Chapter
         *
         * Science:
         *
         *   Science
         *      └── Physics
         *           └── Chapter
         *
         * Therefore:
         *
         *   direct child of root
         *      → subject = parent
         *      → branch = null
         *
         *   grandchild of root
         *      → subject = grandparent
         *      → branch = parent
         */

        const parent =
          chapter.parent_node_id
            ? nodeById.get(
                chapter.parent_node_id
              )
            : undefined;

        const grandparent =
          parent?.parent_node_id
            ? nodeById.get(
                parent.parent_node_id
              )
            : undefined;

        let subjectName: string;
        let branchName:
          | string
          | null;

        if (grandparent) {
          /*
           * Example:
           *
           * Motion
           *   → Physics
           *      → Science
           */
          subjectName =
            grandparent.display_name;

          branchName =
            parent?.display_name ??
            null;
        } else if (parent) {
          /*
           * Example:
           *
           * Mathematics Chapter
           *   → Mathematics
           */
          subjectName =
            parent.display_name;

          branchName =
            null;
        } else {
          /*
           * Defensive fallback.
           *
           * A valid chapter should normally always have
           * a parent subject in the current curriculum
           * architecture.
           */
          subjectName =
            chapter.display_name;

          branchName =
            null;
        }

        return {
          resourceId:
            resource.id,

          title:
            resource.title,

          description:
            resource.description,

          setNumber:
            resource.set_number,

          accessType:
            resource.access_type,

          questionCount,

          chapterId:
            chapter.id,

          chapterName:
            chapter.display_name,

          chapterSequence:
            chapter.sequence_order,

          subjectName,

          branchName,

          session:
            curriculumVersion.session,

          className:
            program.name,

          classSlug:
            program.slug,
        };
      }
    )
    .filter(
      (
        set
      ): set is StudentMcqSet =>
        set !== null
    )
    .sort(
      (a, b) => {
        /*
         * Keep the existing chapter/set ordering.
         *
         * The page layer will handle subject/branch
         * grouping separately.
         */
        const chapterOrder =
          (a.chapterSequence ?? 0) -
          (b.chapterSequence ?? 0);

        if (
          chapterOrder !== 0
        ) {
          return chapterOrder;
        }

        return (
          (a.setNumber ?? 0) -
          (b.setNumber ?? 0)
        );
      }
    );
}