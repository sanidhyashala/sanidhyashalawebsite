import "server-only";

import type {
  SubjectiveEvaluation,
  SubjectiveEvaluationStatus,
} from "@/app/lib/learning/subjective/types";

import { createLearningSupabaseClient } from "@/lib/learning/supabase-learning";

/**
 * Teacher/Admin Evaluation Queue item.
 *
 * This is intentionally separate from SubjectiveEvaluation because
 * the queue RPC returns additional context required by the teacher:
 * submission, attempt, set, question and marks.
 */
export type SubjectiveEvaluationQueueItem = {
  evaluationId: string;
  submissionId: string;
  evaluationStatus: SubjectiveEvaluationStatus;
  submittedAt: string | null;
  attemptId: string;
  setId: string;
  questionId: string;
  questionOrder: number;
  marks: number;
};

/**
 * Complete evaluation detail returned to the teacher evaluation workspace.
 */
export type SubjectiveEvaluationDetail = {
  evaluation: SubjectiveEvaluation;

  submission: {
    id: string;
    attemptQuestionId: string;
    answerText: string | null;
    status: string;
    submittedAt: string | null;
  };

  attemptQuestion: {
    id: string;
    attemptId: string;
    questionId: string;
    questionRevisionId: string;
    questionOrder: number;
    marks: number;
  };

  attempt: {
    id: string;
    setId: string;
    attemptNumber: number;
    attemptType: string;
    status: string;
    startedAt: string;
    submittedAt: string | null;
    evaluatedAt: string | null;
  };

  questionRevision: Record<string, unknown> | null;

  files: Array<{
    id: string;
    filePath: string;
    fileName: string;
    mimeType: string;
    fileSizeBytes: number | null;
    pageNumber: number | null;
  }>;
}

type QueueRpcRow = {
  evaluation_id: string;
  submission_id: string;
  evaluation_status: string;
  submitted_at: string | null;
  attempt_id: string;
  set_id: string;
  question_id: string;
  question_order: number;
  marks: number;
};

type EvaluationDetailRpcRow = {
  evaluation: {
    id: string;
    submission_id: string;
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

    created_at: string;
    updated_at: string;
  };

  submission: {
    id: string;
    attempt_question_id: string;
    answer_text: string | null;
    status: string;
    submitted_at: string | null;
    created_at: string;
    updated_at: string;
  };

  attempt_question: {
    id: string;
    attempt_id: string;
    question_id: string;
    question_revision_id: string;
    question_order: number;
    marks: number;
  };

  attempt: {
    id: string;
    set_id: string;
    attempt_number: number;
    attempt_type: string;
    status: string;
    started_at: string;
    submitted_at: string | null;
    evaluated_at: string | null;
  };

  question_revision: Record<string, unknown> | null;

  files: Array<{
    id: string;
    file_path: string;
    file_name: string;
    mime_type: string;
    file_size_bytes: number | null;
    page_number: number | null;
    created_at: string;
  }>;
};

/**
 * Convert database status into the strict TypeScript union.
 */
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
 * Get the Teacher/Admin Subjective evaluation queue.
 *
 * The Supabase client is created with the authenticated Clerk
 * access token so database-side teacher/admin authorization works.
 */
export async function getTeacherSubjectiveEvaluationQueue(): Promise<
  SubjectiveEvaluationQueueItem[]
> {
  const supabase = await createLearningSupabaseClient();

  const { data, error } = await supabase.rpc(
    "get_subjective_evaluation_queue",
  );

  if (error) {
    console.error(
      "Failed to load Subjective evaluation queue:",
      error,
    );

    throw new Error(
      error.message ||
        "Unable to load the Subjective evaluation queue.",
    );
  }

  if (!data) {
    return [];
  }

  const rows = Array.isArray(data)
    ? (data as QueueRpcRow[])
    : [data as QueueRpcRow];

  return rows.map((row) => ({
    evaluationId: row.evaluation_id,
    submissionId: row.submission_id,
    evaluationStatus: normalizeEvaluationStatus(
      row.evaluation_status,
    ),
    submittedAt: row.submitted_at,
    attemptId: row.attempt_id,
    setId: row.set_id,
    questionId: row.question_id,
    questionOrder: row.question_order,
    marks: Number(row.marks),
  }));
}

/**
 * Get complete Subjective evaluation detail
 * for Teacher/Admin review.
 */
export async function getTeacherSubjectiveEvaluationDetail(
  evaluationId: string,
): Promise<SubjectiveEvaluationDetail | null> {
  const normalizedEvaluationId = evaluationId?.trim();

  if (!normalizedEvaluationId) {
    throw new Error("Evaluation ID is required.");
  }

  const supabase = await createLearningSupabaseClient();

  const { data, error } = await supabase.rpc(
    "get_subjective_evaluation_detail",
    {
      p_evaluation_id: normalizedEvaluationId,
    },
  );

  if (error) {
    console.error(
      "Failed to load Subjective evaluation detail:",
      error,
    );

    throw new Error(
      error.message ||
        "Unable to load the Subjective evaluation.",
    );
  }

  if (!data) {
    return null;
  }

  const detail = data as EvaluationDetailRpcRow;

  const evaluation: SubjectiveEvaluation = {
    id: detail.evaluation.id,

    submissionId:
      detail.evaluation.submission_id,

    evaluationStatus:
      normalizeEvaluationStatus(
        detail.evaluation.evaluation_status,
      ),

    aiSuggestedMarks:
      detail.evaluation.ai_suggested_marks,

    aiFeedback:
      detail.evaluation.ai_feedback,

    aiAnalysis:
      detail.evaluation.ai_analysis,

    teacherMarks:
      detail.evaluation.teacher_marks,

    teacherFeedback:
      detail.evaluation.teacher_feedback,

    teacherNote:
      detail.evaluation.teacher_note,

    finalMarks:
      detail.evaluation.final_marks,

    evaluatedBy:
      detail.evaluation.evaluated_by,

    evaluatedAt:
      detail.evaluation.evaluated_at,
  };

  return {
    evaluation,

    submission: {
      id: detail.submission.id,

      attemptQuestionId:
        detail.submission.attempt_question_id,

      answerText:
        detail.submission.answer_text,

      status:
        detail.submission.status,

      submittedAt:
        detail.submission.submitted_at,
    },

    attemptQuestion: {
      id: detail.attempt_question.id,

      attemptId:
        detail.attempt_question.attempt_id,

      questionId:
        detail.attempt_question.question_id,

      questionRevisionId:
        detail.attempt_question.question_revision_id,

      questionOrder:
        detail.attempt_question.question_order,

      marks: Number(
        detail.attempt_question.marks,
      ),
    },

    attempt: {
      id: detail.attempt.id,

      setId:
        detail.attempt.set_id,

      attemptNumber:
        detail.attempt.attempt_number,

      attemptType:
        detail.attempt.attempt_type,

      status:
        detail.attempt.status,

      startedAt:
        detail.attempt.started_at,

      submittedAt:
        detail.attempt.submitted_at,

      evaluatedAt:
        detail.attempt.evaluated_at,
    },

    questionRevision:
      detail.question_revision,

    files: (detail.files ?? []).map(
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
  };
}