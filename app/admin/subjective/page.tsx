import Link from "next/link";

import AdminPage from "../components/layout/AdminPage";

import ClassSelector from "./components/ClassSelector";

import { getAdminLearningResources } from "@/app/lib/admin/learning/learning-resources.service";

const CLASS_ORDER = [
  "class-9",
  "class-10",
  "class-11",
  "class-12",
];

const CLASS_LABELS: Record<string, string> = {
  "class-9": "Class IX",
  "class-10": "Class X",
  "class-11": "Class XI",
  "class-12": "Class XII",
};

type PageProps = {
  searchParams: Promise<{
    class?: string;
  }>;
};

export default async function AdminSubjectivePage({
  searchParams,
}: PageProps) {
  const { class: selectedClassParam } =
    await searchParams;

  const selectedClass =
    CLASS_ORDER.includes(
      selectedClassParam ?? ""
    )
      ? selectedClassParam!
      : "class-9";

  const resources =
    await getAdminLearningResources();

  const subjectiveResources =
    resources.filter(
      (resource) =>
        resource.resource_type ===
        "SUBJECTIVE"
    );

  /* -------------------------------------------------------
   * Group Subjective Resources by Class
   * ------------------------------------------------------- */

  const groupedByClass = new Map<
    string,
    typeof subjectiveResources
  >();

  for (const resource of subjectiveResources) {
    const programSlug =
      resource.curriculum.program?.slug;

    if (!programSlug) {
      continue;
    }

    const existing =
      groupedByClass.get(programSlug);

    if (existing) {
      existing.push(resource);
    } else {
      groupedByClass.set(
        programSlug,
        [resource]
      );
    }
  }

  /* -------------------------------------------------------
   * Keep all four class groups available
   * ------------------------------------------------------- */

  const classGroups =
    CLASS_ORDER.map(
      (programSlug) => ({
        programSlug,
        resources:
          groupedByClass.get(
            programSlug
          ) ?? [],
      })
    );

  /* -------------------------------------------------------
   * Only render the selected class
   * ------------------------------------------------------- */

  const activeClassGroup =
    classGroups.find(
      (group) =>
        group.programSlug ===
        selectedClass
    ) ?? classGroups[0];

  const {
    programSlug,
    resources: classResources,
  } = activeClassGroup;

  /* -------------------------------------------------------
   * Group selected class resources by chapter
   * ------------------------------------------------------- */

  const groupedByChapter = new Map<
    string,
    typeof classResources
  >();

  for (const resource of classResources) {
    const chapterId =
      resource.curriculum.node?.id ??
      "unassigned";

    const existing =
      groupedByChapter.get(chapterId);

    if (existing) {
      existing.push(resource);
    } else {
      groupedByChapter.set(
        chapterId,
        [resource]
      );
    }
  }

  /* -------------------------------------------------------
   * Sort chapters by database sequence_order
   * ------------------------------------------------------- */

  const chapterGroups =
    Array.from(
      groupedByChapter.entries()
    ).sort(
      ([, resourcesA], [, resourcesB]) => {
        const sequenceA =
          resourcesA[0]
            ?.curriculum.node
            ?.sequence_order ??
          999999;

        const sequenceB =
          resourcesB[0]
            ?.curriculum.node
            ?.sequence_order ??
          999999;

        if (sequenceA !== sequenceB) {
          return (
            sequenceA - sequenceB
          );
        }

        const nameA =
          resourcesA[0]
            ?.curriculum.node
            ?.display_name ?? "";

        const nameB =
          resourcesB[0]
            ?.curriculum.node
            ?.display_name ?? "";

        return nameA.localeCompare(
          nameB
        );
      }
    );

  const session =
    classResources[0]
      ?.curriculum.version
      ?.session ?? "2026-27";

  return (
    <AdminPage
      title="Subjective Engine"
      description="Create, organize and manage Subjective practice sets across all classes."
      sectionTitle="Subjective Resources"
      sectionDescription="Manage Subjective resources class-wise and chapter-wise."
    >
      {/* =====================================================
          SUBJECTIVE ENGINE NAVIGATION
         ===================================================== */}

      <div className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          {/* -------------------------------------------------
              CLASS SELECTOR
             ------------------------------------------------- */}

          <ClassSelector
            selectedClass={selectedClass}
          />

          {/* -------------------------------------------------
              QUESTION BANK
             ------------------------------------------------- */}

          <Link
            href="/admin/subjective/questions"
            className="
              group
              inline-flex
              w-full
              items-center
              justify-between
              gap-4
              rounded-2xl
              border
              border-slate-800
              bg-slate-950
              px-4
              py-3
              text-white
              shadow-sm
              transition-all
              duration-200
              hover:-translate-y-0.5
              hover:border-slate-700
              hover:bg-slate-900
              hover:shadow-lg
              sm:w-auto
              sm:min-w-48
              dark:border-slate-700
              dark:bg-slate-800
              dark:hover:bg-slate-700
            "
          >
            <span className="flex items-center gap-3">
              {/* Question Bank Icon */}

              <span
                className="
                  flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-white/10
                  bg-white/10
                  text-white
                "
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 5.25A2.25 2.25 0 0 1 6.75 3h10.5a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 17.25 21H6.75A2.25 2.25 0 0 1 4.5 18.75V5.25Z"
                  />

                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 7.5h8M8 11h8M8 14.5h4"
                  />
                </svg>
              </span>

              <span className="flex flex-col text-left">
                <span className="text-sm font-semibold tracking-wide">
                  Question Bank
                </span>

                <span className="text-[11px] font-medium text-slate-400">
                  Manage questions
                </span>
              </span>
            </span>

            {/* Arrow */}

            <span
              className="
                text-lg
                text-slate-400
                transition-transform
                duration-200
                group-hover:translate-x-1
                group-hover:text-white
              "
            >
              →
            </span>
          </Link>
        </div>
      </div>

      {/* =====================================================
          SELECTED CLASS
         ===================================================== */}

      <div className="space-y-8">
        <section
          key={programSlug}
          className="
            overflow-hidden
            rounded-3xl
            border
            border-slate-200
            bg-white
            shadow-sm
            dark:border-slate-800
            dark:bg-slate-900
          "
        >
          {/* =================================================
              CLASS HEADER
             ================================================= */}

          <div
            className="
              border-b
              border-slate-200
              bg-slate-50
              px-6
              py-6
              dark:border-slate-800
              dark:bg-slate-950
            "
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-blue-700 dark:text-blue-400">
                  {session}
                </p>

                <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                  {
                    CLASS_LABELS[
                      programSlug
                    ]
                  }
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {classResources.length}{" "}
                  Subjective resource
                  {classResources.length ===
                  1
                    ? ""
                    : "s"}
                </p>
              </div>

              <Link
                href="/admin/learning/new"
                className="
                  inline-flex
                  w-fit
                  items-center
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  px-4
                  py-2
                  text-sm
                  font-semibold
                  text-slate-700
                  transition
                  hover:border-blue-200
                  hover:text-blue-700
                  dark:border-slate-700
                  dark:bg-slate-900
                  dark:text-slate-300
                  dark:hover:border-slate-600
                  dark:hover:text-blue-400
                "
              >
                + Add Resource
              </Link>
            </div>
          </div>

          {/* =================================================
              CLASS CONTENT
             ================================================= */}

          <div className="p-6">
            {chapterGroups.length ===
            0 ? (
              <div
                className="
                  rounded-2xl
                  border
                  border-dashed
                  border-slate-300
                  bg-slate-50
                  px-6
                  py-10
                  text-center
                  dark:border-slate-700
                  dark:bg-slate-950
                "
              >
                <div className="text-3xl">
                  ✍️
                </div>

                <h3 className="mt-3 text-lg font-bold text-slate-900 dark:text-white">
                  No Subjective Resources Yet
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
                  This class does not have
                  any Subjective resources
                  yet. Create one to start
                  building its practice sets.
                </p>

                <div className="mt-5">
                  <Link
                    href="/admin/learning/new"
                    className="
                      inline-flex
                      items-center
                      rounded-xl
                      bg-slate-900
                      px-4
                      py-2.5
                      text-sm
                      font-semibold
                      text-white
                      transition
                      hover:bg-slate-800
                      dark:bg-white
                      dark:text-slate-900
                      dark:hover:bg-slate-200
                    "
                  >
                    + Create Subjective Resource
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {chapterGroups.map(
                  (
                    [
                      chapterId,
                      chapterResources,
                    ],
                    chapterIndex
                  ) => {
                    const chapter =
                      chapterResources[0]
                        ?.curriculum.node;

                    return (
                      <div
                        key={chapterId}
                        className="
                          rounded-2xl
                          border
                          border-slate-200
                          bg-white
                          p-5
                          transition
                          hover:border-blue-200
                          hover:shadow-sm
                          dark:border-slate-800
                          dark:bg-slate-900
                          dark:hover:border-slate-700
                        "
                      >
                        {/* Chapter heading */}

                        <div className="flex items-start gap-4">
                          <div
                            className="
                              flex
                              h-10
                              w-10
                              shrink-0
                              items-center
                              justify-center
                              rounded-xl
                              bg-slate-900
                              text-sm
                              font-bold
                              text-white
                              dark:bg-white
                              dark:text-slate-900
                            "
                          >
                            {chapterIndex +
                              1}
                          </div>

                          <div className="min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                              Chapter{" "}
                              {chapterIndex +
                                1}
                            </p>

                            <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                              {chapter
                                ?.display_name ??
                                "Chapter not assigned"}
                            </h3>
                          </div>
                        </div>

                        {/* Resources inside chapter */}

                        <div className="mt-5 space-y-3">
                          {chapterResources.map(
                            (resource) => (
                              <div
                                key={resource.id}
                                className="
                                  flex
                                  flex-col
                                  gap-4
                                  rounded-xl
                                  border
                                  border-slate-100
                                  bg-slate-50
                                  p-4
                                  sm:flex-row
                                  sm:items-center
                                  sm:justify-between
                                  dark:border-slate-800
                                  dark:bg-slate-950
                                "
                              >
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">
                                      Subjective
                                    </span>

                                    <span
                                      className="
                                        rounded-full
                                        bg-slate-200
                                        px-2.5
                                        py-1
                                        text-[11px]
                                        font-semibold
                                        text-slate-700
                                        dark:bg-slate-800
                                        dark:text-slate-300
                                      "
                                    >
                                      {
                                        resource.status
                                      }
                                    </span>
                                  </div>

                                  <h4 className="mt-1 text-base font-bold text-slate-900 dark:text-white">
                                    {
                                      resource.title
                                    }
                                  </h4>
                                </div>

                                <div className="flex shrink-0 items-center gap-4">
                                  <span
                                    className="
                                      rounded-full
                                      bg-white
                                      px-3
                                      py-1.5
                                      text-xs
                                      font-semibold
                                      text-slate-700
                                      ring-1
                                      ring-slate-200
                                      dark:bg-slate-900
                                      dark:text-slate-300
                                      dark:ring-slate-700
                                    "
                                  >
                                    {
                                      resource.access_type
                                    }
                                  </span>

                                  <Link
                                    href={`/admin/learning/subjective/${resource.id}`}
                                    className="
                                      text-sm
                                      font-semibold
                                      text-blue-700
                                      transition-colors
                                      hover:text-blue-900
                                      dark:text-blue-400
                                      dark:hover:text-blue-300
                                    "
                                  >
                                    Manage Sets →
                                  </Link>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </AdminPage>
  );
}