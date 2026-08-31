import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { getStudentProfile } from "@/lib/learning/student-profile";
import { getStudentDashboard } from "@/lib/learning/dashboard";

export default async function LearningPage() {
  const { isAuthenticated } = await auth();

  /* =====================================================
   * Authentication Gate
   * ===================================================== */

  if (!isAuthenticated) {
    return (
      <main className="px-6 py-20">
        <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center">
          <section
            className="
              w-full
              rounded-3xl
              border
              border-slate-200
              bg-white
              px-8
              py-12
              text-center
              shadow-sm
              dark:border-slate-800
              dark:bg-slate-900
              dark:shadow-none
              sm:px-12
            "
          >
            <p
              className="
                mb-3
                text-sm
                font-semibold
                uppercase
                tracking-widest
                text-blue-700
                dark:text-blue-400
              "
            >
              Learning
            </p>

            <h1
              className="
                text-3xl
                font-bold
                tracking-tight
                text-blue-900
                dark:text-blue-400
                sm:text-4xl
              "
            >
              Please Sign In to Continue Your Learning
            </h1>

            <p
              className="
                mx-auto
                mt-4
                max-w-xl
                text-base
                leading-7
                text-slate-600
                dark:text-slate-300
              "
            >
              Sign in to access your personalized
              learning space.
            </p>

            <div className="mt-8">
              <Link
                href="/sign-in?redirect_url=/learning"
                className="
                  inline-flex
                  items-center
                  justify-center
                  rounded-xl
                  bg-blue-700
                  px-6
                  py-3
                  text-sm
                  font-semibold
                  text-white
                  shadow-sm
                  transition-all
                  hover:bg-blue-800
                  hover:shadow-md
                  focus:outline-none
                  focus:ring-2
                  focus:ring-blue-500
                  focus:ring-offset-2
                  dark:bg-blue-600
                  dark:hover:bg-blue-500
                  dark:focus:ring-offset-slate-900
                "
              >
                Sign In to Continue →
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  /* =====================================================
   * Student Profile Gate
   * ===================================================== */

  const profile = await getStudentProfile();

  if (!profile.exists) {
    redirect("/learning/onboarding");
  }

  if (!profile.program_id) {
    return (
      <main className="px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <section
            className="
              rounded-3xl
              border
              border-amber-200
              bg-amber-50
              p-8
              dark:border-amber-900
              dark:bg-amber-950/30
            "
          >
            <h1
              className="
                text-2xl
                font-bold
                text-amber-900
                dark:text-amber-300
              "
            >
              Learning program not assigned
            </h1>

            <p
              className="
                mt-3
                leading-7
                text-amber-800
                dark:text-amber-200
              "
            >
              Your student profile is complete, but no
              learning class has been assigned to it yet.
            </p>

            <p
              className="
                mt-2
                text-sm
                text-amber-700
                dark:text-amber-300
              "
            >
              Please contact the administrator to update
              your learning profile.
            </p>
          </section>
        </div>
      </main>
    );
  }

  /* =====================================================
   * Load Student Dashboard
   * ===================================================== */

  const dashboard =
    await getStudentDashboard();

  /* =====================================================
   * Determine existing class route
   * ===================================================== */

  const classSlug =
    dashboard.student.programSlug ??
    getClassSlug(
      dashboard.student.programName ?? null
    );

  const mcqHref =
    `/learning/${classSlug}/mcq`;

  const notesHref =
    `/learning/${classSlug}/notes`;

  /* =====================================================
   * Dashboard
   * ===================================================== */

  return (
    <main className="px-6 py-12">
      <div className="mx-auto max-w-6xl space-y-10">

        {/* =================================================
         * Welcome
         * ================================================= */}

        <section
          className="
            rounded-3xl
            border
            border-slate-200
            bg-white
            p-8
            shadow-sm
            dark:border-slate-800
            dark:bg-slate-900
            dark:shadow-none
            sm:p-10
            lg:p-12
          "
        >
          <div
            className="
              flex
              flex-col
              gap-8
              sm:flex-row
              sm:items-start
              sm:justify-between
            "
          >
            <div className="max-w-3xl">
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
                Your Learning Space
              </p>

              <h1
                className="
                  mt-3
                  text-4xl
                  font-bold
                  tracking-tight
                  text-blue-900
                  dark:text-blue-400
                  sm:text-5xl
                "
              >
                Welcome, {profile.full_name}
              </h1>

              <p
                className="
                  mt-5
                  max-w-2xl
                  text-lg
                  leading-8
                  text-slate-600
                  dark:text-slate-300
                "
              >
                Learning is not about finishing more
                chapters. It is about understanding one
                thing a little more clearly than before.
              </p>

              <p
                className="
                  mt-3
                  text-base
                  font-medium
                  text-slate-800
                  dark:text-slate-200
                "
              >
                Choose where you want to begin.
              </p>
            </div>

            <Link
              href="/learning/settings"
              className="
                inline-flex
                shrink-0
                items-center
                justify-center
                rounded-xl
                border
                border-slate-200
                px-4
                py-2.5
                text-sm
                font-semibold
                text-slate-700
                transition
                hover:border-blue-300
                hover:text-blue-700
                dark:border-slate-700
                dark:text-slate-300
                dark:hover:border-blue-500
                dark:hover:text-blue-400
              "
            >
              Settings
            </Link>
          </div>

          {/* Student context */}

          <div className="mt-8 flex flex-wrap gap-3">
            {dashboard.student.programName && (
              <span
                className="
                  rounded-full
                  bg-blue-50
                  px-4
                  py-2
                  text-sm
                  font-medium
                  text-blue-700
                  dark:bg-blue-500/10
                  dark:text-blue-400
                "
              >
                {dashboard.student.programName}
              </span>
            )}

            {dashboard.student.board && (
              <span
                className="
                  rounded-full
                  bg-slate-100
                  px-4
                  py-2
                  text-sm
                  font-medium
                  text-slate-700
                  dark:bg-slate-800
                  dark:text-slate-300
                "
              >
                {dashboard.student.board}
              </span>
            )}

            {dashboard.curriculum?.session && (
              <span
                className="
                  rounded-full
                  bg-slate-100
                  px-4
                  py-2
                  text-sm
                  font-medium
                  text-slate-700
                  dark:bg-slate-800
                  dark:text-slate-300
                "
              >
                Session {dashboard.curriculum.session}
              </span>
            )}
          </div>
        </section>

        {/* =================================================
         * Choose Your Learning Path
         * ================================================= */}

        <section>
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
              Your Learning
            </p>

            <h2
              className="
                mt-2
                text-2xl
                font-bold
                text-slate-900
                dark:text-slate-100
              "
            >
              Where would you like to begin?
            </h2>

            <p
              className="
                mt-2
                max-w-2xl
                text-sm
                leading-6
                text-slate-500
                dark:text-slate-400
              "
            >
              Build understanding through notes, or test
              what you know through focused practice.
            </p>
          </div>

          <div
            className="
              grid
              gap-5
              md:grid-cols-2
            "
          >
            {/* MCQ Practice */}

            <Link
              href={mcqHref}
              className="
                group
                rounded-3xl
                border
                border-slate-200
                bg-white
                p-7
                shadow-sm
                transition-all
                hover:-translate-y-1
                hover:border-blue-300
                hover:shadow-md
                dark:border-slate-800
                dark:bg-slate-900
                dark:shadow-none
                dark:hover:border-blue-700
              "
            >
              <div
                className="
                  flex
                  h-12
                  w-12
                  items-center
                  justify-center
                  rounded-2xl
                  bg-blue-50
                  text-xl
                  font-bold
                  text-blue-700
                  dark:bg-blue-500/10
                  dark:text-blue-400
                "
              >
                ?
              </div>

              <p
                className="
                  mt-6
                  text-xs
                  font-semibold
                  uppercase
                  tracking-widest
                  text-blue-700
                  dark:text-blue-400
                "
              >
                Practice
              </p>

              <h3
                className="
                  mt-2
                  text-2xl
                  font-bold
                  text-slate-900
                  dark:text-slate-100
                "
              >
                MCQ Practice
              </h3>

              <p
                className="
                  mt-3
                  max-w-md
                  text-sm
                  leading-6
                  text-slate-600
                  dark:text-slate-400
                "
              >
                Practice chapter-wise questions, track your
                performance, and understand where you need
                more attention.
              </p>

              <span
                className="
                  mt-6
                  inline-flex
                  items-center
                  text-sm
                  font-semibold
                  text-blue-700
                  transition
                  group-hover:gap-2
                  dark:text-blue-400
                "
              >
                Explore MCQs
                <span className="ml-1">→</span>
              </span>
            </Link>

            {/* Notes */}

            <Link
              href={notesHref}
              className="
                group
                rounded-3xl
                border
                border-slate-200
                bg-white
                p-7
                shadow-sm
                transition-all
                hover:-translate-y-1
                hover:border-blue-300
                hover:shadow-md
                dark:border-slate-800
                dark:bg-slate-900
                dark:shadow-none
                dark:hover:border-blue-700
              "
            >
              <div
                className="
                  flex
                  h-12
                  w-12
                  items-center
                  justify-center
                  rounded-2xl
                  bg-blue-50
                  text-xl
                  font-bold
                  text-blue-700
                  dark:bg-blue-500/10
                  dark:text-blue-400
                "
              >
                ◫
              </div>

              <p
                className="
                  mt-6
                  text-xs
                  font-semibold
                  uppercase
                  tracking-widest
                  text-blue-700
                  dark:text-blue-400
                "
              >
                Understand
              </p>

              <h3
                className="
                  mt-2
                  text-2xl
                  font-bold
                  text-slate-900
                  dark:text-slate-100
                "
              >
                Notes
              </h3>

              <p
                className="
                  mt-3
                  max-w-md
                  text-sm
                  leading-6
                  text-slate-600
                  dark:text-slate-400
                "
              >
                Explore chapter-wise notes designed to
                build conceptual clarity before you begin
                practicing.
              </p>

              <span
                className="
                  mt-6
                  inline-flex
                  items-center
                  text-sm
                  font-semibold
                  text-blue-700
                  transition
                  group-hover:gap-2
                  dark:text-blue-400
                "
              >
                Explore Notes
                <span className="ml-1">→</span>
              </span>
            </Link>
          </div>
        </section>

        {/* =================================================
         * Continue Learning
         * ================================================= */}

        {dashboard.continueLearning &&
          dashboard.continueLearning.tests?.resource_id && (
            <section
              className="
                rounded-2xl
                border
                border-blue-200
                bg-blue-50
                p-6
                dark:border-blue-900
                dark:bg-blue-950/30
              "
            >
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
                Continue Learning
              </p>

              <div
                className="
                  mt-3
                  flex
                  flex-col
                  gap-4
                  sm:flex-row
                  sm:items-center
                  sm:justify-between
                "
              >
                <div>
                  <h2
                    className="
                      text-xl
                      font-bold
                      text-blue-900
                      dark:text-blue-300
                    "
                  >
                    {dashboard.continueLearning.tests.title ??
                      "Practice Test"}
                  </h2>

                  <p
                    className="
                      mt-1
                      text-sm
                      text-blue-800
                      dark:text-blue-200
                    "
                  >
                    Attempt{" "}
                    {dashboard.continueLearning.attempt_number}{" "}
                    is still in progress.
                  </p>
                </div>

                <Link
                  href={`/learning/resources/${dashboard.continueLearning.tests.resource_id}/practice?attemptId=${encodeURIComponent(
                    dashboard.continueLearning.id
                  )}`}
                  className="
                    inline-flex
                    items-center
                    justify-center
                    rounded-xl
                    bg-blue-700
                    px-5
                    py-2.5
                    font-semibold
                    text-white
                    transition
                    hover:bg-blue-800
                    dark:bg-blue-600
                    dark:hover:bg-blue-500
                  "
                >
                  Continue →
                </Link>
              </div>
            </section>
          )}

        {/* =================================================
         * Progress
         * ================================================= */}

        <section>
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
              Your Progress
            </p>

            <h2
              className="
                mt-2
                text-2xl
                font-bold
                text-slate-900
                dark:text-slate-100
              "
            >
              Keep moving forward
            </h2>
          </div>

          <div
            className="
              grid
              gap-4
              sm:grid-cols-2
              lg:grid-cols-4
            "
          >
            <StatCard
              label="Tests Attempted"
              value={
                dashboard.stats.testsAttempted
              }
            />

            <StatCard
              label="Tests Completed"
              value={
                dashboard.stats.testsCompleted
              }
            />

            <StatCard
              label="Average Score"
              value={
                dashboard.stats.averagePercentage !==
                null
                  ? `${dashboard.stats.averagePercentage}%`
                  : "—"
              }
            />

            <StatCard
              label="Questions Answered"
              value={
                dashboard.stats.questionsAnswered
              }
            />
          </div>
        </section>

        {/* =================================================
         * Detailed Attempt History
         *
         * This is the new part.
         * ================================================= */}

        <section>
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
              Attempt History
            </p>

            <h2
              className="
                mt-2
                text-2xl
                font-bold
                text-slate-900
                dark:text-slate-100
              "
            >
              Your Practice Journey
            </h2>

            <p
              className="
                mt-2
                max-w-2xl
                text-sm
                leading-6
                text-slate-500
                dark:text-slate-400
              "
            >
              See how you performed in each MCQ set,
              attempt by attempt.
            </p>
          </div>

          {dashboard.recentAttempts.length === 0 ? (
            <section
              className="
                rounded-3xl
                border
                border-dashed
                border-slate-300
                bg-white
                p-8
                text-center
                dark:border-slate-700
                dark:bg-slate-900
              "
            >
              <p
                className="
                  text-base
                  font-semibold
                  text-slate-800
                  dark:text-slate-200
                "
              >
                No attempts yet
              </p>

              <p
                className="
                  mt-2
                  text-sm
                  leading-6
                  text-slate-500
                  dark:text-slate-400
                "
              >
                Start an MCQ practice set and your
                performance will appear here.
              </p>

              <Link
                href={mcqHref}
                className="
                  mt-5
                  inline-flex
                  items-center
                  justify-center
                  rounded-xl
                  bg-blue-700
                  px-5
                  py-2.5
                  text-sm
                  font-semibold
                  text-white
                  transition
                  hover:bg-blue-800
                  dark:bg-blue-600
                  dark:hover:bg-blue-500
                "
              >
                Start Practice →
              </Link>
            </section>
          ) : (
            <div className="space-y-4">
              {dashboard.recentAttempts.map(
                (attempt) => (
                  <AttemptHistoryCard
                    key={attempt.id}
                    attempt={attempt}
                  />
                )
              )}
            </div>
          )}
        </section>

      </div>
    </main>
  );
}

/* =========================================================
 * Attempt History Card
 * ========================================================= */

function AttemptHistoryCard({
  attempt,
}: {
  attempt: Awaited<
    ReturnType<typeof getStudentDashboard>
  >["recentAttempts"][number];
}) {
  const isSubmitted =
    attempt.status === "SUBMITTED";

  const isInProgress =
    attempt.status === "IN_PROGRESS";

  const percentage =
    typeof attempt.percentage === "number"
      ? `${attempt.percentage}%`
      : "—";

  const score =
    typeof attempt.score === "number"
      ? attempt.score
      : "—";

  const chapterName =
    attempt.chapter?.display_name ??
    "Chapter";

  const resourceTitle =
    attempt.resource?.title ??
    attempt.tests?.title ??
    "MCQ Practice Set";

  const formattedDate =
    attempt.submitted_at
      ? formatAttemptDate(
          attempt.submitted_at
        )
      : attempt.updated_at
        ? formatAttemptDate(
            attempt.updated_at
          )
        : null;

  return (
    <article
      className="
        rounded-3xl
        border
        border-slate-200
        bg-white
        p-6
        shadow-sm
        transition
        hover:border-blue-200
        hover:shadow-md
        dark:border-slate-800
        dark:bg-slate-900
        dark:shadow-none
        dark:hover:border-blue-800
      "
    >
      {/* -------------------------------------------------
       * Top row
       * ------------------------------------------------- */}

      <div
        className="
          flex
          flex-col
          gap-5
          lg:flex-row
          lg:items-start
          lg:justify-between
        "
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="
                rounded-full
                bg-blue-50
                px-3
                py-1
                text-xs
                font-semibold
                text-blue-700
                dark:bg-blue-500/10
                dark:text-blue-400
              "
            >
              {chapterName}
            </span>

            {isSubmitted && (
              <span
                className="
                  rounded-full
                  bg-emerald-50
                  px-3
                  py-1
                  text-xs
                  font-semibold
                  text-emerald-700
                  dark:bg-emerald-500/10
                  dark:text-emerald-400
                "
              >
                Completed
              </span>
            )}

            {isInProgress && (
              <span
                className="
                  rounded-full
                  bg-amber-50
                  px-3
                  py-1
                  text-xs
                  font-semibold
                  text-amber-700
                  dark:bg-amber-500/10
                  dark:text-amber-400
                "
              >
                In Progress
              </span>
            )}
          </div>

          <h3
            className="
              mt-3
              text-xl
              font-bold
              text-slate-900
              dark:text-slate-100
            "
          >
            {resourceTitle}
          </h3>

          <p
            className="
              mt-1
              text-sm
              text-slate-500
              dark:text-slate-400
            "
          >
            Attempt {attempt.attempt_number}
            {formattedDate
              ? ` • ${formattedDate}`
              : ""}
          </p>
        </div>

        {/* -------------------------------------------------
         * Result / Continue button
         * ------------------------------------------------- */}

        {isSubmitted ? (
          <Link
            href={`/learning/results/${encodeURIComponent(
              attempt.id
            )}`}
            className="
              inline-flex
              shrink-0
              items-center
              justify-center
              rounded-xl
              bg-blue-700
              px-5
              py-2.5
              text-sm
              font-semibold
              text-white
              transition
              hover:bg-blue-800
              dark:bg-blue-600
              dark:hover:bg-blue-500
            "
          >
            View Result →
          </Link>
        ) : isInProgress &&
          attempt.tests?.resource_id ? (
          <Link
            href={`/learning/resources/${attempt.tests.resource_id}/practice?attemptId=${encodeURIComponent(
              attempt.id
            )}`}
            className="
              inline-flex
              shrink-0
              items-center
              justify-center
              rounded-xl
              border
              border-blue-200
              px-5
              py-2.5
              text-sm
              font-semibold
              text-blue-700
              transition
              hover:border-blue-400
              hover:bg-blue-50
              dark:border-blue-800
              dark:text-blue-400
              dark:hover:bg-blue-950/40
            "
          >
            Continue →
          </Link>
        ) : null}
      </div>

      {/* -------------------------------------------------
       * Performance summary
       * ------------------------------------------------- */}

      <div
        className="
          mt-6
          grid
          gap-3
          sm:grid-cols-2
          lg:grid-cols-5
        "
      >
        <AttemptMetric
          label="Score"
          value={
            isSubmitted
              ? score
              : "—"
          }
        />

        <AttemptMetric
          label="Percentage"
          value={
            isSubmitted
              ? percentage
              : "—"
          }
        />

        <AttemptMetric
          label="Correct"
          value={
            attempt.correct_count ??
            0
          }
        />

        <AttemptMetric
          label="Incorrect"
          value={
            attempt.incorrect_count ??
            0
          }
        />

        <AttemptMetric
          label="Unanswered"
          value={
            attempt.unanswered_count ??
            0
          }
        />
      </div>
    </article>
  );
}

/* =========================================================
 * Attempt Metric
 * ========================================================= */

function AttemptMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div
      className="
        rounded-2xl
        border
        border-slate-100
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
          text-slate-500
          dark:text-slate-400
        "
      >
        {label}
      </p>

      <p
        className="
          mt-1
          text-lg
          font-bold
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
 * Stat Card
 * ========================================================= */

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div
      className="
        rounded-2xl
        border
        border-slate-200
        bg-white
        p-5
        shadow-sm
        dark:border-slate-800
        dark:bg-slate-900
        dark:shadow-none
      "
    >
      <p
        className="
          text-sm
          text-slate-500
          dark:text-slate-400
        "
      >
        {label}
      </p>

      <p
        className="
          mt-2
          text-3xl
          font-bold
          text-blue-900
          dark:text-blue-400
        "
      >
        {value}
      </p>
    </div>
  );
}

/* =========================================================
 * Attempt Date Formatter
 * ========================================================= */

function formatAttemptDate(
  value: string
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  ).format(date);
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

  const match =
    className.match(
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