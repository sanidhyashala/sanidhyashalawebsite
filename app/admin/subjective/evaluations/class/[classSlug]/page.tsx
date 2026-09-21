import Link from "next/link";

import {
  Bell,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  FileCheck2,
  GraduationCap,
  Sparkles,
  Users,
} from "lucide-react";

import {
  getAdminSubjectiveEvaluationClassOverview,
} from "@/app/lib/admin/subjective/subjective-evaluation-class.service";

const CLASS_LABELS: Record<
  string,
  string
> = {
  "class-9": "Class IX",
  "class-10": "Class X",
  "class-11": "Class XI",
  "class-12": "Class XII",
};

const CATEGORY_LABELS: Record<
  string,
  string
> = {
  UNDERSTAND_APPLY:
    "Understand & Apply",
  THINK_SOLVE:
    "Think & Solve",
  CASE_BASED:
    "Case Based",
};

function Stat({
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

      <div>
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

export default async function SubjectiveEvaluationClassPage({
  params,
}: {
  params: Promise<{
    classSlug: string;
  }>;
}) {
  const { classSlug } =
    await params;

  const classLabel =
    CLASS_LABELS[classSlug] ??
    classSlug;

  const chapters =
    await getAdminSubjectiveEvaluationClassOverview(
      classSlug
    );

  const totalSets =
    chapters.reduce(
      (total, chapter) =>
        total + chapter.sets.length,
      0
    );

  const totalAttempts =
    chapters.reduce(
      (total, chapter) =>
        total +
        chapter.totalStudentAttempts,
      0
    );

  const totalNew =
    chapters.reduce(
      (total, chapter) =>
        total +
        chapter.totalNewSubmissions,
      0
    );

  const totalTeacherReview =
    chapters.reduce(
      (total, chapter) =>
        total +
        chapter.totalTeacherReview,
      0
    );

  const totalEvaluated =
    chapters.reduce(
      (total, chapter) =>
        total +
        chapter.totalEvaluated,
      0
    );

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      {/* =====================================================
       * Breadcrumb
       * ===================================================== */}

      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Link
          href="/admin/subjective/evaluations"
          className="transition hover:text-blue-600"
        >
          Evaluation
        </Link>

        <ChevronRight className="h-4 w-4" />

        <span className="font-medium text-slate-700 dark:text-slate-300">
          {classLabel}
        </span>
      </div>

      {/* =====================================================
       * Header
       * ===================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
            <GraduationCap className="h-5 w-5" />
          </div>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
              {classLabel}
            </h1>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Review Subjective Sets and student
              evaluation workload for this class.
            </p>
          </div>
        </div>
      </div>

      {/* =====================================================
       * Overview Stats
       * ===================================================== */}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500 dark:text-slate-400">
              Published Sets
            </span>

            <BookOpen className="h-4 w-4 text-blue-600" />
          </div>

          <div className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">
            {totalSets}
          </div>

          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Available for evaluation
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500 dark:text-slate-400">
              Student Attempts
            </span>

            <Users className="h-4 w-4 text-slate-500" />
          </div>

          <div className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">
            {totalAttempts}
          </div>

          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Submitted attempts
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500 dark:text-slate-400">
              New Submissions
            </span>

            <Bell className="h-4 w-4 text-blue-600" />
          </div>

          <div className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">
            {totalNew}
          </div>

          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Waiting for AI review
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500 dark:text-slate-400">
              Completed
            </span>

            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>

          <div className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">
            {totalEvaluated}
          </div>

          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Evaluated attempts
          </div>
        </div>
      </section>

      {/* =====================================================
       * New Submission Notice
       * ===================================================== */}

      {totalNew > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 dark:border-blue-900/60 dark:bg-blue-950/30">
          <Bell className="h-5 w-5 shrink-0 text-blue-600" />

          <div>
            <div className="text-sm font-semibold text-blue-900 dark:text-blue-300">
              {totalNew} new student submission
              {totalNew === 1
                ? ""
                : "s"} waiting for AI review
            </div>

            <div className="mt-0.5 text-xs text-blue-700/70 dark:text-blue-300/70">
              Open a Subjective Set below to review
              its student attempts.
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
       * Chapter List
       * ===================================================== */}

      <div>
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-slate-500" />

          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Chapters
          </h2>
        </div>

        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Select a Subjective Set to view student
          attempts and evaluation progress.
        </p>
      </div>

      {chapters.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
          <BookOpen className="mx-auto h-8 w-8 text-slate-400" />

          <h3 className="mt-4 text-sm font-semibold text-slate-900 dark:text-white">
            No Published Subjective Sets
          </h3>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Published Subjective Sets for this class
            will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {chapters.map(
            (chapter) => (
              <section
                key={chapter.chapterId}
                className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                {/* Chapter Header */}

                <div className="border-b border-slate-100 px-6 py-5 dark:border-slate-800">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          Chapter{" "}
                          {chapter.chapterSequence}
                        </span>

                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                          {chapter.chapterName}
                        </h3>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-5">
                      <Stat
                        icon={BookOpen}
                        label="Sets"
                        value={
                          chapter.sets.length
                        }
                      />

                      <Stat
                        icon={Users}
                        label="Attempts"
                        value={
                          chapter.totalStudentAttempts
                        }
                      />

                      <Stat
                        icon={Bell}
                        label="New"
                        value={
                          chapter.totalNewSubmissions
                        }
                      />

                      <Stat
                        icon={Clock3}
                        label="Teacher Review"
                        value={
                          chapter.totalTeacherReview
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Sets */}

                <div className="grid gap-4 p-6 lg:grid-cols-2">
                  {chapter.sets.map(
                    (set) => {
                      const categoryLabel =
                        CATEGORY_LABELS[
                          set.category
                        ] ??
                        set.category;

                      return (
                        <Link
                          key={set.setId}
                          href={`/admin/subjective/evaluations/set/${set.setId}`}
                          className="group rounded-2xl border border-slate-200 p-5 transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md dark:border-slate-800 dark:hover:border-blue-800"
                        >
                          {/* Set Header */}

                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                                  Set{" "}
                                  {
                                    set.setNumber
                                  }
                                </span>

                                <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                  {
                                    categoryLabel
                                  }
                                </span>
                              </div>

                              <h4 className="mt-3 font-semibold text-slate-900 dark:text-white">
                                {set.title}
                              </h4>
                            </div>

                            <ChevronRight className="h-5 w-5 shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600" />
                          </div>

                          {/* New submissions */}

                          {set.newSubmissionCount >
                            0 && (
                            <div className="mt-4 flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 dark:border-blue-900/60 dark:bg-blue-950/30">
                              <Bell className="h-4 w-4 text-blue-600" />

                              <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                                {
                                  set.newSubmissionCount
                                }{" "}
                                new submission
                                {set.newSubmissionCount ===
                                1
                                  ? ""
                                  : "s"}
                              </span>
                            </div>
                          )}

                          {/* Set Stats */}

                          <div className="mt-5 grid grid-cols-2 gap-4">
                            <Stat
                              icon={Users}
                              label="Student Attempts"
                              value={
                                set.studentAttemptCount
                              }
                            />

                            <Stat
                              icon={BrainCircuit}
                              label="Awaiting AI"
                              value={
                                set.awaitingAiCount
                              }
                            />

                            <Stat
                              icon={Sparkles}
                              label="AI Assisted"
                              value={
                                set.aiAssistedCount
                              }
                            />

                            <Stat
                              icon={FileCheck2}
                              label="Evaluated"
                              value={
                                set.evaluatedCount
                              }
                            />
                          </div>

                          {/* Teacher Review */}

                          <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                              <Clock3 className="h-4 w-4 text-amber-600" />

                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                Teacher Review
                              </span>
                            </div>

                            <span className="text-sm font-semibold text-amber-600">
                              {
                                set.teacherReviewCount
                              }
                            </span>
                          </div>

                          <div className="mt-4 text-xs font-medium text-blue-600 opacity-0 transition group-hover:opacity-100">
                            Open student attempts →
                          </div>
                        </Link>
                      );
                    }
                  )}
                </div>
              </section>
            )
          )}
        </div>
      )}
    </div>
  );
}