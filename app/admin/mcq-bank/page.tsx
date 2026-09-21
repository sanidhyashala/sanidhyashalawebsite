import Link from "next/link";

import AdminPage from "../components/layout/AdminPage";

import {
  getAdminMcqs,
} from "@/app/lib/admin/mcq-bank/mcq-bank.service";

import {
  getAdminMcqSets,
} from "@/app/lib/admin/mcq-bank/mcq-set.service";

import MathTextPreview from "./components/MathTextPreview";

/* =========================================================
 * Helpers
 * ========================================================= */

function compareText(
  a: string | null,
  b: string | null
) {
  return (
    (a ?? "").localeCompare(
      b ?? "",
      undefined,
      {
        numeric: true,
        sensitivity: "base",
      }
    )
  );
}

/* =========================================================
 * Page
 * ========================================================= */

export default async function AdminMcqBankPage() {
  const [
    mcqs,
    mcqSets,
  ] = await Promise.all([
    getAdminMcqs(),
    getAdminMcqSets(),
  ]);

  /* =======================================================
   * Sort MCQ Sets
   * ======================================================= */

  const sortedMcqSets =
    [...mcqSets].sort(
      (a, b) => {
        const classComparison =
          compareText(
            a.class_name,
            b.class_name
          );

        if (
          classComparison !== 0
        ) {
          return classComparison;
        }

        const chapterComparison =
          compareText(
            a.chapter_name,
            b.chapter_name
          );

        if (
          chapterComparison !== 0
        ) {
          return chapterComparison;
        }

        return (
          a.set_number -
          b.set_number
        );
      }
    );

  /* =======================================================
   * Group Individual MCQs
   *
   * Structure:
   *
   * Class
   *   ↓
   * Chapter
   *   ↓
   * MCQs
   * ======================================================= */

  const groupedMcqs =
    new Map<
      string,
      {
        className: string;
        chapters: Map<
          string,
          {
            chapterName: string;
            chapterSequenceOrder: number;
            mcqs: typeof mcqs;
          }
        >;
      }
    >();

  for (
    const mcq of mcqs
  ) {
    const className =
      mcq.class_name ??
      "Unmapped Class";

    const chapterName =
      mcq.chapter_name ??
      "Unmapped Chapter";

    const classKey =
      mcq.class_slug ??
      className;

    const chapterKey =
      mcq.curriculum_node_id ??
      chapterName;

    /* -----------------------------------------------------
     * Create class group
     * ----------------------------------------------------- */

    let classGroup =
      groupedMcqs.get(
        classKey
      );

    if (!classGroup) {
      classGroup = {
        className,
        chapters:
          new Map(),
      };

      groupedMcqs.set(
        classKey,
        classGroup
      );
    }

    /* -----------------------------------------------------
     * Create chapter group
     * ----------------------------------------------------- */

    let chapterGroup =
      classGroup.chapters.get(
        chapterKey
      );

    if (!chapterGroup) {
      chapterGroup = {
        chapterName,

        chapterSequenceOrder:
          mcq.chapter_sequence_order ??
          Number.MAX_SAFE_INTEGER,

        mcqs: [],
      };

      classGroup.chapters.set(
        chapterKey,
        chapterGroup
      );
    }

    chapterGroup.mcqs.push(
      mcq
    );
  }

  /* =======================================================
   * Sort MCQs by stable admin question number
   *
   * Within every chapter:
   *
   * Question #1
   * Question #2
   * Question #3
   * Question #4
   * ...
   * ======================================================= */

  for (
    const classGroup of groupedMcqs.values()
  ) {
    for (
      const chapterGroup of classGroup.chapters.values()
    ) {
      chapterGroup.mcqs.sort(
        (a, b) =>
          a.admin_question_number -
          b.admin_question_number
      );
    }
  }

  /* =======================================================
   * Stable class ordering
   * ======================================================= */

  const sortedClassGroups =
    [...groupedMcqs.values()].sort(
      (a, b) =>
        compareText(
          a.className,
          b.className
        )
    );

  /* =======================================================
   * Render
   * ======================================================= */

  return (
    <AdminPage
      title="MCQ Bank"
      description="Create, manage and organize MCQ questions and chapter-wise practice sets."
      actions={
        <div
          className="
            flex
            flex-wrap
            items-center
            gap-3
          "
        >
          {/* Bulk Import MCQs */}

          <Link
            href="/admin/mcq-bank/bulk-import"
            className="
              rounded-xl
              border
              border-blue-200
              bg-blue-50
              px-4
              py-2
              text-sm
              font-semibold
              text-blue-700
              transition
              hover:bg-blue-100
              dark:border-blue-900
              dark:bg-blue-950/30
              dark:text-blue-300
              dark:hover:bg-blue-950/50
            "
          >
            ⇧ Bulk Import
          </Link>

          {/* New MCQ */}

          <Link
            href="/admin/mcq-bank/new"
            className="
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
              hover:bg-slate-50
              dark:border-slate-700
              dark:bg-slate-900
              dark:text-slate-300
              dark:hover:bg-slate-800
            "
          >
            + New MCQ
          </Link>

          {/* New MCQ Set */}

          <Link
            href="/admin/mcq-bank/sets/new"
            className="
              rounded-xl
              bg-slate-900
              px-4
              py-2
              text-sm
              font-semibold
              text-white
              shadow-sm
              transition
              hover:bg-slate-800
              dark:bg-white
              dark:text-slate-900
              dark:hover:bg-slate-200
            "
          >
            + New MCQ Set
          </Link>
        </div>
      }
    >
      <div
        className="
          space-y-8
        "
      >
        {/* =================================================
         * MCQ SETS
         * ================================================= */}

        <section
          className="
            overflow-hidden
            rounded-2xl
            border
            border-slate-200
            bg-white
            dark:border-slate-800
            dark:bg-slate-900
          "
        >
          {/* Section Header */}

          <div
            className="
              border-b
              border-slate-200
              px-6
              py-5
              dark:border-slate-800
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
                    text-xs
                    font-semibold
                    uppercase
                    tracking-wider
                    text-slate-500
                  "
                >
                  Practice Sets
                </p>

                <h2
                  className="
                    mt-2
                    text-xl
                    font-bold
                    text-slate-900
                    dark:text-white
                  "
                >
                  MCQ Sets
                </h2>

                <p
                  className="
                    mt-1
                    text-sm
                    text-slate-500
                  "
                >
                  {mcqSets.length} MCQ{" "}
                  {mcqSets.length === 1
                    ? "set"
                    : "sets"}{" "}
                  currently exist.
                </p>
              </div>

              <Link
                href="/admin/mcq-bank/sets/new"
                className="
                  inline-flex
                  items-center
                  justify-center
                  rounded-xl
                  bg-blue-700
                  px-4
                  py-2.5
                  text-sm
                  font-semibold
                  text-white
                  shadow-sm
                  transition
                  hover:bg-blue-800
                "
              >
                + Create Set
              </Link>
            </div>
          </div>

          {/* =================================================
           * Sets
           * ================================================= */}

          {sortedMcqSets.length === 0 ? (
            <div
              className="
                px-6
                py-16
                text-center
              "
            >
              <div
                className="
                  mx-auto
                  flex
                  h-14
                  w-14
                  items-center
                  justify-center
                  rounded-2xl
                  bg-blue-50
                  text-blue-700
                  dark:bg-blue-950
                  dark:text-blue-300
                "
              >
                <span className="text-xl font-bold">
                  S
                </span>
              </div>

              <h3
                className="
                  mt-5
                  text-lg
                  font-bold
                  text-slate-900
                  dark:text-white
                "
              >
                No MCQ Sets yet
              </h3>

              <p
                className="
                  mx-auto
                  mt-2
                  max-w-md
                  text-sm
                  leading-6
                  text-slate-600
                  dark:text-slate-400
                "
              >
                Create your first chapter-wise MCQ
                practice set. A set can contain
                20 questions by default, while the
                system also supports larger sets.
              </p>

              <div className="mt-6">
                <Link
                  href="/admin/mcq-bank/sets/new"
                  className="
                    inline-flex
                    items-center
                    rounded-xl
                    bg-blue-700
                    px-5
                    py-3
                    text-sm
                    font-semibold
                    text-white
                    shadow-sm
                    transition
                    hover:bg-blue-800
                  "
                >
                  + Create First Set
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table
                className="
                  w-full
                  min-w-[1200px]
                  text-left
                "
              >
                <thead
                  className="
                    border-b
                    border-slate-200
                    bg-slate-50
                    dark:border-slate-800
                    dark:bg-slate-950
                  "
                >
                  <tr>
                    <th className="px-5 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Class
                    </th>

                    <th className="px-5 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Chapter
                    </th>

                    <th className="px-5 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      MCQ Set
                    </th>

                    <th className="px-5 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Access
                    </th>

                    <th className="px-5 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Questions
                    </th>

                    <th className="px-5 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Test
                    </th>

                    <th className="px-5 py-4 text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody
                  className="
                    divide-y
                    divide-slate-200
                    dark:divide-slate-800
                  "
                >
                  {sortedMcqSets.map(
                    (mcqSet) => {
                      const isRecommendedSize =
                        mcqSet.question_count ===
                        20;

                      const isExtendedSet =
                        mcqSet.question_count >
                        20;

                      return (
                        <tr
                          key={
                            mcqSet.id
                          }
                          className="
                            transition
                            hover:bg-slate-50
                            dark:hover:bg-slate-950/50
                          "
                        >
                          <td className="px-5 py-5">
                            {mcqSet.class_name ? (
                              <div
                                className="
                                  inline-flex
                                  items-center
                                  rounded-lg
                                  bg-slate-100
                                  px-3
                                  py-1.5
                                  text-xs
                                  font-bold
                                  text-slate-700
                                  dark:bg-slate-800
                                  dark:text-slate-200
                                "
                              >
                                {
                                  mcqSet.class_name
                                }
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">
                                —
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-5">
                            <div>
                              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                {
                                  mcqSet.chapter_name ??
                                  "—"
                                }
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
                              <div
                                className="
                                  mb-2
                                  inline-flex
                                  items-center
                                  rounded-lg
                                  bg-blue-50
                                  px-2.5
                                  py-1
                                  text-xs
                                  font-bold
                                  text-blue-700
                                  dark:bg-blue-950/40
                                  dark:text-blue-300
                                "
                              >
                                Set{" "}
                                {
                                  mcqSet.set_number
                                }
                              </div>

                              <Link
                                href={`/admin/mcq-bank/sets/${mcqSet.id}`}
                                className="
                                  block
                                  font-semibold
                                  text-slate-900
                                  transition
                                  hover:text-blue-700
                                  dark:text-white
                                  dark:hover:text-blue-400
                                "
                              >
                                {
                                  mcqSet.title
                                }
                              </Link>

                              {mcqSet.description && (
                                <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                                  {
                                    mcqSet.description
                                  }
                                </p>
                              )}
                            </div>
                          </td>

                          <td className="px-5 py-5">
                            <span
                              className={`
                                rounded-full
                                px-3
                                py-1
                                text-xs
                                font-semibold
                                ${
                                  mcqSet.access_type ===
                                  "PREMIUM"
                                    ? `
                                      bg-purple-100
                                      text-purple-700
                                      dark:bg-purple-500/10
                                      dark:text-purple-400
                                    `
                                    : `
                                      bg-green-100
                                      text-green-700
                                      dark:bg-green-500/10
                                      dark:text-green-400
                                    `
                                }
                              `}
                            >
                              {
                                mcqSet.access_type
                              }
                            </span>
                          </td>

                          <td className="px-5 py-5">
                            <div>
                              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                {
                                  mcqSet.question_count
                                }
                              </span>

                              <span className="ml-1 text-xs text-slate-500">
                                questions
                              </span>

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
                                {
                                  mcqSet.test_title
                                }
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                {
                                  mcqSet.duration_minutes ??
                                  "—"
                                }

                                {
                                  mcqSet.duration_minutes !==
                                    null &&
                                  " min"
                                }
                              </p>
                            </div>
                          </td>

                          <td className="px-5 py-5">
                            <div
                              className="
                                flex
                                flex-col
                                items-start
                                gap-2
                              "
                            >
                              <span
                                className={`
                                  rounded-full
                                  px-3
                                  py-1
                                  text-xs
                                  font-semibold
                                  ${
                                    mcqSet.resource_status ===
                                    "PUBLISHED"
                                      ? `
                                        bg-green-100
                                        text-green-700
                                        dark:bg-green-500/10
                                        dark:text-green-400
                                      `
                                      : mcqSet.resource_status ===
                                        "DRAFT"
                                        ? `
                                          bg-yellow-100
                                          text-yellow-700
                                          dark:bg-yellow-500/10
                                          dark:text-yellow-400
                                        `
                                        : `
                                          bg-slate-100
                                          text-slate-600
                                          dark:bg-slate-800
                                          dark:text-slate-300
                                        `
                                  }
                                `}
                              >
                                {
                                  mcqSet.resource_status
                                }
                              </span>

                              <span className="text-[11px] text-slate-400">
                                Test:{" "}
                                {
                                  mcqSet.test_status
                                }
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* =================================================
         * INDIVIDUAL MCQs
         * ================================================= */}

        <section className="space-y-6">

          <div
            className="
              rounded-2xl
              border
              border-slate-200
              bg-white
              px-6
              py-5
              dark:border-slate-800
              dark:bg-slate-900
            "
          >
            <p
              className="
                text-xs
                font-semibold
                uppercase
                tracking-wider
                text-slate-500
              "
            >
              Question Library
            </p>

            <div className="mt-2 flex items-center justify-between">
              <h2
                className="
                  text-xl
                  font-bold
                  text-slate-900
                  dark:text-white
                "
              >
                MCQ Questions
              </h2>

              <Link
                href="/admin/mcq-bank/new"
                className="
                  rounded-xl
                  bg-blue-700
                  px-4
                  py-2
                  text-sm
                  font-semibold
                  text-white
                  hover:bg-blue-800
                "
              >
                + New MCQ
              </Link>
            </div>

            <p className="mt-2 text-sm text-slate-500">
              {mcqs.length} MCQs organized by class and chapter.
            </p>
          </div>

          {sortedClassGroups.length === 0 ? (

            <div
              className="
                rounded-2xl
                border
                border-slate-200
                bg-white
                px-6
                py-16
                text-center
                dark:border-slate-800
                dark:bg-slate-900
              "
            >
              No MCQs available.
            </div>

          ) : (

            sortedClassGroups.map((classGroup) => {

              const sortedChapters =
                [...classGroup.chapters.values()]
                  .sort((a, b) => {

                    if (
                      a.chapterSequenceOrder !==
                      b.chapterSequenceOrder
                    ) {
                      return (
                        a.chapterSequenceOrder -
                        b.chapterSequenceOrder
                      );
                    }

                    return compareText(
                      a.chapterName,
                      b.chapterName
                    );
                  });

              const totalMcqs =
                sortedChapters.reduce(
                  (sum, chapter) =>
                    sum + chapter.mcqs.length,
                  0
                );

              return (

                <details
                  key={classGroup.className}
                  open
                  className="
                    rounded-2xl
                    border
                    border-slate-200
                    bg-white
                    dark:border-slate-800
                    dark:bg-slate-900
                  "
                >

                  <summary
                    className="
                      cursor-pointer
                      px-6
                      py-5
                      text-lg
                      font-bold
                      text-slate-900
                      dark:text-white
                    "
                  >

                    {classGroup.className}

                    <span
                      className="
                        ml-3
                        rounded-full
                        bg-blue-50
                        px-3
                        py-1
                        text-xs
                        text-blue-700
                        dark:bg-blue-950
                        dark:text-blue-300
                      "
                    >
                      {totalMcqs} MCQs
                    </span>

                  </summary>

                  <div
                    className="
                      space-y-4
                      border-t
                      border-slate-200
                      p-5
                      dark:border-slate-800
                    "
                  >

                    {
                      sortedChapters.map((chapter) => (

                        <details
                          key={chapter.chapterName}
                          className="
                            overflow-hidden
                            rounded-xl
                            border
                            border-slate-200
                            dark:border-slate-700
                          "
                        >

                          <summary
                            className="
                              cursor-pointer
                              bg-slate-50
                              px-5
                              py-4
                              font-semibold
                              text-slate-800
                              dark:bg-slate-950
                              dark:text-slate-200
                            "
                          >

                            {chapter.chapterName}

                            <span
                              className="
                                ml-3
                                text-xs
                                text-slate-500
                              "
                            >
                              ({chapter.mcqs.length} MCQs)
                            </span>

                          </summary>

                          <div
                            className="
                              divide-y
                              divide-slate-200
                              dark:divide-slate-800
                            "
                          >

                            {
                              chapter.mcqs.map((mcq) => (

                                <div
                                  key={mcq.id}
                                  className="
                                    flex
                                    items-start
                                    justify-between
                                    gap-5
                                    px-5
                                    py-4
                                    hover:bg-slate-50
                                    dark:hover:bg-slate-950
                                  "
                                >

                                  {/* ---------------------------------
                                   * Question
                                   * --------------------------------- */}

                                  <div className="min-w-0 flex-1">

                                    <p
                                      className="
                                        text-xs
                                        font-semibold
                                        text-slate-400
                                      "
                                    >
                                      Question #{mcq.admin_question_number}
                                    </p>

                                    <div
                                      className="
                                        mt-1
                                        text-sm
                                        font-medium
                                        text-slate-900
                                        dark:text-white
                                      "
                                    >
                                      <MathTextPreview
                                        value={mcq.question_text}
                                      />
                                    </div>

                                    {/* ---------------------------------
                                     * Attached Sets
                                     * --------------------------------- */}

                                    <div className="mt-3">

                                      <p
                                        className="
                                          text-[11px]
                                          font-semibold
                                          uppercase
                                          tracking-wide
                                          text-slate-400
                                        "
                                      >
                                        Attached Sets
                                      </p>

                                      {mcq.attached_sets.length === 0 ? (

                                        <p
                                          className="
                                            mt-1
                                            text-xs
                                            text-slate-400
                                          "
                                        >
                                          Not attached to any MCQ Set
                                        </p>

                                      ) : (

                                        <div
                                          className="
                                            mt-2
                                            flex
                                            flex-wrap
                                            gap-2
                                          "
                                        >

                                          {mcq.attached_sets.map(
                                            (set) => (

                                              <Link
                                                key={
                                                  set.resource_id
                                                }
                                                href={`/admin/mcq-bank/sets/${set.resource_id}`}
                                                className="
                                                  inline-flex
                                                  items-center
                                                  gap-2
                                                  rounded-lg
                                                  border
                                                  border-slate-200
                                                  bg-slate-50
                                                  px-2.5
                                                  py-1.5
                                                  text-xs
                                                  font-semibold
                                                  text-slate-700
                                                  transition
                                                  hover:border-blue-200
                                                  hover:bg-blue-50
                                                  hover:text-blue-700
                                                  dark:border-slate-700
                                                  dark:bg-slate-800
                                                  dark:text-slate-300
                                                  dark:hover:border-blue-800
                                                  dark:hover:bg-blue-950/40
                                                  dark:hover:text-blue-300
                                                "
                                              >

                                                <span>
                                                  Set{" "}
                                                  {set.set_number ??
                                                    "—"}
                                                </span>

                                                <span
                                                  className={`
                                                    rounded-full
                                                    px-1.5
                                                    py-0.5
                                                    text-[9px]
                                                    font-bold
                                                    ${
                                                      set.status ===
                                                      "PUBLISHED"
                                                        ? `
                                                          bg-green-100
                                                          text-green-700
                                                          dark:bg-green-500/10
                                                          dark:text-green-400
                                                        `
                                                        : set.status ===
                                                          "DRAFT"
                                                          ? `
                                                            bg-yellow-100
                                                            text-yellow-700
                                                            dark:bg-yellow-500/10
                                                            dark:text-yellow-400
                                                          `
                                                          : `
                                                            bg-slate-200
                                                            text-slate-600
                                                            dark:bg-slate-700
                                                            dark:text-slate-300
                                                          `
                                                    }
                                                  `}
                                                >
                                                  {
                                                    set.status
                                                  }
                                                </span>

                                              </Link>

                                            )
                                          )}

                                        </div>

                                      )}

                                    </div>

                                  </div>

                                  {/* ---------------------------------
                                   * Open
                                   * --------------------------------- */}

                                  <Link
                                    href={`/admin/mcq-bank/${mcq.id}`}
                                    className="
                                      shrink-0
                                      rounded-xl
                                      border
                                      border-slate-200
                                      px-4
                                      py-2
                                      text-sm
                                      font-semibold
                                      text-slate-700
                                      hover:bg-blue-50
                                      hover:text-blue-700
                                      dark:border-slate-700
                                      dark:text-slate-300
                                    "
                                  >
                                    Open
                                  </Link>

                                </div>

                              ))
                            }

                          </div>

                        </details>

                      ))
                    }

                  </div>

                </details>

              );

            })

          )}

        </section>

        {/* =================================================
         * Workflow Notice
         * ================================================= */}

        <section
          className="
            rounded-2xl
            border
            border-blue-100
            bg-blue-50
            p-5
            dark:border-blue-900/50
            dark:bg-blue-950/20
          "
        >
          <p
            className="
              text-sm
              font-semibold
              text-blue-900
              dark:text-blue-300
            "
          >
            MCQ Bank Workflow
          </p>

          <p
            className="
              mt-2
              text-sm
              leading-6
              text-blue-800
              dark:text-blue-400
            "
          >
            Individual MCQs are maintained in the
            question library and can be reused across
            multiple MCQ Sets. Questions are organized
            here by class and chapter so the library
            remains manageable as the question bank grows.
          </p>

          <p
            className="
              mt-2
              text-sm
              leading-6
              text-blue-800
              dark:text-blue-400
            "
          >
            Mathematical notation is rendered directly
            in the question preview, so authoring content
            such as $x^2$, $\frac&#123;a&#125;&#123;b&#125;$ or $x^2+y^2$
            remains readable before the question is added
            to a student-facing MCQ Set.
          </p>
        </section>
      </div>
    </AdminPage>
  );
}