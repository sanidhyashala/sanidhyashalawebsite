"use server";

import { createLearningSupabaseClient } from "@/lib/learning/supabase-learning";
import { requireLearningAuth } from "@/lib/learning/learning-auth";

/* =========================================================
 * Types
 * ========================================================= */

export type StartSubjectiveTeacherReviewResult =
  | {
      success: true;
      evaluationId: string;
      evaluationStatus: "TEACHER_REVIEW";
    }
  | {
      success: false;
      error: string;
    };

export type SaveSubjectiveTeacherEvaluationDraftResult =
  | {
      success: true;
      evaluationId: string;
      evaluationStatus: "TEACHER_REVIEW";
      teacherMarks: number | null;
      teacherFeedback: string | null;
      teacherNote: string | null;
    }
  | {
      success: false;
      error: string;
    };

/* =========================================================
 * Start Teacher Review
 * ========================================================= */

export async function startSubjectiveTeacherReview(
  evaluationId: string,
): Promise<StartSubjectiveTeacherReviewResult> {
  try {
    await requireLearningAuth();

    const normalizedEvaluationId =
      evaluationId?.trim();

    if (!normalizedEvaluationId) {
      return {
        success: false,
        error: "Evaluation ID is required.",
      };
    }

    const supabase =
      await createLearningSupabaseClient();

    const { data, error } =
      await supabase.rpc(
        "start_subjective_teacher_review",
        {
          p_evaluation_id:
            normalizedEvaluationId,
        },
      );

    if (error) {
      console.error(
        "Failed to start Subjective teacher review:",
        error,
      );

      return {
        success: false,
        error:
          error.message ||
          "Unable to start teacher review.",
      };
    }

    const row = Array.isArray(data)
      ? data[0]
      : data;

    if (!row?.evaluation_id) {
      return {
        success: false,
        error:
          "Teacher review could not be started.",
      };
    }

    if (
      row.evaluation_status !==
      "TEACHER_REVIEW"
    ) {
      return {
        success: false,
        error:
          "The evaluation did not enter Teacher Review.",
      };
    }

    return {
      success: true,
      evaluationId:
        row.evaluation_id,
      evaluationStatus:
        "TEACHER_REVIEW",
    };
  } catch (error) {
    console.error(
      "Unexpected Subjective teacher review error:",
      error,
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.",
    };
  }
}

/* =========================================================
 * Save Teacher Evaluation Draft
 * ========================================================= */

export async function saveSubjectiveTeacherEvaluationDraft(
  evaluationId: string,
  teacherMarks: number | null,
  teacherFeedback: string | null,
  teacherNote: string | null,
): Promise<SaveSubjectiveTeacherEvaluationDraftResult> {
  try {
    await requireLearningAuth();

    const normalizedEvaluationId =
      evaluationId?.trim();

    if (!normalizedEvaluationId) {
      return {
        success: false,
        error: "Evaluation ID is required.",
      };
    }

    /* -------------------------------------------------------
       Normalize marks
       ------------------------------------------------------- */

    let normalizedTeacherMarks =
      teacherMarks;

    if (
      normalizedTeacherMarks !== null &&
      !Number.isFinite(
        normalizedTeacherMarks,
      )
    ) {
      return {
        success: false,
        error:
          "Teacher marks must be a valid number.",
      };
    }

    if (
      normalizedTeacherMarks !== null
    ) {
      normalizedTeacherMarks =
        Math.round(
          normalizedTeacherMarks *
            100,
        ) / 100;
    }

    /* -------------------------------------------------------
       Normalize text fields
       ------------------------------------------------------- */

    const normalizedTeacherFeedback =
      teacherFeedback?.trim() || null;

    const normalizedTeacherNote =
      teacherNote?.trim() || null;

    /* -------------------------------------------------------
       Supabase
       ------------------------------------------------------- */

    const supabase =
      await createLearningSupabaseClient();

    const { data, error } =
      await supabase.rpc(
        "save_subjective_teacher_evaluation_draft",
        {
          p_evaluation_id:
            normalizedEvaluationId,

          p_teacher_marks:
            normalizedTeacherMarks,

          p_teacher_feedback:
            normalizedTeacherFeedback,

          p_teacher_note:
            normalizedTeacherNote,
        },
      );

    if (error) {
      console.error(
        "Failed to save Subjective teacher evaluation draft:",
        error,
      );

      return {
        success: false,
        error:
          error.message ||
          "Unable to save teacher evaluation draft.",
      };
    }

    const row = Array.isArray(data)
      ? data[0]
      : data;

    if (!row?.evaluation_id) {
      return {
        success: false,
        error:
          "Teacher evaluation draft could not be saved.",
      };
    }

    if (
      row.evaluation_status !==
      "TEACHER_REVIEW"
    ) {
      return {
        success: false,
        error:
          "The evaluation is not in Teacher Review.",
      };
    }

    return {
      success: true,

      evaluationId:
        row.evaluation_id,

      evaluationStatus:
        "TEACHER_REVIEW",

      teacherMarks:
        row.teacher_marks !==
        undefined
          ? row.teacher_marks
          : null,

      teacherFeedback:
        row.teacher_feedback ??
        null,

      teacherNote:
        row.teacher_note ??
        null,
    };
  } catch (error) {
    console.error(
      "Unexpected Subjective teacher draft error:",
      error,
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.",
    };
  }
}