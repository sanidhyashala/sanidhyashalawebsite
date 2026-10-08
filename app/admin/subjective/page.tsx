import Link from "next/link";
import AdminPage from "../components/layout/AdminPage";
import ClassSelector from "./components/ClassSelector";
import { getAdminLearningCurriculum } from "@/app/lib/admin/learning/learning-curriculum.service";
import { getAdminLearningResources } from "@/app/lib/admin/learning/learning-resources.service";

const CLASS_ORDER = ["class-9", "class-10", "class-11", "class-12"];

const CLASS_LABELS: Record<string, string> = {
  "class-9": "Class IX",
  "class-10": "Class X",
  "class-11": "Class XI",
  "class-12": "Class XII",
};

type PageProps = {
  searchParams: Promise<{
    class?: string;
    subject?: string;
    branch?: string;
  }>;
};

type CurriculumNode = Awaited<ReturnType<typeof getAdminLearningCurriculum>>[number];

type LearningResource = Awaited<ReturnType<typeof getAdminLearningResources>>[number];

type ChapterView = {
  chapter: CurriculumNode;
  subject: CurriculumNode | null;
  branch: CurriculumNode | null;
  resource: LearningResource | null;
};

type SubjectGroup = {
  subject: CurriculumNode | null;
  chapters: ChapterView[];
};

type BranchGroup = {
  branch: CurriculumNode | null;
  chapters: ChapterView[];
};

export default async function AdminSubjectivePage({ searchParams }: PageProps) {
  const {
    class: selectedClassParam,
    subject: selectedSubjectParam,
    branch: selectedBranchParam,
  } = await searchParams;

  const selectedClass = CLASS_ORDER.includes(selectedClassParam ?? "")
    ? selectedClassParam!
    : "class-9";

  /*
   * =========================================================
   * LOAD CURRICULUM + RESOURCES
   * =========================================================
   * Curriculum is the source of truth for the page structure.
   * Resources only tell us whether a Subjective resource
   * already exists for a particular chapter.
   * =========================================================
   */
  const [curriculum, resources] = await Promise.all([
    getAdminLearningCurriculum(),
    getAdminLearningResources(),
  ]);

  const subjectiveResources = resources.filter(
    (resource) => resource.resource_type === "SUBJECTIVE"
  );

  /*
   * =========================================================
   * SELECTED CLASS CURRICULUM
   * =========================================================
   */
  const classCurriculum = curriculum.filter(
    (node) => node.program.slug === selectedClass
  );

  /*
   * Build a lookup map for every curriculum node.
   * This allows us to resolve subjects and branches directly from parent_node_id.
   */
  const curriculumNodeById = new Map<string, CurriculumNode>(
    classCurriculum.map((node) => [node.id, node])
  );

  /*
   * =========================================================
   * EXISTING SUBJECTIVE RESOURCES
   * =========================================================
   * One Subjective resource belongs to a chapter.
   * =========================================================
   */
  const resourceByChapterId = new Map<string, LearningResource>();

  for (const resource of subjectiveResources) {
    const chapterId = resource.curriculum.node?.id;
    if (!chapterId) continue;

    if (!resourceByChapterId.has(chapterId)) {
      resourceByChapterId.set(chapterId, resource);
    }
  }

  /*
   * =========================================================
   * BUILD CHAPTER VIEWS FROM CURRICULUM
   * =========================================================
   */
  const chapterViews: ChapterView[] = classCurriculum
    .filter((node) => node.node_type === "CHAPTER")
    .map((chapter) => {
      const parent = chapter.parent_node_id
        ? curriculumNodeById.get(chapter.parent_node_id) ?? null
        : null;

      const grandParent = parent?.parent_node_id
        ? curriculumNodeById.get(parent.parent_node_id) ?? null
        : null;

      const subject = grandParent ?? parent;
      const branch = grandParent ? parent : null;

      return {
        chapter,
        subject,
        branch,
        resource: resourceByChapterId.get(chapter.id) ?? null,
      };
    });

  /*
   * =========================================================
   * GROUP BY SUBJECT
   * =========================================================
   */
  const subjectMap = new Map<string, SubjectGroup>();

  for (const chapterView of chapterViews) {
    const subjectId = chapterView.subject?.id ?? "unassigned-subject";
    const existing = subjectMap.get(subjectId);

    if (existing) {
      existing.chapters.push(chapterView);
    } else {
      subjectMap.set(subjectId, {
        subject: chapterView.subject,
        chapters: [chapterView],
      });
    }
  }

  const subjectGroups = Array.from(subjectMap.entries())
    .map(([subjectId, group]) => ({
      subjectId,
      ...group,
    }))
    .sort((a, b) => {
      const sequenceA = a.subject?.sequence_order ?? 999999;
      const sequenceB = b.subject?.sequence_order ?? 999999;

      if (sequenceA !== sequenceB) {
        return sequenceA - sequenceB;
      }
      const nameA = a.subject?.display_name ?? "";
      const nameB = b.subject?.display_name ?? "";
      return nameA.localeCompare(nameB);
    });

  /*
   * =========================================================
   * SUBJECT / SCIENCE BRANCH FILTER
   * =========================================================
   */
  const topLevelSubjects = classCurriculum
    .filter((node) => node.node_type === "SUBJECT" && node.parent_node_id === null)
    .sort((a, b) => (a.sequence_order ?? 999999) - (b.sequence_order ?? 999999));

  const scienceSubject =
    topLevelSubjects.find(
      (subject) => subject.display_name.trim().toLowerCase() === "science"
    ) ?? null;

  const scienceBranches = scienceSubject
    ? classCurriculum
        .filter(
          (node) => node.node_type === "SUBJECT" && node.parent_node_id === scienceSubject.id
        )
        .sort((a, b) => (a.sequence_order ?? 999999) - (b.sequence_order ?? 999999))
    : [];

  const selectedSubjectId = topLevelSubjects.some(
    (subject) => subject.id === selectedSubjectParam
  )
    ? selectedSubjectParam!
    : null;

  const isScienceFilter = selectedSubjectId === scienceSubject?.id;

  const selectedBranchId =
    isScienceFilter && scienceBranches.some((branch) => branch.id === selectedBranchParam)
      ? selectedBranchParam!
      : isScienceFilter
      ? scienceBranches[0]?.id ?? null
      : null;

  let filteredChapterViews = chapterViews;

  if (selectedSubjectId) {
    if (isScienceFilter) {
      filteredChapterViews = selectedBranchId
        ? chapterViews.filter(
            (chapterView) =>
              chapterView.subject?.id === scienceSubject?.id &&
              chapterView.branch?.id === selectedBranchId
          )
        : [];
    } else {
      filteredChapterViews = chapterViews.filter(
        (chapterView) => chapterView.subject?.id === selectedSubjectId
      );
    }
  }

  const visibleSubjectMap = new Map<string, SubjectGroup>();

  for (const chapterView of filteredChapterViews) {
    const subjectId = chapterView.subject?.id ?? "unassigned-subject";
    const existing = visibleSubjectMap.get(subjectId);

    if (existing) {
      existing.chapters.push(chapterView);
    } else {
      visibleSubjectMap.set(subjectId, {
        subject: chapterView.subject,
        chapters: [chapterView],
      });
    }
  }

  const visibleSubjectGroups = Array.from(visibleSubjectMap.entries())
    .map(([subjectId, group]) => ({
      subjectId,
      ...group,
    }))
    .sort((a, b) => {
      const sequenceA = a.subject?.sequence_order ?? 999999;
      const sequenceB = b.subject?.sequence_order ?? 999999;

      if (sequenceA !== sequenceB) {
        return sequenceA - sequenceB;
      }
      return (a.subject?.display_name ?? "").localeCompare(b.subject?.display_name ?? "");
    });

  const visibleTotalChapters = filteredChapterViews.length;
  const visibleCreatedResourceCount = filteredChapterViews.filter(
    (chapter) => chapter.resource !== null
  ).length;
  const visiblePendingResourceCount = visibleTotalChapters - visibleCreatedResourceCount;

  /*
   * =========================================================
   * SESSION
   * =========================================================
   */
  const session = classCurriculum[0]?.curriculum_version?.session ?? "2026-27";

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */
  return (
    <AdminPage
      title="Subjective Engine"
      description="Create, organize and manage Subjective practice sets across all classes."
      sectionTitle="Subjective Resources"
      sectionDescription="Manage Subjective resources class-wise and chapter-wise."
    >
      {/* SUBJECTIVE ENGINE NAVIGATION */}
      <div className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <ClassSelector selectedClass={selectedClass} />

          {/* SUBJECT FILTER */}
          <form method="get" action="/admin/subjective" className="w-full sm:flex-1">
            <input type="hidden" name="class" value={selectedClass} />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="w-full sm:min-w-56 sm:flex-1">
                <label
                  htmlFor="subject-filter"
                  className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400"
                >
                  Select Subject
                </label>
                <select
                  id="subject-filter"
                  name="subject"
                  defaultValue={selectedSubjectId ?? ""}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-blue-500 dark:focus:ring-blue-950"
                >
                  <option value="">All Subjects</option>
                  {topLevelSubjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.display_name}
                    </option>
                  ))}
                </select>
              </div>

              {isScienceFilter && (
                <div className="w-full sm:min-w-56 sm:flex-1">
                  <label
                    htmlFor="science-branch-filter"
                    className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400"
                  >
                    Select Science Subject
                  </label>
                  <select
                    id="science-branch-filter"
                    name="branch"
                    defaultValue={selectedBranchId ?? ""}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-blue-500 dark:focus:ring-blue-950"
                  >
                    <option value="">Select Physics / Chemistry / Biology</option>
                    {scienceBranches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.display_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={isScienceFilter && !selectedBranchId}
                className="h-11 shrink-0 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
              >
                Apply Filter
              </button>
            </div>
          </form>

          {/* QUESTION BANK */}
          <Link
            href="/admin/subjective/questions"
            className="group inline-flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-700 hover:bg-slate-900 hover:shadow-lg sm:w-auto sm:min-w-48 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 5.25A2.25 2.25 0 0 1 6.75 3h10.5a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 17.25 21H6.75A2.25 2.25 0 0 1 4.5 18.75V5.25Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7.5h8M8 11h8M8 14.5h4" />
                </svg>
              </span>
              <span className="flex flex-col text-left">
                <span className="text-sm font-semibold tracking-wide">Question Bank</span>
                <span className="text-[11px] font-medium text-slate-400">Manage questions</span>
              </span>
            </span>
            <span className="text-lg text-slate-400 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-white">
              →
            </span>
          </Link>
        </div>
      </div>

      {/* SELECTED CLASS */}
      <div className="space-y-8">
        <section
          key={selectedClass}
          className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          {/* CLASS HEADER */}
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-6 dark:border-slate-800 dark:bg-slate-950">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-blue-700 dark:text-blue-400">
                  {session}
                </p>
                <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                  {CLASS_LABELS[selectedClass]}
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {visibleTotalChapters} chapter{visibleTotalChapters === 1 ? "" : "s"} · {visibleCreatedResourceCount} Subjective resource{visibleCreatedResourceCount === 1 ? "" : "s"} created
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                {visiblePendingResourceCount > 0
                  ? `${visiblePendingResourceCount} chapter${visiblePendingResourceCount === 1 ? "" : "s"} pending`
                  : "All chapters ready"}
              </div>
            </div>
          </div>

          {/* CLASS CONTENT */}
          <div className="p-6">
            {visibleSubjectGroups.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center dark:border-slate-700 dark:bg-slate-950">
                <div className="text-3xl">📚</div>
                <h3 className="mt-3 text-lg font-bold text-slate-900 dark:text-white">
                  No Curriculum Chapters Found
                </h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
                  No active published curriculum chapters are available for this class.
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {visibleSubjectGroups.map((subjectGroup, subjectIndex) => {
                  const subjectName = subjectGroup.subject?.display_name ?? "Subject not assigned";
                  const hasBranches = subjectGroup.chapters.some((chapter) => chapter.branch !== null);

                  const branchMap = new Map<string, BranchGroup>();

                  if (hasBranches) {
                    for (const chapter of subjectGroup.chapters) {
                      const branchId = chapter.branch?.id ?? "unassigned-branch";
                      const existing = branchMap.get(branchId);
                      if (existing) {
                        existing.chapters.push(chapter);
                      } else {
                        branchMap.set(branchId, {
                          branch: chapter.branch,
                          chapters: [chapter],
                        });
                      }
                    }
                  }

                  const sortedBranches = Array.from(branchMap.entries())
                    .map(([branchId, branchGroup]) => ({
                      branchId,
                      ...branchGroup,
                    }))
                    .sort((a, b) => {
                      const sequenceA = a.branch?.sequence_order ?? 999999;
                      const sequenceB = b.branch?.sequence_order ?? 999999;
                      if (sequenceA !== sequenceB) return sequenceA - sequenceB;
                      const nameA = a.branch?.display_name ?? "";
                      const nameB = b.branch?.display_name ?? "";
                      return nameA.localeCompare(nameB);
                    });

                  return (
                    <div key={subjectGroup.subjectId} className="space-y-4">
                      {/* SUBJECT HEADING */}
                      <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-950">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white dark:bg-white dark:text-slate-900">
                          {subjectIndex + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            Subject
                          </p>
                          <h3 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                            {subjectName}
                          </h3>
                        </div>
                      </div>

                      {/* DIRECT CHAPTERS */}
                      {!hasBranches && (
                        <div className="space-y-4 pl-0 sm:pl-4">
                          {subjectGroup.chapters.map((chapterView, chapterIndex) => (
                            <ChapterCard key={chapterView.chapter.id} chapterView={chapterView} chapterIndex={chapterIndex} />
                          ))}
                        </div>
                      )}

                      {/* BRANCH HIERARCHY */}
                      {hasBranches && (
                        <div className="space-y-6 pl-0 sm:pl-4">
                          {sortedBranches.map((branchGroup, branchIndex) => (
                            <div key={branchGroup.branchId} className="space-y-4">
                              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                  {branchIndex + 1}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                    Branch
                                  </p>
                                  <h4 className="mt-0.5 text-base font-bold text-slate-900 dark:text-white">
                                    {branchGroup.branch?.display_name ?? "Branch not assigned"}
                                  </h4>
                                </div>
                              </div>
                              <div className="space-y-4 pl-0 sm:pl-4">
                                {branchGroup.chapters.map((chapterView, chapterIndex) => (
                                  <ChapterCard key={chapterView.chapter.id} chapterView={chapterView} chapterIndex={chapterIndex} />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </AdminPage>
  );
}

/* =============================================================
   CHAPTER CARD
   ============================================================= */
function ChapterCard({ chapterView, chapterIndex }: { chapterView: ChapterView; chapterIndex: number; }) {
  const { chapter, resource } = chapterView;
  const createHref = `/admin/subjective/new?curriculumNodeId=${encodeURIComponent(chapter.id)}`;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-200 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white dark:bg-white dark:text-slate-900">
          {chapterIndex + 1}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Chapter {chapter.sequence_order ?? chapterIndex + 1}
          </p>
          <h4 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
            {chapter.display_name}
          </h4>
        </div>
      </div>

      <div className="mt-5">
        {resource ? (
          <div className="flex flex-col gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-950">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">
                  Subjective
                </span>
                <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {resource.status}
                </span>
              </div>
              <h5 className="mt-1 text-base font-bold text-slate-900 dark:text-white">
                {resource.title}
              </h5>
            </div>
            <div className="flex shrink-0 items-center gap-4">
              <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700">
                {resource.access_type}
              </span>
              <Link
                href={`/admin/learning/subjective/${resource.id}`}
                className="text-sm font-semibold text-blue-700 transition-colors hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Manage Sets →
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-slate-950">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  Not Created
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                No Subjective resource exists for this chapter yet.
              </p>
            </div>
            <Link
              href={createHref}
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              + Create Subjective Resource
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}