import "server-only";

import { createAdminSupabaseClient } from "@/app/lib/admin/supabase-admin";


/* =========================================================
 * Types
 * ========================================================= */

export type PublicMcqSet = {
  resourceId: string;

  title: string;

  description: string | null;

  slug: string;

  setNumber: number | null;

  accessType: string;

  status: string;

  chapterId: string;

  chapterName: string;

  chapterSequence: number | null;

  curriculumVersionId: string;

  session: string;

  programId: string;

  programName: string;

  programSlug: string;

  testId: string;

  testStatus: string;

  testType: string;
};


/* =========================================================
 * Get published MCQ Sets for a class
 * =========================================================
 *
 * Student-facing rules:
 *
 * 1. Program must be PUBLISHED.
 * 2. Curriculum version must be PUBLISHED.
 * 3. Curriculum chapter must be ACTIVE.
 * 4. Resource must be MCQ.
 * 5. Resource must be PUBLISHED.
 * 6. Linked Test must be MCQ.
 * 7. Linked Test must be PUBLISHED.
 *
 * DRAFT resources/tests are never returned.
 * ========================================================= */

export async function getPublishedMcqSetsForClass(
  classSlug: string
): Promise<PublicMcqSet[]> {

  const normalizedClassSlug =
    classSlug.trim().toLowerCase();


  if (!normalizedClassSlug) {
    return [];
  }


  const supabase =
    createAdminSupabaseClient();


  /* -------------------------------------------------------
   * 1. Resolve published program
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
      `Failed to load learning program: ${programError.message}`
    );
  }


  if (!program) {
    return [];
  }


  /* -------------------------------------------------------
   * 2. Resolve current published curriculum version
   * ------------------------------------------------------- */

  const {
    data: curriculumVersions,
    error: curriculumVersionError,
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
    );


  if (curriculumVersionError) {
    throw new Error(
      `Failed to load curriculum version: ${curriculumVersionError.message}`
    );
  }


  if (
    !curriculumVersions ||
    curriculumVersions.length === 0
  ) {
    return [];
  }


  /*
   * The newest published curriculum version is treated
   * as the current student-facing version.
   */

  const curriculumVersion =
    curriculumVersions[0];


  /* -------------------------------------------------------
   * 3. Load active chapters
   * ------------------------------------------------------- */

  const {
    data: chapters,
    error: chaptersError,
  } = await supabase
    .from("curriculum_nodes")
    .select(
      `
        id,
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
   * 4. Load only PUBLISHED MCQ resources
   * ------------------------------------------------------- */

  const {
    data: resourceMappings,
    error: resourceMappingsError,
  } = await supabase
    .from("resource_curriculum_nodes")
    .select(
      `
        resource_id,
        curriculum_node_id,
        resources!inner (
          id,
          title,
          slug,
          description,
          resource_type,
          access_type,
          status,
          set_number
        )
      `
    )
    .in(
      "curriculum_node_id",
      chapterIds
    )
    .eq(
      "resources.resource_type",
      "MCQ"
    )
    .eq(
      "resources.status",
      "PUBLISHED"
    );


  if (resourceMappingsError) {
    throw new Error(
      `Failed to load published MCQ resources: ${resourceMappingsError.message}`
    );
  }


  if (
    !resourceMappings ||
    resourceMappings.length === 0
  ) {
    return [];
  }


  /* -------------------------------------------------------
   * 5. Normalize resource rows
   * ------------------------------------------------------- */

  const publishedResources =
    resourceMappings
      .map(
        (mapping) => {

          const resource =
            Array.isArray(mapping.resources)
              ? mapping.resources[0]
              : mapping.resources;


          if (!resource) {
            return null;
          }


          return {
            mapping,
            resource,
          };
        }
      )
      .filter(
        (
          item
        ): item is NonNullable<typeof item> =>
          item !== null
      );


  if (
    publishedResources.length === 0
  ) {
    return [];
  }


  const resourceIds =
    publishedResources.map(
      (item) =>
        item.resource.id
    );


  /* -------------------------------------------------------
   * 6. Load linked published MCQ tests
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
        title,
        test_type,
        status,
        access_type
      `
    )
    .in(
      "resource_id",
      resourceIds
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
   * 7. Build lookup maps
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


  const testByResourceId =
    new Map(
      tests.map(
        (test) => [
          test.resource_id,
          test,
        ]
      )
    );


  /* -------------------------------------------------------
   * 8. Build final student-facing Set list
   * ------------------------------------------------------- */

  const result =
    publishedResources
      .map(
        ({
          mapping,
          resource,
        }) => {

          const chapter =
            chapterById.get(
              mapping.curriculum_node_id
            );


          const test =
            testByResourceId.get(
              resource.id
            );


          /*
           * A published resource without a published
           * linked MCQ test is not student-visible.
           */

          if (
            !chapter ||
            !test
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

            slug:
              resource.slug,

            setNumber:
              resource.set_number,

            accessType:
              resource.access_type,

            status:
              resource.status,

            chapterId:
              chapter.id,

            chapterName:
              chapter.display_name,

            chapterSequence:
              chapter.sequence_order,

            curriculumVersionId:
              curriculumVersion.id,

            session:
              curriculumVersion.session,

            programId:
              program.id,

            programName:
              program.name,

            programSlug:
              program.slug,

            testId:
              test.id,

            testStatus:
              test.status,

            testType:
              test.test_type,
          };
        }
      )
      .filter(
        (
          item
        ): item is PublicMcqSet =>
          item !== null
      );


  /* -------------------------------------------------------
   * 9. Final deterministic ordering
   * ------------------------------------------------------- */

  result.sort(
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


  return result;
}