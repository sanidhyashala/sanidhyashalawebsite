import Link from "next/link";

import AdminPage from "../../components/layout/AdminPage";
import MathTextPreview from "../../mcq-bank/components/MathTextPreview";

import PublishSubjectiveRevisionButton from "../components/PublishSubjectiveRevisionButton";

import {
  getAdminSubjectiveQuestionById,
} from "@/app/lib/admin/subjective/subjective-question-bank.service";

type PageProps = {
  params: Promise<{
    questionId: string;
  }>;
};

function statusClasses(status: string) {
  switch (status) {
    case "PUBLISHED":
      return `
        bg-green-100
        text-green-700
        dark:bg-green-900/30
        dark:text-green-400
      `;

    case "DRAFT":
      return `
        bg-amber-100
        text-amber-700
        dark:bg-amber-900/30
        dark:text-amber-400
      `;

    case "ARCHIVED":
      return `
        bg-slate-100
        text-slate-600
        dark:bg-slate-800
        dark:text-slate-400
      `;

    default:
      return `
        bg-slate-100
        text-slate-700
        dark:bg-slate-800
        dark:text-slate-300
      `;
  }
}

export default async function AdminSubjectiveQuestionDetailPage({
  params,
}: PageProps) {
  const { questionId } = await params;

  const question =
    await getAdminSubjectiveQuestionById(
      questionId
    );

  if (!question) {
    return (
      <AdminPage
        title="Subjective Question Not Found"
        description="The requested Subjective question could not be found."
      >
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
          <p className="text-sm text-slate-600 dark:text-slate-400">
            This Subjective question does not exist,
            or its current revision could not be loaded.
          </p>

          <div className="mt-5">
            <Link
              href="/admin/subjective/questions"
              className="
                inline-flex
                items-center
                rounded-xl
                border
                border-slate-300
                px-4
                py-2
                text-sm
                font-semibold
                text-slate-700
                transition
                hover:bg-slate-50
                dark:border-slate-700
                dark:text-slate-200
                dark:hover:bg-slate-800
              "
            >
              ← Back to Question Bank
            </Link>
          </div>
        </div>
      </AdminPage>
    );
  }

  const currentRevision =
    question.revision;

  const draftRevision =
    question.draft_revision;

  const hasDraftRevision =
    Boolean(
      draftRevision &&
        draftRevision.status === "DRAFT"
    );

  return (
    <AdminPage
      title={`Question #${question.admin_question_number}`}
      description="Subjective question details and revision lifecycle."
      actions={
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/admin/subjective/${question.id}/edit`}
            className="
              inline-flex
              items-center
              rounded-xl
              bg-blue-600
              px-4
              py-2
              text-sm
              font-semibold
              text-white
              transition
              hover:bg-blue-700
              dark:bg-blue-500
              dark:hover:bg-blue-600
            "
          >
            Edit Question
          </Link>

          <Link
            href="/admin/subjective/questions"
            className="
              inline-flex
              items-center
              rounded-xl
              border
              border-slate-300
              px-4
              py-2
              text-sm
              font-semibold
              text-slate-700
              transition
              hover:bg-slate-50
              dark:border-slate-700
              dark:text-slate-200
              dark:hover:bg-slate-800
            "
          >
            ← Question Bank
          </Link>
        </div>
      }
    >
      <div className="space-y-6">

        {/* =================================================
         * Current Question
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
              gap-4
              sm:flex-row
              sm:items-start
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
                  dark:text-slate-400
                "
              >
                Current Question
              </p>

              <h2
                className="
                  mt-1
                  text-lg
                  font-semibold
                  text-slate-900
                  dark:text-white
                "
              >
                Question #{question.admin_question_number}
              </h2>
            </div>

            <span
              className={`
                inline-flex
                w-fit
                rounded-full
                px-3
                py-1
                text-xs
                font-semibold
                ${statusClasses(question.status)}
              `}
            >
              {question.status}
            </span>
          </div>

          <div
            className="
              mt-6
              rounded-xl
              border
              border-slate-200
              bg-slate-50
              p-5
              dark:border-slate-800
              dark:bg-slate-950
            "
          >
            {currentRevision ? (
              <MathTextPreview
                value={
                  currentRevision.question_text
                }
              />
            ) : (
              <p className="text-sm text-red-600 dark:text-red-400">
                Current revision is unavailable.
              </p>
            )}
          </div>
        </section>

        {/* =================================================
         * Draft Revision
         * ================================================= */}

        {hasDraftRevision && draftRevision && (
          <section
            className="
              rounded-2xl
              border
              border-amber-200
              bg-amber-50
              p-6
              shadow-sm
              dark:border-amber-900/50
              dark:bg-amber-950/20
            "
          >
            <div
              className="
                flex
                flex-col
                gap-5
                sm:flex-row
                sm:items-start
                sm:justify-between
              "
            >
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <p
                    className="
                      text-xs
                      font-semibold
                      uppercase
                      tracking-wider
                      text-amber-700
                      dark:text-amber-400
                    "
                  >
                    Draft Revision
                  </p>

                  <span
                    className="
                      inline-flex
                      rounded-full
                      bg-amber-200
                      px-3
                      py-1
                      text-xs
                      font-semibold
                      text-amber-800
                      dark:bg-amber-900/50
                      dark:text-amber-300
                    "
                  >
                    Revision {draftRevision.revision_number}
                  </span>

                  <span
                    className="
                      inline-flex
                      rounded-full
                      bg-amber-100
                      px-3
                      py-1
                      text-xs
                      font-semibold
                      text-amber-700
                      dark:bg-amber-900/30
                      dark:text-amber-400
                    "
                  >
                    DRAFT
                  </span>
                </div>

                <h2
                  className="
                    mt-2
                    text-lg
                    font-semibold
                    text-slate-900
                    dark:text-white
                  "
                >
                  Revision {draftRevision.revision_number} is ready
                  for review
                </h2>

                <p
                  className="
                    mt-1
                    max-w-2xl
                    text-sm
                    leading-6
                    text-slate-600
                    dark:text-slate-400
                  "
                >
                  This revision is not yet authoritative.
                  Publishing it will make it the current
                  published revision and archive the
                  previously published revision.
                </p>
              </div>

              <PublishSubjectiveRevisionButton
                questionId={question.id}
                revisionId={draftRevision.id}
                revisionNumber={
                  draftRevision.revision_number
                }
              />
            </div>

            <div
              className="
                mt-6
                rounded-xl
                border
                border-amber-200
                bg-white
                p-5
                dark:border-amber-900/50
                dark:bg-slate-950
              "
            >
              <p
                className="
                  mb-3
                  text-xs
                  font-semibold
                  uppercase
                  tracking-wider
                  text-slate-500
                  dark:text-slate-400
                "
              >
                Draft Question
              </p>

              <MathTextPreview
                value={
                  draftRevision.question_text
                }
              />
            </div>

            <div
              className="
                mt-4
                rounded-xl
                border
                border-amber-200
                bg-amber-100/60
                p-4
                dark:border-amber-900/50
                dark:bg-amber-950/30
              "
            >
              <p
                className="
                  text-xs
                  leading-5
                  text-amber-800
                  dark:text-amber-300
                "
              >
                <strong>Revision safety:</strong>{" "}
                the currently published revision remains
                unchanged until this draft is explicitly
                published.
              </p>
            </div>
          </section>
        )}

        {/* =================================================
         * Revision Information
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
              gap-2
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
                  dark:text-slate-400
                "
              >
                Revision Information
              </p>

              <h2
                className="
                  mt-1
                  text-lg
                  font-semibold
                  text-slate-900
                  dark:text-white
                "
              >
                Revision lifecycle
              </h2>
            </div>

            {currentRevision && (
              <span
                className="
                  inline-flex
                  w-fit
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
                Current Revision{" "}
                {currentRevision.revision_number}
              </span>
            )}
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div
              className="
                rounded-xl
                border
                border-slate-200
                p-4
                dark:border-slate-800
              "
            >
              <p
                className="
                  text-xs
                  font-medium
                  text-slate-500
                  dark:text-slate-400
                "
              >
                Current Revision ID
              </p>

              <p
                className="
                  mt-1
                  break-all
                  font-mono
                  text-xs
                  text-slate-800
                  dark:text-slate-200
                "
              >
                {question.current_revision_id ??
                  "—"}
              </p>
            </div>

            <div
              className="
                rounded-xl
                border
                border-slate-200
                p-4
                dark:border-slate-800
              "
            >
              <p
                className="
                  text-xs
                  font-medium
                  text-slate-500
                  dark:text-slate-400
                "
              >
                Draft Revision
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
                {draftRevision
                  ? `Revision ${draftRevision.revision_number}`
                  : "No draft revision"}
              </p>
            </div>
          </div>

          <div
            className="
              mt-5
              rounded-xl
              border
              border-blue-200
              bg-blue-50
              p-4
              dark:border-blue-900/50
              dark:bg-blue-950/20
            "
          >
            <p
              className="
                text-sm
                leading-6
                text-blue-800
                dark:text-blue-300
              "
            >
              <strong>Revision-safe editing:</strong>{" "}
              editing this question creates a new DRAFT
              revision. Published revisions are never
              modified directly.
            </p>
          </div>
        </section>

        {/* =================================================
         * Curriculum
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
          <p
            className="
              text-xs
              font-semibold
              uppercase
              tracking-wider
              text-slate-500
              dark:text-slate-400
            "
          >
            Curriculum
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p
                className="
                  text-xs
                  font-medium
                  text-slate-500
                  dark:text-slate-400
                "
              >
                Chapter
              </p>

              <p
                className="
                  mt-1
                  text-sm
                  font-semibold
                  text-slate-900
                  dark:text-white
                "
              >
                {question.chapter_name ??
                  "Not mapped"}
              </p>
            </div>

            <div>
              <p
                className="
                  text-xs
                  font-medium
                  text-slate-500
                  dark:text-slate-400
                "
              >
                Chapter ID
              </p>

              <p
                className="
                  mt-1
                  break-all
                  font-mono
                  text-xs
                  text-slate-700
                  dark:text-slate-300
                "
              >
                {question.chapter_id ??
                  "—"}
              </p>
            </div>
          </div>
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
          <p
            className="
              text-xs
              font-semibold
              uppercase
              tracking-wider
              text-slate-500
              dark:text-slate-400
            "
          >
            Question Metadata
          </p>

          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Marks
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                {question.marks ?? "—"}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Difficulty
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                {question.difficulty ?? "—"}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Estimated Time
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                {question.estimated_time_minutes !==
                null
                  ? `${question.estimated_time_minutes} min`
                  : "—"}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Source
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                {question.source_type}
              </p>
            </div>
          </div>

          {question.source_reference && (
            <div className="mt-5">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Source Reference
              </p>

              <p className="mt-1 text-sm text-slate-800 dark:text-slate-200">
                {question.source_reference}
              </p>
            </div>
          )}
        </section>

        {/* =================================================
         * Navigation
         * ================================================= */}

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/admin/subjective/${question.id}/edit`}
            className="
              inline-flex
              items-center
              rounded-xl
              bg-blue-600
              px-4
              py-2
              text-sm
              font-semibold
              text-white
              transition
              hover:bg-blue-700
              dark:bg-blue-500
              dark:hover:bg-blue-600
            "
          >
            Edit Question
          </Link>

          <Link
            href="/admin/subjective/questions"
            className="
              inline-flex
              items-center
              rounded-xl
              border
              border-slate-300
              px-4
              py-2
              text-sm
              font-semibold
              text-slate-700
              transition
              hover:bg-slate-50
              dark:border-slate-700
              dark:text-slate-200
              dark:hover:bg-slate-800
            "
          >
            ← Back to Question Bank
          </Link>
        </div>
      </div>
    </AdminPage>
  );
}