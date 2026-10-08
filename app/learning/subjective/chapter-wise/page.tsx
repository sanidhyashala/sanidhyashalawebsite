import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { getStudentProfile } from "@/lib/learning/student-profile";
import {
  getLearningCurriculum,
  getLearningSubjects,
} from "@/lib/learning/curriculum";

/* =========================================================
 * Subjective Resource Type
 * ========================================================= */
type SubjectiveResource = {
  id: string;
  title: string;
  slug: string;
  resource_type: string;
  access_type: string;
  status: string;
  display_order: number | null;
  content_source: string | null;
};

/* =========================================================
 * Resource Mapping
 * ========================================================= */
type ChapterResourceMapping = {
  resource_id: string;
  resources?: SubjectiveResource[] | null;
};

/* =========================================================
 * Learning Node Type
 * ========================================================= */
type LearningNode = {
  id: string;
  display_name: string;
  description: string | null;
  sequence_order: number;
  canonical_node_id: string | null;
  parent_node_id: string | null;
  resource_curriculum_nodes?: ChapterResourceMapping[] | null;
};

/* =========================================================
 * Chapter View
 * ========================================================= */
type ChapterView = {
  chapter: LearningNode;
  subjectiveResources: SubjectiveResource[];
};

/* =========================================================
 * Branch View
 * ========================================================= */
type BranchView = {
  branch: LearningNode;
  chapters: ChapterView[];
};

/* =========================================================
 * Subject View
 * ========================================================= */
type SubjectView = {
  subject: LearningNode;
  chapters: ChapterView[];
  branches: BranchView[];
};

/* =========================================================
 * Helpers
 * ========================================================= */
function getSubjectiveResources(node: LearningNode): SubjectiveResource[] {
  const mappings = node.resource_curriculum_nodes ?? [];

  return mappings
    .flatMap((mapping) => mapping.resources ?? [])
    .filter(
      (resource) =>
        resource.resource_type === "SUBJECTIVE" &&
        resource.status === "PUBLISHED"
    )
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
}

/* =========================================================
 * Page
 * ========================================================= */
type SubjectiveChapterWisePageProps = {
  searchParams?: Promise<{
    subject?: string | string[];
  }>;
};

export default async function SubjectiveChapterWisePage({
  searchParams,
}: SubjectiveChapterWisePageProps) {
  /* =====================================================
   * Authentication Gate
   * ===================================================== */
  const { isAuthenticated } = await auth();

  if (!isAuthenticated) {
    return (
      <main className="px-6 py-20">
        <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center">
          <section className="w-full rounded-3xl border border-slate-200 bg-white px-8 py-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none sm:px-12">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-700 dark:text-blue-400">
              Subjective Practice
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-blue-900 dark:text-blue-400 sm:text-4xl">
              Please Sign In to Continue
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300">
              Sign in to access your chapter-wise subjective practice.
            </p>
            <div className="mt-8">
              <Link
                href="/sign-in?redirect_url=/learning/subjective/chapter-wise"
                className="inline-flex items-center justify-center rounded-xl bg-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-800 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-600 dark:hover:bg-blue-500 dark:focus:ring-offset-slate-900"
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
   * Student Profile
   * ===================================================== */
  const profile = await getStudentProfile();

  if (!profile.exists) {
    redirect("/learning/onboarding");
  }

  if (!profile.program_id) {
    return (
      <main className="px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <section className="rounded-3xl border border-amber-200 bg-amber-50 p-8 dark:border-amber-900 dark:bg-amber-950/30">
            <p className="text-sm font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-400">
              Subjective Practice
            </p>
            <h1 className="mt-2 text-2xl font-bold text-amber-900 dark:text-amber-300">
              Learning program not assigned
            </h1>
            <p className="mt-3 leading-7 text-amber-800 dark:text-amber-200">
              Your student profile is complete, but no learning class has been assigned to it yet.
            </p>
            <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
              Please contact the administrator to update your learning profile.
            </p>
          </section>
        </div>
      </main>
    );
  }

  /* =====================================================
   * Resolve Student's Class
   * ===================================================== */
  const classSlug = profile.program_slug ?? getClassSlug(profile.program_name ?? null);

  if (!classSlug) {
    return (
      <main className="px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <section className="rounded-3xl border border-red-200 bg-red-50 p-8 dark:border-red-900 dark:bg-red-950/30">
            <p className="text-sm font-semibold uppercase tracking-widest text-red-700 dark:text-red-400">
              Subjective Practice
            </p>
            <h1 className="mt-2 text-2xl font-bold text-red-900 dark:text-red-300">
              Unable to determine your class
            </h1>
            <p className="mt-3 leading-7 text-red-800 dark:text-red-200">
              We could not determine the learning class associated with your student profile.
            </p>
          </section>
        </div>
      </main>
    );
  }

  /* =====================================================
   * Load Selected Subject Curriculum
   * ===================================================== */
  const searchParamsValue = searchParams ? await searchParams : {};
  const requestedSubjectValue = searchParamsValue.subject;
  const requestedSubject = Array.isArray(requestedSubjectValue)
    ? requestedSubjectValue[0] ?? null
    : requestedSubjectValue ?? null;
  const normalizedSubject = requestedSubject?.trim().toLowerCase() || "mathematics";
  
  const allowedSubjects = new Set(["mathematics", "physics", "chemistry", "biology"]);
  const selectedSubject = allowedSubjects.has(normalizedSubject) ? normalizedSubject : "mathematics";

  const { subjects } = await getLearningSubjects(classSlug);
  const learningSubjects = subjects as LearningNode[];

  const findSubject = (name: string) =>
    learningSubjects.find((subject) => subject.display_name.trim().toLowerCase() === name.toLowerCase()) ?? null;

  const mathematicsSubject = findSubject("Mathematics");
  const scienceSubject = findSubject("Science");

  let subjectViews: SubjectView[] = [];

  if (selectedSubject === "mathematics") {
    if (!mathematicsSubject) {
      throw new Error("Mathematics subject not found for this class.");
    }

    const chapters = (await getLearningCurriculum(classSlug, {
      parentNodeId: mathematicsSubject.id,
      includeLockedNotes: false,
    })) as LearningNode[];

    const chapterViews: ChapterView[] = chapters
      .map((chapter) => ({
        chapter,
        subjectiveResources: getSubjectiveResources(chapter),
      }))
      .sort((a, b) => a.chapter.sequence_order - b.chapter.sequence_order);

    subjectViews = [
      {
        subject: mathematicsSubject,
        chapters: chapterViews,
        branches: [],
      },
    ];
  }

  if (selectedSubject === "physics" || selectedSubject === "chemistry" || selectedSubject === "biology") {
    if (!scienceSubject) {
      throw new Error("Science subject not found for this class.");
    }

    const scienceBranches = (await getLearningCurriculum(classSlug, {
      parentNodeId: scienceSubject.id,
      includeLockedNotes: false,
    })) as LearningNode[];

    const selectedBranch = scienceBranches.find(
      (branch) => branch.display_name.trim().toLowerCase() === selectedSubject
    ) ?? null;

    if (!selectedBranch) {
      throw new Error(`Science branch "${selectedSubject}" not found for this class.`);
    }

    const chapters = (await getLearningCurriculum(classSlug, {
      parentNodeId: selectedBranch.id,
      includeLockedNotes: false,
    })) as LearningNode[];

    const chapterViews: ChapterView[] = chapters
      .map((chapter) => ({
        chapter,
        subjectiveResources: getSubjectiveResources(chapter),
      }))
      .sort((a, b) => a.chapter.sequence_order - b.chapter.sequence_order);

    subjectViews = [
      {
        subject: scienceSubject,
        chapters: [],
        branches: [
          {
            branch: selectedBranch,
            chapters: chapterViews,
          },
        ],
      },
    ];
  }

  /* =====================================================
   * Page Render
   * ===================================================== */
  return (
    <main className="px-6 py-12 sm:py-16">
      <div className="mx-auto max-w-6xl space-y-10">

        {/* =================================================
         * Back Navigation
         * ================================================= */}
        <div>
          <Link
            href={`/learning/subjective?subject=${encodeURIComponent(selectedSubject)}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 transition hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
          >
            <span>←</span> Back to Subjective
          </Link>
        </div>

        {/* =================================================
         * Header Section
         * ================================================= */}
        <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white px-7 py-10 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:shadow-none sm:px-10 sm:py-12">
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-blue-50 blur-3xl dark:bg-blue-950/30" />
          <div className="relative">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                {formatClassName(classSlug)}
              </span>
              {profile.board && (
                <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {profile.board}
                </span>
              )}
            </div>
            <p className="mt-7 text-sm font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-400">
              Chapter-wise Practice
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-blue-900 dark:text-blue-400 sm:text-5xl">
              Choose a chapter.
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              Strengthen your understanding chapter by chapter through written questions, reasoning, application, and thoughtful problem solving.
            </p>
          </div>
        </section>

        {/* =================================================
         * Subject / Branch / Chapter List
         * ================================================= */}
        <section>
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-400">
              Explore your curriculum
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100 sm:text-3xl">
              Practice by subject and chapter
            </h2>
            <p className="mt-2 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-400">
              Choose a subject, then move through its chapters and available written practice.
            </p>
          </div>

          {subjectViews.length === 0 ? (
            <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl dark:bg-blue-500/10">
                ✎
              </div>
              <h3 className="mt-5 text-xl font-bold text-slate-900 dark:text-slate-100">
                No subjects available
              </h3>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500 dark:text-slate-400">
                No active subjects are currently available for your learning program.
              </p>
            </section>
          ) : (
            <div className="space-y-10">
              {subjectViews.map(({ subject, chapters, branches }) => {
                const isScience = subject.display_name.trim().toLowerCase() === "science";
                return (
                  <section key={subject.id} className="w-full">
                    {/* Subject Header */}
                    <div className="mb-7">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                          Subject
                        </span>
                        <span className="text-sm font-medium text-slate-400">
                          {isScience ? "Branches" : "Chapters"}
                        </span>
                      </div>
                      <h3 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        {subject.display_name}
                      </h3>
                      {subject.description && (
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                          {subject.description}
                        </p>
                      )}
                    </div>

                    {/* Mathematics / Direct Subject Chapters */}
                    {!isScience && (
                      chapters.length === 0 ? (
                        <EmptyChapters subjectName={subject.display_name} />
                      ) : (
                        <ChapterList chapters={chapters} />
                      )
                    )}

                    {/* Science Branches */}
                    {isScience && (
                      branches.length === 0 ? (
                        <EmptyBranches />
                      ) : (
                        <div className="space-y-8">
                          {branches.map(({ branch, chapters: branchChapters }) => (
                            <section
                              key={branch.id}
                              className="rounded-3xl border border-slate-100 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-950/40 sm:p-6"
                            >
                              {/* Branch Header */}
                              <div className="mb-5">
                                <div className="flex flex-wrap items-center gap-3">
                                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                                    {branch.display_name.charAt(0).toUpperCase()}
                                  </span>
                                  <div>
                                    <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                                      Science
                                    </p>
                                    <h4 className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
                                      {branch.display_name}
                                    </h4>
                                  </div>
                                </div>
                                {branch.description && (
                                  <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                                    {branch.description}
                                  </p>
                                )}
                              </div>
                              {/* Branch Chapters */}
                              {branchChapters.length === 0 ? (
                                <EmptyChapters subjectName={branch.display_name} />
                              ) : (
                                <ChapterList chapters={branchChapters} />
                              )}
                            </section>
                          ))}
                        </div>
                      ) // YAHAN PAR WO EXTRA BRACKET THA JISKO HATA DIYA GAYA HAI
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </section>

        {/* =================================================
         * Learning Philosophy
         * ================================================= */}
        <section className="rounded-3xl border border-blue-100 bg-blue-50/70 p-8 dark:border-blue-900 dark:bg-blue-950/20 sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-400">
            A different kind of practice
          </p>
          <h2 className="mt-3 text-2xl font-bold text-blue-900 dark:text-blue-300">
            Do not just find the answer. Build it.
          </h2>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-300">
            Subjective practice gives you space to explain, justify, connect ideas, and learn from the way you solve — not merely from whether your final answer is right.
          </p>
        </section>

      </div>
    </main>
  );
}

/* =========================================================
 * Chapter List
 * ========================================================= */
function ChapterList({ chapters }: { chapters: ChapterView[] }) {
  return (
    <div className="space-y-5">
      {chapters.map(({ chapter, subjectiveResources }) => {
        const primaryResource = subjectiveResources[0] ?? null;
        const isAvailable = Boolean(primaryResource);

        return (
          <article
            key={chapter.id}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:border-blue-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:shadow-none dark:hover:border-blue-800 sm:p-7"
          >
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              {/* Chapter Information */}
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-sm font-bold text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                  {String(chapter.sequence_order).padStart(2, "0")}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                    Chapter {chapter.sequence_order}
                  </p>
                  <h3 className="mt-1 text-xl font-bold leading-7 text-slate-900 dark:text-slate-100 sm:text-2xl">
                    {chapter.display_name}
                  </h3>
                  {chapter.description && (
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                      {chapter.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Practice Availability Button */}
              <div className="shrink-0">
                {isAvailable ? (
                  <Link
                    href={`/learning/subjective/chapter-wise/${primaryResource.id}`}
                    className="inline-flex items-center justify-center rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 hover:shadow-md dark:bg-blue-600 dark:hover:bg-blue-500"
                  >
                    Explore Practice <span className="ml-2">→</span>
                  </Link>
                ) : (
                  <div className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                    Coming Soon
                  </div>
                )}
              </div>
            </div>

            {/* Availability Detail */}
            <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-5 dark:border-slate-800">
              {isAvailable ? (
                <>
                  <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                    Practice Available
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    Written Questions
                  </span>
                </>
              ) : (
                <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                  Practice will appear when published
                </span>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}

/* =========================================================
 * Empty Chapters
 * ========================================================= */
function EmptyChapters({ subjectName }: { subjectName: string }) {
  return (
    <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl dark:bg-blue-500/10">
        ✎
      </div>
      <h4 className="mt-5 text-xl font-bold text-slate-900 dark:text-slate-100">
        No chapters available
      </h4>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500 dark:text-slate-400">
        No active {subjectName} chapters are currently available for your learning program.
      </p>
    </section>
  );
}

/* =========================================================
 * Empty Science Branches
 * ========================================================= */
function EmptyBranches() {
  return (
    <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl dark:bg-blue-500/10">
        ⚗
      </div>
      <h4 className="mt-5 text-xl font-bold text-slate-900 dark:text-slate-100">
        No science branches available
      </h4>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500 dark:text-slate-400">
        No active Science branches are currently available for your learning program.
      </p>
    </section>
  );
}

/* =========================================================
 * Class Name Helper
 * ========================================================= */
function getClassSlug(className: string | null): string | null {
  if (!className) {
    return null;
  }

  const match = className.match(/Class\s+(IX|X|XI|XII)/i);

  if (!match) {
    return null;
  }

  const value = match[1].toUpperCase();

  const map: Record<string, string> = {
    IX: "class-9",
    X: "class-10",
    XI: "class-11",
    XII: "class-12",
  };

  return map[value] ?? null;
}

/* =========================================================
 * Display Class Name
 * ========================================================= */
function formatClassName(classSlug: string): string {
  const map: Record<string, string> = {
    "class-9": "Class IX",
    "class-10": "Class X",
    "class-11": "Class XI",
    "class-12": "Class XII",
  };

  return map[classSlug] ?? classSlug;
}