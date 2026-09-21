import "server-only";

import { createAdminSupabaseClient } from "@/app/lib/admin/supabase-admin";

/* =========================================================
 * Types
 * ========================================================= */

export type AdminSubjectiveEvaluationClassSummary = {
  classSlug: string;
  className: string;

  publishedSetCount: number;
  studentAttemptCount: number;

  awaitingAiCount: number;
  aiAssistedCount: number;
  teacherReviewCount: number;
  evaluatedCount: number;

  newSubmissionCount: number;
};

/* =========================================================
 * Internal DB types
 * ========================================================= */

type ResourceRow = {
  id: string;
  title: string;
  resource_type: string;
  status: string;
};

type ResourceCurriculumMappingRow = {
  resource_id: string;
  curriculum_node_id: string;
};

type CurriculumNodeRow = {
  id: string;
  display_name: string;
  sequence_order: number | null;
  curriculum_version_id: string;
};

type CurriculumVersionRow = {
  id: string;
  session: string;
  status: string;
  program_id: string;
};

type ProgramRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
};

type SubjectiveSetRow = {
  id: string;
  resource_id: string;
  status: string;
};

type AttemptRow = {
  id: string;
  set_id: string;
  status: string;
};

type EvaluationRow = {
  id: string;
  submission_id: string;
  evaluation_status: string;
};

type SubmissionRow = {
  id: string;
  attempt_question_id: string;
};

type AttemptQuestionRow = {
  id: string;
  attempt_id: string;
};

/* =========================================================
 * Helpers
 * ========================================================= */

function increment(
  map: Map<string, number>,
  key: string
) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

/* =========================================================
 * Get Subjective Evaluation Class Overview
 * =========================================================
 *
 * UI hierarchy:
 *
 * Evaluation
 *    ↓
 * Class
 *
 * This service intentionally aggregates at ATTEMPT level.
 *
 * One student attempt may contain 10 questions and therefore
 * 10 evaluation rows.
 *
 * The dashboard must count that as ONE student attempt,
 * not ten submissions.
 * ========================================================= */

export async function getAdminSubjectiveEvaluationClassSummaries(): Promise<
  AdminSubjectiveEvaluationClassSummary[]
> {
  const supabase = createAdminSupabaseClient();

  /* -------------------------------------------------------
   * 1. Published Subjective resources
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
        resource_type,
        status
      `
    )
    .eq("resource_type", "SUBJECTIVE")
    .eq("status", "PUBLISHED");

  if (resourcesError) {
    throw new Error(
      `Failed to load Subjective evaluation resources: ${resourcesError.message}`
    );
  }

  if (!resources || resources.length === 0) {
    return [];
  }

  const resourceRows = resources as ResourceRow[];

  const resourceIds = resourceRows.map(
    (resource) => resource.id
  );

  /* -------------------------------------------------------
   * 2. Resource → Curriculum mappings
   * ------------------------------------------------------- */

  const {
    data: mappings,
    error: mappingsError,
  } = await supabase
    .from("resource_curriculum_nodes")
    .select(
      `
        resource_id,
        curriculum_node_id
      `
    )
    .in("resource_id", resourceIds);

  if (mappingsError) {
    throw new Error(
      `Failed to load Subjective resource curriculum mappings: ${mappingsError.message}`
    );
  }

  const mappingRows =
    (mappings ?? []) as ResourceCurriculumMappingRow[];

  const curriculumNodeIds = [
    ...new Set(
      mappingRows.map(
        (mapping) =>
          mapping.curriculum_node_id
      )
    ),
  ];

  if (curriculumNodeIds.length === 0) {
    return [];
  }

  /* -------------------------------------------------------
   * 3. Curriculum nodes
   * ------------------------------------------------------- */

  const {
    data: nodes,
    error: nodesError,
  } = await supabase
    .from("curriculum_nodes")
    .select(
      `
        id,
        display_name,
        sequence_order,
        curriculum_version_id
      `
    )
    .in("id", curriculumNodeIds);

  if (nodesError) {
    throw new Error(
      `Failed to load curriculum nodes for Subjective evaluation: ${nodesError.message}`
    );
  }

  const nodeRows =
    (nodes ?? []) as CurriculumNodeRow[];

  const versionIds = [
    ...new Set(
      nodeRows.map(
        (node) =>
          node.curriculum_version_id
      )
    ),
  ];

  /* -------------------------------------------------------
   * 4. Curriculum versions
   * ------------------------------------------------------- */

  const {
    data: versions,
    error: versionsError,
  } = await supabase
    .from("curriculum_versions")
    .select(
      `
        id,
        session,
        status,
        program_id
      `
    )
    .in("id", versionIds);

  if (versionsError) {
    throw new Error(
      `Failed to load curriculum versions for Subjective evaluation: ${versionsError.message}`
    );
  }

  const versionRows =
    (versions ?? []) as CurriculumVersionRow[];

  const programIds = [
    ...new Set(
      versionRows.map(
        (version) =>
          version.program_id
      )
    ),
  ];

  /* -------------------------------------------------------
   * 5. Programs / Classes
   * ------------------------------------------------------- */

  const {
    data: programs,
    error: programsError,
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
    .in("id", programIds);

  if (programsError) {
    throw new Error(
      `Failed to load classes for Subjective evaluation: ${programsError.message}`
    );
  }

  const programRows =
    (programs ?? []) as ProgramRow[];

  /* -------------------------------------------------------
   * 6. Build curriculum lookup maps
   * ------------------------------------------------------- */

  const nodeById = new Map(
    nodeRows.map((node) => [
      node.id,
      node,
    ])
  );

  const versionById = new Map(
    versionRows.map((version) => [
      version.id,
      version,
    ])
  );

  const programById = new Map(
    programRows.map((program) => [
      program.id,
      program,
    ])
  );

  const resourceToProgram = new Map<
    string,
    ProgramRow
  >();

  for (const mapping of mappingRows) {
    const node = nodeById.get(
      mapping.curriculum_node_id
    );

    if (!node) {
      continue;
    }

    const version =
      versionById.get(
        node.curriculum_version_id
      );

    if (!version) {
      continue;
    }

    const program =
      programById.get(
        version.program_id
      );

    if (!program) {
      continue;
    }

    resourceToProgram.set(
      mapping.resource_id,
      program
    );
  }

  /* -------------------------------------------------------
   * 7. Published Subjective Sets
   * ------------------------------------------------------- */

  const {
    data: sets,
    error: setsError,
  } = await supabase
    .from("subjective_sets")
    .select(
      `
        id,
        resource_id,
        status
      `
    )
    .in("resource_id", resourceIds)
    .eq("status", "PUBLISHED");

  if (setsError) {
    throw new Error(
      `Failed to load published Subjective Sets for evaluation: ${setsError.message}`
    );
  }

  const setRows =
    (sets ?? []) as SubjectiveSetRow[];

  if (setRows.length === 0) {
    return [];
  }

  const setIds = setRows.map(
    (set) => set.id
  );

  /* -------------------------------------------------------
   * 8. Attempts
   *
   * Only submitted/locked/evaluated attempts are relevant
   * to teacher evaluation workload.
   * ------------------------------------------------------- */

  const {
    data: attempts,
    error: attemptsError,
  } = await supabase
    .from("subjective_attempts")
    .select(
      `
        id,
        set_id,
        status
      `
    )
    .in("set_id", setIds)
    .in("status", [
      "LOCKED",
      "EVALUATED",
    ]);

  if (attemptsError) {
    throw new Error(
      `Failed to load Subjective student attempts: ${attemptsError.message}`
    );
  }

  const attemptRows =
    (attempts ?? []) as AttemptRow[];

  /* -------------------------------------------------------
   * 9. Attempt Questions
   * ------------------------------------------------------- */

  const attemptIds =
    attemptRows.map(
      (attempt) => attempt.id
    );

  let attemptQuestionRows: AttemptQuestionRow[] =
    [];

  if (attemptIds.length > 0) {
    const {
      data: attemptQuestions,
      error: attemptQuestionsError,
    } = await supabase
      .from("subjective_attempt_questions")
      .select(
        `
          id,
          attempt_id
        `
      )
      .in(
        "attempt_id",
        attemptIds
      );

    if (attemptQuestionsError) {
      throw new Error(
        `Failed to load Subjective attempt questions: ${attemptQuestionsError.message}`
      );
    }

    attemptQuestionRows =
      (attemptQuestions ??
        []) as AttemptQuestionRow[];
  }

  /* -------------------------------------------------------
   * 10. Submissions
   * ------------------------------------------------------- */

  const attemptQuestionIds =
    attemptQuestionRows.map(
      (row) => row.id
    );

  let submissionRows: SubmissionRow[] =
    [];

  if (
    attemptQuestionIds.length > 0
  ) {
    const {
      data: submissions,
      error: submissionsError,
    } = await supabase
      .from("subjective_submissions")
      .select(
        `
          id,
          attempt_question_id
        `
      )
      .in(
        "attempt_question_id",
        attemptQuestionIds
      );

    if (submissionsError) {
      throw new Error(
        `Failed to load Subjective submissions: ${submissionsError.message}`
      );
    }

    submissionRows =
      (submissions ??
        []) as SubmissionRow[];
  }

  /* -------------------------------------------------------
   * 11. Evaluations
   * ------------------------------------------------------- */

  const submissionIds =
    submissionRows.map(
      (submission) =>
        submission.id
    );

  let evaluationRows: EvaluationRow[] =
    [];

  if (submissionIds.length > 0) {
    const {
      data: evaluations,
      error: evaluationsError,
    } = await supabase
      .from("subjective_evaluations")
      .select(
        `
          id,
          submission_id,
          evaluation_status
        `
      )
      .in(
        "submission_id",
        submissionIds
      );

    if (evaluationsError) {
      throw new Error(
        `Failed to load Subjective evaluations: ${evaluationsError.message}`
      );
    }

    evaluationRows =
      (evaluations ??
        []) as EvaluationRow[];
  }

  /* -------------------------------------------------------
   * 12. Attempt lookup
   * ------------------------------------------------------- */

  const attemptById = new Map(
    attemptRows.map((attempt) => [
      attempt.id,
      attempt,
    ])
  );

  const attemptQuestionToAttempt =
    new Map<string, string>();

  for (const row of attemptQuestionRows) {
    attemptQuestionToAttempt.set(
      row.id,
      row.attempt_id
    );
  }

  const submissionToAttempt =
    new Map<string, string>();

  for (const submission of submissionRows) {
    const attemptId =
      attemptQuestionToAttempt.get(
        submission.attempt_question_id
      );

    if (attemptId) {
      submissionToAttempt.set(
        submission.id,
        attemptId
      );
    }
  }

  /* -------------------------------------------------------
   * 13. Aggregate evaluation states at ATTEMPT level
   *
   * One attempt may contain multiple questions.
   *
   * We count each attempt only once per state.
   * ------------------------------------------------------- */

  const stateAttempts = {
    PENDING: new Set<string>(),
    AI_ASSISTED: new Set<string>(),
    TEACHER_REVIEW: new Set<string>(),
    EVALUATED: new Set<string>(),
  };

  for (const evaluation of evaluationRows) {
    const attemptId =
      submissionToAttempt.get(
        evaluation.submission_id
      );

    if (!attemptId) {
      continue;
    }

    if (
      evaluation.evaluation_status ===
      "PENDING"
    ) {
      stateAttempts.PENDING.add(
        attemptId
      );
    }

    if (
      evaluation.evaluation_status ===
      "AI_ASSISTED"
    ) {
      stateAttempts.AI_ASSISTED.add(
        attemptId
      );
    }

    if (
      evaluation.evaluation_status ===
      "TEACHER_REVIEW"
    ) {
      stateAttempts.TEACHER_REVIEW.add(
        attemptId
      );
    }

    if (
      evaluation.evaluation_status ===
      "EVALUATED"
    ) {
      stateAttempts.EVALUATED.add(
        attemptId
      );
    }
  }

  /* -------------------------------------------------------
   * 14. Build class-level aggregation
   * ------------------------------------------------------- */

  const classMap =
    new Map<
      string,
      AdminSubjectiveEvaluationClassSummary
    >();

  /* Published sets */
  for (const set of setRows) {
    const program =
      resourceToProgram.get(
        set.resource_id
      );

    if (!program) {
      continue;
    }

    const existing =
      classMap.get(program.slug);

    if (existing) {
      existing.publishedSetCount += 1;
      continue;
    }

    classMap.set(program.slug, {
      classSlug: program.slug,
      className: program.name,

      publishedSetCount: 1,
      studentAttemptCount: 0,

      awaitingAiCount: 0,
      aiAssistedCount: 0,
      teacherReviewCount: 0,
      evaluatedCount: 0,

      newSubmissionCount: 0,
    });
  }

  /* Set → class lookup */
  const setToClass =
    new Map<string, string>();

  for (const set of setRows) {
    const program =
      resourceToProgram.get(
        set.resource_id
      );

    if (!program) {
      continue;
    }

    setToClass.set(
      set.id,
      program.slug
    );
  }

  /* Student attempts */
  const countedAttempts =
    new Set<string>();

  for (const attempt of attemptRows) {
    const classSlug =
      setToClass.get(
        attempt.set_id
      );

    if (!classSlug) {
      continue;
    }

    const summary =
      classMap.get(classSlug);

    if (!summary) {
      continue;
    }

    if (
      !countedAttempts.has(
        attempt.id
      )
    ) {
      summary.studentAttemptCount +=
        1;

      countedAttempts.add(
        attempt.id
      );
    }
  }

  /* -------------------------------------------------------
   * 15. Evaluation workload counts
   * ------------------------------------------------------- */

  for (const [
    attemptId,
    attempt,
  ] of attemptById.entries()) {
    const classSlug =
      setToClass.get(
        attempt.set_id
      );

    if (!classSlug) {
      continue;
    }

    const summary =
      classMap.get(classSlug);

    if (!summary) {
      continue;
    }

    if (
      stateAttempts.PENDING.has(
        attemptId
      )
    ) {
      summary.awaitingAiCount += 1;
      summary.newSubmissionCount +=
        1;
    }

    if (
      stateAttempts.AI_ASSISTED.has(
        attemptId
      )
    ) {
      summary.aiAssistedCount += 1;
    }

    if (
      stateAttempts.TEACHER_REVIEW.has(
        attemptId
      )
    ) {
      summary.teacherReviewCount +=
        1;
    }

    if (
      stateAttempts.EVALUATED.has(
        attemptId
      )
    ) {
      summary.evaluatedCount += 1;
    }
  }

  /* -------------------------------------------------------
   * 16. Final ordering
   *
   * Class IX
   * Class X
   * Class XI
   * Class XII
   * ------------------------------------------------------- */

  const classOrder = [
    "class-9",
    "class-10",
    "class-11",
    "class-12",
  ];

  return Array.from(
    classMap.values()
  ).sort((a, b) => {
    const aIndex =
      classOrder.indexOf(
        a.classSlug
      );

    const bIndex =
      classOrder.indexOf(
        b.classSlug
      );

    if (
      aIndex !== -1 &&
      bIndex !== -1
    ) {
      return aIndex - bIndex;
    }

    if (aIndex !== -1) {
      return -1;
    }

    if (bIndex !== -1) {
      return 1;
    }

    return a.className.localeCompare(
      b.className,
      undefined,
      {
        numeric: true,
        sensitivity: "base",
      }
    );
  });
}