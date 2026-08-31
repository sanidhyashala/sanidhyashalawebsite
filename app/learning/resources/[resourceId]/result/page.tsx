import Link from "next/link";
import { notFound } from "next/navigation";

import {
  getLearningTestResult,
} from "@/lib/learning/results";

type PageProps = {
  params: Promise<{
    resourceId: string;
  }>;

  searchParams: Promise<{
    attemptId?: string;
  }>;
};

export default async function McqResultPage({
  params,
  searchParams,
}: PageProps) {
  const { resourceId } = await params;
  const { attemptId } = await searchParams;

  if (!attemptId) {
    notFound();
  }

  const result =
    await getLearningTestResult(attemptId);

  if (!result) {
    notFound();
  }

  if (result.status !== "SUBMITTED") {
    notFound();
  }

  return (
    <main className="px-6 py-12">
      <div className="mx-auto max-w-4xl">

        {/* Header */}
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
              Attempt {result.attemptNumber}
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
              Test Result
            </h1>

            <p
              className="
                mt-2
                text-slate-600
                dark:text-slate-400
              "
            >
              Your MCQ attempt has been submitted
              successfully.
            </p>

          </div>
        </div>

        {/* Score */}
        <section
          className="
            mb-6
            rounded-2xl
            border
            bg-white
            p-8
            text-center
            shadow-sm
            dark:border-slate-800
            dark:bg-slate-900
            dark:shadow-none
          "
        >

          <p
            className="
              text-sm
              font-medium
              uppercase
              tracking-wide
              text-slate-500
              dark:text-slate-400
            "
          >
            Your Score
          </p>

          <p
            className="
              mt-3
              text-5xl
              font-bold
              tracking-tight
              text-blue-900
              dark:text-blue-400
            "
          >
            {result.score ?? 0}
          </p>

          {result.percentage !== null && (
            <p
              className="
                mt-2
                text-lg
                font-medium
                text-slate-600
                dark:text-slate-300
              "
            >
              {result.percentage}%
            </p>
          )}

        </section>

        {/* Statistics */}
        <div
          className="
            grid
            gap-4
            sm:grid-cols-3
          "
        >

          <ResultCard
            label="Correct"
            value={result.correctCount}
          />

          <ResultCard
            label="Incorrect"
            value={result.incorrectCount}
          />

          <ResultCard
            label="Unanswered"
            value={result.unansweredCount}
          />

        </div>

        {/* Status */}
        <section
          className="
            mt-6
            rounded-2xl
            border
            bg-white
            p-6
            shadow-sm
            dark:border-slate-800
            dark:bg-slate-900
            dark:shadow-none
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

            <div>

              <p
                className="
                  text-sm
                  font-medium
                  text-slate-500
                  dark:text-slate-400
                "
              >
                Status
              </p>

              <p
                className="
                  mt-1
                  font-semibold
                  text-green-700
                  dark:text-green-400
                "
              >
                ✓ Test Submitted
              </p>

            </div>

            {result.submittedAt && (
              <p
                className="
                  text-sm
                  text-slate-500
                  dark:text-slate-400
                "
              >
                Submitted{" "}
                {formatDate(result.submittedAt)}
              </p>
            )}

          </div>

        </section>

        {/* Actions */}
        <div
          className="
            mt-8
            flex
            flex-col
            gap-3
            sm:flex-row
          "
        >

          <Link
            href={`/learning/resources/${resourceId}`}
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
              transition
              hover:bg-blue-800
              dark:bg-blue-600
              dark:hover:bg-blue-500
            "
          >
            Back to Set
          </Link>

        </div>

      </div>
    </main>
  );
}

/* =========================================================
 * Result Card
 * ========================================================= */

function ResultCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div
      className="
        rounded-2xl
        border
        bg-white
        p-6
        shadow-sm
        dark:border-slate-800
        dark:bg-slate-900
        dark:shadow-none
      "
    >
      <p
        className="
          text-sm
          font-medium
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
 * Date formatter
 * ========================================================= */

function formatDate(value: string) {
  return new Intl.DateTimeFormat(
    "en-IN",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  ).format(new Date(value));
}