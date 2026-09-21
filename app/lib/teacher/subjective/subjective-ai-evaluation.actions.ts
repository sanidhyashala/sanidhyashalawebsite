"use server";

import { auth } from "@clerk/nextjs/server";

import {
  createLearningSupabaseClient,
} from "@/lib/learning/supabase-learning";

import {
  createAdminSupabaseClient,
} from "@/app/lib/admin/supabase-admin";

import {
  getTeacherSubjectiveEvaluationDetail,
} from "./subjective-evaluation.service";

import {
  evaluateSubjectiveWithAi,
} from "./ai/service";

import type {
  SubjectiveAiEvaluationInput,
  SubjectiveAiInputPart,
} from "./ai/types";

/* =========================================================
 * Types
 * ========================================================= */

type AiEvaluationResult =
  | {
      success: true;
      evaluationId: string;
      evaluationStatus: "AI_ASSISTED";
      aiSuggestedMarks: number;
      aiFeedback: string;
      aiAnalysis: Record<string, unknown>;
    }
  | {
      success: false;
      error: string;
    };

/* =========================================================
 * Constants
 * ========================================================= */

const STORAGE_BUCKET = "subjective-answers";
const SIGNED_URL_SECONDS = 10 * 60;

/* =========================================================
 * Helpers
 * ========================================================= */

function normalizeMarks(
  value: number,
  maxMarks: number,
): number {
  if (!Number.isFinite(value)) {
    throw new Error("AI returned invalid marks.");
  }

  if (value < 0 || value > maxMarks) {
    throw new Error(
      `AI returned marks outside the allowed range 0-${maxMarks}.`,
    );
  }

  return Math.round(value * 2) / 2;
}

function normalizeText(
  value: unknown,
): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function normalizeStringArray(
  value: unknown,
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is string =>
        typeof item === "string",
    )
    .map((item) => item.trim())
    .filter(Boolean);
}

/* =========================================================
 * Download a private Supabase file and convert it to
 * base64 for the Gemini Interactions API.
 * ========================================================= */

async function signedUrlToBase64(
  signedUrl: string,
  fileName: string,
): Promise<string> {
  const response = await fetch(
    signedUrl,
    {
      method: "GET",
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(
      `Unable to download solution file "${fileName}" for AI evaluation.`,
    );
  }

  const arrayBuffer =
    await response.arrayBuffer();

  return Buffer
    .from(arrayBuffer)
    .toString("base64");
}

/* =========================================================
 * Main AI Evaluation
 * ========================================================= */

export async function runSubjectiveAiEvaluation(
  evaluationId: string,
): Promise<AiEvaluationResult> {
  try {
    /* -------------------------------------------------------
     * 1. Authenticate current Clerk user
     * ------------------------------------------------------- */

    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: "Authentication required.",
      };
    }

    /* -------------------------------------------------------
     * 2. Verify Teacher/Admin access
     * ------------------------------------------------------- */

    const adminSupabase =
      createAdminSupabaseClient();

    const {
      data: teacherAccess,
      error: teacherAccessError,
    } = await adminSupabase
      .from("teacher_access")
      .select(
        `
          user_id,
          role,
          is_active
        `,
      )
      .eq(
        "user_id",
        userId,
      )
      .eq(
        "is_active",
        true,
      )
      .in(
        "role",
        ["TEACHER", "ADMIN"],
      )
      .maybeSingle();

    if (teacherAccessError) {
      console.error(
        "Failed to verify teacher access:",
        teacherAccessError,
      );

      return {
        success: false,
        error:
          "Unable to verify teacher access.",
      };
    }

    if (!teacherAccess) {
      return {
        success: false,
        error:
          "Teacher or admin access required.",
      };
    }

    /* -------------------------------------------------------
     * 3. Load authoritative evaluation detail
     * ------------------------------------------------------- */

    const detail =
      await getTeacherSubjectiveEvaluationDetail(
        evaluationId,
      );

    if (!detail) {
      return {
        success: false,
        error:
          "Subjective evaluation not found.",
      };
    }

    /* -------------------------------------------------------
     * 4. AI can only run for PENDING evaluations
     * ------------------------------------------------------- */

    if (
      detail.evaluation
        .evaluationStatus !==
      "PENDING"
    ) {
      return {
        success: false,
        error:
          `AI evaluation is available only for PENDING evaluations. Current status: ${detail.evaluation.evaluationStatus}.`,
      };
    }

    /* -------------------------------------------------------
     * 5. Read frozen question revision
     * ------------------------------------------------------- */

    const revision =
      detail.questionRevision;

    const questionText =
      normalizeText(
        revision?.question_text,
      );

    const idealSolution =
      normalizeText(
        revision?.solution_text,
      );

    const mistakeInsight =
      normalizeText(
        revision?.mistake_insight,
      );

    if (!questionText) {
      return {
        success: false,
        error:
          "The frozen question text is unavailable.",
      };
    }

    /* -------------------------------------------------------
     * 6. Validate maximum marks
     * ------------------------------------------------------- */

    const maxMarks =
      Number(
        detail.attemptQuestion.marks,
      );

    if (
      !Number.isFinite(maxMarks) ||
      maxMarks <= 0
    ) {
      return {
        success: false,
        error:
          "The question maximum marks are invalid.",
      };
    }

    /* -------------------------------------------------------
     * 7. Student typed response
     * ------------------------------------------------------- */

    const studentAnswerText =
      normalizeText(
        detail.submission.answerText,
      );

    /* -------------------------------------------------------
     * 8. Build secure multimodal file input
     * ------------------------------------------------------- */

    const files: SubjectiveAiInputPart[] =
      [];

    for (
      const file of detail.files
    ) {
      const {
        data: signed,
        error: signedError,
      } =
        await adminSupabase.storage
          .from(
            STORAGE_BUCKET,
          )
          .createSignedUrl(
            file.filePath,
            SIGNED_URL_SECONDS,
          );

      if (
        signedError ||
        !signed?.signedUrl
      ) {
        console.error(
          "Failed to create signed solution URL:",
          {
            fileId: file.id,
            error: signedError,
          },
        );

        return {
          success: false,
          error:
            `Unable to securely access solution file "${file.fileName}".`,
        };
      }

      /* -----------------------------------------------------
       * Images
       * ----------------------------------------------------- */

      if (
        file.mimeType ===
          "image/jpeg" ||
        file.mimeType ===
          "image/jpg" ||
        file.mimeType ===
          "image/png"
      ) {
        const base64 =
          await signedUrlToBase64(
            signed.signedUrl,
            file.fileName,
          );

        files.push({
          type: "image",
          mimeType:
            file.mimeType ===
            "image/jpg"
              ? "image/jpeg"
              : file.mimeType,
          data: base64,
        });

        continue;
      }

      /* -----------------------------------------------------
       * PDF
       * ----------------------------------------------------- */

      if (
        file.mimeType ===
        "application/pdf"
      ) {
        const base64 =
          await signedUrlToBase64(
            signed.signedUrl,
            file.fileName,
          );

        files.push({
          type: "file",
          mimeType:
            "application/pdf",
          data: base64,
        });

        continue;
      }

      return {
        success: false,
        error:
          `Unsupported solution file type: ${file.mimeType}.`,
      };
    }

    /* -------------------------------------------------------
     * 9. Build provider-neutral AI input
     * ------------------------------------------------------- */

    const aiInput: SubjectiveAiEvaluationInput =
      {
        evaluationId,
        questionText,
        idealSolution:
          idealSolution || null,
        mistakeInsight:
          mistakeInsight || null,
        studentAnswerText:
          studentAnswerText || null,
        maxMarks,
        files,
      };

    /* -------------------------------------------------------
     * 10. Run configured AI provider
     * ------------------------------------------------------- */

    const aiResult =
      await evaluateSubjectiveWithAi(
        aiInput,
      );

    const suggestedMarks =
      normalizeMarks(
        aiResult.suggestedMarks,
        maxMarks,
      );

    const feedback =
      normalizeText(
        aiResult.feedback,
      );

    if (!feedback) {
      return {
        success: false,
        error:
          "AI did not return usable evaluation feedback.",
      };
    }

    /* -------------------------------------------------------
     * 11. Build provider-independent analysis
     * ------------------------------------------------------- */

    const aiAnalysis:
      Record<string, unknown> =
      {
        correctness:
          aiResult.correctness,

        scoreReason:
          normalizeText(
            aiResult.scoreReason,
          ),

        strengths:
          normalizeStringArray(
            aiResult.strengths,
          ),

        mistakes:
          normalizeStringArray(
            aiResult.mistakes,
          ),

        missingSteps:
          normalizeStringArray(
            aiResult.missingSteps,
          ),

        conceptUnderstanding:
          normalizeText(
            aiResult.conceptUnderstanding,
          ),

        provider:
          process.env
            .SUBJECTIVE_AI_PROVIDER
            ?.trim()
            .toLowerCase() ||
          "gemini",

        model:
          process.env
            .GEMINI_SUBJECTIVE_EVALUATION_MODEL
            ?.trim() ||
          "gemini-3.7-flash",

        evaluatedAt:
          new Date().toISOString(),

        fileCount:
          detail.files.length,
      };

    /* -------------------------------------------------------
     * 12. Save through authoritative DB RPC
     * -------------------------------------------------------
     *
     * IMPORTANT:
     *
     * AI does NOT directly update the evaluation row.
     *
     * The existing authenticated RPC remains the single
     * authoritative database mutation path.
     * ------------------------------------------------------- */

    const supabase =
      await createLearningSupabaseClient();

    const {
      data: saved,
      error: saveError,
    } =
      await supabase.rpc(
        "submit_subjective_ai_evaluation",
        {
          p_evaluation_id:
            evaluationId,

          p_ai_suggested_marks:
            suggestedMarks,

          p_ai_feedback:
            feedback,

          p_ai_analysis:
            aiAnalysis,
        },
      );

    if (saveError) {
      console.error(
        "Failed to save AI Subjective evaluation:",
        saveError,
      );

      return {
        success: false,
        error:
          saveError.message ||
          "Unable to save AI evaluation.",
      };
    }

    const savedRow =
      Array.isArray(saved)
        ? saved[0]
        : saved;

    if (
      !savedRow?.evaluation_id
    ) {
      return {
        success: false,
        error:
          "AI evaluation was generated but could not be saved.",
      };
    }

    /* -------------------------------------------------------
     * 13. Success
     * ------------------------------------------------------- */

    return {
      success: true,

      evaluationId:
        savedRow.evaluation_id,

      evaluationStatus:
        "AI_ASSISTED",

      aiSuggestedMarks:
        Number(
          savedRow.ai_suggested_marks,
        ),

      aiFeedback:
        feedback,

      aiAnalysis,
    };
  } catch (error) {
    console.error(
      "Unexpected Subjective AI evaluation error:",
      error,
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An unexpected AI evaluation error occurred.",
    };
  }
}