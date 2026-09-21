"use server";

import { auth } from "@clerk/nextjs/server";

import { createAdminSupabaseClient } from "@/app/lib/admin/supabase-admin";

export type DeleteSubjectiveSubmissionFileResult =
  | {
      success: true;
      fileId: string;
    }
  | {
      success: false;
      error: string;
    };

export type ReorderSubjectiveSubmissionFilesResult =
  | {
      success: true;
      files: Array<{
        fileId: string;
        pageNumber: number;
      }>;
    }
  | {
      success: false;
      error: string;
    };

/* =============================================================
   DELETE SUBJECTIVE SOLUTION FILE
   ============================================================= */

export async function deleteSubjectiveSubmissionFile(
  fileId: string,
  attemptQuestionId: string
): Promise<DeleteSubjectiveSubmissionFileResult> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error:
          "Your learning session could not be verified. Please sign in again.",
      };
    }

    const normalizedFileId = fileId?.trim();
    const normalizedAttemptQuestionId =
      attemptQuestionId?.trim();

    if (!normalizedFileId) {
      return {
        success: false,
        error: "Solution file ID is required.",
      };
    }

    if (!normalizedAttemptQuestionId) {
      return {
        success: false,
        error: "Attempt question ID is required.",
      };
    }

    const supabase = createAdminSupabaseClient();

    /* ---------------------------------------------------------
       Step 1: Load file metadata
       --------------------------------------------------------- */

    const {
      data: file,
      error: fileError,
    } = await supabase
      .from("subjective_submission_files")
      .select(
        `
          id,
          submission_id,
          file_path
        `
      )
      .eq("id", normalizedFileId)
      .maybeSingle();

    if (fileError) {
      console.error(
        "Failed to load Subjective submission file:",
        fileError
      );

      return {
        success: false,
        error:
          fileError.message ||
          "Unable to find the solution file.",
      };
    }

    if (!file) {
      return {
        success: false,
        error:
          "This solution file no longer exists.",
      };
    }

    /* ---------------------------------------------------------
       Step 2: Resolve submission
       --------------------------------------------------------- */

    const {
      data: submission,
      error: submissionError,
    } = await supabase
      .from("subjective_submissions")
      .select(
        `
          id,
          attempt_question_id
        `
      )
      .eq("id", file.submission_id)
      .maybeSingle();

    if (submissionError) {
      console.error(
        "Failed to load Subjective submission:",
        submissionError
      );

      return {
        success: false,
        error:
          submissionError.message ||
          "Unable to verify this solution.",
      };
    }

    if (!submission) {
      return {
        success: false,
        error:
          "The solution submission could not be verified.",
      };
    }

    /* ---------------------------------------------------------
       Step 3: CRITICAL QUESTION ISOLATION CHECK
       --------------------------------------------------------- */

    if (
      submission.attempt_question_id !==
      normalizedAttemptQuestionId
    ) {
      console.warn(
        "Blocked cross-question Subjective file deletion attempt.",
        {
          fileId: normalizedFileId,
          requestedAttemptQuestionId:
            normalizedAttemptQuestionId,
          actualAttemptQuestionId:
            submission.attempt_question_id,
        }
      );

      return {
        success: false,
        error:
          "This solution file does not belong to the current question.",
      };
    }

    /* ---------------------------------------------------------
       Step 4: Resolve attempt
       --------------------------------------------------------- */

    const {
      data: attemptQuestion,
      error: attemptQuestionError,
    } = await supabase
      .from("subjective_attempt_questions")
      .select(
        `
          id,
          attempt_id
        `
      )
      .eq(
        "id",
        submission.attempt_question_id
      )
      .maybeSingle();

    if (attemptQuestionError) {
      console.error(
        "Failed to load Subjective attempt question:",
        attemptQuestionError
      );

      return {
        success: false,
        error:
          attemptQuestionError.message ||
          "Unable to verify the question.",
      };
    }

    if (!attemptQuestion) {
      return {
        success: false,
        error:
          "The question associated with this solution could not be verified.",
      };
    }

    /* ---------------------------------------------------------
       Step 5: Resolve and authorize attempt
       --------------------------------------------------------- */

    const {
      data: attempt,
      error: attemptError,
    } = await supabase
      .from("subjective_attempts")
      .select(
        `
          id,
          user_id,
          status
        `
      )
      .eq(
        "id",
        attemptQuestion.attempt_id
      )
      .maybeSingle();

    if (attemptError) {
      console.error(
        "Failed to load Subjective attempt:",
        attemptError
      );

      return {
        success: false,
        error:
          attemptError.message ||
          "Unable to verify the attempt.",
      };
    }

    if (!attempt) {
      return {
        success: false,
        error:
          "The associated attempt could not be verified.",
      };
    }

    if (attempt.user_id !== userId) {
      return {
        success: false,
        error:
          "You are not allowed to modify this solution.",
      };
    }

    if (attempt.status !== "IN_PROGRESS") {
      return {
        success: false,
        error:
          "This attempt is no longer editable.",
      };
    }

    /* ---------------------------------------------------------
       Step 6: Delete Storage object
       --------------------------------------------------------- */

    const {
      error: storageDeleteError,
    } = await supabase.storage
      .from("subjective-answers")
      .remove([file.file_path]);

    if (storageDeleteError) {
      console.error(
        "Failed to delete Subjective solution from Storage:",
        storageDeleteError
      );

      return {
        success: false,
        error:
          storageDeleteError.message ||
          "The solution file could not be removed.",
      };
    }

    /* ---------------------------------------------------------
       Step 7: Delete metadata
       --------------------------------------------------------- */

    const {
      error: metadataDeleteError,
    } = await supabase
      .from("subjective_submission_files")
      .delete()
      .eq("id", normalizedFileId);

    if (metadataDeleteError) {
      console.error(
        "Failed to delete Subjective solution metadata:",
        metadataDeleteError
      );

      return {
        success: false,
        error:
          metadataDeleteError.message ||
          "The file was removed from Storage, but its record could not be removed.",
      };
    }

    return {
      success: true,
      fileId: normalizedFileId,
    };
  } catch (error) {
    console.error(
      "Unexpected Subjective submission file deletion error:",
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to delete the solution file.",
    };
  }
}

/* =============================================================
   REORDER SUBJECTIVE SOLUTION FILES
   ============================================================= */

export async function reorderSubjectiveSubmissionFiles(
  submissionId: string,
  attemptQuestionId: string,
  fileIds: string[]
): Promise<ReorderSubjectiveSubmissionFilesResult> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error:
          "Your learning session could not be verified. Please sign in again.",
      };
    }

    const normalizedSubmissionId =
      submissionId?.trim();

    const normalizedAttemptQuestionId =
      attemptQuestionId?.trim();

    const normalizedFileIds =
      Array.isArray(fileIds)
        ? fileIds
            .map((fileId) =>
              fileId?.trim()
            )
            .filter(Boolean)
        : [];

    if (!normalizedSubmissionId) {
      return {
        success: false,
        error:
          "Submission ID is required.",
      };
    }

    if (!normalizedAttemptQuestionId) {
      return {
        success: false,
        error:
          "Attempt question ID is required.",
      };
    }

    if (normalizedFileIds.length === 0) {
      return {
        success: false,
        error:
          "At least one solution file is required.",
      };
    }

    const uniqueFileIds =
      new Set(normalizedFileIds);

    if (
      uniqueFileIds.size !==
      normalizedFileIds.length
    ) {
      return {
        success: false,
        error:
          "Duplicate solution files are not allowed.",
      };
    }

    const supabase =
      createAdminSupabaseClient();

    /* ---------------------------------------------------------
       CRITICAL: Verify submission belongs to THIS question
       before calling reorder RPC.
       --------------------------------------------------------- */

    const {
      data: submission,
      error: submissionError,
    } = await supabase
      .from("subjective_submissions")
      .select(
        `
          id,
          attempt_question_id
        `
      )
      .eq(
        "id",
        normalizedSubmissionId
      )
      .maybeSingle();

    if (submissionError) {
      console.error(
        "Failed to verify Subjective submission for reorder:",
        submissionError
      );

      return {
        success: false,
        error:
          submissionError.message ||
          "Unable to verify the solution submission.",
      };
    }

    if (!submission) {
      return {
        success: false,
        error:
          "The solution submission could not be found.",
      };
    }

    if (
      submission.attempt_question_id !==
      normalizedAttemptQuestionId
    ) {
      console.warn(
        "Blocked cross-question Subjective reorder attempt.",
        {
          submissionId:
            normalizedSubmissionId,
          requestedAttemptQuestionId:
            normalizedAttemptQuestionId,
          actualAttemptQuestionId:
            submission.attempt_question_id,
        }
      );

      return {
        success: false,
        error:
          "This solution submission does not belong to the current question.",
      };
    }

    /* ---------------------------------------------------------
       RPC performs ownership, IN_PROGRESS,
       membership and atomic page ordering validation.
       --------------------------------------------------------- */

    const {
      data,
      error,
    } = await supabase.rpc(
      "reorder_subjective_submission_files",
      {
        p_submission_id:
          normalizedSubmissionId,

        p_file_ids:
          normalizedFileIds,

        p_user_id:
          userId,
      }
    );

    if (error) {
      console.error(
        "Failed to reorder Subjective solution files:",
        error
      );

      return {
        success: false,
        error:
          error.message ||
          "Unable to reorder your solution pages.",
      };
    }

    const rows =
      Array.isArray(data)
        ? data
        : [];

    return {
      success: true,
      files: rows.map(
        (row) => ({
          fileId:
            row.file_id,
          pageNumber:
            row.page_number,
        })
      ),
    };
  } catch (error) {
    console.error(
      "Unexpected Subjective solution reorder error:",
      error
    );

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to reorder your solution pages.",
    };
  }
}