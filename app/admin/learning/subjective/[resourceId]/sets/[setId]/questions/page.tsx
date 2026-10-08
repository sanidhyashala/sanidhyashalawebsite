import Link from "next/link";

import AdminPage from "@/app/admin/components/layout/AdminPage";

import { createAdminSupabaseClient } from "@/app/lib/admin/supabase-admin";

import {
  getAdminAvailableSubjectiveQuestionsForSet,
} from "@/app/lib/admin/subjective/subjective-question-bank.service";

import {
  addSubjectiveQuestionsToSet,
} from "@/app/lib/admin/subjective/subjective-set-questions.actions";

type PageProps = {
  params: Promise<{
    resourceId: string;
    setId: string;
  }>;
};

function formatCategory(category: string | null) {
  if (!category) {
    return "Subjective Set";
  }

  return category
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
}

function formatDifficulty(
  difficulty: string | null
) {
  if (!difficulty) {
    return "—";
  }

  return difficulty
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) =>
      char.toUpperCase()
    );
}

export default async function AddQuestionsToSetPage({
  params,
}: PageProps) {
  const {
    resourceId,
    setId,
  } = await params;

  const supabase =
    createAdminSupabaseClient();

  /* ========================================================
   * 1. Load Subjective Set
   * ======================================================== */

  const {
    data: set,
    error: setError,
  } = await supabase
    .from("subjective_sets")
    .select(`
      id,
      resource_id,
      title,
      category,
      status,
      access_type
    `)
    .eq("id", setId)
    .maybeSingle();

  if (setError) {
    throw new Error(
      `Failed to load Subjective Set: ${setError.message}`
    );
  }

  if (!set) {
    throw new Error(
      "Subjective Set not found."
    );
  }

  /* ========================================================
   * 2. Verify resource → set relationship
   * ======================================================== */

  if (set.resource_id !== resourceId) {
    throw new Error(
      "Subjective Set does not belong to this resource."
    );
  }

  /* ========================================================
   * 3. Only DRAFT sets can receive questions
   * ======================================================== */

  if (set.status !== "DRAFT") {
    throw new Error(
      "Questions can only be added to a DRAFT Subjective Set."
    );
  }

  /* ========================================================
   * 4. Load Subjective Resource
   * ======================================================== */

  const {
    data: resource,
    error: resourceError,
  } = await supabase
    .from("resources")
    .select(`
      id,
      title,
      resource_type
    `)
    .eq("id", resourceId)
    .maybeSingle();

  if (resourceError) {
    throw new Error(
      `Failed to load Subjective Resource: ${resourceError.message}`
    );
  }

  if (!resource) {
    throw new Error(
      "Subjective Resource not found."
    );
  }

  if (resource.resource_type !== "SUBJECTIVE") {
    throw new Error(
      "This resource is not a Subjective resource."
    );
  }

  /* ========================================================
   * 5. Resolve Resource → Chapter
   * ======================================================== */

  const {
    data: resourceMappings,
    error: resourceMappingsError,
  } = await supabase
    .from("resource_curriculum_nodes")
    .select(`
      curriculum_node_id
    `)
    .eq(
      "resource_id",
      resourceId
    );

  if (resourceMappingsError) {
    throw new Error(
      `Failed to load Subjective chapter: ${resourceMappingsError.message}`
    );
  }

  const chapterId =
    resourceMappings?.[0]?.curriculum_node_id ??
    null;

  if (!chapterId) {
    throw new Error(
      "Subjective Resource is not assigned to a chapter."
    );
  }

  /* ========================================================
   * 6. Load Chapter
   * ======================================================== */

  const {
    data: chapter,
    error: chapterError,
  } = await supabase
    .from("curriculum_nodes")
    .select(`
      id,
      display_name,
      sequence_order
    `)
    .eq("id", chapterId)
    .maybeSingle();

  if (chapterError) {
    throw new Error(
      `Failed to load chapter: ${chapterError.message}`
    );
  }

  if (!chapter) {
    throw new Error(
      "Chapter not found."
    );
  }

  /* ========================================================
   * 7. Load already attached questions
   * ======================================================== */

  const {
    data: attachedRows,
    error: attachedError,
  } = await supabase
    .from("subjective_set_questions")
    .select(`
      question_id
    `)
    .eq(
      "set_id",
      setId
    );

  if (attachedError) {
    throw new Error(
      `Failed to load attached Subjective questions: ${attachedError.message}`
    );
  }

  const attachedQuestionIds =
    new Set(
      (attachedRows ?? []).map(
        (row) => row.question_id
      )
    );

  /* ========================================================
   * 8. Load available questions
   *
   * Existing service handles:
   * - Subjective question type
   * - chapter mapping
   * - question/revision validation
   * - DRAFT/PUBLISHED availability
   * ======================================================== */

  const availableQuestions =
    await getAdminAvailableSubjectiveQuestionsForSet(
      setId
    );

  /* ========================================================
   * 9. Do not show already attached questions
   * ======================================================== */

  const questionsToAdd =
    availableQuestions.filter(
      (question) =>
        !attachedQuestionIds.has(
          question.id
        )
    );

  /* ========================================================
   * 10. UI
   * ======================================================== */

  return (
    <AdminPage
      title="Add Questions to Set"
      description="Select existing Subjective questions from this chapter and add them to the set."
    >
      <div className="space-y-6">

        {/* ==================================================
         * Header / Context
         * ================================================== */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">

            <div>
              <div className="text-sm font-medium text-slate-500">
                Subjective Resource
              </div>

              <h1 className="mt-1 text-xl font-semibold text-slate-900">
                {resource.title}
              </h1>

              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                  Class Chapter: {chapter.display_name}
                </span>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                  {formatCategory(set.category)}
                </span>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                  {set.access_type}
                </span>

                <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">
                  DRAFT
                </span>
              </div>
            </div>

            <Link
              href={`/admin/learning/subjective/${resourceId}/sets/${setId}`}
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              ← Back to Set
            </Link>

          </div>
        </div>

        {/* ==================================================
         * Selection Form
         * ================================================== */}

        <form
          action={addSubjectiveQuestionsToSet}
          className="space-y-6"
        >
          <input
            type="hidden"
            name="set_id"
            value={setId}
          />

          {/* =================================================
           * Question List
           * ================================================= */}

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-200 px-6 py-5">
              <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Available Questions
                  </h2>

                  <p className="text-sm text-slate-500">
                    Select the questions you want to attach to this set.
                  </p>
                </div>

                <div className="text-sm text-slate-500">
                  {questionsToAdd.length} available
                  {" · "}
                  {attachedQuestionIds.size} already attached
                </div>
              </div>
            </div>

            {questionsToAdd.length === 0 ? (
              <div className="px-6 py-12 text-center">

                <div className="mx-auto max-w-md">

                  <h3 className="text-base font-semibold text-slate-900">
                    No questions available
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    There are no additional Subjective questions
                    available for this chapter. You can create a
                    new question and then return here.
                  </p>

                  <div className="mt-6 flex flex-wrap justify-center gap-3">

                    <Link
                      href={`/admin/learning/subjective/${resourceId}/questions/new`}
                      className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                    >
                      + Create New Question
                    </Link>

                    <Link
                      href={`/admin/learning/subjective/${resourceId}/sets/${setId}`}
                      className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      Back to Set
                    </Link>

                  </div>

                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">

                {questionsToAdd.map(
                  (question) => (
                    <label
                      key={question.id}
                      className="block cursor-pointer px-6 py-5 transition hover:bg-slate-50"
                    >
                      <div className="flex items-start gap-4">

                        {/* Checkbox */}

                        <div className="pt-1">
                          <input
                            type="checkbox"
                            name="question_ids"
                            value={question.id}
                            className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                          />
                        </div>

                        {/* Question Content */}

                        <div className="min-w-0 flex-1">

                          <div className="flex flex-wrap items-center gap-2">

                            <span className="text-sm font-semibold text-slate-900">
                              Q{question.admin_question_number}
                            </span>

                            {question.difficulty && (
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                                {formatDifficulty(
                                  question.difficulty
                                )}
                              </span>
                            )}

                            {question.marks !== null && (
                              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                                {question.marks} marks
                              </span>
                            )}

                            {question.estimated_time_minutes !==
                              null && (
                              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                                ~{question.estimated_time_minutes} min
                              </span>
                            )}

                            <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                              {question.status}
                            </span>

                          </div>

                          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                            {question.question_text}
                          </p>

                        </div>

                      </div>
                    </label>
                  )
                )}

              </div>
            )}

          </div>

          {/* =================================================
           * Actions
           * ================================================= */}

          {questionsToAdd.length > 0 && (
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">

              <Link
                href={`/admin/learning/subjective/${resourceId}/sets/${setId}`}
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </Link>

              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Add Selected Questions
              </button>

            </div>
          )}

        </form>
      </div>
    </AdminPage>
  );
}