"use server";

import { auth } from "@clerk/nextjs/server";

import { createAdminSupabaseClient } from "@/app/lib/admin/supabase-admin";
import { getTeacherSubjectiveEvaluationDetail } from "./subjective-evaluation.service";

const STORAGE_BUCKET = "subjective-answers";
const SIGNED_URL_SECONDS = 10 * 60;

export type SubjectiveSolutionPreviewResult =
  | {
      success: true;
      url: string;
      fileName: string;
      mimeType: string;
      expiresIn: number;
    }
  | {
      success: false;
      error: string;
    };

export async function getSubjectiveSolutionFilePreviewUrl(
  evaluationId: string,
  fileId: string,
): Promise<SubjectiveSolutionPreviewResult> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: "Authentication required.",
      };
    }

    const normalizedEvaluationId = evaluationId?.trim();
    const normalizedFileId = fileId?.trim();

    if (!normalizedEvaluationId || !normalizedFileId) {
      return {
        success: false,
        error: "Evaluation and solution file identifiers are required.",
      };
    }

    const adminSupabase = createAdminSupabaseClient();

    const { data: teacherAccess, error: teacherAccessError } =
      await adminSupabase
        .from("teacher_access")
        .select("user_id, role, is_active")
        .eq("user_id", userId)
        .eq("is_active", true)
        .in("role", ["TEACHER", "ADMIN"])
        .maybeSingle();

    if (teacherAccessError) {
      console.error("Failed to verify teacher access for solution preview:", teacherAccessError);
      return {
        success: false,
        error: "Unable to verify teacher access.",
      };
    }

    if (!teacherAccess) {
      return {
        success: false,
        error: "Teacher or admin access required.",
      };
    }

    const detail = await getTeacherSubjectiveEvaluationDetail(
      normalizedEvaluationId,
    );

    if (!detail) {
      return {
        success: false,
        error: "Subjective evaluation not found.",
      };
    }

    const file = detail.files.find(
      (item) => item.id === normalizedFileId,
    );

    if (!file) {
      return {
        success: false,
        error: "This solution file does not belong to the selected evaluation.",
      };
    }

    const { data, error } = await adminSupabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(file.filePath, SIGNED_URL_SECONDS);

    if (error || !data?.signedUrl) {
      console.error("Failed to create subjective solution preview URL:", {
        evaluationId: normalizedEvaluationId,
        fileId: normalizedFileId,
        error,
      });

      return {
        success: false,
        error: "Unable to prepare the secure solution preview.",
      };
    }

    return {
      success: true,
      url: data.signedUrl,
      fileName: file.fileName,
      mimeType: file.mimeType,
      expiresIn: SIGNED_URL_SECONDS,
    };
  } catch (error) {
    console.error("Unexpected solution preview error:", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to preview the student solution.",
    };
  }
}