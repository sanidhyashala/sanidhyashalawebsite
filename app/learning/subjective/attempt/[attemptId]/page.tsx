import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { createLearningSupabaseClient } from "@/lib/learning/supabase-learning";
import { getStudentProfile } from "@/lib/learning/student-profile";

import SubjectiveAttemptWorkspace, {
  type SubjectiveAttemptQuestion,
  type SubjectiveSubmissionFile,
} from "./SubjectiveAttemptWorkspace";

/* =========================================================
 * Types
 * ========================================================= */

type PageProps = {
  params: Promise<{
    attemptId: string;
  }>;
};

/* =========================================================
 * Page
 * ========================================================= */

export default async function SubjectiveAttemptPage({
  params,
}: PageProps) {
  /* =======================================================
   * Authentication
   * ======================================================= */

  const { isAuthenticated } =
    await auth();

  const { attemptId } =
    await params;

  if (!isAuthenticated) {
    redirect(
      `/sign-in?redirect_url=${encodeURIComponent(
        `/learning/subjective/attempt/${attemptId}`
      )}`
    );
  }

  /* =======================================================
   * Student Profile
   * ======================================================= */

  const profile =
    await getStudentProfile();

  if (!profile.exists) {
    redirect(
      "/learning/onboarding"
    );
  }

  /* =======================================================
   * Validate Attempt ID
   * ======================================================= */

  const normalizedAttemptId =
    attemptId?.trim();

  if (!normalizedAttemptId) {
    notFound();
  }

  /* =======================================================
   * Supabase
   * ======================================================= */

  const supabase =
    await createLearningSupabaseClient();

  /* =======================================================
   * Load Attempt
   * ======================================================= */

  const {
    data: attempt,
    error: attemptError,
  } = await supabase
    .from("subjective_attempts")
    .select(
      `
        id,
        set_id,
        attempt_number,
        attempt_type,
        status,
        subjective_sets (
          id,
          title,
          resource_id
        )
      `
    )
    .eq(
      "id",
      normalizedAttemptId
    )
    .maybeSingle();

  if (attemptError) {
    console.error(
      "Failed to load Subjective attempt:",
      attemptError
    );

    throw new Error(
      `Failed to load Subjective attempt: ${attemptError.message}`
    );
  }

  if (!attempt) {
    notFound();
  }

  const subjectiveSet =
    Array.isArray(
      attempt.subjective_sets
    )
      ? attempt.subjective_sets[0]
      : attempt.subjective_sets;

  if (!subjectiveSet) {
    notFound();
  }

  /* =======================================================
   * Load Frozen Attempt Questions
   * ======================================================= */

  const {
    data: attemptQuestions,
    error: attemptQuestionsError,
  } = await supabase
    .from("subjective_attempt_questions")
    .select(
      `
        id,
        question_id,
        question_revision_id,
        question_order,
        marks
      `
    )
    .eq(
      "attempt_id",
      normalizedAttemptId
    )
    .order(
      "question_order",
      {
        ascending: true,
      }
    );

  if (attemptQuestionsError) {
    console.error(
      "Failed to load Subjective attempt questions:",
      attemptQuestionsError
    );

    throw new Error(
      `Failed to load attempt questions: ${attemptQuestionsError.message}`
    );
  }

  if (
    !attemptQuestions ||
    attemptQuestions.length === 0
  ) {
    notFound();
  }

  /* =======================================================
   * Load Frozen Revisions
   * ======================================================= */

  const revisionIds =
    attemptQuestions.map(
      (question) =>
        question.question_revision_id
    );

  const {
    data: revisions,
    error: revisionsError,
  } = await supabase
    .from("question_revisions")
    .select(
      `
        id,
        question_id,
        revision_number,
        question_text,
        status
      `
    )
    .in(
      "id",
      revisionIds
    );

  if (revisionsError) {
    console.error(
      "Failed to load frozen Subjective revisions:",
      {
        message:
          revisionsError.message,
        details:
          revisionsError.details,
        hint:
          revisionsError.hint,
        code:
          revisionsError.code,
        raw: revisionsError,
      }
    );

    throw new Error(
      [
        "Failed to load Subjective question revisions.",
        `Message: ${
          revisionsError.message ||
          "Unknown"
        }`,
        `Code: ${
          revisionsError.code ||
          "Unknown"
        }`,
        `Details: ${
          revisionsError.details ||
          "None"
        }`,
        `Hint: ${
          revisionsError.hint ||
          "None"
        }`,
      ].join(" ")
    );
  }

  /* =======================================================
   * Revision Lookup
   * ======================================================= */

  const revisionMap =
    new Map(
      (revisions ?? []).map(
        (revision) => [
          revision.id,
          revision,
        ]
      )
    );

  /* =======================================================
   * Load Existing Submissions
   * ======================================================= */

  const attemptQuestionIds =
    attemptQuestions.map(
      (question) => question.id
    );

  const {
    data: submissions,
    error: submissionsError,
  } = await supabase
    .from("subjective_submissions")
    .select(
      `
        id,
        attempt_question_id,
        answer_text,
        status,
        updated_at
      `
    )
    .in(
      "attempt_question_id",
      attemptQuestionIds
    );

  if (submissionsError) {
    console.error(
      "Failed to load Subjective submissions:",
      submissionsError
    );

    throw new Error(
      `Failed to load Subjective answer drafts: ${submissionsError.message}`
    );
  }

  /* =======================================================
   * Load Existing Submission Files
   * ======================================================= */

  const submissionIds =
    (submissions ?? []).map(
      (submission) =>
        submission.id
    );

  let submissionFiles: Array<{
    id: string;
    submission_id: string;
    file_path: string;
    file_name: string;
    mime_type: string;
    file_size_bytes:
      | number
      | null;
    page_number:
      | number
      | null;
  }> = [];

  if (submissionIds.length > 0) {
    const {
      data: files,
      error: filesError,
    } = await supabase
      .from(
        "subjective_submission_files"
      )
      .select(
        `
          id,
          submission_id,
          file_path,
          file_name,
          mime_type,
          file_size_bytes,
          page_number
        `
      )
      .in(
        "submission_id",
        submissionIds
      )
      .order(
        "page_number",
        {
          ascending: true,
          nullsFirst: false,
        }
      )
      .order(
        "created_at",
        {
          ascending: true,
        }
      );

    if (filesError) {
      console.error(
        "Failed to load Subjective submission files:",
        filesError
      );

      throw new Error(
        `Failed to load Subjective solution files: ${filesError.message}`
      );
    }

    submissionFiles =
      files ?? [];
  }

  /* =======================================================
   * Submission Lookup
   * ======================================================= */

  const submissionMap =
    new Map(
      (submissions ?? []).map(
        (submission) => [
          submission.attempt_question_id,
          submission,
        ]
      )
    );

  /* =======================================================
   * Submission Files Lookup
   * ======================================================= */

  const submissionFilesMap =
    new Map<
      string,
      SubjectiveSubmissionFile[]
    >();

  for (
    const file of submissionFiles
  ) {
    const current =
      submissionFilesMap.get(
        file.submission_id
      ) ?? [];

    current.push({
      id: file.id,
      file_path:
        file.file_path,
      file_name:
        file.file_name,
      mime_type:
        file.mime_type,
      file_size_bytes:
        file.file_size_bytes,
      page_number:
        file.page_number,
    });

    submissionFilesMap.set(
      file.submission_id,
      current
    );
  }

  /* =======================================================
   * Build Workspace Questions
   * ======================================================= */

  const workspaceQuestions:
    SubjectiveAttemptQuestion[] =
    attemptQuestions.map(
      (attemptQuestion) => {
        const revision =
          revisionMap.get(
            attemptQuestion.question_revision_id
          );

        if (!revision) {
          throw new Error(
            `Frozen question revision ${attemptQuestion.question_revision_id} could not be found.`
          );
        }

        const submission =
          submissionMap.get(
            attemptQuestion.id
          );

        const files =
          submission
            ? submissionFilesMap.get(
                submission.id
              ) ?? []
            : [];

        return {
          id: attemptQuestion.id,

          question_id:
            attemptQuestion.question_id,

          question_revision_id:
            attemptQuestion.question_revision_id,

          question_order:
            attemptQuestion.question_order,

          marks:
            Number(
              attemptQuestion.marks
            ),

          question_text:
            revision.question_text,

          submission: submission
            ? {
                id:
                  submission.id,

                answer_text:
                  submission.answer_text ??
                  "",

                status:
                  submission.status,

                updated_at:
                  submission.updated_at,

                files,
              }
            : null,
        };
      }
    );

  /* =======================================================
   * Render
   * ======================================================= */

  return (
    <main className="px-6 py-10 sm:py-14">
      <SubjectiveAttemptWorkspace
        attemptId={
          normalizedAttemptId
        }
        setTitle={
          subjectiveSet.title
        }
        attemptNumber={
          attempt.attempt_number
        }
        attemptStatus={
          attempt.status
        }
        questions={
          workspaceQuestions
        }
      />
    </main>
  );
}