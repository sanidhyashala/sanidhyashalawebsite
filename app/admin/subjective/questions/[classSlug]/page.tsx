import Link from "next/link";

import AdminPage from "../../../components/layout/AdminPage";

import MathTextPreview from "../../../mcq-bank/components/MathTextPreview";

import {
  getAdminLearningResources,
} from "@/app/lib/admin/learning/learning-resources.service";

import {
  getAdminSubjectiveQuestionBankChapters,
  getAdminSubjectiveQuestionsForClassChapter,
} from "@/app/lib/admin/subjective/subjective-question-bank.service";

/* =========================================================
 * Types
 * ========================================================= */

type PageProps = {
  params: Promise<{
    classSlug: string;
  }>;

  searchParams: Promise<{
    chapter?: string;
    status?: string;
    q?: string;
  }>;
};

/* =========================================================
 * Helpers
 * ========================================================= */

function normalizeStatus(
  value: string | undefined
):
  | "ALL"
  | "DRAFT"
  | "PUBLISHED" {
  if (
    value === "DRAFT" ||
    value === "PUBLISHED"
  ) {
    return value;
  }

  return "ALL";
}

/* =========================================================
 * Page
 * ========================================================= */

export default async function AdminSubjectiveQuestionBankClassPage(
  props: PageProps
) {
  const {
    classSlug,
  } = await props.params;

  const searchParams =
    await props.searchParams;

  const selectedChapterId =
    searchParams.chapter?.trim() ??
    "";

  const statusFilter =
    normalizeStatus(
      searchParams.status
    );

  const search =
    searchParams.q?.trim() ??
    "";

  /* -------------------------------------------------------
   * Load chapters + resources
   *
   * Resources are needed only to resolve the existing
   * Subjective resource for the selected chapter.
   * ------------------------------------------------------- */

  const [
    chapterResult,
    resources,
  ] = await Promise.all([
    getAdminSubjectiveQuestionBankChapters(
      classSlug
    ),
    getAdminLearningResources(),
  ]);

  const {
    className,
    chapters,
  } = chapterResult;

  /* -------------------------------------------------------
   * Selected chapter
   * ------------------------------------------------------- */

  const selectedChapter =
    chapters.find(
      (chapter) =>
        chapter.id ===
        selectedChapterId
    ) ?? null;

  /* -------------------------------------------------------
   * Resolve existing Subjective Resource
   *
   * This is what allows + New Question to open:
   *
   * /admin/learning/subjective/[resourceId]/questions/new
   * ------------------------------------------------------- */

  const selectedSubjectiveResource =
    selectedChapter
      ? resources.find(
          (resource) =>
            resource.resource_type ===
              "SUBJECTIVE" &&
            resource.curriculum?.node
              ?.id ===
              selectedChapter.id
        ) ?? null
      : null;

  /* -------------------------------------------------------
   * Load questions only when a chapter is selected.
   * ------------------------------------------------------- */

  let questions: Awaited<
    ReturnType<
      typeof getAdminSubjectiveQuestionsForClassChapter
    >
  >["questions"] = [];

  if (selectedChapter) {
    const result =
      await getAdminSubjectiveQuestionsForClassChapter(
        classSlug,
        selectedChapter.id,
        statusFilter,
        search
      );

    questions =
      result.questions;
  }

  /* -------------------------------------------------------
   * Class totals
   * ------------------------------------------------------- */

  const totalQuestions =
    chapters.reduce(
      (sum, chapter) =>
        sum +
        chapter.total_questions,
      0
    );

  const totalDraft =
    chapters.reduce(
      (sum, chapter) =>
        sum +
        chapter.draft_questions,
      0
    );

  const totalPublished =
    chapters.reduce(
      (sum, chapter) =>
        sum +
        chapter.published_questions,
      0
    );

  return (
    <AdminPage
      title={`${className} — Subjective Questions`}
      description="Choose a chapter to browse and manage Subjective questions."
      actions={
        <div className="flex flex-wrap items-center gap-3">

          <Link
            href="/admin/subjective/questions"
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
            ← Question Bank
          </Link>

          <Link
            href="/admin/subjective"
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
            Subjective Engine
          </Link>

          {selectedSubjectiveResource && (
            <Link
              href={`/admin/learning/subjective/${selectedSubjectiveResource.id}/questions/new`}
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
              + New Question
            </Link>
          )}

        </div>
      }
    >
      <div className="space-y-8">

        {/* =================================================
         * Class Header
         * ================================================= */}

        <section
          className="
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-6
            dark:border-slate-800
            dark:bg-slate-900
          "
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Question Bank
              </p>

              <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                {className}
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Select a chapter to view its Subjective
                questions.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:min-w-[360px]">

              <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-950">
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {totalQuestions}
                </p>

                <p className="mt-1 text-[11px] font-medium text-slate-500">
                  Questions
                </p>
              </div>

              <div className="rounded-xl bg-yellow-50 px-4 py-3 dark:bg-yellow-950/20">
                <p className="text-xl font-bold text-yellow-700 dark:text-yellow-400">
                  {totalDraft}
                </p>

                <p className="mt-1 text-[11px] font-medium text-yellow-700 dark:text-yellow-500">
                  Draft
                </p>
              </div>

              <div className="rounded-xl bg-green-50 px-4 py-3 dark:bg-green-950/20">
                <p className="text-xl font-bold text-green-700 dark:text-green-400">
                  {totalPublished}
                </p>

                <p className="mt-1 text-[11px] font-medium text-green-700 dark:text-green-500">
                  Published
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* =================================================
         * Chapter Selection
         * ================================================= */}

        <section
          className="
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-6
            dark:border-slate-800
            dark:bg-slate-900
          "
        >
          <form
            method="GET"
            className="flex flex-col gap-4 lg:flex-row lg:items-end"
          >
            <div className="flex-1">

              <label
                htmlFor="chapter"
                className="block text-sm font-semibold text-slate-800 dark:text-slate-200"
              >
                Select Chapter
              </label>

              <select
                id="chapter"
                name="chapter"
                defaultValue={
                  selectedChapterId
                }
                className="
                  mt-2
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  px-4
                  py-3
                  text-sm
                  font-medium
                  text-slate-800
                  outline-none
                  transition
                  focus:border-blue-500
                  focus:ring-2
                  focus:ring-blue-100
                  dark:border-slate-700
                  dark:bg-slate-950
                  dark:text-slate-200
                  dark:focus:border-blue-500
                  dark:focus:ring-blue-950
                "
              >
                <option value="">
                  Choose a chapter
                </option>

                {chapters.map(
                  (chapter) => (
                    <option
                      key={
                        chapter.id
                      }
                      value={
                        chapter.id
                      }
                    >
                      {chapter.name} —{" "}
                      {
                        chapter.total_questions
                      }{" "}
                      questions
                    </option>
                  )
                )}
              </select>
            </div>

            <button
              type="submit"
              className="
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
              "
            >
              Open Chapter
            </button>
          </form>

          {selectedChapter &&
            !selectedSubjectiveResource && (
              <div
                className="
                  mt-4
                  rounded-xl
                  border
                  border-yellow-200
                  bg-yellow-50
                  p-4
                  text-sm
                  leading-6
                  text-yellow-800
                  dark:border-yellow-900/50
                  dark:bg-yellow-950/20
                  dark:text-yellow-400
                "
              >
                This chapter has Subjective questions, but
                no Subjective learning resource is currently
                mapped to it. The existing resource mapping
                is required before creating a new question.
              </div>
            )}
        </section>

        {/* =================================================
         * Chapter Cards
         * ================================================= */}

        {chapters.length > 0 && (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {chapters.map(
              (chapter) => (
                <Link
                  key={chapter.id}
                  href={`/admin/subjective/questions/${classSlug}?chapter=${encodeURIComponent(
                    chapter.id
                  )}`}
                  className={`
                    rounded-2xl
                    border
                    bg-white
                    p-5
                    transition
                    hover:-translate-y-0.5
                    hover:shadow-md
                    dark:bg-slate-900
                    ${
                      selectedChapterId ===
                      chapter.id
                        ? `
                          border-blue-300
                          ring-2
                          ring-blue-100
                          dark:border-blue-700
                          dark:ring-blue-950
                        `
                        : `
                          border-slate-200
                          dark:border-slate-800
                        `
                    }
                  `}
                >
                  <div className="flex items-start justify-between gap-4">

                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Chapter
                      </p>

                      <h3 className="mt-1 line-clamp-2 font-bold text-slate-900 dark:text-white">
                        {chapter.name}
                      </h3>
                    </div>

                    <span className="shrink-0 text-blue-700 dark:text-blue-400">
                      →
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-2">

                    <div className="rounded-lg bg-slate-50 px-2 py-2.5 dark:bg-slate-950">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {chapter.total_questions}
                      </p>

                      <p className="mt-0.5 text-[10px] text-slate-500">
                        Total
                      </p>
                    </div>

                    <div className="rounded-lg bg-yellow-50 px-2 py-2.5 dark:bg-yellow-950/20">
                      <p className="text-sm font-bold text-yellow-700 dark:text-yellow-400">
                        {chapter.draft_questions}
                      </p>

                      <p className="mt-0.5 text-[10px] text-yellow-700 dark:text-yellow-500">
                        Draft
                      </p>
                    </div>

                    <div className="rounded-lg bg-green-50 px-2 py-2.5 dark:bg-green-950/20">
                      <p className="text-sm font-bold text-green-700 dark:text-green-400">
                        {chapter.published_questions}
                      </p>

                      <p className="mt-0.5 text-[10px] text-green-700 dark:text-green-500">
                        Published
                      </p>
                    </div>

                  </div>
                </Link>
              )
            )}
          </section>
        )}

        {/* =================================================
         * Selected Chapter Questions
         * ================================================= */}

        {selectedChapter && (
          <section className="space-y-5">

            {/* Header */}

            <div
              className="
                rounded-2xl
                border
                border-slate-200
                bg-white
                p-6
                dark:border-slate-800
                dark:bg-slate-900
              "
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {className}
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
                    {selectedChapter.name}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {questions.length} question
                    {questions.length === 1
                      ? ""
                      : "s"} shown
                  </p>
                </div>

                <form
                  method="GET"
                  className="flex flex-col gap-3 sm:flex-row"
                >
                  <input
                    type="hidden"
                    name="chapter"
                    value={
                      selectedChapter.id
                    }
                  />

                  <select
                    name="status"
                    defaultValue={
                      statusFilter
                    }
                    className="
                      rounded-xl
                      border
                      border-slate-200
                      bg-white
                      px-4
                      py-2.5
                      text-sm
                      font-medium
                      text-slate-700
                      outline-none
                      focus:border-blue-500
                      dark:border-slate-700
                      dark:bg-slate-950
                      dark:text-slate-300
                    "
                  >
                    <option value="ALL">
                      All Status
                    </option>

                    <option value="DRAFT">
                      Draft
                    </option>

                    <option value="PUBLISHED">
                      Published
                    </option>
                  </select>

                  <input
                    type="search"
                    name="q"
                    defaultValue={
                      search
                    }
                    placeholder="Search questions..."
                    className="
                      w-full
                      rounded-xl
                      border
                      border-slate-200
                      bg-white
                      px-4
                      py-2.5
                      text-sm
                      text-slate-800
                      outline-none
                      focus:border-blue-500
                      sm:w-64
                      dark:border-slate-700
                      dark:bg-slate-950
                      dark:text-slate-200
                    "
                  />

                  <button
                    type="submit"
                    className="
                      rounded-xl
                      bg-slate-900
                      px-5
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
                    Apply
                  </button>
                </form>
              </div>
            </div>

            {/* Questions */}

            {questions.length === 0 ? (
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
                <div
                  className="
                    mx-auto
                    flex
                    h-14
                    w-14
                    items-center
                    justify-center
                    rounded-2xl
                    bg-slate-100
                    text-slate-600
                    dark:bg-slate-800
                    dark:text-slate-300
                  "
                >
                  <span className="text-xl font-bold">
                    Q
                  </span>
                </div>

                <h3 className="mt-5 text-lg font-bold text-slate-900 dark:text-white">
                  No questions found
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
                  No Subjective questions match the
                  selected chapter, status and search
                  filters.
                </p>
              </div>
            ) : (
              <div
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
                <div className="divide-y divide-slate-200 dark:divide-slate-800">

                  {questions.map(
                    (question) => (
                      <div
                        key={
                          question.id
                        }
                        className="
                          px-6
                          py-5
                          transition
                          hover:bg-slate-50
                          dark:hover:bg-slate-950
                        "
                      >
                        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">

                          <div className="min-w-0 flex-1">

                            <div className="flex flex-wrap items-center gap-2">

                              <span className="text-xs font-bold text-slate-400">
                                Question #
                                {
                                  question.admin_question_number
                                }
                              </span>

                              <span
                                className={`
                                  rounded-full
                                  px-2.5
                                  py-1
                                  text-[11px]
                                  font-semibold
                                  ${
                                    question.status ===
                                    "PUBLISHED"
                                      ? `
                                        bg-green-100
                                        text-green-700
                                        dark:bg-green-500/10
                                        dark:text-green-400
                                      `
                                      : `
                                        bg-yellow-100
                                        text-yellow-700
                                        dark:bg-yellow-500/10
                                        dark:text-yellow-400
                                      `
                                  }
                                `}
                              >
                                {
                                  question.status
                                }
                              </span>

                              {question.difficulty && (
                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                  {
                                    question.difficulty
                                  }
                                </span>
                              )}

                            </div>

                            <div className="mt-3">
                              <MathTextPreview
                                value={
                                  question.question_text
                                }
                              />
                            </div>

                            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">

                              <span>
                                Marks:{" "}
                                <strong className="text-slate-700 dark:text-slate-300">
                                  {question.marks ??
                                    "—"}
                                </strong>
                              </span>

                              <span>
                                Time:{" "}
                                <strong className="text-slate-700 dark:text-slate-300">
                                  {question.estimated_time_minutes ??
                                    "—"}
                                  {question.estimated_time_minutes !==
                                    null &&
                                    " min"}
                                </strong>
                              </span>

                              <span>
                                Source:{" "}
                                <strong className="text-slate-700 dark:text-slate-300">
                                  {
                                    question.source_type
                                  }
                                </strong>
                              </span>

                              <span>
                                Revision:{" "}
                                <strong className="text-slate-700 dark:text-slate-300">
                                  v
                                  {
                                    question
                                      .revision
                                      ?.revision_number
                                  }
                                </strong>
                              </span>

                            </div>

                            {question.source_reference && (
                              <p className="mt-2 text-xs text-slate-400">
                                Reference:{" "}
                                {
                                  question.source_reference
                                }
                              </p>
                            )}

                          </div>

                          <div className="shrink-0">

                            <Link
                              href={`/admin/subjective/${question.id}`}
                              className="
                                inline-flex
                                rounded-xl
                                border
                                border-slate-200
                                px-4
                                py-2.5
                                text-sm
                                font-semibold
                                text-slate-700
                                transition
                                hover:border-blue-200
                                hover:bg-blue-50
                                hover:text-blue-700
                                dark:border-slate-700
                                dark:text-slate-300
                                dark:hover:border-blue-900
                                dark:hover:bg-blue-950/30
                                dark:hover:text-blue-400
                              "
                            >
                              Open
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
        )}

        {/* =================================================
         * No Chapter Selected
         * ================================================= */}

        {!selectedChapter &&
          chapters.length > 0 && (
            <section
              className="
                rounded-2xl
                border
                border-blue-100
                bg-blue-50
                p-6
                dark:border-blue-900/50
                dark:bg-blue-950/20
              "
            >
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-300">
                Choose a chapter to continue
              </p>

              <p className="mt-1 text-sm leading-6 text-blue-800 dark:text-blue-400">
                Use the dropdown above or click any chapter
                card. Draft and Published questions will then
                appear for that particular chapter.
              </p>
            </section>
          )}

      </div>
    </AdminPage>
  );
}