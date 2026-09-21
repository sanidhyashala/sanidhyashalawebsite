import Link from "next/link";

import { clerkClient } from "@clerk/nextjs/server";

import {
  Bell,
  BrainCircuit,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileCheck2,
  GraduationCap,
  Sparkles,
  Users,
} from "lucide-react";

import {
  getAdminSubjectiveEvaluationSetOverview,
} from "@/app/lib/admin/subjective/subjective-evaluation-set.service";

import ResendSubjectiveEvaluationEmailButton from "@/app/admin/subjective/evaluations/set/[setId]/ResendSubjectiveEvaluationEmailButton";

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

const STATUS_LABELS: Record<
  string,
  string
> = {
  AWAITING_AI:
    "Awaiting AI Review",

  AI_ASSISTED:
    "AI Assisted",

  TEACHER_REVIEW:
    "Teacher Review",

  EVALUATED:
    "Evaluated",

  IN_PROGRESS:
    "In Progress",
};

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const label =
    STATUS_LABELS[status] ??
    status;

  if (
    status ===
    "AWAITING_AI"
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
        <Bell className="h-3.5 w-3.5" />
        {label}
      </span>
    );
  }

  if (
    status ===
    "AI_ASSISTED"
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">
        <Sparkles className="h-3.5 w-3.5" />
        {label}
      </span>
    );
  }

  if (
    status ===
    "TEACHER_REVIEW"
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
        <Clock3 className="h-3.5 w-3.5" />
        {label}
      </span>
    );
  }

  if (
    status ===
    "EVALUATED"
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
        <CheckCircle2 className="h-3.5 w-3.5" />
        {label}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
      {label}
    </span>
  );
}

function formatSubmittedAt(
  value: string | null
) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }

  return date.toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

async function getStudentDisplayName(userId: string) {
  try {
    const clerk = await clerkClient();
    const student = await clerk.users.getUser(userId);

    const fullName = [
      student.firstName,
      student.lastName,
    ]
      .filter(
        (value): value is string =>
          Boolean(value?.trim()),
      )
      .join(" ")
      .trim();

    return (
      fullName ||
      student.username?.trim() ||
      "Student"
    );
  } catch (error) {
    console.warn(
      "Unable to resolve student name for Subjective evaluation set:",
      userId,
      error,
    );

    return "Student";
  }
}

function getStudentInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "ST";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return (
    parts[0][0] +
    parts[parts.length - 1][0]
  ).toUpperCase();
}

export default async function SubjectiveEvaluationSetPage({
  params,
}: {
  params: Promise<{
    setId: string;
  }>;
}) {
  const { setId } =
    await params;

  const set =
    await getAdminSubjectiveEvaluationSetOverview(
      setId
    );

  if (!set) {
    return (
      <div className="mx-auto w-full max-w-5xl">
        <Link
          href="/admin/subjective/evaluations"
          className="inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-blue-600"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Evaluation
        </Link>

        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
            Subjective Set Not Found
          </h1>

          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            This Subjective Set could not be found or
            is no longer available.
          </p>
        </div>
      </div>
    );
  }

  const categoryLabel =
    CATEGORY_LABELS[
      set.category
    ] ?? set.category;

  /*
   * Resolve human-readable student names for the teacher-facing
   * attempts table. userId remains the stable identity key; the
   * name is display metadata only and does not affect evaluation
   * logic.
   */
  const studentNames = new Map<
    string,
    string
  >();

  const uniqueUserIds = [
    ...new Set(
      set.attempts
        .map((attempt) => attempt.userId)
        .filter(Boolean),
    ),
  ];

  const resolvedStudents =
    await Promise.all(
      uniqueUserIds.map(
        async (userId) => [
          userId,
          await getStudentDisplayName(userId),
        ] as const,
      ),
    );

  for (const [userId, name] of resolvedStudents) {
    studentNames.set(userId, name);
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      {/* =====================================================
       * Breadcrumb
       * ===================================================== */}

      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Link
          href="/admin/subjective/evaluations"
          className="transition hover:text-blue-600"
        >
          Evaluation
        </Link>

        <ChevronRight className="h-4 w-4" />

        <span>
          {set.className}
        </span>

        <ChevronRight className="h-4 w-4" />

        <span>
          {set.chapterName}
        </span>

        <ChevronRight className="h-4 w-4" />

        <span className="font-medium text-slate-700 dark:text-slate-300">
          Set {set.setNumber}
        </span>
      </div>

      {/* =====================================================
       * Header
       * ===================================================== */}

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
            <GraduationCap className="h-5 w-5" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                {set.title}
              </h1>

              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {categoryLabel}
              </span>
            </div>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {set.className} ·{" "}
              {set.chapterName} · Set{" "}
              {set.setNumber}
            </p>
          </div>
        </div>
      </div>

      {/* =====================================================
       * Summary Stats
       * ===================================================== */}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500 dark:text-slate-400">
              Student Attempts
            </span>

            <Users className="h-4 w-4 text-slate-500" />
          </div>

          <div className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">
            {set.studentAttemptCount}
          </div>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-5 shadow-sm dark:border-blue-900/60 dark:bg-blue-950/30">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700 dark:text-blue-300">
              New Submissions
            </span>

            <Bell className="h-4 w-4 text-blue-600" />
          </div>

          <div className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">
            {set.newSubmissionCount}
          </div>

          <div className="mt-1 text-xs text-blue-700/70 dark:text-blue-300/70">
            Waiting for AI review
          </div>
        </div>

        <div className="rounded-2xl border border-violet-200 bg-violet-50/60 p-5 shadow-sm dark:border-violet-900/60 dark:bg-violet-950/30">
          <div className="flex items-center justify-between">
            <span className="text-sm text-violet-700 dark:text-violet-300">
              AI Assisted
            </span>

            <BrainCircuit className="h-4 w-4 text-violet-600" />
          </div>

          <div className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">
            {set.aiAssistedCount}
          </div>

          <div className="mt-1 text-xs text-violet-700/70 dark:text-violet-300/70">
            AI results available
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 shadow-sm dark:border-amber-900/60 dark:bg-amber-950/30">
          <div className="flex items-center justify-between">
            <span className="text-sm text-amber-700 dark:text-amber-300">
              Teacher Review
            </span>

            <Clock3 className="h-4 w-4 text-amber-600" />
          </div>

          <div className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">
            {set.teacherReviewCount}
          </div>

          <div className="mt-1 text-xs text-amber-700/70 dark:text-amber-300/70">
            Ready for review
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 shadow-sm dark:border-emerald-900/60 dark:bg-emerald-950/30">
          <div className="flex items-center justify-between">
            <span className="text-sm text-emerald-700 dark:text-emerald-300">
              Evaluated
            </span>

            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>

          <div className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">
            {set.evaluatedCount}
          </div>

          <div className="mt-1 text-xs text-emerald-700/70 dark:text-emerald-300/70">
            Completed attempts
          </div>
        </div>
      </section>

      {/* =====================================================
       * New Submission Notice
       * ===================================================== */}

      {set.newSubmissionCount >
        0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 dark:border-blue-900/60 dark:bg-blue-950/30">
          <Bell className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />

          <div>
            <div className="text-sm font-semibold text-blue-900 dark:text-blue-300">
              {set.newSubmissionCount} new student submission
              {set.newSubmissionCount ===
              1
                ? ""
                : "s"} waiting for AI review
            </div>

            <div className="mt-1 text-xs text-blue-700/70 dark:text-blue-300/70">
              These attempts have been submitted and are
              ready for AI assistance.
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
       * Student Attempts
       * ===================================================== */}

      <section>
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-slate-500" />

              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Student Attempts
              </h2>
            </div>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Select an attempt to review the student&apos;s
              submitted solutions.
            </p>
          </div>
        </div>

        {set.attempts.length ===
        0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
            <FileCheck2 className="mx-auto h-8 w-8 text-slate-400" />

            <h3 className="mt-4 text-sm font-semibold text-slate-900 dark:text-white">
              No Student Attempts Yet
            </h3>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Student submissions for this Set will appear
              here.
            </p>
          </div>
        ) : (
          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            {/* Table Header */}

            <div className="hidden grid-cols-[1.5fr_0.7fr_1fr_1fr_1fr_1.05fr_0.8fr] gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3 text-xs font-medium uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 lg:grid">
              <div>
                Student
              </div>

              <div>
                Attempt
              </div>

              <div>
                Submitted
              </div>

              <div>
                Solutions
              </div>

              <div>
                Status
              </div>

              <div>
                Email
              </div>

              <div className="text-right">
                Action
              </div>
            </div>

            {/* Rows */}

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {set.attempts.map(
                (attempt) => (
                  <div
                    key={attempt.attemptId}
                    className="group transition hover:bg-slate-50 dark:hover:bg-slate-950"
                  >
                    <div className="grid gap-4 px-5 py-5 lg:grid-cols-[1.5fr_0.7fr_1fr_1fr_1fr_1.05fr_0.8fr] lg:items-center">
                      {/* Student */}

                      <div>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {getStudentInitials(
                              studentNames.get(
                                attempt.userId,
                              ) ?? "Student",
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-slate-900 dark:text-white">
                              {studentNames.get(
                                attempt.userId,
                              ) ?? "Student"}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Attempt */}

                      <div>
                        <div className="text-sm font-medium text-slate-900 dark:text-white">
                          #{attempt.attemptNumber}
                        </div>

                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {attempt.attemptType ===
                          "PREMIUM_RETRY"
                            ? "Premium Retry"
                            : "Initial Attempt"}
                        </div>
                      </div>

                      {/* Submitted */}

                      <div>
                        <div className="text-sm text-slate-700 dark:text-slate-300">
                          {formatSubmittedAt(
                            attempt.submittedAt
                          )}
                        </div>
                      </div>

                      {/* Solutions */}

                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">
                          {
                            attempt.submittedQuestionCount
                          }{" "}
                          /{" "}
                          {
                            attempt.questionCount
                          }
                        </div>

                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Solutions submitted
                        </div>
                      </div>

                      {/* Status */}

                      <div>
                        <StatusBadge
                          status={
                            attempt.evaluationStatus
                          }
                        />
                      </div>

                      {/* Email */}

                      <div className="flex items-center">
                        {attempt.evaluationStatus ===
                        "EVALUATED" ? (
                          <ResendSubjectiveEvaluationEmailButton
                            attemptId={
                              attempt.attemptId
                            }
                          />
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            —
                          </span>
                        )}
                      </div>

                      {/* Action */}

                      <div className="flex items-center justify-end">
                        <Link
                          href={`/admin/subjective/evaluations/attempt/${attempt.attemptId}`}
                          className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 transition hover:text-blue-700"
                        >
                          Review
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
