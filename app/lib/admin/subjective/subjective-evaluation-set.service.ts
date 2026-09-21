import "server-only";

import { createAdminSupabaseClient } from "@/app/lib/admin/supabase-admin";

/* =========================================================
 * Types
 * ========================================================= */

export type AdminSubjectiveEvaluationStudentAttempt = {
  attemptId: string;
  userId: string;

  attemptNumber: number;
  attemptType: string;
  attemptStatus: string;

  submittedAt: string | null;

  questionCount: number;
  submittedQuestionCount: number;
  evaluatedQuestionCount: number;

  evaluationStatus:
    | "AWAITING_AI"
    | "AI_ASSISTED"
    | "TEACHER_REVIEW"
    | "EVALUATED"
    | "IN_PROGRESS";

  newSubmission: boolean;
};

export type AdminSubjectiveEvaluationSetOverview = {
  setId: string;
  resourceId: string;

  title: string;
  category: string;
  setNumber: number;

  chapterName: string;
  className: string;

  studentAttemptCount: number;

  newSubmissionCount: number;
  awaitingAiCount: number;
  aiAssistedCount: number;
  teacherReviewCount: number;
  evaluatedCount: number;

  attempts: AdminSubjectiveEvaluationStudentAttempt[];
};

/* =========================================================
 * DB Types
 * ========================================================= */

type SetRow = {
  id: string;
  resource_id: string;
  category: string;
  title: string;
  set_number: number;
  status: string;
};

type AttemptRow = {
  id: string;
  set_id: string;
  user_id: string;
  attempt_number: number;
  attempt_type: string;
  status: string;
  submitted_at: string | null;
};

type AttemptQuestionRow = {
  id: string;
  attempt_id: string;
};

type SubmissionRow = {
  id: string;
  attempt_question_id: string;
};

type SubmissionFileRow = {
  id: string;
  submission_id: string;
};

type EvaluationRow = {
  id: string;
  submission_id: string;
  evaluation_status: string;
};

/* =========================================================
 * Get Set Evaluation Overview
 * ========================================================= */

export async function getAdminSubjectiveEvaluationSetOverview(
  setId: string
): Promise<AdminSubjectiveEvaluationSetOverview | null> {
  const normalizedSetId =
    setId?.trim();

  if (!normalizedSetId) {
    throw new Error(
      "Subjective Set ID is required."
    );
  }

  const supabase =
    createAdminSupabaseClient();

  /* -------------------------------------------------------
   * 1. Load Set
   * ------------------------------------------------------- */

  const {
    data: set,
    error: setError,
  } = await supabase
    .from("subjective_sets")
    .select(
      `
        id,
        resource_id,
        category,
        title,
        set_number,
        status
      `
    )
    .eq(
      "id",
      normalizedSetId
    )
    .maybeSingle();

  if (setError) {
    throw new Error(
      `Failed to load Subjective Set: ${setError.message}`
    );
  }

  if (!set) {
    return null;
  }

  const setRow =
    set as SetRow;

  /* -------------------------------------------------------
   * 2. Load Resource + Curriculum information
   * ------------------------------------------------------- */

  const {
    data: resource,
    error: resourceError,
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
    .eq(
      "id",
      setRow.resource_id
    )
    .maybeSingle();

  if (resourceError) {
    throw new Error(
      `Failed to load Subjective resource: ${resourceError.message}`
    );
  }

  if (!resource) {
    throw new Error(
      "The Subjective Set resource could not be found."
    );
  }

  const {
    data: mapping,
    error: mappingError,
  } = await supabase
    .from(
      "resource_curriculum_nodes"
    )
    .select(
      `
        resource_id,
        curriculum_node_id
      `
    )
    .eq(
      "resource_id",
      setRow.resource_id
    )
    .maybeSingle();

  if (mappingError) {
    throw new Error(
      `Failed to load Subjective resource mapping: ${mappingError.message}`
    );
  }

  let chapterName =
    "Subjective Chapter";

  let className =
    "Class";

  if (mapping) {
    const {
      data: node,
      error: nodeError,
    } = await supabase
      .from("curriculum_nodes")
      .select(
        `
          id,
          display_name,
          curriculum_version_id
        `
      )
      .eq(
        "id",
        mapping.curriculum_node_id
      )
      .maybeSingle();

    if (nodeError) {
      throw new Error(
        `Failed to load curriculum chapter: ${nodeError.message}`
      );
    }

    if (node) {
      chapterName =
        node.display_name;

      const {
        data: version,
        error: versionError,
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
          node.curriculum_version_id
        )
        .maybeSingle();

      if (versionError) {
        throw new Error(
          `Failed to load curriculum version: ${versionError.message}`
        );
      }

      if (version) {
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
            version.program_id
          )
          .maybeSingle();

        if (programError) {
          throw new Error(
            `Failed to load class information: ${programError.message}`
          );
        }

        if (program) {
          className =
            program.name;
        }
      }
    }
  }

  /* -------------------------------------------------------
   * 3. Load Student Attempts
   * ------------------------------------------------------- */

  const {
    data: attempts,
    error: attemptsError,
  } = await supabase
    .from(
      "subjective_attempts"
    )
    .select(
      `
        id,
        set_id,
        user_id,
        attempt_number,
        attempt_type,
        status,
        submitted_at
      `
    )
    .eq(
      "set_id",
      normalizedSetId
    )
    .in(
      "status",
      [
        "LOCKED",
        "EVALUATED",
      ]
    )
    .order(
      "submitted_at",
      {
        ascending: true,
        nullsFirst: false,
      }
    );

  if (attemptsError) {
    throw new Error(
      `Failed to load student attempts: ${attemptsError.message}`
    );
  }

  const attemptRows =
    (attempts ??
      []) as AttemptRow[];

  if (attemptRows.length === 0) {
    return {
      setId: setRow.id,
      resourceId:
        setRow.resource_id,

      title: setRow.title,
      category:
        setRow.category,
      setNumber:
        setRow.set_number,

      chapterName,
      className,

      studentAttemptCount: 0,

      newSubmissionCount: 0,
      awaitingAiCount: 0,
      aiAssistedCount: 0,
      teacherReviewCount: 0,
      evaluatedCount: 0,

      attempts: [],
    };
  }

  const attemptIds =
    attemptRows.map(
      (attempt) => attempt.id
    );

  /* -------------------------------------------------------
   * 4. Attempt Questions
   * ------------------------------------------------------- */

  const {
    data: attemptQuestions,
    error: attemptQuestionsError,
  } = await supabase
    .from(
      "subjective_attempt_questions"
    )
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
      `Failed to load attempt questions: ${attemptQuestionsError.message}`
    );
  }

  const attemptQuestionRows =
    (attemptQuestions ??
      []) as AttemptQuestionRow[];

  const attemptQuestionIds =
    attemptQuestionRows.map(
      (row) => row.id
    );

  /* -------------------------------------------------------
   * 5. Submissions
   * ------------------------------------------------------- */

  let submissionRows: SubmissionRow[] =
    [];

  if (
    attemptQuestionIds.length > 0
  ) {
    const {
      data: submissions,
      error: submissionsError,
    } = await supabase
      .from(
        "subjective_submissions"
      )
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
        `Failed to load submissions: ${submissionsError.message}`
      );
    }

    submissionRows =
      (submissions ??
        []) as SubmissionRow[];
  }

  /* -------------------------------------------------------
   * 6. Submission Files
   *
   * A question is considered submitted when it has
   * at least one uploaded solution file.
   * ------------------------------------------------------- */

  const submissionIds =
    submissionRows.map(
      (submission) =>
        submission.id
    );

  let submissionFileRows: SubmissionFileRow[] =
    [];

  if (
    submissionIds.length > 0
  ) {
    const {
      data: files,
      error: filesError,
    } = await supabase
      .from(
        "subjective_submission_files"
      )
      .select(
        `
          id,
          submission_id
        `
      )
      .in(
        "submission_id",
        submissionIds
      );

    if (filesError) {
      throw new Error(
        `Failed to load submission files: ${filesError.message}`
      );
    }

    submissionFileRows =
      (files ??
        []) as SubmissionFileRow[];
  }

  /* -------------------------------------------------------
   * 7. Evaluations
   * ------------------------------------------------------- */

  let evaluationRows: EvaluationRow[] =
    [];

  if (
    submissionIds.length > 0
  ) {
    const {
      data: evaluations,
      error: evaluationsError,
    } = await supabase
      .from(
        "subjective_evaluations"
      )
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
        `Failed to load evaluation states: ${evaluationsError.message}`
      );
    }

    evaluationRows =
      (evaluations ??
        []) as EvaluationRow[];
  }

  /* -------------------------------------------------------
   * 8. Build lookups
   * ------------------------------------------------------- */

  const questionsByAttempt =
    new Map<
      string,
      AttemptQuestionRow[]
    >();

  for (
    const question of attemptQuestionRows
  ) {
    const current =
      questionsByAttempt.get(
        question.attempt_id
      ) ?? [];

    current.push(question);

    questionsByAttempt.set(
      question.attempt_id,
      current
    );
  }

  const submissionByQuestion =
    new Map<
      string,
      SubmissionRow
    >();

  for (
    const submission of submissionRows
  ) {
    submissionByQuestion.set(
      submission.attempt_question_id,
      submission
    );
  }

  const filesBySubmission =
    new Set<string>();

  for (
    const file of submissionFileRows
  ) {
    filesBySubmission.add(
      file.submission_id
    );
  }

  const evaluationBySubmission =
    new Map<
      string,
      string
    >();

  for (
    const evaluation of evaluationRows
  ) {
    evaluationBySubmission.set(
      evaluation.submission_id,
      evaluation.evaluation_status
    );
  }

  /* -------------------------------------------------------
   * 9. Build Student Attempt Cards
   * ------------------------------------------------------- */

  const attemptSummaries =
    attemptRows.map(
      (attempt) => {
        const questions =
          questionsByAttempt.get(
            attempt.id
          ) ?? [];

        let submittedQuestionCount =
          0;

        let evaluatedQuestionCount =
          0;

        const statuses =
          new Set<string>();

        for (
          const question of questions
        ) {
          const submission =
            submissionByQuestion.get(
              question.id
            );

          if (!submission) {
            continue;
          }

          if (
            filesBySubmission.has(
              submission.id
            )
          ) {
            submittedQuestionCount +=
              1;
          }

          const evaluationStatus =
            evaluationBySubmission.get(
              submission.id
            );

          if (
            evaluationStatus
          ) {
            statuses.add(
              evaluationStatus
            );

            if (
              evaluationStatus ===
              "EVALUATED"
            ) {
              evaluatedQuestionCount +=
                1;
            }
          }
        }

        let evaluationStatus:
          | "AWAITING_AI"
          | "AI_ASSISTED"
          | "TEACHER_REVIEW"
          | "EVALUATED"
          | "IN_PROGRESS";

        /*
         * Attempt-level status follows the highest-priority
         * outstanding workflow state.
         */

        if (
          statuses.has(
            "PENDING"
          )
        ) {
          evaluationStatus =
            "AWAITING_AI";
        } else if (
          statuses.has(
            "TEACHER_REVIEW"
          )
        ) {
          evaluationStatus =
            "TEACHER_REVIEW";
        } else if (
          statuses.has(
            "AI_ASSISTED"
          )
        ) {
          evaluationStatus =
            "AI_ASSISTED";
        } else if (
          attempt.status ===
            "EVALUATED" &&
          submittedQuestionCount >
            0
        ) {
          evaluationStatus =
            "EVALUATED";
        } else {
          evaluationStatus =
            "IN_PROGRESS";
        }

        return {
          attemptId:
            attempt.id,

          userId:
            attempt.user_id,

          attemptNumber:
            attempt.attempt_number,

          attemptType:
            attempt.attempt_type,

          attemptStatus:
            attempt.status,

          submittedAt:
            attempt.submitted_at,

          questionCount:
            questions.length,

          submittedQuestionCount,

          evaluatedQuestionCount,

          evaluationStatus,

          newSubmission:
            evaluationStatus ===
            "AWAITING_AI",
        };
      }
    );

  /* -------------------------------------------------------
   * 10. Aggregate Set-level counts
   * ------------------------------------------------------- */

  let newSubmissionCount = 0;
  let awaitingAiCount = 0;
  let aiAssistedCount = 0;
  let teacherReviewCount = 0;
  let evaluatedCount = 0;

  for (
    const attempt of attemptSummaries
  ) {
    if (
      attempt.evaluationStatus ===
      "AWAITING_AI"
    ) {
      awaitingAiCount += 1;
      newSubmissionCount += 1;
    }

    if (
      attempt.evaluationStatus ===
      "AI_ASSISTED"
    ) {
      aiAssistedCount += 1;
    }

    if (
      attempt.evaluationStatus ===
      "TEACHER_REVIEW"
    ) {
      teacherReviewCount += 1;
    }

    if (
      attempt.evaluationStatus ===
      "EVALUATED"
    ) {
      evaluatedCount += 1;
    }
  }

  /* -------------------------------------------------------
   * 11. Return
   * ------------------------------------------------------- */

  return {
    setId: setRow.id,
    resourceId:
      setRow.resource_id,

    title:
      setRow.title,

    category:
      setRow.category,

    setNumber:
      setRow.set_number,

    chapterName,
    className,

    studentAttemptCount:
      attemptSummaries.length,

    newSubmissionCount,
    awaitingAiCount,
    aiAssistedCount,
    teacherReviewCount,
    evaluatedCount,

    attempts:
      attemptSummaries,
  };
}