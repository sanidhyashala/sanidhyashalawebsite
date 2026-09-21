"use server";

import { auth } from "@clerk/nextjs/server";

import { createLearningSupabaseClient } from "@/lib/learning/supabase-learning";

export type FinalizeSubjectiveTeacherEvaluationResult =
  | {
      success: true;
      evaluationId: string;
      evaluationStatus: "EVALUATED";
      teacherMarks: number;
      teacherFeedback: string | null;
      teacherNote: string | null;
      finalMarks: number;
      evaluatedBy: string;
      evaluatedAt: string | null;
    }
  | {
      success: false;
      error: string;
    };

export async function finalizeSubjectiveTeacherEvaluation(
  evaluationId: string,
  teacherMarks: number,
  teacherFeedback: string,
  teacherNote: string,
): Promise<FinalizeSubjectiveTeacherEvaluationResult> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: "Authentication required.",
      };
    }

    const normalizedEvaluationId = evaluationId?.trim();

    if (!normalizedEvaluationId) {
      return {
        success: false,
        error: "Evaluation ID is required.",
      };
    }

    if (!Number.isFinite(teacherMarks)) {
      return {
        success: false,
        error: "Teacher marks must be a valid number.",
      };
    }

    const supabase = await createLearningSupabaseClient();

    const { data, error } = await supabase.rpc(
      "teacher_finalize_subjective_evaluation",
      {
        p_evaluation_id: normalizedEvaluationId,
        p_teacher_marks: teacherMarks,
        p_teacher_feedback:
          teacherFeedback.trim() || null,
        p_teacher_note:
          teacherNote.trim() || null,
      },
    );

    if (error) {
      console.error(
        "Failed to finalize Subjective teacher evaluation:",
        error,
      );

      return {
        success: false,
        error:
          error.message ||
          "Unable to finalize the evaluation.",
      };
    }

    const row = Array.isArray(data) ? data[0] : data;

    if (!row?.evaluation_id) {
      return {
        success: false,
        error:
          "The evaluation could not be finalized.",
      };
    }

    return {
      success: true,
      evaluationId: row.evaluation_id,
      evaluationStatus: "EVALUATED",
      teacherMarks: Number(row.teacher_marks),
      teacherFeedback:
        row.teacher_feedback ??
        (teacherFeedback.trim() || null),
      teacherNote:
        row.teacher_note ??
        (teacherNote.trim() || null),
      finalMarks: Number(row.final_marks),
      evaluatedBy: row.evaluated_by,
      evaluatedAt: row.evaluated_at ?? null,
    };
  } catch (error) {
    console.error(
      "Unexpected Subjective teacher finalization error:",
      error,
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to finalize the evaluation.",
    };
  }
}