import "server-only";

import { clerkClient } from "@clerk/nextjs/server";

import type {
  SubjectiveAttemptStatus,
  SubjectiveAttemptType,
  SubjectiveEvaluationStatus,
} from "@/app/lib/learning/subjective/types";

import { createLearningSupabaseClient } from "@/lib/learning/supabase-learning";

/**
 * ============================================================
 * Teacher Evaluation Workspace Types
 * ============================================================
 */

export type SubjectiveAttemptEvaluationQuestion = {
  attemptQuestionId: string;
  attemptId: string;

  questionId: string;
  questionRevisionId: string;
  questionOrder: number;

  marks: number;
  questionText: string;

  submission: {
    id: string;
    answerText: string | null;
    status: string;
    submittedAt: string | null;
  } | null;

  evaluation: {
    id: string;
    evaluationStatus: SubjectiveEvaluationStatus;

    aiSuggestedMarks: number | null;
    aiFeedback: string | null;
    aiAnalysis: Record<string, unknown> | null;

    teacherMarks: number | null;
    teacherFeedback: string | null;
    teacherNote: string | null;

    finalMarks: number | null;

    evaluatedBy: string | null;
    evaluatedAt: string | null;
  } | null;

  files: Array<{
    id: string;
    filePath: string;
    fileName: string;
    mimeType: string;
    fileSizeBytes: number | null;
    pageNumber: number | null;
  }>;
};

export type SubjectiveAttemptEvaluationWorkspace = {
  attempt: {
    id: string;
    setId: string;
    userId: string;
    studentName: string | null;

    attemptNumber: number;
    attemptType: SubjectiveAttemptType;
    status: SubjectiveAttemptStatus;

    startedAt: string;
    submittedAt: string | null;
    evaluatedAt: string | null;

    teacherNote: string | null;
  };

  set: {
    id: string;
    resourceId: string;

    title: string;
    description: string | null;

    category: string;
    setNumber: number;

    accessType: string;
  } | null;

  resource: {
    id: string;
    title: string;
    className: string | null;
    chapterName: string | null;
    session: string | null;
  } | null;

  questions: SubjectiveAttemptEvaluationQuestion[];

  summary: {
    questionCount: number;
    submittedQuestionCount: number;
    evaluatedQuestionCount: number;

    maxMarks: number;
    finalMarks: number;

    pendingEvaluationCount: number;
    aiAssistedCount: number;
    teacherReviewCount: number;
  };
};

/**
 * ============================================================
 * Raw RPC Types
 * ============================================================
 *
 * The workspace RPC is expected to return one row per
 * attempt question with nested JSON objects.
 */

type AttemptWorkspaceRpcRow = {
  attempt: {
    id: string;
    set_id: string;
    user_id: string;

    attempt_number: number;
    attempt_type: string;
    status: string;

    started_at: string;
    submitted_at: string | null;
    evaluated_at: string | null;

    teacher_note: string | null;
  };

  set: {
    id: string;
    resource_id: string;

    title: string;
    description: string | null;

    category: string;
    set_number: number;

    access_type: string;
  } | null;

  resource: {
    id: string;
    title: string;
    class_name: string | null;
    chapter_name: string | null;
    session: string | null;
  } | null;

  question: {
    attempt_question_id: string;
    attempt_id: string;

    question_id: string;
    question_revision_id: string;
    question_order: number;

    marks: number;
    question_text: string;
  };

  submission: {
    id: string;
    answer_text: string | null;
    status: string;
    submitted_at: string | null;
  } | null;

  evaluation: {
    id: string;
    evaluation_status: string;

    ai_suggested_marks: number | null;
    ai_feedback: string | null;
    ai_analysis: Record<string, unknown> | null;

    teacher_marks: number | null;
    teacher_feedback: string | null;
    teacher_note: string | null;

    final_marks: number | null;

    evaluated_by: string | null;
    evaluated_at: string | null;
  } | null;

  files: Array<{
    id: string;
    file_path: string;
    file_name: string;
    mime_type: string;
    file_size_bytes: number | null;
    page_number: number | null;
  }>;
};

/**
 * ============================================================
 * Helpers
 * ============================================================
 */

function normalizeAttemptStatus(
  status: string,
): SubjectiveAttemptStatus {
  switch (status) {
    case "IN_PROGRESS":
    case "SUBMITTED":
    case "LOCKED":
    case "EVALUATED":
    case "ABANDONED":
      return status;

    default:
      throw new Error(
        `Invalid Subjective attempt status returned by database: ${status}`,
      );
  }
}

function normalizeAttemptType(
  attemptType: string,
): SubjectiveAttemptType {
  switch (attemptType) {
    case "INITIAL":
    case "PREMIUM_RETRY":
      return attemptType;

    default:
      throw new Error(
        `Invalid Subjective attempt type returned by database: ${attemptType}`,
      );
  }
}

function normalizeEvaluationStatus(
  status: string,
): SubjectiveEvaluationStatus {
  switch (status) {
    case "PENDING":
    case "AI_ASSISTED":
    case "TEACHER_REVIEW":
    case "EVALUATED":
      return status;

    default:
      throw new Error(
        `Invalid Subjective evaluation status returned by database: ${status}`,
      );
  }
}

/**
 * ============================================================
 * Main Workspace Loader
 * ============================================================
 *
 * This function intentionally uses the authenticated Clerk
 * Supabase client.
 *
 * It does NOT use the service-role client.
 *
 * Database-side teacher/admin authorization therefore remains
 * the authority for protected evaluation data.
 */

export async function getTeacherSubjectiveAttemptEvaluationWorkspace(
  attemptId: string,
): Promise<SubjectiveAttemptEvaluationWorkspace | null> {
  const normalizedAttemptId = attemptId?.trim();

  if (!normalizedAttemptId) {
    throw new Error("Attempt ID is required.");
  }

  const supabase = await createLearningSupabaseClient();

  /**
   * ----------------------------------------------------------
   * IMPORTANT
   * ----------------------------------------------------------
   *
   * This RPC is the only database contract required by this
   * service.
   *
   * We will create the RPC next, after this service is in place.
   */
  const { data, error } = await supabase.rpc(
    "get_subjective_attempt_evaluation_workspace",
    {
      p_attempt_id: normalizedAttemptId,
    },
  );

  if (error) {
    console.error(
      "Failed to load Subjective attempt evaluation workspace:",
      error,
    );

    throw new Error(
      error.message ||
        "Unable to load the Subjective evaluation workspace.",
    );
  }

  if (!data) {
    return null;
  }

  const rows = Array.isArray(data)
    ? (data as AttemptWorkspaceRpcRow[])
    : [data as AttemptWorkspaceRpcRow];

  if (rows.length === 0) {
    return null;
  }

  const first = rows[0];

  if (!first.attempt) {
    throw new Error(
      "The Subjective attempt could not be loaded.",
    );
  }

  /*
   * Resolve the student's human-readable name from Clerk. The
   * attempt still keeps userId as the stable identity key; this
   * is display metadata only and never changes evaluation logic.
   */
  let studentName: string | null = null;

  try {
    const clerk = await clerkClient();
    const student = await clerk.users.getUser(
      first.attempt.user_id,
    );

    studentName =
      [student.firstName, student.lastName]
        .filter(
          (value): value is string =>
            Boolean(value?.trim()),
        )
        .join(" ")
        .trim() ||
      student.username?.trim() ||
      null;
  } catch (error) {
    console.warn(
      "Unable to resolve student name for Subjective evaluation workspace:",
      error,
    );
  }

  /**
   * ----------------------------------------------------------
   * Questions
   * ----------------------------------------------------------
   */

  const questions: SubjectiveAttemptEvaluationQuestion[] =
    rows
      .filter((row) => row.question)
      .sort(
        (a, b) =>
          a.question.question_order -
          b.question.question_order,
      )
      .map((row) => ({
        attemptQuestionId:
          row.question.attempt_question_id,

        attemptId:
          row.question.attempt_id,

        questionId:
          row.question.question_id,

        questionRevisionId:
          row.question.question_revision_id,

        questionOrder:
          row.question.question_order,

        marks:
          Number(row.question.marks),

        questionText:
          row.question.question_text,

        submission: row.submission
          ? {
              id: row.submission.id,

              answerText:
                row.submission.answer_text,

              status:
                row.submission.status,

              submittedAt:
                row.submission.submitted_at,
            }
          : null,

        evaluation: row.evaluation
          ? {
              id: row.evaluation.id,

              evaluationStatus:
                normalizeEvaluationStatus(
                  row.evaluation.evaluation_status,
                ),

              aiSuggestedMarks:
                row.evaluation.ai_suggested_marks,

              aiFeedback:
                row.evaluation.ai_feedback,

              aiAnalysis:
                row.evaluation.ai_analysis,

              teacherMarks:
                row.evaluation.teacher_marks,

              teacherFeedback:
                row.evaluation.teacher_feedback,

              teacherNote:
                row.evaluation.teacher_note,

              finalMarks:
                row.evaluation.final_marks,

              evaluatedBy:
                row.evaluation.evaluated_by,

              evaluatedAt:
                row.evaluation.evaluated_at,
            }
          : null,

        files: (row.files ?? []).map(
          (file) => ({
            id: file.id,

            filePath:
              file.file_path,

            fileName:
              file.file_name,

            mimeType:
              file.mime_type,

            fileSizeBytes:
              file.file_size_bytes,

            pageNumber:
              file.page_number,
          }),
        ),
      }));

  /**
   * ----------------------------------------------------------
   * Summary
   * ----------------------------------------------------------
   */

  const questionCount =
    questions.length;

  const submittedQuestionCount =
    questions.filter(
      (question) =>
        question.submission !== null &&
        question.files.length > 0,
    ).length;

  const evaluatedQuestionCount =
    questions.filter(
      (question) =>
        question.evaluation?.evaluationStatus ===
        "EVALUATED",
    ).length;

  const pendingEvaluationCount =
    questions.filter(
      (question) =>
        question.evaluation?.evaluationStatus ===
        "PENDING",
    ).length;

  const aiAssistedCount =
    questions.filter(
      (question) =>
        question.evaluation?.evaluationStatus ===
        "AI_ASSISTED",
    ).length;

  const teacherReviewCount =
    questions.filter(
      (question) =>
        question.evaluation?.evaluationStatus ===
        "TEACHER_REVIEW",
    ).length;

  const maxMarks = questions.reduce(
    (total, question) =>
      total + question.marks,
    0,
  );

  /**
   * Only finalised marks contribute to final marks.
   *
   * Not-attempted questions therefore contribute zero here
   * without being treated as an incorrect evaluated answer.
   */
  const finalMarks = questions.reduce(
    (total, question) =>
      total +
      (question.evaluation?.finalMarks ?? 0),
    0,
  );

  return {
    attempt: {
      id: first.attempt.id,

      setId:
        first.attempt.set_id,

      userId:
        first.attempt.user_id,

      studentName,

      attemptNumber:
        first.attempt.attempt_number,

      attemptType:
        normalizeAttemptType(
          first.attempt.attempt_type,
        ),

      status:
        normalizeAttemptStatus(
          first.attempt.status,
        ),

      startedAt:
        first.attempt.started_at,

      submittedAt:
        first.attempt.submitted_at,

      evaluatedAt:
        first.attempt.evaluated_at,

      teacherNote:
        first.attempt.teacher_note,
    },

    set: first.set
      ? {
          id:
            first.set.id,

          resourceId:
            first.set.resource_id,

          title:
            first.set.title,

          description:
            first.set.description,

          category:
            first.set.category,

          setNumber:
            first.set.set_number,

          accessType:
            first.set.access_type,
        }
      : null,

    resource: first.resource
      ? {
          id:
            first.resource.id,

          title:
            first.resource.title,

          className:
            first.resource.class_name,

          chapterName:
            first.resource.chapter_name,

          session:
            first.resource.session,
        }
      : null,

    questions,

    summary: {
      questionCount,

      submittedQuestionCount,

      evaluatedQuestionCount,

      maxMarks,

      finalMarks,

      pendingEvaluationCount,

      aiAssistedCount,

      teacherReviewCount,
    },
  };
}