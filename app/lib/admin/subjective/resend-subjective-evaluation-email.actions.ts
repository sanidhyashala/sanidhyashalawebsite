"use server";

import { clerkClient } from "@clerk/nextjs/server";

import { requireAdmin } from "@/app/lib/auth/admin";
import { createAdminSupabaseClient } from "@/app/lib/admin/supabase-admin";
import {
  sendSubjectiveEvaluationEmail,
} from "@/app/lib/email/sendSubjectiveEvaluationEmail";

export type ResendSubjectiveEvaluationEmailResult =
  | {
      success: true;
      email: string;
      emailId?: string;
    }
  | {
      success: false;
      error: string;
    };

function toNumber(value: unknown): number {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

export async function resendSubjectiveEvaluationEmail(
  attemptId: string,
): Promise<ResendSubjectiveEvaluationEmailResult> {
  try {
    await requireAdmin();

    const normalizedAttemptId = attemptId?.trim();

    if (!normalizedAttemptId) {
      return {
        success: false,
        error: "Subjective attempt ID is required.",
      };
    }

    const supabase = createAdminSupabaseClient();

    const {
      data: attempt,
      error: attemptError,
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
      .eq("id", normalizedAttemptId)
      .maybeSingle();

    if (attemptError) {
      console.error(
        "Failed to load Subjective attempt for email resend:",
        attemptError,
      );

      return {
        success: false,
        error:
          attemptError.message ||
          "Unable to load the Subjective attempt.",
      };
    }

    if (!attempt) {
      return {
        success: false,
        error: "Subjective attempt could not be found.",
      };
    }

    if (attempt.status !== "EVALUATED") {
      return {
        success: false,
        error:
          "Evaluation email can only be sent after the attempt is fully evaluated.",
      };
    }

    const studentUserId = String(
      attempt.user_id ?? "",
    ).trim();

    if (!studentUserId) {
      return {
        success: false,
        error:
          "Student identity is missing for this attempt.",
      };
    }

    const subjectiveSet = Array.isArray(
      attempt.subjective_sets,
    )
      ? attempt.subjective_sets[0]
      : attempt.subjective_sets;

    const setTitle =
      typeof subjectiveSet?.title === "string" &&
      subjectiveSet.title.trim()
        ? subjectiveSet.title.trim()
        : "Subjective Evaluation";

    const {
      data: questionRows,
      error: questionsError,
    } = await supabase
      .from("subjective_attempt_questions")
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
      .eq("attempt_id", normalizedAttemptId);

    if (questionsError) {
      console.error(
        "Failed to load Subjective marks for email resend:",
        questionsError,
      );

      return {
        success: false,
        error:
          questionsError.message ||
          "Unable to calculate evaluation marks.",
      };
    }

    let maxMarks = 0;
    let finalMarks = 0;

    for (const question of questionRows ?? []) {
      maxMarks += toNumber(question.marks);

      const submission = Array.isArray(
        question.subjective_submissions,
      )
        ? question.subjective_submissions[0]
        : question.subjective_submissions;

      const evaluation = Array.isArray(
        submission?.subjective_evaluations,
      )
        ? submission.subjective_evaluations[0]
        : submission?.subjective_evaluations;

      finalMarks += toNumber(
        evaluation?.final_marks,
      );
    }

    const clerk = await clerkClient();

    const student =
      await clerk.users.getUser(studentUserId);

    const studentEmail =
      student.primaryEmailAddress?.emailAddress?.trim();

    if (!studentEmail) {
      return {
        success: false,
        error:
          "This student does not have a primary email address.",
      };
    }

    const studentName =
      [
        student.firstName,
        student.lastName,
      ]
        .filter(
          (value): value is string =>
            Boolean(value?.trim()),
        )
        .join(" ")
        .trim() ||
      student.username?.trim() ||
      "Student";

    const emailResult =
      await sendSubjectiveEvaluationEmail({
        to: studentEmail,
        studentName,
        setTitle,
        attemptId: normalizedAttemptId,
        finalMarks,
        maxMarks,
      });

    if (!emailResult.success) {
      return {
        success: false,
        error: emailResult.error,
      };
    }

    return {
      success: true,
      email: studentEmail,
      emailId: emailResult.id,
    };
  } catch (error) {
    console.error(
      "Unexpected Subjective evaluation email resend error:",
      error,
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to resend the evaluation email.",
    };
  }
}
