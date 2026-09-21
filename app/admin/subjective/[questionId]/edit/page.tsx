import Link from "next/link";

import AdminPage from "@/app/admin/components/layout/AdminPage";

import {
  getAdminSubjectiveQuestionById,
} from "@/app/lib/admin/subjective/subjective-question-bank.service";

import SubjectiveQuestionRevisionForm from "./SubjectiveQuestionRevisionForm";

/* =========================================================
 * Types
 * ========================================================= */

type PageProps = {
  params: Promise<{
    questionId: string;
  }>;
};

/* =========================================================
 * Page
 * ========================================================= */

export default async function AdminSubjectiveQuestionEditPage({
  params,
}: PageProps) {
  const { questionId } = await params;

  const question = await getAdminSubjectiveQuestionById(questionId);

  /* -------------------------------------------------------
   * Not found
   * ------------------------------------------------------- */

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
            p-8
            dark:border-slate-800
            dark:bg-slate-900
          "
        >
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Question not found
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
            The question may have been removed, archived, or its current
            revision may no longer be valid.
          </p>

          <div className="mt-6">
            <Link
              href="/admin/subjective/questions"
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
                hover:bg-slate-50
                dark:border-slate-700
                dark:text-slate-300
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

  /* -------------------------------------------------------
   * Current revision
   * ------------------------------------------------------- */

  const currentRevision = question.revision;

  if (!currentRevision) {
    return (
      <AdminPage
        title={`Edit Question #${question.admin_question_number}`}
        description="Create a new revision from the current Subjective question."
      >
        <div
          className="
            rounded-2xl
            border
            border-red-200
            bg-red-50
            p-6
            text-sm
            text-red-700
            dark:border-red-900/50
            dark:bg-red-950/20
            dark:text-red-400
          "
        >
          <p className="font-semibold">
            Current revision unavailable
          </p>

          <p className="mt-2 leading-6">
            The current question revision could not be loaded. A new revision
            cannot be created safely until the existing revision is available.
          </p>

          <div className="mt-5">
            <Link
              href={`/admin/subjective/${question.id}`}
              className="
                inline-flex
                rounded-xl
                border
                border-red-200
                bg-white
                px-4
                py-2.5
                text-sm
                font-semibold
                text-red-700
                transition
                hover:bg-red-100
                dark:border-red-900/50
                dark:bg-red-950/20
                dark:text-red-400
                dark:hover:bg-red-950/40
              "
            >
              ← Back to Question
            </Link>
          </div>
        </div>
      </AdminPage>
    );
  }

  /* -------------------------------------------------------
   * Page
   * ------------------------------------------------------- */

  return (
    <AdminPage
      title={`Edit Question #${question.admin_question_number}`}
      description="Create a new revision without changing the current revision."
      actions={
        <Link
          href={`/admin/subjective/${question.id}`}
          className="
            inline-flex
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
            hover:bg-slate-50
            dark:border-slate-700
            dark:bg-slate-900
            dark:text-slate-300
            dark:hover:bg-slate-800
          "
        >
          ← Back to Question
        </Link>
      }
    >
      <div className="space-y-6">

        {/* =================================================
         * Header
         * ================================================= */}

        <section>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Subjective Question Bank
          </div>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Edit Question #{question.admin_question_number}
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400">
            Editing this question will create a new DRAFT revision. The
            existing revision will remain unchanged until the new revision is
            explicitly published.
          </p>
        </section>

        {/* =================================================
         * Revision Safety
         * ================================================= */}

        <section
          className="
            rounded-2xl
            border
            border-blue-200
            bg-blue-50
            p-5
            dark:border-blue-900/50
            dark:bg-blue-950/20
          "
        >
          <div className="flex items-start gap-3">
            <div
              className="
                mt-0.5
                flex
                h-8
                w-8
                shrink-0
                items-center
                justify-center
                rounded-full
                bg-blue-100
                text-sm
                font-bold
                text-blue-700
                dark:bg-blue-900/40
                dark:text-blue-300
              "
            >
              ✓
            </div>

            <div>
              <p className="text-sm font-bold text-blue-900 dark:text-blue-300">
                Revision-safe editing
              </p>

              <p className="mt-1.5 text-sm leading-6 text-blue-800 dark:text-blue-400">
                This editor never overwrites the existing revision directly.
                When you save, your changes will become a separate DRAFT
                revision.
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-blue-700 dark:text-blue-500">
                <span>
                  Current Revision: v{currentRevision.revision_number}
                </span>

                <span>
                  Status: {currentRevision.status}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
         * Curriculum Context
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
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Curriculum Context
          </h2>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Curriculum mapping is fixed for this question and cannot be
            changed while creating a revision.
          </p>

          <div className="mt-5 grid gap-5 sm:grid-cols-3">

            {/* Chapter */}

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Chapter
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
                {question.chapter_name ?? "Not mapped"}
              </p>
            </div>

            {/* Question Number */}

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Question Number
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
                Q#{question.admin_question_number}
              </p>
            </div>

            {/* Question Type */}

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Type
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
                Subjective
              </p>
            </div>

          </div>
        </section>

        {/* =================================================
         * Revision Editor
         * ================================================= */}

        <SubjectiveQuestionRevisionForm
          questionId={question.id}
          initialQuestionText={
            currentRevision.question_text ??
            question.question_text
          }
          initialSolutionText={
            currentRevision.solution_text ?? ""
          }
          initialMistakeInsight={
            currentRevision.mistake_insight ?? ""
          }
          currentRevisionNumber={
            currentRevision.revision_number
          }
        />

      </div>
    </AdminPage>
  );
}