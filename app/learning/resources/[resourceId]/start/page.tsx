import { notFound, redirect } from "next/navigation";

import {
  getStudentMcqResource,
} from "@/app/lib/learning/resource.service";

import {
  startLearningTestAttempt,
} from "@/lib/learning/attempts";


type PageProps = {
  params: Promise<{
    resourceId: string;
  }>;
};


export default async function McqStartPage({
  params,
}: PageProps) {

  const {
    resourceId,
  } = await params;


  /* -------------------------------------------------------
   * 1. Validate published student resource
   * ------------------------------------------------------- */

  const resource =
    await getStudentMcqResource(
      resourceId
    );


  if (!resource) {
    notFound();
  }


  /* -------------------------------------------------------
   * 2. Start or resume attempt
   *
   * The RPC:
   *
   * - authenticates the Clerk/Supabase user
   * - verifies the published test
   * - verifies resource accessibility
   * - resumes an existing IN_PROGRESS attempt
   * - otherwise creates the next attempt
   * ------------------------------------------------------- */

  let attemptResult: unknown;

  try {

    attemptResult =
      await startLearningTestAttempt(
        resource.testId
      );

  } catch (error) {

    /*
     * Keep the student-facing route clean.
     *
     * The underlying RPC error is still surfaced through
     * the server error boundary/logs.
     */

    const message =
      error instanceof Error
        ? error.message
        : "Unable to start the MCQ practice.";

    throw new Error(message);
  }


  /* -------------------------------------------------------
   * 3. Validate RPC response
   * ------------------------------------------------------- */

  if (
    !attemptResult ||
    typeof attemptResult !== "object"
  ) {
    throw new Error(
      "Invalid attempt response received."
    );
  }


  const result =
    attemptResult as {
      attempt_id?: unknown;
      test_id?: unknown;
      attempt_number?: unknown;
      status?: unknown;
      started_at?: unknown;
      existing_attempt?: unknown;
    };


  const attemptId =
    typeof result.attempt_id === "string"
      ? result.attempt_id
      : null;


  if (!attemptId) {
    throw new Error(
      "Attempt ID was not returned."
    );
  }


  /* -------------------------------------------------------
   * 4. Ensure the returned attempt belongs to this test
   * ------------------------------------------------------- */

  if (
    typeof result.test_id === "string" &&
    result.test_id !== resource.testId
  ) {
    throw new Error(
      "Attempt belongs to a different test."
    );
  }


  /* -------------------------------------------------------
   * 5. Attempt must be in progress
   * ------------------------------------------------------- */

  if (
    typeof result.status === "string" &&
    result.status !== "IN_PROGRESS"
  ) {
    throw new Error(
      "This test attempt is not available for practice."
    );
  }


  /* -------------------------------------------------------
   * 6. Continue to the actual practice interface
   *
   * The attempt ID is now part of the URL so the practice
   * interface can save answers against this exact attempt.
   * ------------------------------------------------------- */

  redirect(
    `/learning/resources/${resource.resourceId}/practice?attemptId=${encodeURIComponent(
      attemptId
    )}`
  );
}