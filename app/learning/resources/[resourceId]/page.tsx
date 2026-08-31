import Link from "next/link";
import { notFound } from "next/navigation";

import { getStudentMcqResource } from "@/app/lib/learning/resource.service";
import { createLearningSupabaseClient } from "@/lib/learning/supabase-learning";
import { requireLearningAuth } from "@/lib/learning/learning-auth";

type PageProps = {
  params: Promise<{
    resourceId: string;
  }>;
};

type AttemptRow = {
  id: string;
  attempt_number: number;
  status: string;
  score: number | null;
  percentage: number | null;
  correct_count: number | null;
  incorrect_count: number | null;
  unanswered_count: number | null;
  submitted_at: string | null;
};

export default async function McqResourcePage({
  params,
}: PageProps) {
  const { resourceId } = await params;

  /* =======================================================
   * 1. Validate published student resource
   * ======================================================= */

  const resource =
    await getStudentMcqResource(resourceId);

  if (!resource) {
    notFound();
  }

  /* =======================================================
   * 2. Require authenticated learning user
   * ======================================================= */

  await requireLearningAuth();

  /* =======================================================
   * 3. Load this student's attempts
   * ======================================================= */

  const supabase =
    await createLearningSupabaseClient();

  const {
    data: attempts,
    error: attemptsError,
  } = await supabase
    .from("test_attempts")
    .select(
      `
        id,
        attempt_number,
        status,
        score,
        percentage,
        correct_count,
        incorrect_count,
        unanswered_count,
        submitted_at
      `
    )
    .eq(
      "test_id",
      resource.testId
    )
    .order(
      "attempt_number",
      {
        ascending: true,
      }
    );

  if (attemptsError) {
    throw new Error(
      `Failed to load test attempts: ${attemptsError.message}`
    );
  }

  const typedAttempts =
    (attempts ?? []) as AttemptRow[];

  /* =======================================================
   * 4. Separate current attempt from completed attempts
   * ======================================================= */

  const activeAttempt =
    typedAttempts.find(
      (attempt) =>
        attempt.status ===
        "IN_PROGRESS"
    );

  const submittedAttempts =
    typedAttempts.filter(
      (attempt) =>
        attempt.status ===
        "SUBMITTED"
    );

  /* =======================================================
   * 5. Attempt state
   * ======================================================= */

  const attemptCount =
    typedAttempts.length;

  const nextAttemptNumber =
    attemptCount + 1;

  const attemptsRemaining =
    Math.max(
      resource.maxAttempts -
        attemptCount,
      0
    );

  const attemptsExhausted =
    !activeAttempt &&
    attemptCount >=
      resource.maxAttempts;

  /* =======================================================
   * 6. Student-facing attempt label
   * ======================================================= */

  let attemptLabel: string;

  if (activeAttempt) {
    attemptLabel =
      `Attempt ${activeAttempt.attempt_number} in progress`;
  } else if (attemptsExhausted) {
    attemptLabel =
      `${resource.maxAttempts} of ${resource.maxAttempts} attempts used`;
  } else {
    attemptLabel =
      `Attempt ${nextAttemptNumber} of ${resource.maxAttempts}`;
  }

  return (
    <main className="px-6 py-16">
      <div className="mx-auto max-w-4xl">

        {/* =================================================
         * Breadcrumb
         * ================================================= */}

        <div className="mb-8 text-sm text-slate-500 dark:text-slate-400">

          <Link
            href={`/learning/${getClassSlug(
              resource.className
            )}`}
            className="
              transition
              hover:text-blue-700
              dark:hover:text-blue-400
            "
          >
            {resource.className ?? "Learning"}
          </Link>

          <span className="mx-2">
            /
          </span>

          <span>
            MCQ Practice
          </span>

        </div>


        {/* =================================================
         * Main Resource Card
         * ================================================= */}

        <section
          className="
            rounded-2xl
            border
            bg-white
            p-8
            shadow-sm
            dark:border-slate-800
            dark:bg-slate-900
            dark:shadow-none
          "
        >

          {/* -------------------------------------------------
           * Set badges
           * ------------------------------------------------- */}

          <div className="mb-5 flex flex-wrap items-center gap-3">

            {resource.className && (
              <span
                className="
                  rounded-full
                  bg-blue-50
                  px-3
                  py-1
                  text-sm
                  font-medium
                  text-blue-700
                  dark:bg-blue-500/10
                  dark:text-blue-400
                "
              >
                {resource.className}
              </span>
            )}

            {resource.setNumber !== null && (
              <span
                className="
                  rounded-full
                  bg-slate-100
                  px-3
                  py-1
                  text-sm
                  font-medium
                  text-slate-700
                  dark:bg-slate-800
                  dark:text-slate-300
                "
              >
                Set {resource.setNumber}
              </span>
            )}

            <span
              className="
                rounded-full
                bg-green-50
                px-3
                py-1
                text-sm
                font-medium
                text-green-700
                dark:bg-green-500/10
                dark:text-green-400
              "
            >
              Available
            </span>

          </div>


          {/* -------------------------------------------------
           * Title
           * ------------------------------------------------- */}

          <h1
            className="
              text-3xl
              font-bold
              tracking-tight
              text-blue-900
              sm:text-4xl
              dark:text-blue-400
            "
          >
            {resource.title}
          </h1>


          {/* -------------------------------------------------
           * Chapter
           * ------------------------------------------------- */}

          {resource.chapterName && (
            <p
              className="
                mt-3
                text-base
                text-slate-600
                dark:text-slate-400
              "
            >
              Chapter{" "}
              {resource.chapterSequence ?? ""}
              {resource.chapterSequence
                ? " · "
                : ""}
              {resource.chapterName}
            </p>
          )}


          {/* -------------------------------------------------
           * Description
           * ------------------------------------------------- */}

          {resource.description && (
            <p
              className="
                mt-6
                max-w-3xl
                text-lg
                leading-8
                text-slate-600
                dark:text-slate-300
              "
            >
              {resource.description}
            </p>
          )}


          {/* =================================================
           * Test Information
           * ================================================= */}

          <div
            className="
              mt-8
              grid
              gap-3
              sm:grid-cols-2
              lg:grid-cols-4
            "
          >

            <InfoCard
              label="Questions"
              value={String(
                resource.questionCount
              )}
            />

            <InfoCard
              label="Duration"
              value={
                resource.durationMinutes
                  ? `${resource.durationMinutes} min`
                  : "No limit"
              }
            />

            <InfoCard
              label="Attempts"
              value={attemptLabel}
            />

            <InfoCard
              label="Passing"
              value={
                resource.passingPercentage !== null
                  ? `${resource.passingPercentage}%`
                  : "Not specified"
              }
            />

          </div>


          {/* =================================================
           * Current Attempt Status
           * ================================================= */}

          <div
            className="
              mt-6
              rounded-xl
              border
              bg-slate-50
              px-4
              py-4
              dark:border-slate-800
              dark:bg-slate-950
            "
          >

            {activeAttempt ? (
              <>
                <p
                  className="
                    text-sm
                    font-semibold
                    text-blue-700
                    dark:text-blue-400
                  "
                >
                  Attempt{" "}
                  {activeAttempt.attempt_number}{" "}
                  is in progress
                </p>

                <p
                  className="
                    mt-1
                    text-sm
                    text-slate-500
                    dark:text-slate-400
                  "
                >
                  You can continue your current
                  attempt.
                </p>
              </>
            ) : attemptsExhausted ? (
              <>
                <p
                  className="
                    text-sm
                    font-semibold
                    text-slate-700
                    dark:text-slate-300
                  "
                >
                  All attempts used
                </p>

                <p
                  className="
                    mt-1
                    text-sm
                    text-slate-500
                    dark:text-slate-400
                  "
                >
                  You have used all{" "}
                  {resource.maxAttempts}{" "}
                  attempts for this test.
                </p>
              </>
            ) : (
              <>
                <p
                  className="
                    text-sm
                    font-semibold
                    text-slate-700
                    dark:text-slate-300
                  "
                >
                  {attemptLabel}
                </p>

                <p
                  className="
                    mt-1
                    text-sm
                    text-slate-500
                    dark:text-slate-400
                  "
                >
                  {attemptsRemaining}{" "}
                  {attemptsRemaining === 1
                    ? "attempt"
                    : "attempts"}{" "}
                  remaining.
                </p>
              </>
            )}

          </div>


          {/* =================================================
           * Previous Attempts / Results
           * ================================================= */}

          {submittedAttempts.length > 0 && (
            <section
              className="
                mt-8
                border-t
                border-slate-200
                pt-8
                dark:border-slate-800
              "
            >

              <div className="mb-5">

                <p
                  className="
                    text-sm
                    font-semibold
                    uppercase
                    tracking-widest
                    text-blue-700
                    dark:text-blue-400
                  "
                >
                  Your previous attempts
                </p>

                <h2
                  className="
                    mt-2
                    text-xl
                    font-bold
                    text-slate-900
                    dark:text-slate-100
                  "
                >
                  Practice history
                </h2>

                <p
                  className="
                    mt-2
                    text-sm
                    leading-6
                    text-slate-500
                    dark:text-slate-400
                  "
                >
                  Review how you performed in
                  your previous attempts.
                </p>

              </div>


              <div className="space-y-3">

                {submittedAttempts.map(
                  (attempt) => {

                    const percentage =
                      attempt.percentage !== null
                        ? Number(
                            attempt.percentage
                          )
                        : null;

                    const score =
                      attempt.score !== null
                        ? Number(
                            attempt.score
                          )
                        : null;

                    const correct =
                      attempt.correct_count ?? 0;

                    const incorrect =
                      attempt.incorrect_count ?? 0;

                    const unanswered =
                      attempt.unanswered_count ?? 0;

                    return (
                      <div
                        key={attempt.id}
                        className="
                          rounded-2xl
                          border
                          border-slate-200
                          bg-slate-50
                          p-5
                          dark:border-slate-800
                          dark:bg-slate-950
                        "
                      >

                        <div
                          className="
                            flex
                            flex-col
                            gap-4
                            sm:flex-row
                            sm:items-center
                            sm:justify-between
                          "
                        >

                          {/* Attempt information */}

                          <div>

                            <div
                              className="
                                flex
                                flex-wrap
                                items-center
                                gap-3
                              "
                            >

                              <span
                                className="
                                  text-sm
                                  font-semibold
                                  text-blue-700
                                  dark:text-blue-400
                                "
                              >
                                Attempt{" "}
                                {attempt.attempt_number}
                              </span>

                              <span
                                className="
                                  rounded-full
                                  bg-green-50
                                  px-2.5
                                  py-1
                                  text-xs
                                  font-medium
                                  text-green-700
                                  dark:bg-green-500/10
                                  dark:text-green-400
                                "
                              >
                                Submitted
                              </span>

                            </div>


                            <div
                              className="
                                mt-3
                                flex
                                flex-wrap
                                items-baseline
                                gap-x-4
                                gap-y-1
                              "
                            >

                              <p
                                className="
                                  text-xl
                                  font-bold
                                  text-slate-900
                                  dark:text-slate-100
                                "
                              >
                                {score !== null
                                  ? score
                                  : "—"}
                                {" / "}
                                {resource.questionCount}
                              </p>

                              <p
                                className="
                                  text-sm
                                  font-semibold
                                  text-blue-700
                                  dark:text-blue-400
                                "
                              >
                                {percentage !== null
                                  ? `${percentage}%`
                                  : "Result unavailable"}
                              </p>

                            </div>


                            <p
                              className="
                                mt-2
                                text-sm
                                text-slate-500
                                dark:text-slate-400
                              "
                            >
                              {correct} correct ·{" "}
                              {incorrect} incorrect ·{" "}
                              {unanswered} unanswered
                            </p>

                          </div>


                          {/* Result action */}

                          <Link
                            href={`/learning/results/${attempt.id}`}
                            className="
                              inline-flex
                              shrink-0
                              items-center
                              justify-center
                              rounded-xl
                              border
                              border-blue-200
                              bg-white
                              px-5
                              py-2.5
                              text-sm
                              font-semibold
                              text-blue-700
                              transition
                              hover:border-blue-300
                              hover:bg-blue-50
                              dark:border-blue-900
                              dark:bg-slate-900
                              dark:text-blue-400
                              dark:hover:bg-blue-950/40
                            "
                          >
                            View Result

                            <span className="ml-2">
                              →
                            </span>
                          </Link>

                        </div>

                      </div>
                    );
                  }
                )}

              </div>

            </section>
          )}


          {/* =================================================
           * Start / Continue Area
           * ================================================= */}

          <div
            className="
              mt-10
              flex
              flex-col
              gap-4
              border-t
              pt-8
              sm:flex-row
              sm:items-center
              sm:justify-between
              dark:border-slate-800
            "
          >

            <div>

              <p
                className="
                  font-medium
                  text-slate-800
                  dark:text-slate-200
                "
              >
                {activeAttempt
                  ? "Continue your practice?"
                  : attemptsExhausted
                    ? "Practice completed"
                    : "Ready to begin?"}
              </p>

              <p
                className="
                  mt-1
                  text-sm
                  text-slate-500
                  dark:text-slate-400
                "
              >
                {activeAttempt
                  ? "Your current attempt will be resumed."
                  : attemptsExhausted
                    ? "No more attempts are available for this test."
                    : "Read each question carefully before submitting your answer."}
              </p>

            </div>


            {attemptsExhausted ? (

              <span
                className="
                  inline-flex
                  items-center
                  justify-center
                  rounded-xl
                  bg-slate-200
                  px-6
                  py-3
                  font-semibold
                  text-slate-500
                  dark:bg-slate-800
                  dark:text-slate-400
                "
              >
                All Attempts Used
              </span>

            ) : (

              <Link
                href={`/learning/resources/${resource.resourceId}/start`}
                className="
                  inline-flex
                  items-center
                  justify-center
                  rounded-xl
                  bg-blue-700
                  px-6
                  py-3
                  font-semibold
                  text-white
                  shadow-sm
                  transition
                  hover:bg-blue-800
                  focus:outline-none
                  focus:ring-2
                  focus:ring-blue-500
                  focus:ring-offset-2
                  dark:bg-blue-600
                  dark:hover:bg-blue-500
                  dark:focus:ring-offset-slate-900
                "
              >
                {activeAttempt
                  ? "Continue Practice"
                  : "Start Practice"}

                <span className="ml-2">
                  →
                </span>
              </Link>

            )}

          </div>

        </section>

      </div>
    </main>
  );
}


/* =========================================================
 * Small UI helpers
 * ========================================================= */

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      className="
        rounded-xl
        border
        bg-slate-50
        px-4
        py-4
        dark:border-slate-800
        dark:bg-slate-950
      "
    >

      <p
        className="
          text-xs
          font-medium
          uppercase
          tracking-wide
          text-slate-500
          dark:text-slate-400
        "
      >
        {label}
      </p>

      <p
        className="
          mt-1
          font-semibold
          text-slate-900
          dark:text-slate-100
        "
      >
        {value}
      </p>

    </div>
  );
}


/* =========================================================
 * Convert program name to existing learning route slug
 * ========================================================= */

function getClassSlug(
  className: string | null
) {
  if (!className) {
    return "class-9";
  }

  const match = className.match(
    /Class\s+(IX|X|XI|XII)/i
  );

  if (!match) {
    return "class-9";
  }

  const value =
    match[1].toUpperCase();

  const map: Record<
    string,
    string
  > = {
    IX: "class-9",
    X: "class-10",
    XI: "class-11",
    XII: "class-12",
  };

  return (
    map[value] ??
    "class-9"
  );
}