import Link from "next/link";
import { notFound } from "next/navigation";

import {
  getStudentMcqResource,
} from "@/app/lib/learning/resource.service";

import {
  getLearningTestAttempt,
} from "@/lib/learning/attempts";

import {
  getLearningTestQuestions,
} from "@/lib/learning/questions";

import {
  createLearningSupabaseClient,
} from "@/lib/learning/supabase-learning";

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
   * 1. Attempt ID is required
   * ------------------------------------------------------- */

  if (!attemptId) {
    notFound();
  }

  /* -------------------------------------------------------
   * 2. Load the published MCQ resource
   * ------------------------------------------------------- */

  const resource =
    await getStudentMcqResource(
      resourceId
    );

  if (!resource) {
    notFound();
  }

  /* -------------------------------------------------------
   * 3. Load the current student's attempt
   *
   * getLearningTestAttempt() uses the authenticated
   * learning client, so the attempt belongs to the
   * current authenticated student.
   * ------------------------------------------------------- */

  const attempt =
    await getLearningTestAttempt(
      attemptId
    );

  if (!attempt) {
    notFound();
  }

  /* -------------------------------------------------------
   * 4. Attempt must still be IN_PROGRESS
   * ------------------------------------------------------- */

  if (
    attempt.status !==
    "IN_PROGRESS"
  ) {
    notFound();
  }

  /* -------------------------------------------------------
   * 5. Critical integrity check
   *
   * The attempt must belong to THIS resource.
   *
   * Prevents:
   *
   * resource A
   * +
   * attempt from resource B
   * =
   * questions from resource B
   * ------------------------------------------------------- */

  if (
    attempt.test_id !==
    resource.testId
  ) {
    notFound();
  }

  /* -------------------------------------------------------
   * 6. Resolve current student access
   *
   * FREE:
   *   always accessible
   *
   * PREMIUM:
   *   requires active Chapter or Subject entitlement
   *
   * The RPC reads the authenticated Clerk/Supabase
   * identity from auth.jwt()->>'sub'.
   * ------------------------------------------------------- */

  if (
    resource.accessType ===
    "PREMIUM"
  ) {
    const learningSupabase =
      await createLearningSupabaseClient();

    const {
      data: hasAccess,
      error: accessError,
    } =
      await learningSupabase.rpc(
        "user_has_learning_product_access",
        {
          p_resource_id:
            resourceId,
        }
      );

    if (accessError) {
      throw new Error(
        `Failed to resolve MCQ access: ${accessError.message}`
      );
    }

    if (hasAccess !== true) {
      notFound();
    }
  }

  /* -------------------------------------------------------
   * 7. Load questions ONLY after all access checks pass
   * ------------------------------------------------------- */

  const questions =
    await getLearningTestQuestions(
      attempt.test_id
    );

  if (
    !questions ||
    questions.length === 0
  ) {
    notFound();
  }

  /* -------------------------------------------------------
   * 8. Render practice
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