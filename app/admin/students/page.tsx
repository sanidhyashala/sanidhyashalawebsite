import type { Metadata } from "next";

import AdminPage from "../components/layout/AdminPage";
import { getAdminStudents } from "@/app/lib/admin/students/students.service";

export const metadata: Metadata = {
  title: "Students | SanidhyaShala Admin",
  description:
    "View and manage students enrolled in SanidhyaShala Learning.",
};

export const dynamic = "force-dynamic";

type StudentsPageProps = {
  searchParams: Promise<{
    class?: string;
  }>;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getBoardLabel(board: string) {
  switch (board) {
    case "CBSE":
      return "CBSE";

    case "ICSE":
      return "ICSE";

    case "UP_BOARD":
      return "UP Board";

    case "OTHER":
      return "Other";

    default:
      return board;
  }
}

function getLanguageLabel(language: string) {
  switch (language) {
    case "English":
      return "English";

    case "Hindi":
      return "Hindi";

    case "Hinglish":
      return "Hinglish";

    default:
      return language;
  }
}

export default async function AdminStudentsPage({
  searchParams,
}: StudentsPageProps) {
  const { class: selectedClassId = "all" } = await searchParams;

  const students = await getAdminStudents();

  /*
   * Build the class filter options from the actual student data.
   * programId is the source of truth for the student's class.
   */
  const classMap = new Map<
    string,
    {
      id: string;
      name: string;
    }
  >();

  for (const student of students) {
    if (!classMap.has(student.programId)) {
      classMap.set(student.programId, {
        id: student.programId,
        name: student.programName,
      });
    }
  }

  const classOptions = Array.from(classMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name, undefined, {
      numeric: true,
      sensitivity: "base",
    })
  );

  const filteredStudents =
    selectedClassId === "all"
      ? students
      : students.filter(
          (student) => student.programId === selectedClassId
        );

  const representedClasses = new Set(
    filteredStudents.map((student) => student.programId)
  ).size;

  return (
    <AdminPage
      title="Students"
      description="Students who have completed Learning Module onboarding."
      sectionTitle="Student Directory"
    >
      <div className="space-y-6">
        {/* Summary */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Total Students
            </p>

            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              {filteredStudents.length}
            </p>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {selectedClassId === "all"
                ? "Completed Learning onboarding"
                : "Students in selected class"}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Active Profiles
            </p>

            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              {
                filteredStudents.filter(
                  (student) => student.onboardingCompleted
                ).length
              }
            </p>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Onboarding completed
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Classes Represented
            </p>

            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              {representedClasses}
            </p>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {selectedClassId === "all"
                ? "Learning programs"
                : "Selected class"}
            </p>
          </div>
        </div>

        {/* Student directory */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {/* Header + Filter */}
          <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-1">
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  All Students
                </h2>

                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Student information is taken directly from the Learning
                  profile and Clerk account.
                </p>
              </div>

              {/* Class Filter */}
              <form
                method="GET"
                className="flex flex-col gap-2 sm:flex-row sm:items-center"
              >
                <label
                  htmlFor="student-class-filter"
                  className="text-sm font-medium text-slate-600 dark:text-slate-300"
                >
                  Filter by class
                </label>

                <select
                  id="student-class-filter"
                  name="class"
                  defaultValue={selectedClassId}
                  className="min-w-[190px] rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                >
                  <option value="all">All Classes</option>

                  {classOptions.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.name}
                    </option>
                  ))}
                </select>

                <button
                  type="submit"
                  className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                >
                  Apply
                </button>

                {selectedClassId !== "all" ? (
                  <a
                    href="/admin/students"
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-center text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Clear
                  </a>
                ) : null}
              </form>
            </div>

            {/* Active filter indicator */}
            {selectedClassId !== "all" ? (
              <div className="mt-4 flex items-center gap-2">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  Showing
                </span>

                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                  {classOptions.find(
                    (program) => program.id === selectedClassId
                  )?.name ?? "Selected Class"}
                </span>

                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {filteredStudents.length}{" "}
                  {filteredStudents.length === 1
                    ? "student"
                    : "students"}
                </span>
              </div>
            ) : null}
          </div>

          {/* Empty state */}
          {filteredStudents.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                <svg
                  className="h-6 w-6 text-slate-400 dark:text-slate-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 19a3 3 0 0 0-6 0m9-3a3 3 0 0 0-3-3h-6a3 3 0 0 0-3 3m9-8a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM3 11a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z"
                  />
                </svg>
              </div>

              <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">
                {selectedClassId === "all"
                  ? "No students yet"
                  : "No students in this class"}
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
                {selectedClassId === "all"
                  ? "Students who complete the Learning Module onboarding form will automatically appear here."
                  : "There are currently no onboarded students assigned to this class."}
              </p>
            </div>
          ) : (
            /* Student table */
            <div className="overflow-x-auto">
              <table className="min-w-[1100px] w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-950/60">
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Student
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Email
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Class
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Board
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      School
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Language
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Status
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Joined
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Updated
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredStudents.map((student) => (
                    <tr
                      key={student.id}
                      className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                    >
                      {/* Student */}
                      <td className="px-5 py-4 align-top">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                            {student.fullName
                              .trim()
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {student.fullName}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                              Student
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-5 py-4 align-top">
                        {student.email ? (
                          <span className="break-all text-sm text-slate-700 dark:text-slate-300">
                            {student.email}
                          </span>
                        ) : (
                          <span className="text-sm italic text-slate-400 dark:text-slate-500">
                            Email unavailable
                          </span>
                        )}
                      </td>

                      {/* Class */}
                      <td className="px-5 py-4 align-top">
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex w-fit rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                            {student.programName}
                          </span>

                          {student.programSlug ? (
                            <span className="text-xs text-slate-400 dark:text-slate-500">
                              {student.programSlug}
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Board */}
                      <td className="px-5 py-4 align-top">
                        <span className="text-sm text-slate-700 dark:text-slate-300">
                          {getBoardLabel(student.board)}
                        </span>
                      </td>

                      {/* School */}
                      <td className="max-w-[220px] px-5 py-4 align-top">
                        {student.schoolName ? (
                          <span className="text-sm text-slate-700 dark:text-slate-300">
                            {student.schoolName}
                          </span>
                        ) : (
                          <span className="text-sm italic text-slate-400 dark:text-slate-500">
                            Not provided
                          </span>
                        )}
                      </td>

                      {/* Language */}
                      <td className="px-5 py-4 align-top">
                        <span className="text-sm text-slate-700 dark:text-slate-300">
                          {getLanguageLabel(
                            student.preferredLanguage
                          )}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 align-top">
                        {student.onboardingCompleted ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                            <span
                              className="h-1.5 w-1.5 rounded-full bg-emerald-500"
                              aria-hidden="true"
                            />
                            Onboarded
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                            <span
                              className="h-1.5 w-1.5 rounded-full bg-amber-500"
                              aria-hidden="true"
                            />
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Joined */}
                      <td className="whitespace-nowrap px-5 py-4 align-top">
                        <span className="text-sm text-slate-700 dark:text-slate-300">
                          {formatDate(student.createdAt)}
                        </span>
                      </td>

                      {/* Updated */}
                      <td className="whitespace-nowrap px-5 py-4 align-top">
                        <span className="text-sm text-slate-700 dark:text-slate-300">
                          {formatDate(student.updatedAt)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminPage>
  );
}