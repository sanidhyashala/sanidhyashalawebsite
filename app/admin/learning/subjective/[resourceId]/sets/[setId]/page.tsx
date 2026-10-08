import Link from "next/link";
import { notFound } from "next/navigation";

import AdminPage from "@/app/admin/components/layout/AdminPage";
import MathTextPreview from "@/app/admin/mcq-bank/components/MathTextPreview";

import { getAdminSubjectiveSetDetail } from "@/app/lib/admin/subjective/subjective-set.service";
import { publishSubjectiveSet } from "@/app/lib/admin/subjective/subjective-publish.actions";

const CATEGORY_LABELS = {
  UNDERSTAND_APPLY: "Understand & Apply",
  THINK_SOLVE: "Think & Solve",
  CASE_BASED: "Case Based",
} as const;

type PageProps = {
  params: Promise<{
    resourceId: string;
    setId: string;
  }>;
};

export default async function AdminSubjectiveSetDetailPage({
  params,
}: PageProps) {
  const { resourceId, setId } = await params;

  const normalizedResourceId = resourceId.trim();
  const normalizedSetId = setId.trim();

  if (!normalizedResourceId || !normalizedSetId) {
    notFound();
  }

  const set = await getAdminSubjectiveSetDetail(
    normalizedResourceId,
    normalizedSetId
  );

  if (!set) {
    notFound();
  }

  const createQuestionHref =
    `/admin/learning/subjective/${set.resourceId}/questions/new`;

  const addQuestionsHref =
    `/admin/learning/subjective/${set.resourceId}/sets/${set.id}/questions`;

  const isPublished =
    set.status === "PUBLISHED";

  return (
    <AdminPage
      title={set.title}
      description="Manage this Subjective practice set and its questions."
      sectionTitle="Set Details"
      sectionDescription={
        `Set ${set.setNumber} · ${CATEGORY_LABELS[set.category]}`
      }
      actions={
        <div className="flex flex-wrap items-center gap-3">

          {/* =====================================================
              BACK
          ===================================================== */}

          <Link
            href={`/admin/learning/subjective/${set.resourceId}`}
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
              hover:border-slate-300
              hover:bg-slate-50
              dark:border-slate-700
              dark:bg-slate-900
              dark:text-slate-300
              dark:hover:bg-slate-800
            "
          >
            ← Back to Sets
          </Link>

          {/* =====================================================
              CREATE NEW QUESTION
          ===================================================== */}

          <Link
            href={createQuestionHref}
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
              hover:border-blue-300
              hover:bg-blue-100
              dark:border-blue-900
              dark:bg-blue-950
              dark:text-blue-300
              dark:hover:bg-blue-900
            "
          >
            + Create New Question
          </Link>

          {/* =====================================================
              ADD EXISTING QUESTIONS
          ===================================================== */}

          <Link
            href={addQuestionsHref}
            className="
              rounded-xl
              bg-slate-900
              px-4
              py-2
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
            + Add Questions
          </Link>

          {/* =====================================================
              PUBLISH / PUBLISHED
          ===================================================== */}

          {isPublished ? (
            <button
              type="button"
              disabled
              className="
                cursor-not-allowed
                rounded-xl
                border
                border-emerald-200
                bg-emerald-50
                px-4
                py-2
                text-sm
                font-semibold
                text-emerald-700
                opacity-90
                dark:border-emerald-900
                dark:bg-emerald-950/30
                dark:text-emerald-300
              "
            >
              ✓ Published
            </button>
          ) : (
            <form action={publishSubjectiveSet}>
              <input
                type="hidden"
                name="set_id"
                value={set.id}
              />

              <button
                type="submit"
                className="
                  rounded-xl
                  bg-blue-700
                  px-4
                  py-2
                  text-sm
                  font-semibold
                  text-white
                  transition
                  hover:bg-blue-800
                  dark:bg-blue-600
                  dark:hover:bg-blue-500
                "
              >
                Publish Set
              </button>
            </form>
          )}
        </div>
      }
    >
      <div className="space-y-8">

        {/* =====================================================
            SET INFORMATION
        ===================================================== */}

        <div
          className="
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-6
            shadow-sm
            dark:border-slate-800
            dark:bg-slate-900
          "
        >
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

            {/* SET */}

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Set
              </p>

              <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                Set {set.setNumber}
              </p>
            </div>

            {/* CATEGORY */}

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Category
              </p>

              <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                {CATEGORY_LABELS[set.category]}
              </p>
            </div>

            {/* ACCESS */}

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Access
              </p>

              <p
                className={`
                  mt-1
                  inline-flex
                  rounded-full
                  px-3
                  py-1
                  text-sm
                  font-bold
                  ${
                    set.accessType === "PREMIUM"
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                      : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                  }
                `}
              >
                {set.accessType}
              </p>
            </div>

            {/* STATUS */}

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Status
              </p>

              <p
                className={`
                  mt-1
                  inline-flex
                  rounded-full
                  px-3
                  py-1
                  text-sm
                  font-bold
                  ${
                    isPublished
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  }
                `}
              >
                {set.status}
              </p>
            </div>
          </div>

          {/* DESCRIPTION */}

          {set.description && (
            <div className="mt-6 border-t border-slate-200 pt-6 dark:border-slate-800">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Description
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {set.description}
              </p>
            </div>
          )}
        </div>

        {/* =====================================================
    PUBLISHING WORKSPACE
===================================================== */}

{!isPublished ? (
  <div
    className="
      rounded-2xl
      border
      border-blue-100
      bg-blue-50/60
      p-6
      dark:border-blue-900
      dark:bg-blue-950/20
    "
  >
    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700 dark:text-blue-400">
      Publishing
    </p>

    <h2 className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
      This set is ready to be published.
    </h2>

    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
      Review the questions attached to this set and publish it
      when the content is ready. The selected access type remains
      part of the set configuration.
    </p>
  </div>
) : (
  <div
    className="
      rounded-2xl
      border
      border-emerald-100
      bg-emerald-50/60
      p-6
      dark:border-emerald-900
      dark:bg-emerald-950/20
    "
  >
    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-400">
      Published
    </p>

    <h2 className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
      This Subjective Set is published.
    </h2>

    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
      The set is now available according to its configured
      access type.
    </p>
  </div>
)}

        {/* =====================================================
            QUESTIONS
        ===================================================== */}

        <div className="space-y-4">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Questions
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {set.questions.length}{" "}
                question
                {set.questions.length === 1 ? "" : "s"}{" "}
                attached to this set.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">

              {/* CREATE */}

              <Link
                href={createQuestionHref}
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
                  hover:border-blue-300
                  hover:bg-blue-100
                  dark:border-blue-900
                  dark:bg-blue-950
                  dark:text-blue-300
                  dark:hover:bg-blue-900
                "
              >
                + Create New Question
              </Link>

              {/* ADD EXISTING */}

              <Link
                href={addQuestionsHref}
                className="
                  rounded-xl
                  bg-slate-900
                  px-4
                  py-2
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
                + Add Existing
              </Link>
            </div>
          </div>

          {/* ===================================================
              EMPTY STATE
          =================================================== */}

          {set.questions.length === 0 ? (
            <div
              className="
                rounded-2xl
                border
                border-dashed
                border-slate-300
                bg-white
                p-10
                text-center
                dark:border-slate-700
                dark:bg-slate-900
              "
            >
              <div className="text-4xl">✍️</div>

              <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
                No Questions Added Yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
                Create a new Subjective question for this
                chapter or add an existing question from the
                Question Bank.
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">

                {/* CREATE NEW */}

                <Link
                  href={createQuestionHref}
                  className="
                    inline-flex
                    items-center
                    rounded-xl
                    bg-blue-600
                    px-4
                    py-2.5
                    text-sm
                    font-semibold
                    text-white
                    transition
                    hover:bg-blue-700
                  "
                >
                  + Create New Question
                </Link>

                {/* ADD EXISTING */}

                <Link
                  href={addQuestionsHref}
                  className="
                    inline-flex
                    items-center
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    px-4
                    py-2.5
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
                  + Add Existing Question
                </Link>
              </div>
            </div>
          ) : (
            /* =================================================
               QUESTION LIST
            ================================================= */

            <div className="space-y-3">
              {set.questions.map((question) => {
                /*
                 * IMPORTANT:
                 * question.id = subjective_set_questions.id
                 * question.questionId = actual questions.id
                 *
                 * The Open/Edit routes must use question.questionId.
                 */

                const openQuestionHref =
                  `/admin/subjective/${question.questionId}`;

                const editQuestionHref =
                  `/admin/subjective/${question.questionId}/edit`;

                return (
                  <div
                    key={question.id}
                    className="
                      rounded-2xl
                      border
                      border-slate-200
                      bg-white
                      p-5
                      shadow-sm
                      dark:border-slate-800
                      dark:bg-slate-900
                    "
                  >
                    <div className="flex items-start gap-4">

                      {/* QUESTION ORDER */}

                      <div
                        className="
                          flex
                          h-9
                          w-9
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
                        {question.questionOrder}
                      </div>

                      <div className="min-w-0 flex-1">

                        {/* =================================================
                            QUESTION HEADER
                        ================================================= */}

                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">

                          {/* MATHEMATICAL QUESTION RENDERING */}

                          <div className="min-w-0 flex-1 text-sm leading-7 text-slate-800 dark:text-slate-200">
                            <MathTextPreview
                              value={question.questionText}
                            />
                          </div>

                          {/* OPEN / EDIT */}

                          <div className="flex shrink-0 items-center gap-2">

                            <Link
                              href={openQuestionHref}
                              className="
                                inline-flex
                                items-center
                                justify-center
                                rounded-lg
                                border
                                border-slate-200
                                bg-white
                                px-3
                                py-1.5
                                text-xs
                                font-semibold
                                text-slate-700
                                transition
                                hover:border-slate-300
                                hover:bg-slate-50
                                dark:border-slate-700
                                dark:bg-slate-800
                                dark:text-slate-300
                                dark:hover:bg-slate-700
                              "
                            >
                              Open
                            </Link>

                            <Link
                              href={editQuestionHref}
                              className="
                                inline-flex
                                items-center
                                justify-center
                                rounded-lg
                                border
                                border-blue-200
                                bg-blue-50
                                px-3
                                py-1.5
                                text-xs
                                font-semibold
                                text-blue-700
                                transition
                                hover:border-blue-300
                                hover:bg-blue-100
                                dark:border-blue-900
                                dark:bg-blue-950
                                dark:text-blue-300
                                dark:hover:bg-blue-900
                              "
                            >
                              Edit
                            </Link>

                          </div>
                        </div>

                        {/* QUESTION META */}

                        <div className="mt-4 flex flex-wrap items-center gap-3">

                          <span
                            className="
                              rounded-full
                              bg-slate-100
                              px-3
                              py-1
                              text-xs
                              font-semibold
                              text-slate-700
                              dark:bg-slate-800
                              dark:text-slate-300
                            "
                          >
                            {question.marks} marks
                          </span>

                          <span
                            className="
                              rounded-full
                              bg-blue-50
                              px-3
                              py-1
                              text-xs
                              font-semibold
                              text-blue-700
                              dark:bg-blue-950
                              dark:text-blue-300
                            "
                          >
                            Revision frozen
                          </span>

                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminPage>
  );
}