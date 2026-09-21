import Link from "next/link";

import AdminPage from "../../components/layout/AdminPage";

import {
  getAdminSubjectiveQuestionBankClasses,
} from "@/app/lib/admin/subjective/subjective-question-bank.service";

/* =========================================================
 * Page
 * ========================================================= */

export default async function AdminSubjectiveQuestionBankPage() {
  const classes =
    await getAdminSubjectiveQuestionBankClasses();

  const totalQuestions =
    classes.reduce(
      (sum, item) =>
        sum +
        item.total_questions,
      0
    );

  const totalDraft =
    classes.reduce(
      (sum, item) =>
        sum +
        item.draft_questions,
      0
    );

  const totalPublished =
    classes.reduce(
      (sum, item) =>
        sum +
        item.published_questions,
      0
    );

  return (
    <AdminPage
      title="Subjective Question Bank"
      description="Browse, manage and organize subjective questions class-wise and chapter-wise."
      actions={
        <div className="flex flex-wrap items-center gap-3">
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
            ← Subjective Engine
          </Link>

          <Link
            href="/admin/learning/new"
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
            + New Resource
          </Link>
        </div>
      }
    >
      <div className="space-y-8">

        {/* =================================================
         * Summary
         * ================================================= */}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div
            className="
              rounded-2xl
              border
              border-slate-200
              bg-white
              p-5
              dark:border-slate-800
              dark:bg-slate-900
            "
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Classes
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
              {classes.length}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Classes with questions
            </p>
          </div>

          <div
            className="
              rounded-2xl
              border
              border-slate-200
              bg-white
              p-5
              dark:border-slate-800
              dark:bg-slate-900
            "
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Questions
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
              {totalQuestions}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Active Subjective questions
            </p>
          </div>

          <div
            className="
              rounded-2xl
              border
              border-yellow-200
              bg-yellow-50
              p-5
              dark:border-yellow-900/50
              dark:bg-yellow-950/20
            "
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-yellow-700 dark:text-yellow-400">
              Draft
            </p>

            <p className="mt-2 text-3xl font-bold text-yellow-800 dark:text-yellow-300">
              {totalDraft}
            </p>

            <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-400">
              Questions awaiting publication
            </p>
          </div>

          <div
            className="
              rounded-2xl
              border
              border-green-200
              bg-green-50
              p-5
              dark:border-green-900/50
              dark:bg-green-950/20
            "
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-green-700 dark:text-green-400">
              Published
            </p>

            <p className="mt-2 text-3xl font-bold text-green-800 dark:text-green-300">
              {totalPublished}
            </p>

            <p className="mt-1 text-sm text-green-700 dark:text-green-400">
              Questions ready for use
            </p>
          </div>
        </section>

        {/* =================================================
         * Header
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
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Question Library
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            Choose a Class
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            Start with the class, then choose a chapter.
            Questions are loaded only after a chapter is
            selected, keeping the Question Bank fast and
            manageable as it grows.
          </p>
        </section>

        {/* =================================================
         * Empty State
         * ================================================= */}

        {classes.length === 0 ? (
          <section
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
                bg-blue-50
                text-blue-700
                dark:bg-blue-950
                dark:text-blue-300
              "
            >
              <span className="text-xl font-bold">
                Q
              </span>
            </div>

            <h3 className="mt-5 text-lg font-bold text-slate-900 dark:text-white">
              No Subjective Questions Yet
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
              Create and publish your first Subjective
              question to make it appear in the Question
              Bank.
            </p>
          </section>
        ) : (
          /* =================================================
           * Class Cards
           * ================================================= */

          <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {classes.map((item) => (
              <Link
                key={item.class_slug}
                href={`/admin/subjective/questions/${item.class_slug}`}
                className="
                  group
                  rounded-2xl
                  border
                  border-slate-200
                  bg-white
                  p-6
                  transition
                  hover:-translate-y-0.5
                  hover:border-blue-300
                  hover:shadow-md
                  dark:border-slate-800
                  dark:bg-slate-900
                  dark:hover:border-blue-700
                "
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Class
                    </p>

                    <h3 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                      {item.class_name}
                    </h3>
                  </div>

                  <span
                    className="
                      flex
                      h-10
                      w-10
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      bg-blue-50
                      text-blue-700
                      transition
                      group-hover:bg-blue-100
                      dark:bg-blue-950
                      dark:text-blue-300
                      dark:group-hover:bg-blue-900
                    "
                  >
                    →
                  </span>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-3">

                  <div
                    className="
                      rounded-xl
                      bg-slate-50
                      px-3
                      py-3
                      dark:bg-slate-950
                    "
                  >
                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                      {item.total_questions}
                    </p>

                    <p className="mt-1 text-[11px] font-medium text-slate-500">
                      Total
                    </p>
                  </div>

                  <div
                    className="
                      rounded-xl
                      bg-yellow-50
                      px-3
                      py-3
                      dark:bg-yellow-950/20
                    "
                  >
                    <p className="text-lg font-bold text-yellow-700 dark:text-yellow-400">
                      {item.draft_questions}
                    </p>

                    <p className="mt-1 text-[11px] font-medium text-yellow-700 dark:text-yellow-500">
                      Draft
                    </p>
                  </div>

                  <div
                    className="
                      rounded-xl
                      bg-green-50
                      px-3
                      py-3
                      dark:bg-green-950/20
                    "
                  >
                    <p className="text-lg font-bold text-green-700 dark:text-green-400">
                      {item.published_questions}
                    </p>

                    <p className="mt-1 text-[11px] font-medium text-green-700 dark:text-green-500">
                      Published
                    </p>
                  </div>

                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
                  <span className="text-sm font-medium text-slate-500">
                    Browse chapters
                  </span>

                  <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                    Open →
                  </span>
                </div>
              </Link>
            ))}
          </section>
        )}

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
          <p className="text-sm font-semibold text-blue-900 dark:text-blue-300">
            Subjective Question Bank Workflow
          </p>

          <p className="mt-2 text-sm leading-6 text-blue-800 dark:text-blue-400">
            Questions are organized first by class and then
            by chapter. Draft and Published questions remain
            together in the bank, while their status stays
            clearly visible.
          </p>

          <p className="mt-2 text-sm leading-6 text-blue-800 dark:text-blue-400">
            The Question Bank does not load the complete
            question library at once. Question content is
            fetched after you choose a specific chapter.
          </p>
        </section>
      </div>
    </AdminPage>
  );
}