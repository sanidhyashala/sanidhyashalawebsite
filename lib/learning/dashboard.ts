import { createLearningSupabaseClient } from "./supabase-learning";
import { requireLearningAuth } from "./learning-auth";
import { getStudentProfile } from "./student-profile";

type AttemptTest = {
  id: string;
  title: string;
  test_type: string;
  resource_id: string;
};

type StudentAttempt = {
  id: string;
  test_id: string;
  attempt_number: number;
  status: string;
  started_at: string | null;
  submitted_at: string | null;
  score: number | null;
  percentage: number | null;
  correct_count: number | null;
  incorrect_count: number | null;
  unanswered_count: number | null;
  updated_at: string | null;

  tests: AttemptTest | null;

  resource: {
    id: string;
    title: string;
    slug: string;
    resource_type: string;
    access_type: string;
  } | null;

  chapter: {
    id: string;
    display_name: string;
  } | null;
};

export async function getStudentDashboard() {
  const { userId } =
    await requireLearningAuth();

  const supabase =
    await createLearningSupabaseClient();

  /* =====================================================
   * 1. Resolve student's learning profile
   * ===================================================== */

  const profile =
    await getStudentProfile();

  if (!profile.exists) {
    throw new Error(
      "Student profile is not configured."
    );
  }

  if (!profile.program_id) {
    throw new Error(
      "Student learning program is not assigned."
    );
  }

  /* =====================================================
   * 2. Resolve student's published curriculum
   * ===================================================== */

  const {
    data: curriculum,
    error: curriculumError,
  } = await supabase
    .from("curriculum_versions")
    .select(`
      id,
      session,
      slug,
      description,
      status,
      program_id,
      programs (
        id,
        name,
        slug
      )
    `)
    .eq(
      "program_id",
      profile.program_id
    )
    .eq(
      "status",
      "PUBLISHED"
    )
    .maybeSingle();

  if (curriculumError) {
    throw new Error(
      `Failed to load student curriculum: ${curriculumError.message}`
    );
  }

  if (!curriculum) {
    throw new Error(
      "No published curriculum is available for your class."
    );
  }

  /* =====================================================
   * 3. Resolve curriculum nodes
   * ===================================================== */

  const {
    data: curriculumNodes,
    error: nodesError,
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
      curriculum.id
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

  if (nodesError) {
    throw new Error(
      `Failed to load curriculum nodes: ${nodesError.message}`
    );
  }

  const nodeIds =
    (curriculumNodes ?? []).map(
      (node) => node.id
    );

  /* =====================================================
   * 4. Resolve resources belonging ONLY to
   *    student's current curriculum
   *
   * IMPORTANT:
   * resources table does NOT contain
   * mcq_set_number.
   * ===================================================== */

  let availableResources: Array<{
    id: string;
    title: string;
    slug: string;
    description: string | null;
    resource_type: string;
    access_type: string;
    thumbnail_url: string | null;
    display_order: number | null;
  }> = [];

  if (nodeIds.length > 0) {
    const {
      data: resourceMappings,
      error: resourceMappingsError,
    } = await supabase
      .from(
        "resource_curriculum_nodes"
      )
      .select(`
        resource_id,
        curriculum_node_id
      `)
      .in(
        "curriculum_node_id",
        nodeIds
      );

    if (resourceMappingsError) {
      throw new Error(
        `Failed to load curriculum resources: ${resourceMappingsError.message}`
      );
    }

    const resourceIds =
      Array.from(
        new Set(
          (resourceMappings ?? []).map(
            (mapping) =>
              mapping.resource_id
          )
        )
      );

    if (resourceIds.length > 0) {
      const {
        data: resources,
        error: resourcesError,
      } = await supabase
        .from("resources")
        .select(`
          id,
          title,
          slug,
          description,
          resource_type,
          access_type,
          thumbnail_url,
          display_order
        `)
        .in(
          "id",
          resourceIds
        )
        .eq(
          "status",
          "PUBLISHED"
        )
        .order(
          "display_order",
          {
            ascending: true,
          }
        )
        .order(
          "title",
          {
            ascending: true,
          }
        )
        .limit(12);

      if (resourcesError) {
        throw new Error(
          `Failed to load student resources: ${resourcesError.message}`
        );
      }

      availableResources =
        resources ?? [];
    }
  }

  /* =====================================================
   * 5. Resolve tests belonging ONLY to the student's
   *    currently available resources
   *
   *    This preserves class isolation.
   * ===================================================== */

  const availableResourceIds =
    availableResources.map(
      (resource) => resource.id
    );

  let currentTestIds: string[] =
    [];

  if (
    availableResourceIds.length > 0
  ) {
    const {
      data: currentTests,
      error: currentTestsError,
    } = await supabase
      .from("tests")
      .select(`
        id,
        resource_id
      `)
      .in(
        "resource_id",
        availableResourceIds
      );

    if (currentTestsError) {
      throw new Error(
        `Failed to load student curriculum tests: ${currentTestsError.message}`
      );
    }

    currentTestIds =
      (currentTests ?? []).map(
        (test) => test.id
      );
  }

  /* =====================================================
   * 6. Load ONLY student's attempts for tests belonging
   *    to student's CURRENT curriculum
   * ===================================================== */

  let allAttempts: StudentAttempt[] =
    [];

  if (
    currentTestIds.length > 0
  ) {
    const {
      data: attempts,
      error: attemptsError,
    } = await supabase
      .from("test_attempts")
      .select(`
        id,
        test_id,
        attempt_number,
        status,
        started_at,
        submitted_at,
        score,
        percentage,
        correct_count,
        incorrect_count,
        unanswered_count,
        updated_at,
        tests (
          id,
          title,
          test_type,
          resource_id
        )
      `)
      .eq(
        "user_id",
        userId
      )
      .in(
        "test_id",
        currentTestIds
      )
      .order(
        "updated_at",
        {
          ascending: false,
        }
      )
      .limit(20);

    if (attemptsError) {
      throw new Error(
        `Failed to load student attempts: ${attemptsError.message}`
      );
    }

    /* ===================================================
     * Normalize nested tests relation
     * =================================================== */

    const normalizedAttempts =
      (attempts ?? []).map(
        (attempt) => {
          const rawTests =
            attempt.tests;

          const test =
            Array.isArray(
              rawTests
            )
              ? rawTests[0] ?? null
              : rawTests ?? null;

          return {
            id: attempt.id,
            test_id:
              attempt.test_id,
            attempt_number:
              attempt.attempt_number,
            status:
              attempt.status,
            started_at:
              attempt.started_at,
            submitted_at:
              attempt.submitted_at,
            score:
              attempt.score,
            percentage:
              attempt.percentage,
            correct_count:
              attempt.correct_count,
            incorrect_count:
              attempt.incorrect_count,
            unanswered_count:
              attempt.unanswered_count,
            updated_at:
              attempt.updated_at,
            tests: test,
          };
        }
      );

    /* ===================================================
     * Resolve resource + chapter information for
     * each attempt.
     *
     * This is done from the already loaded/current
     * curriculum data.
     * =================================================== */

    const attemptResourceIds =
      Array.from(
        new Set(
          normalizedAttempts
            .map(
              (attempt) =>
                attempt.tests
                  ?.resource_id
            )
            .filter(
              (
                id
              ): id is string =>
                Boolean(id)
            )
        )
      );

    let attemptResources: Array<{
      id: string;
      title: string;
      slug: string;
      resource_type: string;
      access_type: string;
    }> = [];

    if (
      attemptResourceIds.length > 0
    ) {
      const {
        data: resources,
        error,
      } = await supabase
        .from("resources")
        .select(`
          id,
          title,
          slug,
          resource_type,
          access_type
        `)
        .in(
          "id",
          attemptResourceIds
        );

      if (error) {
        throw new Error(
          `Failed to load attempt resources: ${error.message}`
        );
      }

      attemptResources =
        resources ?? [];
    }

    /* ===================================================
     * Build resource → chapter mapping
     *
     * resource_curriculum_nodes connects resources
     * to curriculum nodes.
     * =================================================== */

    const resourceToNode =
      new Map<
        string,
        string
      >();

    if (
      attemptResourceIds.length > 0 &&
      nodeIds.length > 0
    ) {
      const {
        data: mappings,
        error,
      } = await supabase
        .from(
          "resource_curriculum_nodes"
        )
        .select(`
          resource_id,
          curriculum_node_id
        `)
        .in(
          "resource_id",
          attemptResourceIds
        )
        .in(
          "curriculum_node_id",
          nodeIds
        );

      if (error) {
        throw new Error(
          `Failed to load attempt chapter mapping: ${error.message}`
        );
      }

      for (
        const mapping of
          mappings ?? []
      ) {
        if (
          !resourceToNode.has(
            mapping.resource_id
          )
        ) {
          resourceToNode.set(
            mapping.resource_id,
            mapping.curriculum_node_id
          );
        }
      }
    }

    const resourceMap =
      new Map(
        attemptResources.map(
          (resource) => [
            resource.id,
            resource,
          ]
        )
      );

    const nodeMap =
      new Map(
        (curriculumNodes ?? []).map(
          (node) => [
            node.id,
            node,
          ]
        )
      );

    /* ===================================================
     * Final normalized attempt model
     * =================================================== */

    allAttempts =
      normalizedAttempts.map(
        (attempt) => {
          const resourceId =
            attempt.tests
              ?.resource_id ??
            null;

          const resource =
            resourceId
              ? resourceMap.get(
                  resourceId
                ) ?? null
              : null;

          const nodeId =
            resourceId
              ? resourceToNode.get(
                  resourceId
                ) ?? null
              : null;

          const node =
            nodeId
              ? nodeMap.get(
                  nodeId
                ) ?? null
              : null;

          return {
            ...attempt,
            resource,
            chapter: node
              ? {
                  id: node.id,
                  display_name:
                    node.display_name,
                }
              : null,
          };
        }
      );
  }

  /* =====================================================
   * 7. Attempt statistics
   * ===================================================== */

  const inProgressAttempts =
    allAttempts.filter(
      (attempt) =>
        attempt.status ===
        "IN_PROGRESS"
    );

  const submittedAttempts =
    allAttempts.filter(
      (attempt) =>
        attempt.status ===
        "SUBMITTED"
    );

  const completedAttempts =
    submittedAttempts.length;

  const percentages =
    submittedAttempts
      .map(
        (attempt) =>
          attempt.percentage
      )
      .filter(
        (
          percentage
        ): percentage is number =>
          typeof percentage ===
          "number"
      );

  const averagePercentage =
    percentages.length > 0
      ? Math.round(
          percentages.reduce(
            (
              sum,
              percentage
            ) =>
              sum +
              percentage,
            0
          ) /
            percentages.length
        )
      : null;

  const questionsAnswered =
    allAttempts.reduce(
      (
        total,
        attempt
      ) =>
        total +
        (attempt.correct_count ??
          0) +
        (attempt.incorrect_count ??
          0),
      0
    );

  /* =====================================================
   * 8. Normalize program
   * ===================================================== */

  const program =
    Array.isArray(
      curriculum.programs
    )
      ? curriculum.programs[0] ??
        null
      : curriculum.programs;

  /* =====================================================
   * 9. Return dashboard model
   * ===================================================== */

  return {
    student: {
      userId,

      fullName:
        profile.full_name ??
        null,

      board:
        profile.board ??
        null,

      schoolName:
        profile.school_name ??
        null,

      preferredLanguage:
        profile.preferred_language ??
        null,

      programId:
        profile.program_id,

      programName:
        profile.program_name ??
        program?.name ??
        null,

      programSlug:
        profile.program_slug ??
        program?.slug ??
        null,
    },

    curriculum: {
      id: curriculum.id,
      session:
        curriculum.session,
      slug:
        curriculum.slug,
      description:
        curriculum.description,
    },

    continueLearning:
      inProgressAttempts[0] ??
      null,

    recentAttempts:
      allAttempts,

    availableResources,

    curriculumNodes:
      curriculumNodes ?? [],

    stats: {
      testsAttempted:
        allAttempts.length,

      testsCompleted:
        completedAttempts,

      averagePercentage,

      questionsAnswered,
    },
  };
}

/* =========================================================
 * Chapter-specific student dashboard
 * =========================================================
 *
 * This uses the existing student dashboard data and
 * narrows it down to one curriculum chapter.
 *
 * IMPORTANT:
 * We are NOT changing the existing dashboard.
 * We are NOT removing anything from learning/page.tsx.
 * ========================================================= */

export async function getStudentChapterDashboard(
  chapterId: string
) {
  const dashboard =
    await getStudentDashboard();

  const chapter =
    dashboard.curriculumNodes.find(
      (node) =>
        node.id === chapterId
    );

  if (!chapter) {
    return null;
  }

  const chapterAttempts =
    dashboard.recentAttempts.filter(
      (attempt) =>
        attempt.chapter?.id ===
        chapterId
    );

  const inProgressAttempts =
    chapterAttempts.filter(
      (attempt) =>
        attempt.status ===
        "IN_PROGRESS"
    );

  const submittedAttempts =
    chapterAttempts.filter(
      (attempt) =>
        attempt.status ===
        "SUBMITTED"
    );

  const percentages =
    submittedAttempts
      .map(
        (attempt) =>
          attempt.percentage
      )
      .filter(
        (
          percentage
        ): percentage is number =>
          typeof percentage ===
          "number"
      );

  const averagePercentage =
    percentages.length > 0
      ? Math.round(
          percentages.reduce(
            (
              sum,
              percentage
            ) =>
              sum +
              percentage,
            0
          ) /
            percentages.length
        )
      : null;

  const questionsAnswered =
    chapterAttempts.reduce(
      (
        total,
        attempt
      ) =>
        total +
        (attempt.correct_count ??
          0) +
        (attempt.incorrect_count ??
          0),
      0
    );

  const chapterResources =
    dashboard.availableResources.filter(
      (resource) =>
        dashboard.curriculumNodes.some(
          (node) =>
            node.id === chapterId
        )
    );

  return {
    student:
      dashboard.student,

    curriculum:
      dashboard.curriculum,

    chapter: {
      id: chapter.id,
      display_name:
        chapter.display_name,
      sequence_order:
        chapter.sequence_order,
    },

    continueLearning:
      inProgressAttempts[0] ??
      null,

    recentAttempts:
      chapterAttempts,

    availableResources:
      chapterResources,

    stats: {
      testsAttempted:
        chapterAttempts.length,

      testsCompleted:
        submittedAttempts.length,

      averagePercentage,

      questionsAnswered,
    },
  };
}