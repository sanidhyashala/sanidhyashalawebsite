import Link from "next/link";
import Script from "next/script";
import AdminPage from "../components/layout/AdminPage";
import { getAdminMcqs } from "@/app/lib/admin/mcq-bank/mcq-bank.service";
import { getAdminMcqCurriculumClasses } from "@/app/lib/admin/mcq-bank/mcq-bank-curriculum.service";
import { getAdminMcqSets } from "@/app/lib/admin/mcq-bank/mcq-set.service";
import MathTextPreview from "./components/MathTextPreview";

/* =========================================================
 * Helpers
 * ========================================================= */
function compareText(a: string | null, b: string | null) {
  return (a ?? "").localeCompare(b ?? "", undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

/* =========================================================
 * Page
 * ========================================================= */
export default async function AdminMcqBankPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [mcqs, mcqSets, curriculumClasses] = await Promise.all([
    getAdminMcqs(),
    getAdminMcqSets(),
    getAdminMcqCurriculumClasses(),
  ]);

  const resolvedSearchParams = (await searchParams) ?? {};

  const getParam = (key: string) => {
    const value = resolvedSearchParams[key];
    return Array.isArray(value) ? value[0] ?? "" : value ?? "";
  };

  const selectedClass = getParam("class");
  const selectedSubject = getParam("subject");
  const selectedBranch = getParam("branch");
  const selectedAccess = getParam("access");
  const selectedStatus = getParam("status");

  /* =======================================================
   * Sort MCQ Sets
   * ======================================================= */
  const sortedMcqSets = [...mcqSets].sort((a, b) => {
    const classComparison = compareText(a.class_name, b.class_name);
    if (classComparison !== 0) {
      return classComparison;
    }
    const chapterComparison = compareText(a.chapter_name, b.chapter_name);
    if (chapterComparison !== 0) {
      return chapterComparison;
    }
    return a.set_number - b.set_number;
  });

  /* =======================================================
   * MCQ Set Filters
   * ======================================================= */
  const uniqueSorted = (values: Array<string | null | undefined>) =>
    [
      ...new Set(
        values
          .filter((value): value is string => Boolean(value?.trim()))
          .map((value) => value.trim())
      ),
    ].sort((a, b) => compareText(a, b));

  const classOptions = uniqueSorted(mcqSets.map((set) => set.class_name));
  const subjectOptions = uniqueSorted(
    mcqSets
      .filter((set) => !selectedClass || set.class_name === selectedClass)
      .map((set) => set.subject_name)
  );

  const branchOptions = uniqueSorted(
    mcqSets
      .filter((set) => !selectedClass || set.class_name === selectedClass)
      .filter((set) => !selectedSubject || set.subject_name === selectedSubject)
      .map((set) => set.branch_name)
  );

  const accessOptions = uniqueSorted(mcqSets.map((set) => set.access_type));
  const statusOptions = uniqueSorted(mcqSets.map((set) => set.resource_status));

  const filteredMcqSets = sortedMcqSets.filter(
    (mcqSet) =>
      (!selectedClass || mcqSet.class_name === selectedClass) &&
      (!selectedSubject || mcqSet.subject_name === selectedSubject) &&
      (!selectedBranch || mcqSet.branch_name === selectedBranch) &&
      (!selectedAccess || mcqSet.access_type === selectedAccess) &&
      (!selectedStatus || mcqSet.resource_status === selectedStatus)
  );

  const hasActiveSetFilters = Boolean(
    selectedClass ||
      selectedSubject ||
      selectedBranch ||
      selectedAccess ||
      selectedStatus
  );

  /* =======================================================
   * Build chapter → subject/branch context
   *
   * This lookup mirrors the real curriculum hierarchy without
   * changing the MCQ data model or question workflow.
   * ======================================================= */
  const curriculumContextByChapterId = new Map<
    string,
    {
      subjectName: string;
      branchName: string | null;
    }
  >();

  for (const curriculumClass of curriculumClasses) {
    for (const subject of curriculumClass.subjects ?? []) {
      for (const chapter of subject.chapters ?? []) {
        curriculumContextByChapterId.set(chapter.id, {
          subjectName: subject.display_name,
          branchName: null,
        });
      }
      for (const branch of subject.branches ?? []) {
        for (const chapter of branch.chapters ?? []) {
          curriculumContextByChapterId.set(chapter.id, {
            subjectName: subject.display_name,
            branchName: branch.display_name,
          });
        }
      }
    }
  }

  /* =======================================================
   * Group Individual MCQs
   *
   * Class → Subject → Branch (when applicable) → Chapter → MCQs
   * ======================================================= */
  type ChapterGroup = {
    chapterName: string;
    chapterSequenceOrder: number;
    mcqs: typeof mcqs;
  };

  type BranchGroup = {
    branchName: string;
    chapters: Map<string, ChapterGroup>;
  };

  type SubjectGroup = {
    subjectName: string;
    chapters: Map<string, ChapterGroup>;
    branches: Map<string, BranchGroup>;
  };

  type ClassGroup = {
    className: string;
    subjects: Map<string, SubjectGroup>;
  };

  const groupedMcqs = new Map<string, ClassGroup>();

  for (const mcq of mcqs) {
    const className = mcq.class_name ?? "Unmapped Class";
    const classKey = mcq.class_slug ?? className;
    const chapterName = mcq.chapter_name ?? "Unmapped Chapter";
    const chapterKey = mcq.curriculum_node_id ?? chapterName;

    const curriculumContext = mcq.curriculum_node_id
      ? curriculumContextByChapterId.get(mcq.curriculum_node_id)
      : undefined;

    const subjectName = curriculumContext?.subjectName ?? "Unmapped Subject";
    const branchName = curriculumContext?.branchName ?? null;

    let classGroup = groupedMcqs.get(classKey);

    if (!classGroup) {
      classGroup = {
        className,
        subjects: new Map(),
      };
      groupedMcqs.set(classKey, classGroup);
    }

    const subjectKey = subjectName.toLowerCase();
    let subjectGroup = classGroup.subjects.get(subjectKey);

    if (!subjectGroup) {
      subjectGroup = {
        subjectName,
        chapters: new Map(),
        branches: new Map(),
      };
      classGroup.subjects.set(subjectKey, subjectGroup);
    }

    const chapterGroupData: ChapterGroup = {
      chapterName,
      chapterSequenceOrder: mcq.chapter_sequence_order ?? Number.MAX_SAFE_INTEGER,
      mcqs: [],
    };

    if (branchName) {
      const branchKey = branchName.toLowerCase();
      let branchGroup = subjectGroup.branches.get(branchKey);

      if (!branchGroup) {
        branchGroup = {
          branchName,
          chapters: new Map(),
        };
        subjectGroup.branches.set(branchKey, branchGroup);
      }

      let chapterGroup = branchGroup.chapters.get(chapterKey);

      if (!chapterGroup) {
        branchGroup.chapters.set(chapterKey, chapterGroupData);
        chapterGroup = chapterGroupData;
      }

      chapterGroup.mcqs.push(mcq);
    } else {
      let chapterGroup = subjectGroup.chapters.get(chapterKey);

      if (!chapterGroup) {
        subjectGroup.chapters.set(chapterKey, chapterGroupData);
        chapterGroup = chapterGroupData;
      }

      chapterGroup.mcqs.push(mcq);
    }
  }

  /* =======================================================
   * Sort MCQs by stable admin question number
   * ======================================================= */
  const sortChapterGroups = (chapterGroups: Map<string, ChapterGroup>) => {
    for (const chapterGroup of chapterGroups.values()) {
      chapterGroup.mcqs.sort(
        (a, b) => a.admin_question_number - b.admin_question_number,
      );
    }
  };

  for (const classGroup of groupedMcqs.values()) {
    for (const subjectGroup of classGroup.subjects.values()) {
      sortChapterGroups(subjectGroup.chapters);

      for (const branchGroup of subjectGroup.branches.values()) {
        sortChapterGroups(branchGroup.chapters);
      }
    }
  }

  /* =======================================================
   * Stable hierarchy ordering
   * ======================================================= */
  const sortChapters = (chapterGroups: Map<string, ChapterGroup>) =>
    [...chapterGroups.values()].sort((a, b) => {
      if (a.chapterSequenceOrder !== b.chapterSequenceOrder) {
        return a.chapterSequenceOrder - b.chapterSequenceOrder;
      }
      return compareText(a.chapterName, b.chapterName);
    });

  const sortedClassGroups = [...groupedMcqs.values()].sort((a, b) =>
    compareText(a.className, b.className),
  );

  /* =======================================================
   * Render
   * ======================================================= */
  const renderChapter = (chapter: ChapterGroup, persistKey: string) => (
    <details
      key={chapter.chapterName}
      data-mcq-persist={persistKey}
      className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700"
    >
      <summary className="cursor-pointer list-none bg-white px-4 py-3 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {chapter.chapterName}
          </span>
          <span className="text-[11px] font-medium text-slate-500">
            {chapter.mcqs.length} MCQs
          </span>
        </div>
      </summary>

      <div className="divide-y divide-slate-200 border-t border-slate-200 dark:divide-slate-800 dark:border-slate-800">
        {chapter.mcqs.map((mcq) => (
          <div
            key={mcq.id}
            className="flex items-start justify-between gap-4 px-4 py-4 transition hover:bg-slate-50 dark:hover:bg-slate-950"
          >
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-slate-400">
                Question #{mcq.admin_question_number}
              </p>

              <div className="mt-1 text-sm font-medium text-slate-900 dark:text-white">
                <MathTextPreview value={mcq.question_text} />
              </div>

              <div className="mt-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Attached Sets
                </p>

                {mcq.attached_sets.length === 0 ? (
                  <p className="mt-1 text-xs text-slate-400">
                    Not attached to any MCQ Set
                  </p>
                ) : (
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {mcq.attached_sets.map((set) => (
                      <Link
                        key={set.resource_id}
                        href={`/admin/mcq-bank/sets/${set.resource_id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-blue-800 dark:hover:bg-blue-950/40 dark:hover:text-blue-300"
                      >
                        <span>Set {set.set_number ?? "—"}</span>
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                            set.status === "PUBLISHED"
                              ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                              : set.status === "DRAFT"
                                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400"
                                : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {set.status}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Link
              href={`/admin/mcq-bank/${mcq.id}`}
              className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:text-slate-300"
            >
              Open
            </Link>
          </div>
        ))}
      </div>
    </details>
  );

  return (
    <AdminPage
      title="MCQ Bank"
      description="Create, manage and organize MCQ questions and chapter-wise practice sets."
      actions={
        <div className="flex flex-wrap items-center gap-3">
          {/* Bulk Import MCQs */}
          <Link
            href="/admin/mcq-bank/bulk-import"
            className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300 dark:hover:bg-blue-950/50"
          >
            ⇧ Bulk Import
          </Link>
          {/* New MCQ */}
          <Link
            href="/admin/mcq-bank/new"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            + New MCQ
          </Link>
          {/* New MCQ Set */}
          <Link
            href="/admin/mcq-bank/sets/new"
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            + New MCQ Set
          </Link>
        </div>
      }
    >
      <Script id="mcq-bank-details-persistence" strategy="afterInteractive">{`
        (() => {
          const prefix = "sanidhyashala:admin:mcq-bank:details:";
          const nodes = document.querySelectorAll("[data-mcq-persist]");
          nodes.forEach((node) => {
            const key = node.getAttribute("data-mcq-persist");
            if (!key) return;
            const storageKey = prefix + key;
            const savedState = window.localStorage.getItem(storageKey);
            if (savedState === "open") {
              node.open = true;
            } else if (savedState === "closed") {
              node.open = false;
            }
            node.addEventListener("toggle", () => {
              window.localStorage.setItem(
                storageKey,
                node.open ? "open" : "closed",
              );
            });
          });
        })();
      `}</Script>
      <div className="space-y-8">
        {/* =================================================
         * MCQ SETS
         * ================================================= */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          {/* Section Header */}
          <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-800">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Practice Sets
                </p>
                <h2 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                  MCQ Sets
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {hasActiveSetFilters
                    ? `${filteredMcqSets.length} of ${mcqSets.length}`
                    : mcqSets.length}{" "}
                  MCQ {mcqSets.length === 1 ? "set" : "sets"}{" "}
                  {hasActiveSetFilters
                    ? "match the current filters."
                    : "currently exist."}
                </p>
              </div>
              <Link
                href="/admin/mcq-bank/sets/new"
                className="inline-flex items-center justify-center rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
              >
                + Create Set
              </Link>
            </div>
          </div>

          {/* =================================================
           * Set Filters
           * ================================================= */}
          <form
            method="get"
            className="border-b border-slate-200 bg-slate-50/70 px-6 py-5 dark:border-slate-800 dark:bg-slate-950/40"
          >
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  Filter practice sets
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  Narrow the set library by class, subject, branch, access, or publication status.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <label className="space-y-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Class
                  </span>
                  <select
                    name="class"
                    defaultValue={selectedClass}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    <option value="">All Classes</option>
                    {classOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Subject
                  </span>
                  <select
                    name="subject"
                    defaultValue={selectedSubject}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    <option value="">All Subjects</option>
                    {subjectOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Branch
                  </span>
                  <select
                    name="branch"
                    defaultValue={selectedBranch}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    <option value="">All Branches</option>
                    {branchOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Access
                  </span>
                  <select
                    name="access"
                    defaultValue={selectedAccess}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    <option value="">All Access</option>
                    {accessOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Status
                  </span>
                  <select
                    name="status"
                    defaultValue={selectedStatus}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    <option value="">All Status</option>
                    {statusOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                >
                  Apply Filters
                </button>
                {hasActiveSetFilters && (
                  <Link
                    href="/admin/mcq-bank"
                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Clear Filters
                  </Link>
                )}
                {hasActiveSetFilters && (
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Showing {filteredMcqSets.length} of {mcqSets.length} sets
                  </span>
                )}
              </div>
            </div>
          </form>

          {/* =================================================
           * Sets
           * ================================================= */}
          {filteredMcqSets.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                <span className="text-xl font-bold">S</span>
              </div>
              <h3 className="mt-5 text-lg font-bold text-slate-900 dark:text-white">
                {hasActiveSetFilters
                  ? "No MCQ Sets match these filters"
                  : "No MCQ Sets yet"}
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-400">
                {hasActiveSetFilters
                  ? "Try clearing one or more filters to see more practice sets."
                  : "Create your first chapter-wise MCQ practice set. A set can contain 20 questions by default, while the system also supports larger sets."}
              </p>
              <div className="mt-6">
                <Link
                  href="/admin/mcq-bank/sets/new"
                  className="inline-flex items-center rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
                >
                  + Create First Set
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px] text-left">
                <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
                  <tr>
                    <th className="px-5 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Class</th>
                    <th className="px-5 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Chapter</th>
                    <th className="px-5 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">MCQ Set</th>
                    <th className="px-5 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Access</th>
                    <th className="px-5 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Questions</th>
                    <th className="px-5 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Test</th>
                    <th className="px-5 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredMcqSets.map((mcqSet) => {
                    const isRecommendedSize = mcqSet.question_count === 20;
                    const isExtendedSet = mcqSet.question_count > 20;
                    return (
                      <tr
                        key={mcqSet.id}
                        className="transition hover:bg-slate-50 dark:hover:bg-slate-950/50"
                      >
                        <td className="px-5 py-5">
                          {mcqSet.class_name ? (
                            <div className="inline-flex items-center rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                              {mcqSet.class_name}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-5 py-5">
                          <div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                              {mcqSet.chapter_name ?? "—"}
                            </p>
                            {mcqSet.curriculum_version_id && (
                              <p className="mt-1 text-[10px] text-slate-400">
                                Curriculum mapped
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-5">
                          <div className="max-w-xl">
                            <div className="mb-2 inline-flex items-center rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                              Set {mcqSet.set_number}
                            </div>
                            <Link
                              href={`/admin/mcq-bank/sets/${mcqSet.id}`}
                              className="block font-semibold text-slate-900 transition hover:text-blue-700 dark:text-white dark:hover:text-blue-400"
                            >
                              {mcqSet.title}
                            </Link>
                            {mcqSet.description && (
                              <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                                {mcqSet.description}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-5">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              mcqSet.access_type === "PREMIUM"
                                ? "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400"
                                : "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                            }`}
                          >
                            {mcqSet.access_type}
                          </span>
                        </td>
                        <td className="px-5 py-5">
                          <div>
                            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                              {mcqSet.question_count}
                            </span>
                            <span className="ml-1 text-xs text-slate-500">questions</span>
                            {isRecommendedSize && (
                              <p className="mt-1 text-[11px] font-medium text-green-600 dark:text-green-400">
                                Recommended size
                              </p>
                            )}
                            {isExtendedSet && (
                              <p className="mt-1 text-[11px] font-medium text-blue-600 dark:text-blue-400">
                                Extended set
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-5">
                          <div>
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                              {mcqSet.test_title}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {mcqSet.duration_minutes ?? "—"}
                              {mcqSet.duration_minutes !== null && " min"}
                            </p>
                          </div>
                        </td>
                        <td className="px-5 py-5">
                          <div className="flex flex-col items-start gap-2">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                mcqSet.resource_status === "PUBLISHED"
                                  ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                                  : mcqSet.resource_status === "DRAFT"
                                    ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400"
                                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                              }`}
                            >
                              {mcqSet.resource_status}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              Test: {mcqSet.test_status}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* =================================================
         * INDIVIDUAL MCQs
         * ================================================= */}
        <section className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Question Library
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                  MCQ Questions
                </h2>
                <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">
                  {mcqs.length} MCQs organized by class, subject, branch, and chapter.
                </p>
              </div>
              <Link
                href="/admin/mcq-bank/new"
                className="inline-flex shrink-0 items-center justify-center rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
              >
                + New MCQ
              </Link>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-800">Class</span>
              <span>→</span>
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                Subject
              </span>
              <span>→</span>
              <span className="rounded-full bg-purple-50 px-2.5 py-1 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                Branch when applicable
              </span>
              <span>→</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-800">Chapter</span>
            </div>
          </div>

          {sortedClassGroups.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No MCQs available.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedClassGroups.map((classGroup) => {
                const sortedSubjects = [...classGroup.subjects.values()].sort(
                  (a, b) => compareText(a.subjectName, b.subjectName),
                );

                const totalMcqs = sortedSubjects.reduce(
                  (sum, subject) =>
                    sum +
                    [...subject.chapters.values()].reduce(
                      (chapterSum, chapter) => chapterSum + chapter.mcqs.length,
                      0,
                    ) +
                    [...subject.branches.values()].reduce(
                      (branchSum, branch) =>
                        branchSum +
                        [...branch.chapters.values()].reduce(
                          (chapterSum, chapter) => chapterSum + chapter.mcqs.length,
                          0,
                        ),
                      0,
                    ),
                  0,
                );

                return (
                  <details
                    key={classGroup.className}
                    open
                    data-mcq-persist={`class:${classGroup.className}`}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                  >
                    <summary className="cursor-pointer list-none border-b border-slate-200 px-5 py-4 dark:border-slate-800">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-bold text-slate-900 dark:text-white">
                          {classGroup.className}
                        </span>
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                          {totalMcqs} MCQs
                        </span>
                        <span className="text-xs text-slate-400">
                          {sortedSubjects.length}{" "}
                          {sortedSubjects.length === 1 ? "subject" : "subjects"}
                        </span>
                      </div>
                    </summary>

                    <div className="space-y-3 p-4">
                      {sortedSubjects.map((subjectGroup) => {
                        const directChapters = sortChapters(subjectGroup.chapters);

                        const sortedBranches = [...subjectGroup.branches.values()].sort(
                          (a, b) => compareText(a.branchName, b.branchName),
                        );

                        const subjectCount =
                          directChapters.reduce(
                            (sum, chapter) => sum + chapter.mcqs.length,
                            0,
                          ) +
                          sortedBranches.reduce(
                            (sum, branch) =>
                              sum +
                              [...branch.chapters.values()].reduce(
                                (chapterSum, chapter) => chapterSum + chapter.mcqs.length,
                                0,
                              ),
                            0,
                          );

                        return (
                          <details
                            key={subjectGroup.subjectName}
                            data-mcq-persist={`class:${classGroup.className}|subject:${subjectGroup.subjectName}`}
                            className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700"
                          >
                            <summary className="cursor-pointer list-none bg-slate-50 px-4 py-3 dark:bg-slate-950">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-semibold text-slate-900 dark:text-white">
                                  {subjectGroup.subjectName}
                               </span>
                                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                  {subjectCount} MCQs
                                </span>
                                {sortedBranches.length > 0 && (
                                  <span className="text-[11px] text-slate-400">
                                    {sortedBranches.length}{" "}
                                    {sortedBranches.length === 1 ? "branch" : "branches"}
                                  </span>
                                )}
                              </div>
                            </summary>

                            <div className="space-y-3 border-t border-slate-200 p-3 dark:border-slate-700">
                              {directChapters.map((chapter) =>
                                renderChapter(
                                  chapter,
                                  `class:${classGroup.className}|subject:${subjectGroup.subjectName}|chapter:${chapter.chapterName}`,
                                ),
                              )}

                              {sortedBranches.map((branch) => {
                                const branchChapters = sortChapters(branch.chapters);
                                const branchCount = branchChapters.reduce(
                                  (sum, chapter) => sum + chapter.mcqs.length,
                                  0,
                                );

                                return (
                                  <details
                                    key={branch.branchName}
                                    data-mcq-persist={`class:${classGroup.className}|subject:${subjectGroup.subjectName}|branch:${branch.branchName}`}
                                    className="overflow-hidden rounded-lg border border-purple-100 dark:border-purple-900/40"
                                  >
                                    <summary className="cursor-pointer list-none bg-purple-50/60 px-4 py-3 dark:bg-purple-950/20">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                          {branch.branchName}
                                        </span>
                                        <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700 dark:bg-purple-500/10 dark:text-purple-300">
                                          {branchCount} MCQs
                                        </span>
                                        <span className="text-[11px] text-slate-400">
                                          {branchChapters.length}{" "}
                                          {branchChapters.length === 1 ? "chapter" : "chapters"}
                                        </span>
                                      </div>
                                    </summary>

                                    <div className="space-y-2 border-t border-purple-100 p-2.5 dark:border-purple-900/40">
                                      {branchChapters.map((chapter) =>
                                        renderChapter(
                                          chapter,
                                          `class:${classGroup.className}|subject:${subjectGroup.subjectName}|branch:${branch.branchName}|chapter:${chapter.chapterName}`,
                                        ),
                                      )}
                                    </div>
                                  </details>
                                );
                              })}
                            </div>
                          </details>
                        );
                      })}
                    </div>
                  </details>
                );
              })}
            </div>
          )}
        </section>

        {/* =================================================
         * Workflow Notice
         * ================================================= */}
        <section className="rounded-2xl border border-blue-100 bg-blue-50 p-5 dark:border-blue-900/50 dark:bg-blue-950/20">
          <p className="text-sm font-semibold text-blue-900 dark:text-blue-300">
            MCQ Bank Workflow
          </p>
          <p className="mt-2 text-sm leading-6 text-blue-800 dark:text-blue-400">
            Individual MCQs are maintained in the question library and can be
            reused across multiple MCQ Sets. Questions are organized here by
            class and chapter so the library remains manageable as the question
            bank grows.
          </p>
          <p className="mt-2 text-sm leading-6 text-blue-800 dark:text-blue-400">
            Mathematical notation is rendered directly in the question preview,
            so authoring content such as $x^2$, $\frac&#123;a&#125;&#123;b&#125;$
            or $x^2+y^2$ remains readable before the question is added to a
            student-facing MCQ Set.
          </p>
        </section>
      </div>
    </AdminPage>
  );
}