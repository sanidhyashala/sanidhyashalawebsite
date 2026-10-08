import { requireAdmin } from "@/app/lib/auth/admin";

import { createAdminSupabaseClient } from "@/app/lib/admin/supabase-admin";

/* =========================================================
 * Types
 * ========================================================= */

export type AdminMcqSet = {
  id: string;

  resource_id: string;

  title: string;
  description: string | null;

  resource_type: string;
  access_type: string;
  resource_status: string;
  content_source: string;

  /*
   * Chapter-wise MCQ Set number.
   *
   * Example:
   * Chapter A → Set 1, Set 2, Set 3
   * Chapter B → Set 1, Set 2
   */
  set_number: number;

  /*
   * Curriculum identity.
   *
   * Example:
   *
   * Class 10 → Mathematics → Probability
   * Class 11 → Mathematics → Probability
   *
   * Science:
   *
   * Class 9 → Science → Physics → Motion
   * Class 9 → Science → Chemistry → Matter
   *
   * These fields allow the admin UI to filter
   * and display the curriculum hierarchy clearly.
   */
  curriculum_node_id: string | null;
  curriculum_version_id: string | null;

  class_name: string | null;
  subject_name: string | null;
  branch_name: string | null;
  chapter_name: string | null;

  test_id: string;

  test_title: string;
  test_type: string;
  duration_minutes: number | null;
  max_attempts: number;
  passing_percentage: number | null;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  test_status: string;
  test_access_type: string;

  question_count: number;

  created_at: string;
  updated_at: string;
};

/* =========================================================
 * Curriculum Lookup Types
 * ========================================================= */

type CurriculumNodeLookup = {
  curriculum_node_id: string;
  curriculum_version_id: string;

  display_name: string;

  parent_node_id: string | null;

  chapter_name: string;
};

type CurriculumVersionLookup = {
  id: string;
  program_id: string;
};

type ProgramLookup = {
  id: string;
  name: string;
};

/* =========================================================
 * Curriculum Context
 *
 * This is intentionally derived from the existing
 * curriculum_nodes hierarchy.
 *
 * Mathematics:
 *
 *   Mathematics
 *      └── Chapter
 *
 * Science:
 *
 *   Science
 *      ├── Physics
 *      │     └── Chapter
 *      ├── Chemistry
 *      │     └── Chapter
 *      └── Biology
 *            └── Chapter
 *
 * No database changes are required.
 * ========================================================= */

type CurriculumContext = {
  subject_name: string | null;
  branch_name: string | null;
};

/* =========================================================
 * Resolve Subject + Branch
 * ========================================================= */

function resolveCurriculumContext(
  nodeId: string,
  curriculumNodesById: Map<
    string,
    {
      id: string;
      display_name: string;
      parent_node_id: string | null;
      curriculum_version_id: string;
    }
  >,
): CurriculumContext {
  const currentNode =
    curriculumNodesById.get(nodeId);

  if (!currentNode) {
    return {
      subject_name: null,
      branch_name: null,
    };
  }

  /*
   * -------------------------------------------------------
   * Immediate parent
   * -------------------------------------------------------
   */

  const parentNode = currentNode.parent_node_id
    ? curriculumNodesById.get(
        currentNode.parent_node_id,
      )
    : undefined;

  /*
   * No parent means the node itself is a root node.
   *
   * This should normally not happen for an MCQ chapter,
   * but returning the node as subject is the safest
   * fallback.
   */

  if (!parentNode) {
    return {
      subject_name:
        currentNode.display_name,
      branch_name: null,
    };
  }

  /*
   * -------------------------------------------------------
   * Direct child of Subject
   *
   * Example:
   *
   * Mathematics
   *    └── Sets
   *
   * Here:
   *
   * currentNode = Sets
   * parentNode  = Mathematics
   *
   * Mathematics has no parent.
   * -------------------------------------------------------
   */

  if (parentNode.parent_node_id === null) {
    return {
      subject_name:
        parentNode.display_name,
      branch_name: null,
    };
  }

  /*
   * -------------------------------------------------------
   * Nested Science-style hierarchy
   *
   * Example:
   *
   * Science
   *    └── Physics
   *          └── Motion
   *
   * Here:
   *
   * currentNode = Motion
   * parentNode  = Physics
   * grandParent = Science
   * -------------------------------------------------------
   */

  const grandParentNode =
    parentNode.parent_node_id
      ? curriculumNodesById.get(
          parentNode.parent_node_id,
        )
      : undefined;

  if (!grandParentNode) {
    /*
     * Defensive fallback.
     *
     * If the hierarchy is incomplete, at least expose
     * the immediate parent as the subject-like context.
     */

    return {
      subject_name:
        parentNode.display_name,
      branch_name: null,
    };
  }

  /*
   * The root ancestor is the Subject.
   * The immediate parent is the Branch.
   */

  return {
    subject_name:
      grandParentNode.display_name,

    branch_name:
      parentNode.display_name,
  };
}

/* =========================================================
 * Get all MCQ Sets
 * ========================================================= */

export async function getAdminMcqSets(): Promise<
  AdminMcqSet[]
> {
  /* -------------------------------------------------------
   * 1. Admin authentication
   * -------------------------------------------------------
   */

  await requireAdmin();

  /* -------------------------------------------------------
   * 2. Trusted server-side Supabase client
   * -------------------------------------------------------
   */

  const supabase =
    createAdminSupabaseClient();

  /* -------------------------------------------------------
   * 3. Load MCQ resources
   * -------------------------------------------------------
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
        description,
        resource_type,
        access_type,
        status,
        content_source,
        set_number,
        created_at,
        updated_at
      `,
    )
    .eq(
      "resource_type",
      "MCQ",
    )
    .order(
      "created_at",
      {
        ascending: false,
      },
    );

  if (resourcesError) {
    throw new Error(
      `Failed to load MCQ resources: ${resourcesError.message}`,
    );
  }

  if (
    !resources ||
    resources.length === 0
  ) {
    return [];
  }

  /* -------------------------------------------------------
   * 4. Load tests belonging to these resources
   * -------------------------------------------------------
   */

  const resourceIds =
    resources.map(
      (resource) =>
        resource.id,
    );

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
        duration_minutes,
        max_attempts,
        passing_percentage,
        shuffle_questions,
        shuffle_options,
        status,
        access_type
      `,
    )
    .in(
      "resource_id",
      resourceIds,
    )
    .eq(
      "test_type",
      "MCQ",
    );

  if (testsError) {
    throw new Error(
      `Failed to load MCQ tests: ${testsError.message}`,
    );
  }

  /* -------------------------------------------------------
   * 5. Load curriculum mappings
   * -------------------------------------------------------
   */

  const {
    data: curriculumMappings,
    error: curriculumError,
  } = await supabase
    .from(
      "resource_curriculum_nodes",
    )
    .select(
      `
        resource_id,
        curriculum_node_id
      `,
    )
    .in(
      "resource_id",
      resourceIds,
    );

  if (curriculumError) {
    throw new Error(
      `Failed to load MCQ curriculum mappings: ${curriculumError.message}`,
    );
  }

  /* -------------------------------------------------------
   * 6. Resolve curriculum node IDs
   * -------------------------------------------------------
   */

  const curriculumNodeIds = [
    ...new Set(
      (curriculumMappings ?? [])
        .map(
          (mapping) =>
            mapping.curriculum_node_id,
        )
        .filter(Boolean),
    ),
  ];

  /*
   * We need the chapter nodes first.
   */

  let curriculumNodeRows: {
    id: string;
    display_name: string;
    curriculum_version_id: string;
    parent_node_id: string | null;
  }[] = [];

  if (
    curriculumNodeIds.length > 0
  ) {
    const {
      data,
      error,
    } = await supabase
      .from("curriculum_nodes")
      .select(
        `
          id,
          display_name,
          curriculum_version_id,
          parent_node_id
        `,
      )
      .in(
        "id",
        curriculumNodeIds,
      );

    if (error) {
      throw new Error(
        `Failed to load MCQ curriculum chapters: ${error.message}`,
      );
    }

    curriculumNodeRows =
      data ?? [];
  }

  /* -------------------------------------------------------
   * 7. Load curriculum versions
   * -------------------------------------------------------
   */

  const curriculumVersionIds = [
    ...new Set(
      curriculumNodeRows
        .map(
          (node) =>
            node.curriculum_version_id,
        )
        .filter(Boolean),
    ),
  ];

  let curriculumVersionRows: CurriculumVersionLookup[] =
    [];

  if (
    curriculumVersionIds.length > 0
  ) {
    const {
      data,
      error,
    } = await supabase
      .from("curriculum_versions")
      .select(
        `
          id,
          program_id
        `,
      )
      .in(
        "id",
        curriculumVersionIds,
      );

    if (error) {
      throw new Error(
        `Failed to load curriculum versions: ${error.message}`,
      );
    }

    curriculumVersionRows =
      data ?? [];
  }

  /* -------------------------------------------------------
   * 8. Load programs / Classes
   * -------------------------------------------------------
   */

  const programIds = [
    ...new Set(
      curriculumVersionRows
        .map(
          (version) =>
            version.program_id,
        )
        .filter(Boolean),
    ),
  ];

  let programRows: ProgramLookup[] =
    [];

  if (
    programIds.length > 0
  ) {
    const {
      data,
      error,
    } = await supabase
      .from("programs")
      .select(
        `
          id,
          name
        `,
      )
      .in(
        "id",
        programIds,
      );

    if (error) {
      throw new Error(
        `Failed to load curriculum classes: ${error.message}`,
      );
    }

    programRows =
      data ?? [];
  }

  /* -------------------------------------------------------
   * 9. Load complete curriculum hierarchy
   *
   * We load all nodes belonging to the relevant curriculum
   * versions so that a chapter can resolve:
   *
   * Chapter
   *   ↓
   * Branch
   *   ↓
   * Subject
   *
   * -------------------------------------------------------
   */

  let curriculumHierarchyRows: {
    id: string;
    display_name: string;
    parent_node_id: string | null;
    curriculum_version_id: string;
  }[] = [];

  if (
    curriculumVersionIds.length > 0
  ) {
    const {
      data,
      error,
    } = await supabase
      .from("curriculum_nodes")
      .select(
        `
          id,
          display_name,
          parent_node_id,
          curriculum_version_id
        `,
      )
      .in(
        "curriculum_version_id",
        curriculumVersionIds,
      )
      .eq(
        "status",
        "ACTIVE",
      );

    if (error) {
      throw new Error(
        `Failed to load MCQ curriculum hierarchy: ${error.message}`,
      );
    }

    curriculumHierarchyRows =
      data ?? [];
  }

  /* -------------------------------------------------------
   * 10. Build curriculum lookup maps
   * -------------------------------------------------------
   */

  const curriculumNodeById =
    new Map<
      string,
      CurriculumNodeLookup
    >();

  for (
    const node of
      curriculumNodeRows
  ) {
    curriculumNodeById.set(
      node.id,
      {
        curriculum_node_id:
          node.id,

        curriculum_version_id:
          node.curriculum_version_id,

        display_name:
          node.display_name,

        parent_node_id:
          node.parent_node_id,

        chapter_name:
          node.display_name,
      },
    );
  }

  /*
   * Complete hierarchy lookup.
   */

  const curriculumHierarchyById =
    new Map<
      string,
      {
        id: string;
        display_name: string;
        parent_node_id: string | null;
        curriculum_version_id: string;
      }
    >();

  for (
    const node of
      curriculumHierarchyRows
  ) {
    curriculumHierarchyById.set(
      node.id,
      node,
    );
  }

  /*
   * -------------------------------------------------------
   * Curriculum Version map
   * -------------------------------------------------------
   */

  const curriculumVersionById =
    new Map<
      string,
      CurriculumVersionLookup
    >();

  for (
    const version of
      curriculumVersionRows
  ) {
    curriculumVersionById.set(
      version.id,
      version,
    );
  }

  /*
   * -------------------------------------------------------
   * Program map
   * -------------------------------------------------------
   */

  const programById =
    new Map<
      string,
      ProgramLookup
    >();

  for (
    const program of
      programRows
  ) {
    programById.set(
      program.id,
      program,
    );
  }

  /* -------------------------------------------------------
   * 11. Load question counts
   * -------------------------------------------------------
   */

  const testIds =
    (tests ?? []).map(
      (test) =>
        test.id,
    );

  let questionRows: {
    test_id: string;
    question_id: string;
  }[] = [];

  if (
    testIds.length > 0
  ) {
    const {
      data,
      error,
    } = await supabase
      .from("test_questions")
      .select(
        `
          test_id,
          question_id
        `,
      )
      .in(
        "test_id",
        testIds,
      );

    if (error) {
      throw new Error(
        `Failed to load MCQ set questions: ${error.message}`,
      );
    }

    questionRows =
      data ?? [];
  }

  /* -------------------------------------------------------
   * 12. Build test lookup map
   * -------------------------------------------------------
   */

  const testByResourceId =
    new Map<
      string,
      (typeof tests)[number]
    >();

  for (
    const test of
      tests ?? []
  ) {
    testByResourceId.set(
      test.resource_id,
      test,
    );
  }

  /* -------------------------------------------------------
   * 13. Build curriculum mapping lookup
   * -------------------------------------------------------
   */

  const curriculumByResourceId =
    new Map<
      string,
      string
    >();

  for (
    const mapping of
      curriculumMappings ?? []
  ) {
    curriculumByResourceId.set(
      mapping.resource_id,
      mapping.curriculum_node_id,
    );
  }

  /* -------------------------------------------------------
   * 14. Build question count lookup
   * -------------------------------------------------------
   */

  const questionCountByTestId =
    new Map<
      string,
      number
    >();

  for (
    const row of
      questionRows
  ) {
    questionCountByTestId.set(
      row.test_id,
      (
        questionCountByTestId.get(
          row.test_id,
        ) ?? 0
      ) + 1,
    );
  }

  /* -------------------------------------------------------
   * 15. Combine all data
   * -------------------------------------------------------
   */

  const mcqSets:
    AdminMcqSet[] = [];

  for (
    const resource of
      resources
  ) {
    const test =
      testByResourceId.get(
        resource.id,
      );

    /*
     * An MCQ resource without an MCQ test
     * is not yet a usable MCQ Set.
     */

    if (!test) {
      continue;
    }

    /*
     * MCQ resources created after the numbering
     * migration must have a Set Number.
     */

    if (
      resource.set_number ===
        null ||
      resource.set_number ===
        undefined
    ) {
      continue;
    }

    const curriculumNodeId =
      curriculumByResourceId.get(
        resource.id,
      ) ?? null;

    const curriculumNode =
      curriculumNodeId
        ? curriculumNodeById.get(
            curriculumNodeId,
          )
        : undefined;

    const curriculumVersion =
      curriculumNode
        ? curriculumVersionById.get(
            curriculumNode.curriculum_version_id,
          )
        : undefined;

    const program =
      curriculumVersion
        ? programById.get(
            curriculumVersion.program_id,
          )
        : undefined;

    /*
     * Resolve Subject + Branch from
     * the actual curriculum hierarchy.
     */

    const curriculumContext =
      curriculumNodeId
        ? resolveCurriculumContext(
            curriculumNodeId,
            curriculumHierarchyById,
          )
        : {
            subject_name: null,
            branch_name: null,
          };

    mcqSets.push({
      id: resource.id,

      resource_id:
        resource.id,

      title:
        resource.title,

      description:
        resource.description,

      resource_type:
        resource.resource_type,

      access_type:
        resource.access_type,

      resource_status:
        resource.status,

      content_source:
        resource.content_source,

      set_number:
        resource.set_number,

      /*
       * Curriculum identity
       */

      curriculum_node_id:
        curriculumNodeId,

      curriculum_version_id:
        curriculumNode?.curriculum_version_id ??
        null,

      class_name:
        program?.name ??
        null,

      subject_name:
        curriculumContext.subject_name,

      branch_name:
        curriculumContext.branch_name,

      chapter_name:
        curriculumNode?.chapter_name ??
        null,

      /*
       * Test
       */

      test_id:
        test.id,

      test_title:
        test.title,

      test_type:
        test.test_type,

      duration_minutes:
        test.duration_minutes,

      max_attempts:
        test.max_attempts,

      passing_percentage:
        test.passing_percentage,

      shuffle_questions:
        test.shuffle_questions,

      shuffle_options:
        test.shuffle_options,

      test_status:
        test.status,

      test_access_type:
        test.access_type,

      /*
       * Questions
       */

      question_count:
        questionCountByTestId.get(
          test.id,
        ) ?? 0,

      /*
       * Timestamps
       */

      created_at:
        resource.created_at,

      updated_at:
        resource.updated_at,
    });
  }

  return mcqSets;
}

/* =========================================================
 * Get single MCQ Set by Resource ID
 * ========================================================= */

export async function getAdminMcqSetById(
  resourceId: string,
): Promise<AdminMcqSet> {
  /* -------------------------------------------------------
   * 1. Admin authentication
   * -------------------------------------------------------
   */

  await requireAdmin();

  /* -------------------------------------------------------
   * 2. Validate Resource ID
   * -------------------------------------------------------
   */

  if (
    !resourceId.trim()
  ) {
    throw new Error(
      "MCQ Set resource ID is required.",
    );
  }

  /* -------------------------------------------------------
   * 3. Trusted server-side Supabase client
   * -------------------------------------------------------
   */

  const supabase =
    createAdminSupabaseClient();

  /* -------------------------------------------------------
   * 4. Load resource
   * -------------------------------------------------------
   */

  const {
    data: resource,
    error: resourceError,
  } = await supabase
    .from("resources")
    .select(
      `
        id,
        title,
        description,
        resource_type,
        access_type,
        status,
        content_source,
        set_number,
        created_at,
        updated_at
      `,
    )
    .eq(
      "id",
      resourceId,
    )
    .eq(
      "resource_type",
      "MCQ",
    )
    .maybeSingle();

  if (resourceError) {
    throw new Error(
      `Failed to load MCQ Set resource: ${resourceError.message}`,
    );
  }

  if (!resource) {
    throw new Error(
      "MCQ Set not found.",
    );
  }

  /* -------------------------------------------------------
   * 5. Validate Set number
   * -------------------------------------------------------
   */

  if (
    resource.set_number ===
      null ||
    resource.set_number ===
      undefined
  ) {
    throw new Error(
      "MCQ Set number is missing.",
    );
  }

  /* -------------------------------------------------------
   * 6. Load associated MCQ test
   * -------------------------------------------------------
   */

  const {
    data: test,
    error: testError,
  } = await supabase
    .from("tests")
    .select(
      `
        id,
        resource_id,
        title,
        test_type,
        duration_minutes,
        max_attempts,
        passing_percentage,
        shuffle_questions,
        shuffle_options,
        status,
        access_type
      `,
    )
    .eq(
      "resource_id",
      resource.id,
    )
    .eq(
      "test_type",
      "MCQ",
    )
    .maybeSingle();

  if (testError) {
    throw new Error(
      `Failed to load MCQ Set test: ${testError.message}`,
    );
  }

  if (!test) {
    throw new Error(
      "MCQ Set test configuration not found.",
    );
  }

  /* -------------------------------------------------------
   * 7. Load curriculum mapping
   * -------------------------------------------------------
   */

  const {
    data: curriculumMapping,
    error: curriculumError,
  } = await supabase
    .from(
      "resource_curriculum_nodes",
    )
    .select(
      `
        curriculum_node_id
      `,
    )
    .eq(
      "resource_id",
      resource.id,
    )
    .maybeSingle();

  if (curriculumError) {
    throw new Error(
      `Failed to load MCQ Set curriculum mapping: ${curriculumError.message}`,
    );
  }

  /* -------------------------------------------------------
   * 8. Resolve Class + Subject + Branch + Chapter
   * -------------------------------------------------------
   */

  let className:
    string | null = null;

  let subjectName:
    string | null = null;

  let branchName:
    string | null = null;

  let chapterName:
    string | null = null;

  let curriculumVersionId:
    string | null = null;

  if (
    curriculumMapping?.curriculum_node_id
  ) {
    /*
     * -----------------------------------------------------
     * Load chapter node.
     * -----------------------------------------------------
     */

    const {
      data: curriculumNode,
      error: curriculumNodeError,
    } = await supabase
      .from("curriculum_nodes")
      .select(
        `
          id,
          display_name,
          parent_node_id,
          curriculum_version_id
        `,
      )
      .eq(
        "id",
        curriculumMapping.curriculum_node_id,
      )
      .maybeSingle();

    if (curriculumNodeError) {
      throw new Error(
        `Failed to load MCQ Set chapter: ${curriculumNodeError.message}`,
      );
    }

    if (curriculumNode) {
      chapterName =
        curriculumNode.display_name;

      curriculumVersionId =
        curriculumNode.curriculum_version_id;

      /*
       * ---------------------------------------------------
       * Load curriculum version.
       * ---------------------------------------------------
       */

      const {
        data: curriculumVersion,
        error:
          curriculumVersionError,
      } = await supabase
        .from("curriculum_versions")
        .select(
          `
            id,
            program_id
          `,
        )
        .eq(
          "id",
          curriculumNode.curriculum_version_id,
        )
        .maybeSingle();

      if (
        curriculumVersionError
      ) {
        throw new Error(
          `Failed to load MCQ Set curriculum version: ${curriculumVersionError.message}`,
        );
      }

      /*
       * ---------------------------------------------------
       * Resolve Class / Program.
       * ---------------------------------------------------
       */

      if (
        curriculumVersion?.program_id
      ) {
        const {
          data: program,
          error: programError,
        } = await supabase
          .from("programs")
          .select(
            `
              id,
              name
            `,
          )
          .eq(
            "id",
            curriculumVersion.program_id,
          )
          .maybeSingle();

        if (programError) {
          throw new Error(
            `Failed to load MCQ Set class: ${programError.message}`,
          );
        }

        className =
          program?.name ??
          null;
      }

      /*
       * ---------------------------------------------------
       * Resolve Subject + Branch.
       *
       * Load the curriculum hierarchy for this version.
       * ---------------------------------------------------
       */

      const {
        data: hierarchyNodes,
        error:
          hierarchyError,
      } = await supabase
        .from("curriculum_nodes")
        .select(
          `
            id,
            display_name,
            parent_node_id,
            curriculum_version_id
          `,
        )
        .eq(
          "curriculum_version_id",
          curriculumNode.curriculum_version_id,
        )
        .eq(
          "status",
          "ACTIVE",
        );

      if (hierarchyError) {
        throw new Error(
          `Failed to load MCQ Set curriculum hierarchy: ${hierarchyError.message}`,
        );
      }

      const hierarchyById =
        new Map<
          string,
          {
            id: string;
            display_name: string;
            parent_node_id:
              | string
              | null;
            curriculum_version_id: string;
          }
        >();

      for (
        const node of
          hierarchyNodes ?? []
      ) {
        hierarchyById.set(
          node.id,
          node,
        );
      }

      const curriculumContext =
        resolveCurriculumContext(
          curriculumNode.id,
          hierarchyById,
        );

      subjectName =
        curriculumContext.subject_name;

      branchName =
        curriculumContext.branch_name;
    }
  }

  /* -------------------------------------------------------
   * 9. Count questions
   * -------------------------------------------------------
   */

  const {
    count,
    error: questionError,
  } = await supabase
    .from("test_questions")
    .select(
      "question_id",
      {
        count: "exact",
        head: true,
      },
    )
    .eq(
      "test_id",
      test.id,
    );

  if (questionError) {
    throw new Error(
      `Failed to count MCQ Set questions: ${questionError.message}`,
    );
  }

  /* -------------------------------------------------------
   * 10. Return normalized MCQ Set
   * -------------------------------------------------------
   */

  return {
    id: resource.id,

    resource_id:
      resource.id,

    title:
      resource.title,

    description:
      resource.description,

    resource_type:
      resource.resource_type,

    access_type:
      resource.access_type,

    resource_status:
      resource.status,

    content_source:
      resource.content_source,

    set_number:
      resource.set_number,

    /*
     * Curriculum identity
     */

    curriculum_node_id:
      curriculumMapping?.curriculum_node_id ??
      null,

    curriculum_version_id:
      curriculumVersionId,

    class_name:
      className,

    subject_name:
      subjectName,

    branch_name:
      branchName,

    chapter_name:
      chapterName,

    /*
     * Test
     */

    test_id:
      test.id,

    test_title:
      test.title,

    test_type:
      test.test_type,

    duration_minutes:
      test.duration_minutes,

    max_attempts:
      test.max_attempts,

    passing_percentage:
      test.passing_percentage,

    shuffle_questions:
      test.shuffle_questions,

    shuffle_options:
      test.shuffle_options,

    test_status:
      test.status,

    test_access_type:
      test.access_type,

    /*
     * Questions
     */

    question_count:
      count ?? 0,

    /*
     * Timestamps
     */

    created_at:
      resource.created_at,

    updated_at:
      resource.updated_at,
  };
}