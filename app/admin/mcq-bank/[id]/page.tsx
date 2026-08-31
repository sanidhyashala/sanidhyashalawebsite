import Link from "next/link";

import AdminPage from "../../components/layout/AdminPage";

import {
  getAdminMcqById,
} from "@/app/lib/admin/mcq-bank/mcq-bank.service";

import {
  publishAdminMcq,
} from "@/app/lib/admin/mcq-bank/mcq-bank.actions";


type Props = {
  params: Promise<{
    id: string;
  }>;
};


export default async function AdminMcqDetailPage({
  params,
}: Props) {
  const { id } = await params;

  const mcq =
    await getAdminMcqById(id);

  const revision =
    mcq.revision;

  const revisionStatus =
    revision?.status ?? null;


  return (
    <AdminPage
      title="MCQ Detail"
      description="Review and manage this multiple-choice question and its revision lifecycle."
      actions={
        <Link
          href="/admin/mcq-bank"
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
          ← Back to MCQ Bank
        </Link>
      }
    >
      <div className="space-y-6">

        {/* =================================================
         * MCQ Header
         * ================================================= */}

        <section
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
          <div
            className="
              flex
              flex-col
              gap-5
              lg:flex-row
              lg:items-start
              lg:justify-between
            "
          >
            <div className="min-w-0">

              <div className="flex flex-wrap items-center gap-2">

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
                  MCQ
                </span>


                <span
                  className={`
                    rounded-full
                    px-3
                    py-1
                    text-xs
                    font-semibold
                    ${
                      mcq.status ===
                      "PUBLISHED"
                        ? `
                          bg-green-100
                          text-green-700
                          dark:bg-green-500/10
                          dark:text-green-400
                        `
                        : mcq.status ===
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
                  Question: {mcq.status}
                </span>


                {revisionStatus && (
                  <span
                    className={`
                      rounded-full
                      px-3
                      py-1
                      text-xs
                      font-semibold
                      ${
                        revisionStatus ===
                        "PUBLISHED"
                          ? `
                            bg-green-100
                            text-green-700
                            dark:bg-green-500/10
                            dark:text-green-400
                          `
                          : revisionStatus ===
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
                    Revision: {revisionStatus}
                  </span>
                )}

              </div>


              <h2
                className="
                  mt-4
                  text-2xl
                  font-bold
                  leading-9
                  text-slate-900
                  dark:text-white
                "
              >
                {mcq.question_text}
              </h2>


              <p className="mt-3 text-xs text-slate-500">
                Question ID: {mcq.id}
              </p>

              {revision && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-slate-500">
                    Revision: {revision.revision_number}
                  </p>

                  <p className="break-all text-xs text-slate-500">
                    Revision ID: {revision.id}
                  </p>
                </div>
              )}

            </div>


            {/* =================================================
             * Student-Facing Rule
             * ================================================= */}

            <div
              className="
                shrink-0
                max-w-sm
                rounded-2xl
                border
                border-blue-100
                bg-blue-50
                px-5
                py-4
                dark:border-blue-900/50
                dark:bg-blue-950/20
              "
            >
              <p
                className="
                  text-xs
                  font-semibold
                  uppercase
                  tracking-wider
                  text-blue-700
                  dark:text-blue-300
                "
              >
                Student-Facing Control
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
                Student access is controlled by the
                published MCQ Set. Publishing a question
                revision does not independently publish the
                question to students.
              </p>
            </div>

          </div>
        </section>


        {/* =================================================
         * Revision Status + Publication Action
         * ================================================= */}

        <section
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

          <div
            className="
              flex
              flex-col
              gap-5
              lg:flex-row
              lg:items-center
              lg:justify-between
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
                Revision Lifecycle
              </p>

              <h3
                className="
                  mt-2
                  text-lg
                  font-bold
                  text-slate-900
                  dark:text-white
                "
              >
                {revision
                  ? `Revision ${revision.revision_number}`
                  : "No Current Revision"}
              </h3>

              <p
                className="
                  mt-2
                  text-sm
                  leading-6
                  text-slate-600
                  dark:text-slate-400
                "
              >
                {revision
                  ? revision.status ===
                    "DRAFT"
                    ? "This revision is a draft and is ready to be published as the current revision."
                    : revision.status ===
                      "PUBLISHED"
                      ? "This revision is the currently published revision of this question."
                      : "This revision is no longer the active published revision."
                  : "This question does not currently have a published revision."}
              </p>

            </div>


            {/* =================================================
             * Publish Revision
             * ================================================= */}

            {revision?.status ===
              "DRAFT" && (

              <form
                action={publishAdminMcq}
                className="shrink-0"
              >

                <input
                  type="hidden"
                  name="question_id"
                  value={mcq.id}
                />

                <input
                  type="hidden"
                  name="revision_id"
                  value={revision.id}
                />

                <button
                  type="submit"
                  className="
                    rounded-xl
                    bg-blue-600
                    px-5
                    py-3
                    text-sm
                    font-semibold
                    text-white
                    shadow-sm
                    transition
                    hover:bg-blue-700
                    focus:outline-none
                    focus:ring-2
                    focus:ring-blue-500
                    focus:ring-offset-2
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                    dark:focus:ring-offset-slate-900
                  "
                >
                  Publish Revision {revision.revision_number}
                </button>

              </form>
            )}

          </div>


          {revision?.status ===
            "DRAFT" && (
            <div
              className="
                mt-5
                rounded-xl
                border
                border-yellow-200
                bg-yellow-50
                px-4
                py-3
                text-sm
                leading-6
                text-yellow-800
                dark:border-yellow-900/50
                dark:bg-yellow-950/20
                dark:text-yellow-300
              "
            >
              Publishing this revision will make it the
              current published revision of this question.
              If another revision is currently published,
              the database will archive that previous
              revision atomically.
            </div>
          )}

        </section>


        {/* =================================================
         * Revision Content
         * ================================================= */}

        {revision && (
          <section
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

            <div className="mb-5">

              <p
                className="
                  text-xs
                  font-semibold
                  uppercase
                  tracking-wider
                  text-slate-500
                "
              >
                Revision Content
              </p>

              <h3
                className="
                  mt-2
                  text-lg
                  font-bold
                  text-slate-900
                  dark:text-white
                "
              >
                Revision {revision.revision_number}
              </h3>

            </div>


            <div className="space-y-5">

              <div>
                <p className="text-xs text-slate-500">
                  Question Text
                </p>

                <p
                  className="
                    mt-2
                    whitespace-pre-wrap
                    text-sm
                    leading-7
                    text-slate-800
                    dark:text-slate-200
                  "
                >
                  {revision.question_text}
                </p>
              </div>


              {revision.solution_text && (
                <div>
                  <p className="text-xs text-slate-500">
                    Solution
                  </p>

                  <p
                    className="
                      mt-2
                      whitespace-pre-wrap
                      text-sm
                      leading-7
                      text-slate-700
                      dark:text-slate-300
                    "
                  >
                    {revision.solution_text}
                  </p>
                </div>
              )}


              {revision.mistake_insight && (
                <div>
                  <p className="text-xs text-slate-500">
                    Mistake Insight
                  </p>

                  <p
                    className="
                      mt-2
                      whitespace-pre-wrap
                      text-sm
                      leading-7
                      text-slate-700
                      dark:text-slate-300
                    "
                  >
                    {revision.mistake_insight}
                  </p>
                </div>
              )}

            </div>

          </section>
        )}


        {/* =================================================
         * Options
         * ================================================= */}

        <section
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
          <div className="mb-5">

            <p
              className="
                text-xs
                font-semibold
                uppercase
                tracking-wider
                text-slate-500
              "
            >
              Answer Options
            </p>

            <h3
              className="
                mt-2
                text-lg
                font-bold
                text-slate-900
                dark:text-white
              "
            >
              {revision
                ? `Revision ${revision.revision_number} Options`
                : "MCQ Options"}
            </h3>

          </div>


          {mcq.options.length ===
          0 ? (
            <div
              className="
                rounded-2xl
                border
                border-dashed
                border-slate-300
                bg-slate-50
                p-6
                text-sm
                text-slate-500
                dark:border-slate-700
                dark:bg-slate-950
                dark:text-slate-400
              "
            >
              No options are available for this MCQ yet.
            </div>
          ) : (
            <div className="space-y-3">

              {mcq.options.map(
                (option) => (
                  <div
                    key={option.id}
                    className={`
                      rounded-2xl
                      border
                      p-4
                      ${
                        option.is_correct
                          ? `
                            border-green-200
                            bg-green-50
                            dark:border-green-900/50
                            dark:bg-green-950/20
                          `
                          : `
                            border-slate-200
                            bg-slate-50
                            dark:border-slate-800
                            dark:bg-slate-950
                          `
                      }
                    `}
                  >
                    <div className="flex items-start gap-4">

                      <span
                        className={`
                          flex
                          h-9
                          w-9
                          shrink-0
                          items-center
                          justify-center
                          rounded-xl
                          text-sm
                          font-bold
                          ${
                            option.is_correct
                              ? `
                                bg-green-600
                                text-white
                              `
                              : `
                                bg-white
                                text-slate-700
                                ring-1
                                ring-slate-200
                                dark:bg-slate-900
                                dark:text-slate-300
                                dark:ring-slate-700
                              `
                          }
                        `}
                      >
                        {option.option_key}
                      </span>


                      <div className="min-w-0 flex-1">

                        <p
                          className="
                            text-sm
                            leading-6
                            text-slate-800
                            dark:text-slate-200
                          "
                        >
                          {option.option_text}
                        </p>


                        {option.is_correct && (
                          <p
                            className="
                              mt-2
                              text-xs
                              font-semibold
                              text-green-700
                              dark:text-green-400
                            "
                          >
                            Correct Answer
                          </p>
                        )}

                      </div>

                    </div>
                  </div>
                )
              )}

            </div>
          )}

        </section>


        {/* =================================================
         * Metadata
         * ================================================= */}

        <section
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
          <div className="mb-5">

            <p
              className="
                text-xs
                font-semibold
                uppercase
                tracking-wider
                text-slate-500
              "
            >
              Question Metadata
            </p>

            <h3
              className="
                mt-2
                text-lg
                font-bold
                text-slate-900
                dark:text-white
              "
            >
              Details
            </h3>

          </div>


          <div
            className="
              grid
              gap-5
              sm:grid-cols-2
              lg:grid-cols-4
            "
          >

            {/* Source */}

            <div>
              <p className="text-xs text-slate-500">
                Source
              </p>

              <p
                className="
                  mt-1
                  text-sm
                  font-semibold
                  text-slate-800
                  dark:text-slate-200
                "
              >
                {mcq.source_type}
              </p>
            </div>


            {/* Difficulty */}

            <div>
              <p className="text-xs text-slate-500">
                Difficulty
              </p>

              <p
                className="
                  mt-1
                  text-sm
                  font-semibold
                  text-slate-800
                  dark:text-slate-200
                "
              >
                {mcq.difficulty ??
                  "—"}
              </p>
            </div>


            {/* Marks */}

            <div>
              <p className="text-xs text-slate-500">
                Marks
              </p>

              <p
                className="
                  mt-1
                  text-sm
                  font-semibold
                  text-slate-800
                  dark:text-slate-200
                "
              >
                {mcq.marks ??
                  "—"}
              </p>
            </div>


            {/* Estimated Time */}

            <div>
              <p className="text-xs text-slate-500">
                Estimated Time
              </p>

              <p
                className="
                  mt-1
                  text-sm
                  font-semibold
                  text-slate-800
                  dark:text-slate-200
                "
              >
                {mcq.estimated_time_minutes ??
                  "—"}

                {mcq.estimated_time_minutes !==
                  null &&
                  " min"}
              </p>
            </div>

          </div>


          {/* Source Reference */}

          {mcq.source_reference && (
            <div className="mt-6">

              <p className="text-xs text-slate-500">
                Source Reference
              </p>

              <p
                className="
                  mt-1
                  text-sm
                  text-slate-700
                  dark:text-slate-300
                "
              >
                {mcq.source_reference}
              </p>

            </div>
          )}


          {/* Curriculum */}

          <div className="mt-6">

            <p className="text-xs text-slate-500">
              Curriculum Node
            </p>

            <p
              className="
                mt-1
                break-all
                text-sm
                text-slate-700
                dark:text-slate-300
              "
            >
              {mcq.curriculum_node_id ??
                "—"}
            </p>

          </div>


          {/* Current Revision */}

          <div className="mt-6">

            <p className="text-xs text-slate-500">
              Current Revision ID
            </p>

            <p
              className="
                mt-1
                break-all
                text-sm
                text-slate-700
                dark:text-slate-300
              "
            >
              {mcq.current_revision_id ??
                "No published revision"}
            </p>

          </div>

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
            MCQ Revision Workflow
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
            The question itself is the reusable identity.
            Its authoring content lives inside revisions.
            A draft revision does not become the current
            question revision until it is explicitly published.
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
            Once a revision is published, that revision is
            immutable. Future changes must be made through
            a new revision rather than modifying the published
            revision.
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
            Student visibility remains controlled by the
            published MCQ Set. Publishing a question revision
            does not independently expose the question to
            students.
          </p>

        </section>

      </div>
    </AdminPage>
  );
}