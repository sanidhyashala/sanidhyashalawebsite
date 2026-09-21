import Link from "next/link";
import { notFound } from "next/navigation";

import AdminPage from "@/app/admin/components/layout/AdminPage";

import {
  getAdminSubjectiveSetDetail,
} from "@/app/lib/admin/subjective/subjective-set.service";

import {
  getAdminAvailableSubjectiveQuestionsForSet,
} from "@/app/lib/admin/subjective/subjective-question-bank.service";

import SubjectiveQuestionSelector from "./SubjectiveQuestionSelector";

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

export default async function AdminSubjectiveQuestionsPage({
  params,
}: PageProps) {
  const {
    resourceId,
    setId,
  } = await params;

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

  const availableQuestions =
    await getAdminAvailableSubjectiveQuestionsForSet(
      normalizedSetId
    );

  const isDraft = set.status === "DRAFT";

  return (
    <AdminPage
      title={`Add Questions — ${set.title}`}
      description="Select Subjective questions from the appropriate chapter to build this practice set."
      sectionTitle="Question Bank"
      sectionDescription={`Set ${set.setNumber} · ${CATEGORY_LABELS[set.category]}`}
      actions={
        <Link
          href={`/admin/learning/subjective/${set.resourceId}/sets/${set.id}`}
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
          ← Back to Set
        </Link>
      }
    >
      <div className="space-y-6">
        {/* =====================================================
            SET CONTEXT
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
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Set
              </p>

              <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                Set {set.setNumber}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Category
              </p>

              <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                {CATEGORY_LABELS[set.category]}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Status
              </p>

              <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                {set.status}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Attached
              </p>

              <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                {set.questions.length}
              </p>
            </div>
          </div>
        </div>

        {/* =====================================================
            NON-DRAFT NOTICE
            ===================================================== */}

        {!isDraft ? (
          <div
            className="
              rounded-2xl
              border
              border-amber-200
              bg-amber-50
              p-6
              dark:border-amber-900/60
              dark:bg-amber-950/30
            "
          >
            <h2 className="text-base font-bold text-amber-900 dark:text-amber-200">
              This Set is {set.status}
            </h2>

            <p className="mt-2 text-sm leading-6 text-amber-800 dark:text-amber-300">
              Questions can only be added while a Subjective Set is in
              DRAFT status. Published and archived sets are locked.
            </p>
          </div>
        ) : (
          <>
            {/* =================================================
                QUESTION SELECTOR
                ================================================= */}

            <SubjectiveQuestionSelector
              setId={set.id}
              questions={availableQuestions}
            />

            {/* =================================================
                EMPTY STATE
                ================================================= */}

            {availableQuestions.length === 0 && (
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
                <div className="text-4xl">
                  📚
                </div>

                <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
                  No Available Questions
                </h2>

                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500 dark:text-slate-400">
                  There are currently no published Subjective questions
                  available from this resource chapter that are not already
                  attached to this Set.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </AdminPage>
  );
}