import Link from "next/link";

import {
  Bell,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  FileCheck2,
  GraduationCap,
  Sparkles,
  Users,
} from "lucide-react";

import {
  getAdminSubjectiveEvaluationClassSummaries,
} from "@/app/lib/admin/subjective/subjective-evaluation-overview.service";

const CLASS_LABELS: Record<string, string> = {
  "class-9": "Class IX",
  "class-10": "Class X",
  "class-11": "Class XI",
  "class-12": "Class XII",
};

function StatItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-slate-400" />

      <div className="min-w-0">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          {label}
        </div>

        <div className="text-sm font-semibold text-slate-900 dark:text-white">
          {value}
        </div>
      </div>
    </div>
  );
}

export default async function SubjectiveEvaluationPage() {
  const classes =
    await getAdminSubjectiveEvaluationClassSummaries();

  const totalNewSubmissions =
    classes.reduce(
      (total, item) =>
        total + item.newSubmissionCount,
      0
    );

  const totalAwaitingAi =
    classes.reduce(
      (total, item) =>
        total + item.awaitingAiCount,
      0
    );

  const totalTeacherReview =
    classes.reduce(
      (total, item) =>
        total + item.teacherReviewCount,
      0
    );

  const totalEvaluated =
    classes.reduce(
      (total, item) =>
        total + item.evaluatedCount,
      0
    );

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      {/* =====================================================
       * Header
       * ===================================================== */}

      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
            <ClipboardCheck className="h-5 w-5" />
          </div>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
              Subjective Evaluation
            </h1>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Review student solutions, verify AI assistance,
              and finalize teacher evaluations.
            </p>
          </div>
        </div>
      </div>

      {/* =====================================================
       * New Submission Notification
       * ===================================================== */}

      <section
        className={`rounded-2xl border p-5 shadow-sm ${
          totalNewSubmissions > 0
            ? "border-blue-200 bg-blue-50/70 dark:border-blue-900/60 dark:bg-blue-950/30"
            : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
        }`}
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                totalNewSubmissions > 0
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              <Bell className="h-5 w-5" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold text-slate-900 dark:text-white">
                  New Submissions
                </h2>

                {totalNewSubmissions > 0 && (
                  <span className="rounded-full bg-blue-600 px-2.5 py-0.5 text-xs font-semibold text-white">
                    {totalNewSubmissions} new
                  </span>
                )}
              </div>

              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {totalNewSubmissions > 0
                  ? `${totalNewSubmissions} new student submission${
                      totalNewSubmissions === 1
                        ? ""
                        : "s"
                    } ${
                      totalNewSubmissions === 1
                        ? "is"
                        : "are"
                    } waiting for AI review.`
                  : "There are no new student submissions waiting for AI review."}
              </p>
            </div>
          </div>

          {totalNewSubmissions > 0 && (
            <Link
              href="/admin/subjective/evaluations"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Review New Submissions
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </section>

      {/* =====================================================
       * Overall Workload
       * ===================================================== */}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* New Submissions */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-500 dark:text-slate-400">
              New Submissions
            </div>

            <Bell className="h-4 w-4 text-blue-600" />
          </div>

          <div className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">
            {totalNewSubmissions}
          </div>

          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Waiting for AI review
          </div>
        </div>

        {/* Awaiting AI Review */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Awaiting AI Review
            </div>

            <BrainCircuit className="h-4 w-4 text-slate-500" />
          </div>

          <div className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">
            {totalAwaitingAi}
          </div>

          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Awaiting AI assistance
          </div>
        </div>

        {/* Teacher Review */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Teacher Review
            </div>

            <Clock3 className="h-4 w-4 text-amber-600" />
          </div>

          <div className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">
            {totalTeacherReview}
          </div>

          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Ready for teacher review
          </div>
        </div>

        {/* Completed Evaluations */}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Completed Evaluations
            </div>

            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>

          <div className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">
            {totalEvaluated}
          </div>

          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Teacher-reviewed submissions
          </div>
        </div>
      </section>

      {/* =====================================================
       * Classes Heading
       * ===================================================== */}

      <div>
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-slate-500" />

          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Classes
          </h2>
        </div>

        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Select a class to view its Subjective evaluation
          workload.
        </p>
      </div>

      {/* =====================================================
       * Class Cards
       * ===================================================== */}

      {classes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
          <BookOpen className="mx-auto h-8 w-8 text-slate-400" />

          <h3 className="mt-4 text-sm font-semibold text-slate-900 dark:text-white">
            No Published Subjective Classes
          </h3>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Published Subjective Sets will appear here when
            they become available.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-2">
          {classes.map((item) => {
            const classLabel =
              CLASS_LABELS[
                item.classSlug
              ] ?? item.className;

            return (
              <Link
                key={item.classSlug}
                href={`/admin/subjective/evaluations/class/${encodeURIComponent(
                  item.classSlug
                )}`}
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-800"
              >
                {/* Card Header */}

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        <GraduationCap className="h-5 w-5" />
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                          {classLabel}
                        </h3>

                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Subjective Evaluation
                        </p>
                      </div>
                    </div>
                  </div>

                  <ChevronRight className="mt-1 h-5 w-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600" />
                </div>

                {/* New Submission Badge */}

                {item.newSubmissionCount >
                  0 && (
                  <div className="mt-5 flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 dark:border-blue-900/60 dark:bg-blue-950/30">
                    <Bell className="h-4 w-4 text-blue-600" />

                    <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                      {item.newSubmissionCount} new
                      submission
                      {item.newSubmissionCount ===
                      1
                        ? ""
                        : "s"}
                    </span>

                    <span className="text-xs text-blue-700/70 dark:text-blue-300/70">
                      awaiting AI review
                    </span>
                  </div>
                )}

                {/* Main Stats */}

                <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <StatItem
                    icon={BookOpen}
                    label="Published Sets"
                    value={
                      item.publishedSetCount
                    }
                  />

                  <StatItem
                    icon={Users}
                    label="Student Attempts"
                    value={
                      item.studentAttemptCount
                    }
                  />

                  <StatItem
                    icon={Sparkles}
                    label="AI Assisted"
                    value={
                      item.aiAssistedCount
                    }
                  />

                  <StatItem
                    icon={FileCheck2}
                    label="Evaluated"
                    value={
                      item.evaluatedCount
                    }
                  />
                </div>

                {/* Evaluation Workload */}

                <div className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800">
                  <div className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-400">
                    Evaluation Workload
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <div className="text-lg font-semibold text-slate-900 dark:text-white">
                        {item.awaitingAiCount}
                      </div>

                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Awaiting AI
                      </div>
                    </div>

                    <div>
                      <div className="text-lg font-semibold text-amber-600">
                        {item.teacherReviewCount}
                      </div>

                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Teacher Review
                      </div>
                    </div>

                    <div>
                      <div className="text-lg font-semibold text-emerald-600">
                        {item.evaluatedCount}
                      </div>

                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Completed
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}

                <div className="mt-5 flex items-center justify-between text-xs text-slate-400">
                  <span>
                    Open class evaluation
                  </span>

                  <span className="inline-flex items-center gap-1 font-medium text-blue-600 opacity-0 transition group-hover:opacity-100">
                    Continue
                    <ChevronRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}