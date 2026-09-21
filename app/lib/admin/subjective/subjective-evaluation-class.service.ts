import "server-only";

import { createAdminSupabaseClient } from "@/app/lib/admin/supabase-admin";

import {
  getAdminLearningResources,
} from "@/app/lib/admin/learning/learning-resources.service";

/* =========================================================
 * Types
 * ========================================================= */

export type AdminSubjectiveEvaluationSetSummary = {
  setId: string;
  resourceId: string;

  chapterName: string;
  chapterSequence: number;

  category: string;
  title: string;
  setNumber: number;
  displayOrder: number;

  studentAttemptCount: number;

  awaitingAiCount: number;
  aiAssistedCount: number;
  teacherReviewCount: number;
  evaluatedCount: number;

  newSubmissionCount: number;
};

export type AdminSubjectiveEvaluationChapterSummary = {
  chapterId: string;
  chapterName: string;
  chapterSequence: number;

  sets: AdminSubjectiveEvaluationSetSummary[];

  totalStudentAttempts: number;
  totalNewSubmissions: number;
  totalAwaitingAi: number;
  totalAiAssisted: number;
  totalTeacherReview: number;
  totalEvaluated: number;
};

/* =========================================================
 * DB Types
 * ========================================================= */

type SubjectiveSetRow = {
  id: string;
  resource_id: string;
  category: string;
  title: string;
  set_number: number;
  display_order: number;
  status: string;
};

type AttemptRow = {
  id: string;
  set_id: string;
  status: string;
};

type AttemptQuestionRow = {
  id: string;
  attempt_id: string;
};

type SubmissionRow = {
  id: string;
  attempt_question_id: string;
};

type EvaluationRow = {
  id: string;
  submission_id: string;
  evaluation_status: string;
};

/* =========================================================
 * Helpers
 * ========================================================= */

function createEmptyChapter(
  chapterId: string,
  chapterName: string,
  chapterSequence: number
): AdminSubjectiveEvaluationChapterSummary {
  return {
    chapterId,
    chapterName,
    chapterSequence,

    sets: [],

    totalStudentAttempts: 0,
    totalNewSubmissions: 0,
    totalAwaitingAi: 0,
    totalAiAssisted: 0,
    totalTeacherReview: 0,
    totalEvaluated: 0,
  };
}

/* =========================================================
 * Get evaluation overview for one class
 * ========================================================= */

export async function getAdminSubjectiveEvaluationClassOverview(
  classSlug: string
): Promise<AdminSubjectiveEvaluationChapterSummary[]> {
  const normalizedClassSlug =
    classSlug?.trim();

  if (!normalizedClassSlug) {
    throw new Error(
      "Class slug is required."
    );
  }

  const supabase =
    createAdminSupabaseClient();

  /* -------------------------------------------------------
   * 1. Load existing learning resources
   *
   * We deliberately reuse the existing curriculum
   * resolution instead of duplicating curriculum logic.
   * ------------------------------------------------------- */

  const resources =
    await getAdminLearningResources();

  const classResources =
    resources.filter(
      (resource) =>
        resource.resource_type ===
          "SUBJECTIVE" &&
        resource.status ===
          "PUBLISHED" &&
        resource.curriculum?.program
          ?.slug === normalizedClassSlug
    );

  if (
    classResources.length === 0
  ) {
    return [];
  }

  const resourceIds =
    classResources.map(
      (resource) => resource.id
    );

  /* -------------------------------------------------------
   * 2. Build resource → chapter lookup
   * ------------------------------------------------------- */

  const resourceInfo =
    new Map<
      string,
      {
        chapterId: string;
        chapterName: string;
        chapterSequence: number;
      }
    >();

  for (const resource of classResources) {
    const node =
      resource.curriculum?.node;

    if (!node) {
      continue;
    }

    resourceInfo.set(
      resource.id,
      {
        chapterId: node.id,
        chapterName:
          node.display_name,
        chapterSequence:
          node.sequence_order ?? 999999,
      }
    );
  }

  if (resourceInfo.size === 0) {
    return [];
  }

  /* -------------------------------------------------------
   * 3. Published Subjective Sets
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
        category,
        title,
        set_number,
        display_order,
        status
      `
    )
    .in(
      "resource_id",
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
    );

  if (setsError) {
    throw new Error(
      `Failed to load published Subjective Sets: ${setsError.message}`
    );
  }

  const setRows =
    (sets ?? []) as SubjectiveSetRow[];

  if (setRows.length === 0) {
    return [];
  }

  const setIds =
    setRows.map(
      (set) => set.id
    );

  /* -------------------------------------------------------
   * 4. Student Attempts
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
    .in(
      "set_id",
      setIds
    )
    .in(
      "status",
      [
        "LOCKED",
        "EVALUATED",
      ]
    );

  if (attemptsError) {
    throw new Error(
      `Failed to load Subjective attempts: ${attemptsError.message}`
    );
  }

  const attemptRows =
    (attempts ?? []) as AttemptRow[];

  /* -------------------------------------------------------
   * 5. Attempt Questions
   * ------------------------------------------------------- */

  const attemptIds =
    attemptRows.map(
      (attempt) => attempt.id
    );

  let attemptQuestionRows: AttemptQuestionRow[] =
    [];

  if (
    attemptIds.length > 0
  ) {
    const {
      data: attemptQuestions,
      error:
        attemptQuestionsError,
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
        `Failed to load Subjective attempt questions: ${attemptQuestionsError.message}`
      );
    }

    attemptQuestionRows =
      (attemptQuestions ??
        []) as AttemptQuestionRow[];
  }

  /* -------------------------------------------------------
   * 6. Submissions
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
        `Failed to load Subjective submissions: ${submissionsError.message}`
      );
    }

    submissionRows =
      (submissions ??
        []) as SubmissionRow[];
  }

  /* -------------------------------------------------------
   * 7. Evaluations
   * ------------------------------------------------------- */

  const submissionIds =
    submissionRows.map(
      (submission) =>
        submission.id
    );

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
        `Failed to load Subjective evaluations: ${evaluationsError.message}`
      );
    }

    evaluationRows =
      (evaluations ??
        []) as EvaluationRow[];
  }

  /* -------------------------------------------------------
   * 8. Build lookups
   * ------------------------------------------------------- */

  const attemptById =
    new Map(
      attemptRows.map(
        (attempt) => [
          attempt.id,
          attempt,
        ]
      )
    );

  const attemptQuestionToAttempt =
    new Map<string, string>();

  for (
    const row of attemptQuestionRows
  ) {
    attemptQuestionToAttempt.set(
      row.id,
      row.attempt_id
    );
  }

  const submissionToAttempt =
    new Map<string, string>();

  for (
    const submission of submissionRows
  ) {
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

  const setById =
    new Map(
      setRows.map(
        (set) => [
          set.id,
          set,
        ]
      )
    );

  /* -------------------------------------------------------
   * 9. Determine attempt-level evaluation state
   *
   * IMPORTANT:
   *
   * 10 evaluated questions for one student attempt
   * must still count as ONE evaluated attempt.
   * ------------------------------------------------------- */

  const attemptStates =
    new Map<
      string,
      Set<string>
    >();

  for (
    const evaluation of evaluationRows
  ) {
    const attemptId =
      submissionToAttempt.get(
        evaluation.submission_id
      );

    if (!attemptId) {
      continue;
    }

    if (
      !attemptStates.has(
        attemptId
      )
    ) {
      attemptStates.set(
        attemptId,
        new Set<string>()
      );
    }

    attemptStates
      .get(attemptId)!
      .add(
        evaluation.evaluation_status
      );
  }

  /* -------------------------------------------------------
   * 10. Create chapter map
   * ------------------------------------------------------- */

  const chapterMap =
    new Map<
      string,
      AdminSubjectiveEvaluationChapterSummary
    >();

  for (
    const set of setRows
  ) {
    const info =
      resourceInfo.get(
        set.resource_id
      );

    if (!info) {
      continue;
    }

    if (
      !chapterMap.has(
        info.chapterId
      )
    ) {
      chapterMap.set(
        info.chapterId,
        createEmptyChapter(
          info.chapterId,
          info.chapterName,
          info.chapterSequence
        )
      );
    }

    const chapter =
      chapterMap.get(
        info.chapterId
      )!;

    chapter.sets.push({
      setId: set.id,
      resourceId:
        set.resource_id,

      chapterName:
        info.chapterName,
      chapterSequence:
        info.chapterSequence,

      category:
        set.category,
      title:
        set.title,
      setNumber:
        set.set_number,
      displayOrder:
        set.display_order,

      studentAttemptCount: 0,

      awaitingAiCount: 0,
      aiAssistedCount: 0,
      teacherReviewCount: 0,
      evaluatedCount: 0,

      newSubmissionCount: 0,
    });
  }

  /* -------------------------------------------------------
   * 11. Aggregate attempts into sets
   * ------------------------------------------------------- */

  for (
    const attempt of attemptRows
  ) {
    const set =
      setById.get(
        attempt.set_id
      );

    if (!set) {
      continue;
    }

    const info =
      resourceInfo.get(
        set.resource_id
      );

    if (!info) {
      continue;
    }

    const chapter =
      chapterMap.get(
        info.chapterId
      );

    if (!chapter) {
      continue;
    }

    const setSummary =
      chapter.sets.find(
        (item) =>
          item.setId ===
          set.id
      );

    if (!setSummary) {
      continue;
    }

    setSummary.studentAttemptCount +=
      1;

    chapter.totalStudentAttempts +=
      1;

    const states =
      attemptStates.get(
        attempt.id
      );

    if (!states) {
      continue;
    }

    /* -----------------------------------------------------
     * Priority:
     *
     * Teacher Review
     * > AI Assisted
     * > Awaiting AI
     * > Evaluated
     *
     * We use the actual current evaluation states.
     * ----------------------------------------------------- */

    if (
      states.has(
        "PENDING"
      )
    ) {
      setSummary.awaitingAiCount +=
        1;

      setSummary.newSubmissionCount +=
        1;

      chapter.totalAwaitingAi +=
        1;

      chapter.totalNewSubmissions +=
        1;
    }

    if (
      states.has(
        "AI_ASSISTED"
      )
    ) {
      setSummary.aiAssistedCount +=
        1;

      chapter.totalAiAssisted +=
        1;
    }

    if (
      states.has(
        "TEACHER_REVIEW"
      )
    ) {
      setSummary.teacherReviewCount +=
        1;

      chapter.totalTeacherReview +=
        1;
    }

    /*
     * An attempt can have all its question evaluations
     * finalized. The DB attempt itself is also EVALUATED.
     */
    if (
      attempt.status ===
      "EVALUATED"
    ) {
      setSummary.evaluatedCount +=
        1;

      chapter.totalEvaluated +=
        1;
    }
  }

  /* -------------------------------------------------------
   * 12. Sort sets
   * ------------------------------------------------------- */

  for (
    const chapter of chapterMap.values()
  ) {
    chapter.sets.sort(
      (a, b) =>
        a.displayOrder -
          b.displayOrder ||
        a.setNumber -
          b.setNumber
    );
  }

  /* -------------------------------------------------------
   * 13. Sort chapters
   * ------------------------------------------------------- */

  return Array.from(
    chapterMap.values()
  ).sort(
    (a, b) =>
      a.chapterSequence -
      b.chapterSequence
  );
}