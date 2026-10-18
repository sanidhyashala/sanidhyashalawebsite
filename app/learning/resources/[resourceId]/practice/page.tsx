
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  getStudentMcqResource,
} from "@/app/lib/learning/resource.service";

import {
  requireLearningAuth,
} from "@/lib/learning/learning-auth";

import {
  getLearningTestAttempt,
} from "@/lib/learning/attempts";

import {
  getLearningTestQuestions,
} from "@/lib/learning/questions";

import PracticeClient from "./PracticeClient";

type PageProps = {
  params: Promise<{
    resourceId: string;
  }>;

  searchParams: Promise<{
    attemptId?: string;
  }>;
};

export default async function McqPracticePage({
  params,
  searchParams,
}: PageProps) {
  const {
    resourceId,
  } = await params;

  const {
    attemptId,
  } = await searchParams;

  /* -------------------------------------------------------
   * 1. Require authentication before loading practice data
   * ------------------------------------------------------- */

  await requireLearningAuth();

  /* -------------------------------------------------------
   * 2. Attempt ID is required
   * ------------------------------------------------------- */

  if (
    !attemptId ||
    !attemptId.trim()
  ) {
    notFound();
  }

  /* -------------------------------------------------------
   * 3. Load the published MCQ resource
   * ------------------------------------------------------- */

  const resource =
    await getStudentMcqResource(
      resourceId
    );

  if (!resource) {
    notFound();
  }

  /* -------------------------------------------------------
   * 4. Load the current student's attempt
   *
   * getLearningTestAttempt() uses the authenticated
   * learning client and must return only an attempt
   * accessible to the current student.
   * ------------------------------------------------------- */

  const attempt =
    await getLearningTestAttempt(
      attemptId
    );

  if (!attempt) {
    notFound();
  }

  /* -------------------------------------------------------
   * 5. Only an active attempt may be resumed
   * ------------------------------------------------------- */

  if (
    attempt.status !== "IN_PROGRESS"
  ) {
    notFound();
  }

  /* -------------------------------------------------------
   * 6. Critical integrity check
   *
   * The attempt must belong to this resource's test.
   * An attempt from another resource must never be used
   * to load questions here.
   * ------------------------------------------------------- */

  if (
    attempt.test_id !== resource.testId
  ) {
    notFound();
  }

  /* -------------------------------------------------------
   * 7. Do NOT recheck Premium entitlement here
   *
   * Policy:
   * - A valid entitlement is required to start a NEW
   *   Premium attempt.
   * - An existing IN_PROGRESS attempt may be resumed
   *   and completed after entitlement expiry/revocation.
   *
   * Authentication, attempt ownership, status and
   * resource/test binding checks remain mandatory.
   * ------------------------------------------------------- */

  /* -------------------------------------------------------
   * 8. Load questions only after integrity checks pass
   * ------------------------------------------------------- */

  const questions =
  await getLearningTestQuestions(
    attempt.id
  );

  if (
    !questions ||
    questions.length === 0
  ) {
    notFound();
  }

  /* -------------------------------------------------------
   * 9. Render practice
   * ------------------------------------------------------- */

  return (
    <main className="px-6 py-12">
      <div className="mx-auto max-w-4xl">

        <div className="mb-8">

          <Link
            href={`/learning/resources/${resourceId}`}
            className="
              text-sm
              font-medium
              text-blue-700
              hover:text-blue-800
              dark:text-blue-400
              dark:hover:text-blue-300
            "
          >
            ← Back to Set
          </Link>

          <div className="mt-6">

            <p
              className="
                text-sm
                font-medium
                text-slate-500
                dark:text-slate-400
              "
            >
              Attempt{" "}
              {attempt.attempt_number}
            </p>

            <h1
              className="
                mt-2
                text-3xl
                font-bold
                tracking-tight
                text-blue-900
                dark:text-blue-400
              "
            >
              MCQ Practice
            </h1>

            <p
              className="
                mt-2
                text-slate-600
                dark:text-slate-400
              "
            >
              Answer each question carefully.
            </p>

          </div>

        </div>

        <PracticeClient
          attemptId={attempt.id}
          resourceId={resourceId}
          questions={questions}
        />

      </div>
    </main>
  );
}
