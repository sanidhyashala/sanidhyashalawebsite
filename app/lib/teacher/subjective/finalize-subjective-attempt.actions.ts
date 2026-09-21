"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";

import { createLearningSupabaseClient } from "@/lib/learning/supabase-learning";

import {
  sendSubjectiveEvaluationEmail,
} from "@/app/lib/email/sendSubjectiveEvaluationEmail";

/* =========================================================
 * Types
 * ========================================================= */

export type FinalizeSubjectiveAttemptResult =
  | {
      success: true;
      attemptId: string;
      attemptStatus: "EVALUATED";
      evaluatedAt: string | null;
      questionCount: number;
      evaluatedQuestionCount: number;
      teacherNote: string | null;
      emailSent: boolean;
    }
  | {
      success: false;
      error: string;
    };

/* =========================================================
 * Helpers
 * ========================================================= */

function normalizeString(
  value: unknown,
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  return normalized || null;
}

function normalizeNumber(
  value: unknown,
): number {
  const numberValue = Number(value);

  return Number.isFinite(numberValue)
    ? numberValue
    : 0;
}

/* =========================================================
 * Finalize complete student attempt
 *
 * Question-level:
 *   Teacher checks a question -> Save Draft
 *
 * Attempt-level:
 *   Teacher finishes the complete set -> Finish Evaluation
 *
 * The database RPC remains the authoritative
 * finalization mechanism.
 *
 * Email is sent ONLY after successful finalization.
 * Email failure NEVER rolls back grading.
 * ========================================================= */

export async function finalizeSubjectiveAttempt(
  attemptId: string,
  teacherNote?: string | null,
): Promise<FinalizeSubjectiveAttemptResult> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: "Authentication required.",
      };
    }

    const normalizedAttemptId =
      attemptId?.trim();

    if (!normalizedAttemptId) {
      return {
        success: false,
        error:
          "Subjective attempt ID is required.",
      };
    }

    const normalizedTeacherNote =
      typeof teacherNote === "string"
        ? teacherNote.trim()
        : null;

    if (
      normalizedTeacherNote &&
      normalizedTeacherNote.length > 20000
    ) {
      return {
        success: false,
        error:
          "Teacher note cannot exceed 20000 characters.",
      };
    }

    const supabase =
      await createLearningSupabaseClient();

    /* =====================================================
     * Load attempt owner BEFORE finalization
     *
     * This is used only for post-finalization
     * student email delivery.
     *
     * The RPC remains authoritative for the actual
     * evaluation finalization.
     * ===================================================== */

    const {
      data: attemptBefore,
      error: attemptBeforeError,
    } = await supabase
      .from("subjective_attempts")
      .select(
        `
          id,
          user_id,
          set_id,
          status,
          subjective_sets (
            id,
            title
          )
        `,
      )
      .eq(
        "id",
        normalizedAttemptId,
      )
      .maybeSingle();

    if (attemptBeforeError) {
      console.error(
        "Failed to load Subjective attempt owner:",
        attemptBeforeError,
      );

      return {
        success: false,
        error:
          attemptBeforeError.message ||
          "Unable to load Subjective attempt.",
      };
    }

    if (!attemptBefore) {
      return {
        success: false,
        error:
          "Subjective attempt could not be found.",
      };
    }

    const wasAlreadyEvaluated =
      attemptBefore.status ===
      "EVALUATED";

    const studentUserId =
      normalizeString(
        attemptBefore.user_id,
      );

    const subjectiveSet =
      Array.isArray(
        attemptBefore.subjective_sets,
      )
        ? attemptBefore.subjective_sets[0]
        : attemptBefore.subjective_sets;

    const setTitle =
      normalizeString(
        subjectiveSet?.title,
      ) ||
      "Subjective Evaluation";

    /* =====================================================
     * Authoritative DB finalization
     * ===================================================== */

    const {
      data,
      error,
    } = await supabase.rpc(
      "finalize_subjective_attempt",
      {
        p_attempt_id:
          normalizedAttemptId,
        p_teacher_note:
          normalizedTeacherNote || null,
      },
    );

    if (error) {
      console.error(
        "Failed to finalize Subjective attempt:",
        error,
      );

      return {
        success: false,
        error:
          error.message ||
          "Failed to finalize Subjective evaluation.",
      };
    }

    const row =
      Array.isArray(data)
        ? data[0]
        : data;

    if (!row) {
      return {
        success: false,
        error:
          "Subjective attempt finalization returned no result.",
      };
    }

    const resultAttemptId =
      String(
        row.attempt_id ??
          normalizedAttemptId,
      );

    const evaluatedAt =
      row.evaluated_at
        ? String(row.evaluated_at)
        : null;

    const questionCount =
      normalizeNumber(
        row.question_count,
      );

    const evaluatedQuestionCount =
      normalizeNumber(
        row.evaluated_question_count,
      );

    const returnedTeacherNote =
      row.teacher_note == null
        ? null
        : String(row.teacher_note);

    /* =====================================================
     * Email notification
     *
     * Important:
     *
     * 1. Only send when this call actually transitions
     *    the attempt into EVALUATED.
     *
     * 2. If it was already EVALUATED before this call,
     *    do not send another email.
     *
     * 3. Email failure must NEVER change the successful
     *    grading result.
     * ===================================================== */

    let emailSent = false;

    if (
      !wasAlreadyEvaluated &&
      studentUserId
    ) {
      try {
        const clerk =
          await clerkClient();

        const student =
          await clerk.users.getUser(
            studentUserId,
          );

        const studentEmail =
          student.primaryEmailAddress
            ?.emailAddress
            ?.trim();

        const studentName =
          [
            student.firstName,
            student.lastName,
          ]
            .filter(
              (
                value,
              ): value is string =>
                Boolean(
                  value?.trim(),
                ),
            )
            .join(" ")
            .trim() ||
          student.username?.trim() ||
          "Student";

        if (!studentEmail) {
          console.warn(
            "Subjective evaluation finalized, but student has no primary email address:",
            studentUserId,
          );
        } else {
          /*
           * Calculate final marks from the authoritative
           * evaluated attempt after finalization.
           *
           * This query is read-only and does not participate
           * in grading.
           */

          const {
            data: markRows,
            error: marksError,
          } = await supabase
            .from(
              "subjective_attempt_questions",
            )
            .select(
              `
                marks,
                subjective_submissions (
                  id,
                  subjective_evaluations (
                    final_marks
                  )
                )
              `,
            )
            .eq(
              "attempt_id",
              resultAttemptId,
            );

          if (marksError) {
            console.warn(
              "Unable to calculate marks for Subjective evaluation email:",
              marksError,
            );
          }

          let maxMarks = 0;
          let finalMarks = 0;

          for (
            const question of
              markRows ?? []
          ) {
            maxMarks +=
              normalizeNumber(
                question.marks,
              );

            const submission =
              Array.isArray(
                question.subjective_submissions,
              )
                ? question
                    .subjective_submissions[0]
                : question.subjective_submissions;

            const evaluation =
              Array.isArray(
                submission?.subjective_evaluations,
              )
                ? submission
                    ?.subjective_evaluations[0]
                : submission?.subjective_evaluations;

            finalMarks +=
              normalizeNumber(
                evaluation?.final_marks,
              );
          }

          const emailResult =
            await sendSubjectiveEvaluationEmail(
              {
                to: studentEmail,
                studentName,
                setTitle,
                attemptId:
                  resultAttemptId,
                finalMarks,
                maxMarks,
              },
            );

          if (emailResult.success) {
            emailSent = true;

            console.log(
              "Subjective evaluation email sent successfully:",
              {
                attemptId:
                  resultAttemptId,
                studentUserId,
                emailId:
                  emailResult.id,
              },
            );
          } else {
            console.warn(
              "Subjective evaluation finalized, but email could not be sent:",
              emailResult.error,
            );
          }
        }
      } catch (emailError) {
        /*
         * NEVER throw here.
         *
         * Evaluation has already been finalized.
         * Email delivery is a secondary notification.
         */

        console.error(
          "Subjective evaluation email notification failed:",
          emailError,
        );
      }
    }

    return {
      success: true,
      attemptId:
        resultAttemptId,
      attemptStatus:
        "EVALUATED",
      evaluatedAt,
      questionCount,
      evaluatedQuestionCount,
      teacherNote:
        returnedTeacherNote,
      emailSent,
    };
  } catch (error) {
    console.error(
      "Unexpected Subjective attempt finalization error:",
      error,
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Something went wrong while finalizing the evaluation.",
    };
  }
}