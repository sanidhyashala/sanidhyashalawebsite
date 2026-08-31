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
 * Resource
 *   ├── resource_type = MCQ
 *   └── status = PUBLISHED
 *
 * Curriculum
 *   ├── matching class/program
 *   ├── published curriculum version
 *   └── active chapter
 *
 * Test
 *   ├── test_type = MCQ
 *   └── status = PUBLISHED
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
    .select(`
      id,
      name,
      slug,
      status
    `)
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
    .select(`
      id,
      session,
      status
    `)
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
   * 3. Find active chapters
   * ------------------------------------------------------- */

  const {
    data: chapters,
    error: chaptersError,
  } = await supabase
    .from("curriculum_nodes")
    .select(`
      id,
      display_name,
      sequence_order,
      status
    `)
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

  if (chaptersError) {
    throw new Error(
      `Failed to load curriculum chapters: ${chaptersError.message}`
    );
  }

  if (
    !chapters ||
    chapters.length === 0
  ) {
    return [];
  }

  const chapterIds =
    chapters.map(
      (chapter) =>
        chapter.id
    );

  /* -------------------------------------------------------
   * 4. Find MCQ resources mapped to these chapters
   * ------------------------------------------------------- */

  const {
    data: resourceMappings,
    error: resourceMappingsError,
  } = await supabase
    .from("resource_curriculum_nodes")
    .select(`
      resource_id,
      curriculum_node_id
    `)
    .in(
      "curriculum_node_id",
      chapterIds
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
   * 5. Load only PUBLISHED MCQ resources
   * ------------------------------------------------------- */

  const {
    data: resources,
    error: resourcesError,
  } = await supabase
    .from("resources")
    .select(`
      id,
      title,
      description,
      access_type,
      status,
      resource_type,
      set_number
    `)
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
   * 6. Load linked PUBLISHED MCQ tests
   * ------------------------------------------------------- */

  const {
    data: tests,
    error: testsError,
  } = await supabase
    .from("tests")
    .select(`
      id,
      resource_id,
      status,
      test_type
    `)
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
   * 7. Load questions for each published test
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
   * 8. Build lookup maps
   * ------------------------------------------------------- */

  const chapterById =
    new Map(
      chapters.map(
        (chapter) => [
          chapter.id,
          chapter,
        ]
      )
    );

  const mappingByResourceId =
    new Map(
      resourceMappings.map(
        (mapping) => [
          mapping.resource_id,
          mapping,
        ]
      )
    );

  /* -------------------------------------------------------
   * 9. Normalize student-facing data
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

        const chapter =
          mapping
            ? chapterById.get(
                mapping.curriculum_node_id
              )
            : undefined;

        if (!chapter) {
          return null;
        }

        const questionCount =
          questionCounts.get(
            resource.id
          ) ?? 0;

        /* -------------------------------------------------
         * Defensive publication boundary
         * ------------------------------------------------- */

        if (
          questionCount <= 0
        ) {
          return null;
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


/* =========================================================
 * Get published MCQ sets for a specific chapter
 * =========================================================
 *
 * This function is used by:
 *
 * /learning/class-10/mcq/[chapterId]
 *
 * It first verifies that the chapter belongs to the
 * requested class's currently published curriculum.
 *
 * Only then are MCQ resources for that chapter loaded.
 * ========================================================= */

export async function getStudentMcqSetsByChapter(
  classSlug: string,
  chapterId: string
): Promise<StudentMcqSet[]> {
  const normalizedClassSlug =
    classSlug.trim().toLowerCase();

  const normalizedChapterId =
    chapterId.trim();

  if (
    !normalizedClassSlug ||
    !normalizedChapterId
  ) {
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
    .select(`
      id,
      name,
      slug,
      status
    `)
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
    .select(`
      id,
      session,
      status
    `)
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
   * 3. Validate requested chapter
   * ------------------------------------------------------- */

  const {
    data: chapter,
    error: chapterError,
  } = await supabase
    .from("curriculum_nodes")
    .select(`
      id,
      display_name,
      sequence_order,
      status
    `)
    .eq(
      "id",
      normalizedChapterId
    )
    .eq(
      "curriculum_version_id",
      curriculumVersion.id
    )
    .eq(
      "status",
      "ACTIVE"
    )
    .maybeSingle();

  if (chapterError) {
    throw new Error(
      `Failed to load MCQ chapter: ${chapterError.message}`
    );
  }

  if (!chapter) {
    return [];
  }

  /* -------------------------------------------------------
   * 4. Find resources mapped ONLY to this chapter
   * ------------------------------------------------------- */

  const {
    data: resourceMappings,
    error: resourceMappingsError,
  } = await supabase
    .from("resource_curriculum_nodes")
    .select(`
      resource_id,
      curriculum_node_id
    `)
    .eq(
      "curriculum_node_id",
      chapter.id
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

  if (
    resourceIds.length === 0
  ) {
    return [];
  }

  /* -------------------------------------------------------
   * 5. Load published MCQ resources
   * ------------------------------------------------------- */

  const {
    data: resources,
    error: resourcesError,
  } = await supabase
    .from("resources")
    .select(`
      id,
      title,
      description,
      access_type,
      status,
      resource_type,
      set_number
    `)
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
   * 6. Load linked published MCQ tests
   * ------------------------------------------------------- */

  const {
    data: tests,
    error: testsError,
  } = await supabase
    .from("tests")
    .select(`
      id,
      resource_id,
      status,
      test_type
    `)
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

  /* -------------------------------------------------------
   * 7. Published resource IDs
   * ------------------------------------------------------- */

  const publishedResourceIds =
    new Set(
      tests.map(
        (test) =>
          test.resource_id
      )
    );

  /* -------------------------------------------------------
   * 8. Count questions for each test
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

    questionCounts.set(
      test.resource_id,
      questionRows?.length ?? 0
    );
  }

  /* -------------------------------------------------------
   * 9. Normalize chapter MCQ sets
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
        const questionCount =
          questionCounts.get(
            resource.id
          ) ?? 0;

        /*
         * Published resource without questions
         * should not appear to students.
         */

        if (
          questionCount <= 0
        ) {
          return null;
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
      (a, b) =>
        (a.setNumber ?? 0) -
        (b.setNumber ?? 0)
    );
}