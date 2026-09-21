import "server-only";

import { supabaseServer } from "@/lib/supabase-server";

import type {
  SubjectiveSetSummary,
  SubjectiveCategory,
  SubjectiveAccessType,
  SubjectiveSetStatus,
} from "@/app/lib/learning/subjective/types";

/*
 * =========================================================
 * Admin Subjective Set Detail
 * =========================================================
 */

export type AdminSubjectiveSetDetail = {
  id: string;
  resourceId: string;

  category: SubjectiveCategory;

  title: string;
  description: string | null;

  setNumber: number;
  displayOrder: number;

  status: SubjectiveSetStatus;
  accessType: SubjectiveAccessType;

  questions: {
    id: string;
    questionId: string;
    questionRevisionId: string;
    questionOrder: number;
    marks: number;
    questionText: string;
  }[];
};

/*
 * =========================================================
 * Get Subjective Sets for a Resource
 * =========================================================
 */

export async function getAdminSubjectiveSets(
  resourceId: string
): Promise<SubjectiveSetSummary[]> {
  const normalizedResourceId = resourceId.trim();

  if (!normalizedResourceId) {
    throw new Error(
      "Subjective resource ID is required."
    );
  }

  /*
   * Subjective admin reads use the privileged
   * server-side Supabase client.
   */

  const supabase = supabaseServer;

  /*
   * -------------------------------------------------------
   * Load Sets
   * -------------------------------------------------------
   */

  const { data: sets, error: setsError } =
    await supabase
      .from("subjective_sets")
      .select(`
        id,
        resource_id,
        category,
        title,
        description,
        set_number,
        display_order,
        status,
        access_type
      `)
      .eq(
        "resource_id",
        normalizedResourceId
      )
      .order("set_number", {
        ascending: true,
      })
      .order("display_order", {
        ascending: true,
      });

  if (setsError) {
    throw new Error(
      `Failed to load Subjective Sets: ${setsError.message}`
    );
  }

  if (!sets || sets.length === 0) {
    return [];
  }

  /*
   * -------------------------------------------------------
   * Load Question Counts
   * -------------------------------------------------------
   */

  const setIds = sets.map(
    (set) => set.id
  );

  const {
    data: questionRows,
    error: questionError,
  } = await supabase
    .from("subjective_set_questions")
    .select("set_id")
    .in("set_id", setIds);

  if (questionError) {
    throw new Error(
      `Failed to load Subjective Set question counts: ${questionError.message}`
    );
  }

  const questionCountMap =
    new Map<string, number>();

  for (const row of questionRows ?? []) {
    questionCountMap.set(
      row.set_id,
      (questionCountMap.get(row.set_id) ??
        0) + 1
    );
  }

  /*
   * -------------------------------------------------------
   * Normalize
   * -------------------------------------------------------
   */

  return sets.map((set) => ({
    id: set.id,
    resourceId: set.resource_id,

    category: set.category,
    title: set.title,
    description: set.description,

    setNumber: set.set_number,
    displayOrder: set.display_order,

    status: set.status,
    accessType: set.access_type,

    questionCount:
      questionCountMap.get(set.id) ?? 0,
  }));
}

/*
 * =========================================================
 * Get Single Subjective Set Detail
 * =========================================================
 */

export async function getAdminSubjectiveSetDetail(
  resourceId: string,
  setId: string
): Promise<AdminSubjectiveSetDetail | null> {
  const normalizedResourceId =
    resourceId.trim();

  const normalizedSetId =
    setId.trim();

  if (!normalizedResourceId) {
    throw new Error(
      "Subjective resource ID is required."
    );
  }

  if (!normalizedSetId) {
    throw new Error(
      "Subjective Set ID is required."
    );
  }

  const supabase = supabaseServer;

  /*
   * -------------------------------------------------------
   * Load Set
   * -------------------------------------------------------
   */

  const {
    data: set,
    error: setError,
  } = await supabase
    .from("subjective_sets")
    .select(`
      id,
      resource_id,
      category,
      title,
      description,
      set_number,
      display_order,
      status,
      access_type
    `)
    .eq("id", normalizedSetId)
    .eq(
      "resource_id",
      normalizedResourceId
    )
    .maybeSingle();

  if (setError) {
    throw new Error(
      `Failed to load Subjective Set: ${setError.message}`
    );
  }

  if (!set) {
    return null;
  }

  /*
   * -------------------------------------------------------
   * Load Attached Questions
   * -------------------------------------------------------
   */

  const {
    data: setQuestions,
    error: questionsError,
  } = await supabase
    .from("subjective_set_questions")
    .select(`
      id,
      question_id,
      question_revision_id,
      question_order,
      marks
    `)
    .eq("set_id", normalizedSetId)
    .order("question_order", {
      ascending: true,
    });

  if (questionsError) {
    throw new Error(
      `Failed to load Subjective Set questions: ${questionsError.message}`
    );
  }

  /*
   * -------------------------------------------------------
   * Empty Set
   * -------------------------------------------------------
   */

  if (
    !setQuestions ||
    setQuestions.length === 0
  ) {
    return {
      id: set.id,
      resourceId: set.resource_id,

      category: set.category,
      title: set.title,
      description: set.description,

      setNumber: set.set_number,
      displayOrder: set.display_order,

      status: set.status,
      accessType: set.access_type,

      questions: [],
    };
  }

  /*
   * -------------------------------------------------------
   * Load EXACT frozen revisions
   * -------------------------------------------------------
   *
   * Important:
   * We use the revision stored in
   * subjective_set_questions.
   *
   * We do NOT use questions.current_revision_id.
   */

  const revisionIds =
    setQuestions.map(
      (question) =>
        question.question_revision_id
    );

  const {
    data: revisions,
    error: revisionsError,
  } = await supabase
    .from("question_revisions")
    .select(`
      id,
      question_id,
      question_text,
      status
    `)
    .in("id", revisionIds);

  if (revisionsError) {
    throw new Error(
      `Failed to load Subjective question revisions: ${revisionsError.message}`
    );
  }

  /*
   * -------------------------------------------------------
   * Revision Lookup
   * -------------------------------------------------------
   */

  const revisionMap =
    new Map<
      string,
      {
        id: string;
        question_id: string;
        question_text: string;
        status: string;
      }
    >();

  for (const revision of revisions ?? []) {
    revisionMap.set(
      revision.id,
      revision
    );
  }

  /*
   * -------------------------------------------------------
   * Normalize Questions
   * -------------------------------------------------------
   */

  const questions =
    setQuestions.map((question) => {
      const revision =
        revisionMap.get(
          question.question_revision_id
        );

      return {
        id: question.id,

        questionId:
          question.question_id,

        questionRevisionId:
          question.question_revision_id,

        questionOrder:
          question.question_order,

        marks: Number(question.marks),

        questionText:
          revision?.question_text ??
          "Question revision not found.",
      };
    });

  /*
   * -------------------------------------------------------
   * Final Result
   * -------------------------------------------------------
   */

  return {
    id: set.id,
    resourceId: set.resource_id,

    category: set.category,
    title: set.title,
    description: set.description,

    setNumber: set.set_number,
    displayOrder: set.display_order,

    status: set.status,
    accessType: set.access_type,

    questions,
  };
}