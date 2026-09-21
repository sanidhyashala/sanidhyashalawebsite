import { requireAdmin } from "@/app/lib/auth/admin";
import { createAdminSupabaseClient } from "@/app/lib/admin/supabase-admin";

/* =========================================================
 * Types
 * ========================================================= */

export type AdminMcqRevisionOption = {
  id: string;
  option_key: "A" | "B" | "C" | "D";
  option_text: string;
  display_order: number;
  is_correct: boolean;
};

export type AdminMcqRevision = {
  id: string;
  question_id: string;
  revision_number: number;
  question_text: string;
  solution_text: string | null;
  mistake_insight: string | null;
  status: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  options: AdminMcqRevisionOption[];
};

/* =========================================================
 * Attached MCQ Set
 * =========================================================
 *
 * Shows which MCQ Sets currently use a question.
 *
 * Example:
 *
 * Question #1
 *   └── Set 1
 *   └── Set 20
 *
 * A question can belong to multiple Sets.
 * ========================================================= */

export type AdminMcqAttachedSet = {
  resource_id: string;
  title: string;
  set_number: number | null;
  status: string;
};

export type AdminMcq = {
  id: string;

  /*
   * Stable admin-facing question number.
   */
  admin_question_number: number;

  question_text: string;

  question_type: string;

  source_type: string;

  source_reference: string | null;

  difficulty: string | null;

  marks: number | null;

  estimated_time_minutes: number | null;

  status: string;

  current_revision_id: string | null;

  created_at: string;

  updated_at: string;

  /*
   * Curriculum context.
   */
  curriculum_node_id: string | null;

  chapter_name: string | null;

  chapter_sequence_order: number | null;

  class_name: string | null;

  class_slug: string | null;

  /*
   * MCQ Set usage.
   *
   * One question may be reused across multiple
   * MCQ Sets.
   */
  attached_sets: AdminMcqAttachedSet[];
};

export type AdminMcqOption = AdminMcqRevisionOption;

export type AdminMcqDetail = {
  id: string;

  /*
   * Stable admin-facing question number.
   */
  admin_question_number: number;

  question_text: string;

  question_type: string;

  source_type: string;

  source_reference: string | null;

  difficulty: string | null;

  marks: number | null;

  estimated_time_minutes: number | null;

  status: string;

  current_revision_id: string | null;

  created_at: string;

  updated_at: string;

  revision: AdminMcqRevision | null;

  /*
   * Compatibility field.
   */
  options: AdminMcqOption[];

  curriculum_node_id: string | null;

  chapter_name: string | null;

  chapter_sequence_order: number | null;

  class_name: string | null;

  class_slug: string | null;

  /*
   * MCQ Set usage.
   */
  attached_sets: AdminMcqAttachedSet[];
};

/* =========================================================
 * Get all MCQs for Admin MCQ Bank
 * ========================================================= */

export async function getAdminMcqs(): Promise<AdminMcq[]> {
  /* -------------------------------------------------------
   * 1. Admin authentication
   * ------------------------------------------------------- */

  await requireAdmin();

  /* -------------------------------------------------------
   * 2. Trusted server-side Supabase client
   * ------------------------------------------------------- */

  const supabase = createAdminSupabaseClient();

  /* -------------------------------------------------------
   * 3. Load MCQ questions
   * ------------------------------------------------------- */

  const {
    data,
    error,
  } = await supabase
    .from("questions")
    .select(
      `
        id,
        admin_question_number,
        question_text,
        question_type,
        source_type,
        source_reference,
        difficulty,
        marks,
        estimated_time_minutes,
        status,
        current_revision_id,
        created_at,
        updated_at
      `
    )
    .eq(
      "question_type",
      "MCQ"
    )
    .order(
      "created_at",
      {
        ascending: false,
      }
    );

  if (error) {
    throw new Error(
      `Failed to load MCQ Bank: ${error.message}`
    );
  }

  const questions = (data ?? []) as Array<
    Omit<
      AdminMcq,
      | "curriculum_node_id"
      | "chapter_name"
      | "chapter_sequence_order"
      | "class_name"
      | "class_slug"
      | "attached_sets"
    >
  >;

  if (questions.length === 0) {
    return [];
  }

  const questionIds = questions.map(
    (question) => question.id
  );

  /* -------------------------------------------------------
   * 4. Load question → curriculum mappings
   * ------------------------------------------------------- */

  const {
    data: curriculumMappings,
    error: curriculumMappingsError,
  } = await supabase
    .from(
      "question_curriculum_nodes"
    )
    .select(
      `
        question_id,
        curriculum_node_id
      `
    )
    .in(
      "question_id",
      questionIds
    );

  if (curriculumMappingsError) {
    throw new Error(
      `Failed to load MCQ curriculum mappings: ${curriculumMappingsError.message}`
    );
  }

  /* -------------------------------------------------------
   * 5. Build question → curriculum node lookup
   * ------------------------------------------------------- */

  const curriculumNodeByQuestionId =
    new Map<string, string>();

  for (
    const mapping of
      curriculumMappings ?? []
  ) {
    if (
      !curriculumNodeByQuestionId.has(
        mapping.question_id
      )
    ) {
      curriculumNodeByQuestionId.set(
        mapping.question_id,
        mapping.curriculum_node_id
      );
    }
  }

  const curriculumNodeIds = [
    ...new Set(
      (curriculumMappings ?? []).map(
        (mapping) =>
          mapping.curriculum_node_id
      )
    ),
  ];

  /* -------------------------------------------------------
   * 6. Load curriculum nodes
   * ------------------------------------------------------- */

  const curriculumNodeById =
    new Map<
      string,
      {
        id: string;
        display_name: string;
        sequence_order: number | null;
        curriculum_version_id: string;
      }
    >();

  if (
    curriculumNodeIds.length > 0
  ) {
    const {
      data: curriculumNodes,
      error: curriculumNodesError,
    } = await supabase
      .from(
        "curriculum_nodes"
      )
      .select(
        `
          id,
          display_name,
          sequence_order,
          curriculum_version_id
        `
      )
      .in(
        "id",
        curriculumNodeIds
      );

    if (curriculumNodesError) {
      throw new Error(
        `Failed to load MCQ curriculum chapters: ${curriculumNodesError.message}`
      );
    }

    for (
      const node of
        curriculumNodes ?? []
    ) {
      curriculumNodeById.set(
        node.id,
        node
      );
    }
  }

  /* -------------------------------------------------------
   * 7. Load curriculum versions
   * ------------------------------------------------------- */

  const curriculumVersionIds = [
    ...new Set(
      Array.from(
        curriculumNodeById.values()
      ).map(
        (node) =>
          node.curriculum_version_id
      )
    ),
  ];

  const curriculumVersionById =
    new Map<
      string,
      {
        id: string;
        program_id: string;
        session: string | null;
        status: string;
      }
    >();

  if (
    curriculumVersionIds.length > 0
  ) {
    const {
      data: curriculumVersions,
      error: curriculumVersionsError,
    } = await supabase
      .from(
        "curriculum_versions"
      )
      .select(
        `
          id,
          program_id,
          session,
          status
        `
      )
      .in(
        "id",
        curriculumVersionIds
      );

    if (curriculumVersionsError) {
      throw new Error(
        `Failed to load MCQ curriculum versions: ${curriculumVersionsError.message}`
      );
    }

    for (
      const version of
        curriculumVersions ?? []
    ) {
      curriculumVersionById.set(
        version.id,
        version
      );
    }
  }

  /* -------------------------------------------------------
   * 8. Load programs
   * ------------------------------------------------------- */

  const programIds = [
    ...new Set(
      Array.from(
        curriculumVersionById.values()
      ).map(
        (version) =>
          version.program_id
      )
    ),
  ];

  const programById =
    new Map<
      string,
      {
        id: string;
        name: string;
        slug: string;
      }
    >();

  if (
    programIds.length > 0
  ) {
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
        `Failed to load MCQ curriculum programs: ${programsError.message}`
      );
    }

    for (
      const program of
        programs ?? []
    ) {
      programById.set(
        program.id,
        program
      );
    }
  }

  /* -------------------------------------------------------
   * 9. Load latest revision for every MCQ
   * ------------------------------------------------------- */

  const {
    data: revisions,
    error: revisionsError,
  } = await supabase
    .from(
      "question_revisions"
    )
    .select(
      `
        id,
        question_id,
        revision_number,
        question_text,
        status
      `
    )
    .in(
      "question_id",
      questionIds
    )
    .order(
      "revision_number",
      {
        ascending: false,
      }
    );

  if (revisionsError) {
    throw new Error(
      `Failed to load MCQ revisions: ${revisionsError.message}`
    );
  }

  /* -------------------------------------------------------
   * 10. Keep only latest revision per question
   * ------------------------------------------------------- */

  const latestRevisionByQuestionId =
    new Map<
      string,
      {
        id: string;
        question_id: string;
        revision_number: number;
        question_text: string;
        status: string;
      }
    >();

  for (
    const revision of
      revisions ?? []
  ) {
    if (
      !latestRevisionByQuestionId.has(
        revision.question_id
      )
    ) {
      latestRevisionByQuestionId.set(
        revision.question_id,
        revision
      );
    }
  }

  /* -------------------------------------------------------
   * 11. Load question → MCQ Set relationships
   *
   * Relationship:
   *
   * questions
   *    ↓
   * test_questions
   *    ↓
   * tests
   *    ↓
   * resources
   *
   * A single question may be attached to many Sets.
   * ------------------------------------------------------- */

  const {
    data: testQuestionRows,
    error: testQuestionRowsError,
  } = await supabase
    .from("test_questions")
    .select(
      `
        question_id,
        test_id
      `
    )
    .in(
      "question_id",
      questionIds
    );

  if (testQuestionRowsError) {
    throw new Error(
      `Failed to load MCQ Set attachments: ${testQuestionRowsError.message}`
    );
  }

  /* -------------------------------------------------------
   * 12. Build question → test IDs lookup
   * ------------------------------------------------------- */

  const testIds = [
    ...new Set(
      (testQuestionRows ?? []).map(
        (row) => row.test_id
      )
    ),
  ];

  const testIdsByQuestionId =
    new Map<
      string,
      string[]
    >();

  for (
    const row of
      testQuestionRows ?? []
  ) {
    const existing =
      testIdsByQuestionId.get(
        row.question_id
      ) ?? [];

    if (
      !existing.includes(
        row.test_id
      )
    ) {
      existing.push(
        row.test_id
      );
    }

    testIdsByQuestionId.set(
      row.question_id,
      existing
    );
  }

  /* -------------------------------------------------------
   * 13. Load linked MCQ tests
   * ------------------------------------------------------- */

  const testById =
    new Map<
      string,
      {
        id: string;
        resource_id: string;
        test_type: string;
      }
    >();

  if (
    testIds.length > 0
  ) {
    const {
      data: tests,
      error: testsError,
    } = await supabase
      .from("tests")
      .select(
        `
          id,
          resource_id,
          test_type
        `
      )
      .in(
        "id",
        testIds
      )
      .eq(
        "test_type",
        "MCQ"
      );

    if (testsError) {
      throw new Error(
        `Failed to load MCQ Set tests: ${testsError.message}`
      );
    }

    for (
      const test of
        tests ?? []
    ) {
      testById.set(
        test.id,
        test
      );
    }
  }

  /* -------------------------------------------------------
   * 14. Load MCQ Set resources
   * ------------------------------------------------------- */

  const resourceIds = [
    ...new Set(
      Array.from(
        testById.values()
      ).map(
        (test) =>
          test.resource_id
      )
    ),
  ];

  const resourceById =
    new Map<
      string,
      {
        id: string;
        title: string;
        set_number: number | null;
        status: string;
        resource_type: string;
      }
    >();

  if (
    resourceIds.length > 0
  ) {
    const {
      data: resources,
      error: resourcesError,
    } = await supabase
      .from("resources")
      .select(
        `
          id,
          title,
          set_number,
          status,
          resource_type
        `
      )
      .in(
        "id",
        resourceIds
      )
      .eq(
        "resource_type",
        "MCQ"
      );

    if (resourcesError) {
      throw new Error(
        `Failed to load MCQ Set resources: ${resourcesError.message}`
      );
    }

    for (
      const resource of
        resources ?? []
    ) {
      resourceById.set(
        resource.id,
        resource
      );
    }
  }

  /* -------------------------------------------------------
   * 15. Build question → attached Sets lookup
   * ------------------------------------------------------- */

  const attachedSetsByQuestionId =
    new Map<
      string,
      AdminMcqAttachedSet[]
    >();

  for (
    const row of
      testQuestionRows ?? []
  ) {
    const test =
      testById.get(
        row.test_id
      );

    if (!test) {
      continue;
    }

    const resource =
      resourceById.get(
        test.resource_id
      );

    if (!resource) {
      continue;
    }

    const attachedSets =
      attachedSetsByQuestionId.get(
        row.question_id
      ) ?? [];

    const alreadyAttached =
      attachedSets.some(
        (set) =>
          set.resource_id ===
          resource.id
      );

    if (!alreadyAttached) {
      attachedSets.push({
        resource_id:
          resource.id,

        title:
          resource.title,

        set_number:
          resource.set_number,

        status:
          resource.status,
      });
    }

    attachedSetsByQuestionId.set(
      row.question_id,
      attachedSets
    );
  }

  /* -------------------------------------------------------
   * 16. Sort attached Sets
   *
   * Set 1
   * Set 2
   * Set 10
   * Set 20
   * ------------------------------------------------------- */

  for (
    const attachedSets of
      attachedSetsByQuestionId.values()
  ) {
    attachedSets.sort(
      (a, b) => {
        const aNumber =
          a.set_number ??
          Number.MAX_SAFE_INTEGER;

        const bNumber =
          b.set_number ??
          Number.MAX_SAFE_INTEGER;

        if (
          aNumber !==
          bNumber
        ) {
          return (
            aNumber -
            bNumber
          );
        }

        return a.title.localeCompare(
          b.title,
          undefined,
          {
            numeric: true,
            sensitivity: "base",
          }
        );
      }
    );
  }

  /* -------------------------------------------------------
   * 17. Build final MCQ list
   * ------------------------------------------------------- */

  return questions.map(
    (question) => {
      const curriculumNodeId =
        curriculumNodeByQuestionId.get(
          question.id
        ) ?? null;

      const curriculumNode =
        curriculumNodeId
          ? curriculumNodeById.get(
              curriculumNodeId
            )
          : undefined;

      const curriculumVersion =
        curriculumNode
          ? curriculumVersionById.get(
              curriculumNode.curriculum_version_id
            )
          : undefined;

      const program =
        curriculumVersion
          ? programById.get(
              curriculumVersion.program_id
            )
          : undefined;

      const latestRevision =
        latestRevisionByQuestionId.get(
          question.id
        );

      const displayedQuestionText =
        latestRevision?.question_text ??
        question.question_text;

      return {
        ...question,

        admin_question_number:
          question.admin_question_number,

        question_text:
          displayedQuestionText,

        curriculum_node_id:
          curriculumNodeId,

        chapter_name:
          curriculumNode?.display_name ??
          null,

        chapter_sequence_order:
          curriculumNode?.sequence_order ??
          null,

        class_name:
          program?.name ??
          null,

        class_slug:
          program?.slug ??
          null,

        attached_sets:
          attachedSetsByQuestionId.get(
            question.id
          ) ?? [],
      };
    }
  );
}

/* =========================================================
 * Get single MCQ by ID
 * ========================================================= */

export async function getAdminMcqById(
  id: string
): Promise<AdminMcqDetail> {
  /* -------------------------------------------------------
   * 1. Admin authentication
   * ------------------------------------------------------- */

  await requireAdmin();

  /* -------------------------------------------------------
   * 2. Validate ID
   * ------------------------------------------------------- */

  const questionId =
    id.trim();

  if (!questionId) {
    throw new Error(
      "MCQ ID is required."
    );
  }

  /* -------------------------------------------------------
   * 3. Trusted server-side Supabase client
   * ------------------------------------------------------- */

  const supabase =
    createAdminSupabaseClient();

  /* -------------------------------------------------------
   * 4. Load MCQ question identity/projection
   * ------------------------------------------------------- */

  const {
    data: question,
    error: questionError,
  } = await supabase
    .from("questions")
    .select(
      `
        id,
        admin_question_number,
        question_text,
        question_type,
        source_type,
        source_reference,
        difficulty,
        marks,
        estimated_time_minutes,
        status,
        current_revision_id,
        created_at,
        updated_at
      `
    )
    .eq(
      "id",
      questionId
    )
    .eq(
      "question_type",
      "MCQ"
    )
    .maybeSingle();

  if (questionError) {
    throw new Error(
      `Failed to load MCQ: ${questionError.message}`
    );
  }

  if (!question) {
    throw new Error(
      "MCQ not found."
    );
  }

  /* -------------------------------------------------------
   * 5. Load latest MCQ revision
   * ------------------------------------------------------- */

  let revision:
    | AdminMcqRevision
    | null = null;

  const {
    data: revisionData,
    error: revisionError,
  } = await supabase
    .from(
      "question_revisions"
    )
    .select(
      `
        id,
        question_id,
        revision_number,
        question_text,
        solution_text,
        mistake_insight,
        status,
        created_by,
        created_at,
        updated_at
      `
    )
    .eq(
      "question_id",
      questionId
    )
    .order(
      "revision_number",
      {
        ascending: false,
      }
    )
    .limit(1)
    .maybeSingle();

  if (revisionError) {
    throw new Error(
      `Failed to load MCQ revision: ${revisionError.message}`
    );
  }

  /* -------------------------------------------------------
   * 6. Load revision options
   * ------------------------------------------------------- */

  if (revisionData) {
    const {
      data: revisionOptions,
      error: revisionOptionsError,
    } = await supabase
      .from(
        "question_revision_options"
      )
      .select(
        `
          id,
          option_key,
          option_text,
          display_order,
          is_correct
        `
      )
      .eq(
        "revision_id",
        revisionData.id
      )
      .order(
        "display_order",
        {
          ascending: true,
        }
      );

    if (revisionOptionsError) {
      throw new Error(
        `Failed to load MCQ revision options: ${revisionOptionsError.message}`
      );
    }

    revision = {
      id:
        revisionData.id,

      question_id:
        revisionData.question_id,

      revision_number:
        revisionData.revision_number,

      question_text:
        revisionData.question_text,

      solution_text:
        revisionData.solution_text,

      mistake_insight:
        revisionData.mistake_insight,

      status:
        revisionData.status,

      created_by:
        revisionData.created_by,

      created_at:
        revisionData.created_at,

      updated_at:
        revisionData.updated_at,

      options:
        (revisionOptions ??
          []) as AdminMcqRevisionOption[],
    };
  }

  /* -------------------------------------------------------
   * 7. Legacy compatibility options
   * ------------------------------------------------------- */

  let legacyOptions:
    | AdminMcqOption[]
    = [];

  if (!revision) {
    const {
      data: legacyOptionData,
      error: legacyOptionsError,
    } = await supabase
      .from(
        "question_mcq_options"
      )
      .select(
        `
          id,
          option_key,
          option_text,
          display_order,
          is_correct
        `
      )
      .eq(
        "question_id",
        questionId
      )
      .order(
        "display_order",
        {
          ascending: true,
        }
      );

    if (legacyOptionsError) {
      throw new Error(
        `Failed to load legacy MCQ options: ${legacyOptionsError.message}`
      );
    }

    legacyOptions =
      (legacyOptionData ??
        []) as AdminMcqOption[];
  }

  /* -------------------------------------------------------
   * 8. Load curriculum mapping
   * ------------------------------------------------------- */

  const {
    data: curriculumMappings,
    error: curriculumError,
  } = await supabase
    .from(
      "question_curriculum_nodes"
    )
    .select(
      `
        curriculum_node_id
      `
    )
    .eq(
      "question_id",
      questionId
    )
    .limit(1);

  if (curriculumError) {
    throw new Error(
      `Failed to load MCQ curriculum mapping: ${curriculumError.message}`
    );
  }

  /* -------------------------------------------------------
   * 9. Prepare curriculum node ID
   * ------------------------------------------------------- */

  const curriculumNodeId =
    curriculumMappings &&
    curriculumMappings.length > 0
      ? curriculumMappings[0]
          .curriculum_node_id
      : null;

  /* -------------------------------------------------------
   * 10. Load curriculum context
   * ------------------------------------------------------- */

  let chapterName:
    | string
    | null = null;

  let chapterSequenceOrder:
    | number
    | null = null;

  let className:
    | string
    | null = null;

  let classSlug:
    | string
    | null = null;

  if (curriculumNodeId) {
    const {
      data: curriculumNode,
      error: curriculumNodeError,
    } = await supabase
      .from(
        "curriculum_nodes"
      )
      .select(
        `
          id,
          display_name,
          sequence_order,
          curriculum_version_id
        `
      )
      .eq(
        "id",
        curriculumNodeId
      )
      .maybeSingle();

    if (curriculumNodeError) {
      throw new Error(
        `Failed to load MCQ curriculum chapter: ${curriculumNodeError.message}`
      );
    }

    if (curriculumNode) {
      chapterName =
        curriculumNode.display_name;

      chapterSequenceOrder =
        curriculumNode.sequence_order;

      const {
        data: curriculumVersion,
        error: curriculumVersionError,
      } = await supabase
        .from(
          "curriculum_versions"
        )
        .select(
          `
            id,
            program_id
          `
        )
        .eq(
          "id",
          curriculumNode.curriculum_version_id
        )
        .maybeSingle();

      if (curriculumVersionError) {
        throw new Error(
          `Failed to load MCQ curriculum version: ${curriculumVersionError.message}`
        );
      }

      if (curriculumVersion) {
        const {
          data: program,
          error: programError,
        } = await supabase
          .from("programs")
          .select(
            `
              id,
              name,
              slug
            `
          )
          .eq(
            "id",
            curriculumVersion.program_id
          )
          .maybeSingle();

        if (programError) {
          throw new Error(
            `Failed to load MCQ curriculum class: ${programError.message}`
          );
        }

        if (program) {
          className =
            program.name;

          classSlug =
            program.slug;
        }
      }
    }
  }

  /* -------------------------------------------------------
   * 11. Load attached MCQ Sets for this question
   * ------------------------------------------------------- */

  const {
    data: attachedTestQuestions,
    error: attachedTestQuestionsError,
  } = await supabase
    .from("test_questions")
    .select(
      `
        test_id
      `
    )
    .eq(
      "question_id",
      questionId
    );

  if (attachedTestQuestionsError) {
    throw new Error(
      `Failed to load MCQ Set attachments: ${attachedTestQuestionsError.message}`
    );
  }

  const attachedTestIds = [
    ...new Set(
      (attachedTestQuestions ?? []).map(
        (row) =>
          row.test_id
      )
    ),
  ];

  const attachedTestById =
    new Map<
      string,
      {
        id: string;
        resource_id: string;
        test_type: string;
      }
    >();

  if (
    attachedTestIds.length > 0
  ) {
    const {
      data: attachedTests,
      error: attachedTestsError,
    } = await supabase
      .from("tests")
      .select(
        `
          id,
          resource_id,
          test_type
        `
      )
      .in(
        "id",
        attachedTestIds
      )
      .eq(
        "test_type",
        "MCQ"
      );

    if (attachedTestsError) {
      throw new Error(
        `Failed to load MCQ Set tests: ${attachedTestsError.message}`
      );
    }

    for (
      const test of
        attachedTests ?? []
    ) {
      attachedTestById.set(
        test.id,
        test
      );
    }
  }

  const attachedResourceIds = [
    ...new Set(
      Array.from(
        attachedTestById.values()
      ).map(
        (test) =>
          test.resource_id
      )
    ),
  ];

  const attachedResourceById =
    new Map<
      string,
      {
        id: string;
        title: string;
        set_number: number | null;
        status: string;
        resource_type: string;
      }
    >();

  if (
    attachedResourceIds.length > 0
  ) {
    const {
      data: attachedResources,
      error: attachedResourcesError,
    } = await supabase
      .from("resources")
      .select(
        `
          id,
          title,
          set_number,
          status,
          resource_type
        `
      )
      .in(
        "id",
        attachedResourceIds
      )
      .eq(
        "resource_type",
        "MCQ"
      );

    if (attachedResourcesError) {
      throw new Error(
        `Failed to load MCQ Set resources: ${attachedResourcesError.message}`
      );
    }

    for (
      const resource of
        attachedResources ?? []
    ) {
      attachedResourceById.set(
        resource.id,
        resource
      );
    }
  }

  const attachedSets: AdminMcqAttachedSet[] = [];

  for (
    const test of
      attachedTestById.values()
  ) {
    const resource =
      attachedResourceById.get(
        test.resource_id
      );

    if (!resource) {
      continue;
    }

    if (
      attachedSets.some(
        (set) =>
          set.resource_id ===
          resource.id
      )
    ) {
      continue;
    }

    attachedSets.push({
      resource_id:
        resource.id,

      title:
        resource.title,

      set_number:
        resource.set_number,

      status:
        resource.status,
    });
  }

  attachedSets.sort(
    (a, b) => {
      const aNumber =
        a.set_number ??
        Number.MAX_SAFE_INTEGER;

      const bNumber =
        b.set_number ??
        Number.MAX_SAFE_INTEGER;

      if (
        aNumber !==
        bNumber
      ) {
        return (
          aNumber -
          bNumber
        );
      }

      return a.title.localeCompare(
        b.title,
        undefined,
        {
          numeric: true,
          sensitivity: "base",
        }
      );
    }
  );

  /* -------------------------------------------------------
   * 12. Determine displayed content
   * ------------------------------------------------------- */

  const displayedQuestionText =
    revision?.question_text ??
    question.question_text;

  const displayedOptions =
    revision?.options ??
    legacyOptions;

  /* -------------------------------------------------------
   * 13. Return complete MCQ detail
   * ------------------------------------------------------- */

  return {
    id:
      question.id,

    admin_question_number:
      question.admin_question_number,

    question_text:
      displayedQuestionText,

    question_type:
      question.question_type,

    source_type:
      question.source_type,

    source_reference:
      question.source_reference,

    difficulty:
      question.difficulty,

    marks:
      question.marks,

    estimated_time_minutes:
      question.estimated_time_minutes,

    status:
      question.status,

    current_revision_id:
      question.current_revision_id,

    created_at:
      question.created_at,

    updated_at:
      question.updated_at,

    revision,

    options:
      displayedOptions,

    curriculum_node_id:
      curriculumNodeId,

    chapter_name:
      chapterName,

    chapter_sequence_order:
      chapterSequenceOrder,

    class_name:
      className,

    class_slug:
      classSlug,

    attached_sets:
      attachedSets,
  };
}