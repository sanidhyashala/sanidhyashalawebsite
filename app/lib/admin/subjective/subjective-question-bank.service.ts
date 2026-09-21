import "server-only";

import { createAdminSupabaseClient } from "@/app/lib/admin/supabase-admin";

/* =========================================================
 * Types
 * ========================================================= */

export type AdminSubjectiveQuestionRevision = {
  id: string;

  revision_number: number;

  question_text: string;

  solution_text?: string | null;

  mistake_insight?: string | null;

  status: string;
};

export type AdminSubjectiveQuestion = {
  id: string;

  admin_question_number: number;

  question_text: string;

  question_type: string;

  source_type: string;

  source_reference: string | null;

  difficulty: string | null;

  marks: number | null;

  estimated_time_minutes: number | null;

  status: string;

  current_revision_id: string | null;

  created_at: string;

  updated_at: string;

  chapter_id: string | null;

  chapter_name: string | null;

  chapter_sequence_order: number | null;

  /*
   * Current authoritative revision.
   *
   * IMPORTANT:
   * This remains the revision pointed to by
   * questions.current_revision_id.
   *
   * It must NOT be replaced by a newer DRAFT revision.
   */
  revision: AdminSubjectiveQuestionRevision | null;

  /*
   * Latest DRAFT revision, if one exists.
   *
   * This is intentionally separate from `revision`.
   *
   * Example:
   *
   *   revision       → Revision 1 PUBLISHED
   *   draft_revision → Revision 2 DRAFT
   *
   * This allows the admin UI to safely publish the
   * intended draft revision.
   */
  draft_revision: AdminSubjectiveQuestionRevision | null;
};

export type AdminSubjectiveQuestionBankItem =
  AdminSubjectiveQuestion;

/* =========================================================
 * Question Bank Class Summary
 * ========================================================= */

export type AdminSubjectiveQuestionBankClass = {
  class_name: string;

  class_slug: string;

  total_questions: number;

  draft_questions: number;

  published_questions: number;
};

/* =========================================================
 * Question Bank Chapter
 * ========================================================= */

export type AdminSubjectiveQuestionBankChapter = {
  id: string;

  name: string;

  sequence_order: number | null;

  total_questions: number;

  draft_questions: number;

  published_questions: number;
};

/* =========================================================
 * Helpers
 * ========================================================= */

function compareText(
  a: string | null,
  b: string | null
) {
  return (a ?? "").localeCompare(
    b ?? "",
    undefined,
    {
      numeric: true,
      sensitivity: "base",
    }
  );
}

/* =========================================================
 * Get all Subjective Questions
 *
 * Legacy/general Question Bank function.
 *
 * This continues to support the existing Subjective
 * Question Bank architecture.
 * ========================================================= */

export async function getAdminSubjectiveQuestionBank(): Promise<
  AdminSubjectiveQuestionBankItem[]
> {
  const supabase =
    createAdminSupabaseClient();

  /* -------------------------------------------------------
   * 1. Load Subjective questions
   * ------------------------------------------------------- */

  const {
    data: questions,
    error: questionsError,
  } = await supabase
    .from("questions")
    .select(`
      id,
      admin_question_number,
      question_text,
      question_type,
      source_type,
      source_reference,
      difficulty,
      marks,
      estimated_time_minutes,
      status,
      current_revision_id,
      created_at,
      updated_at
    `)
    .eq("question_type", "SUBJECTIVE")
    .in("status", ["DRAFT", "PUBLISHED"])
    .order("admin_question_number", {
      ascending: true,
    });

  if (questionsError) {
    throw new Error(
      `Failed to load Subjective Question Bank: ${questionsError.message}`
    );
  }

  if (
    !questions ||
    questions.length === 0
  ) {
    return [];
  }

  /* -------------------------------------------------------
   * 2. Load current revisions
   * ------------------------------------------------------- */

  const revisionIds = questions
    .map(
      (question) =>
        question.current_revision_id
    )
    .filter(
      (
        revisionId
      ): revisionId is string =>
        Boolean(revisionId)
    );

  if (revisionIds.length === 0) {
    return [];
  }

  const {
    data: revisions,
    error: revisionsError,
  } = await supabase
    .from("question_revisions")
    .select(`
      id,
      question_id,
      revision_number,
      question_text,
      status
    `)
    .in("id", revisionIds);

  if (revisionsError) {
    throw new Error(
      `Failed to load Subjective Question revisions: ${revisionsError.message}`
    );
  }

  const revisionById =
    new Map<
      string,
      {
        id: string;
        question_id: string;
        revision_number: number;
        question_text: string;
        status: string;
      }
    >();

  for (const revision of revisions ?? []) {
    revisionById.set(
      revision.id,
      revision
    );
  }

  /* -------------------------------------------------------
   * 3. Load curriculum mappings
   * ------------------------------------------------------- */

  const questionIds = questions.map(
    (question) => question.id
  );

  const {
    data: curriculumMappings,
    error: curriculumMappingsError,
  } = await supabase
    .from("question_curriculum_nodes")
    .select(`
      question_id,
      curriculum_node_id
    `)
    .in(
      "question_id",
      questionIds
    );

  if (curriculumMappingsError) {
    throw new Error(
      `Failed to load Subjective Question curriculum mappings: ${curriculumMappingsError.message}`
    );
  }

  const chapterByQuestionId =
    new Map<string, string>();

  for (
    const mapping of
      curriculumMappings ?? []
  ) {
    if (
      !chapterByQuestionId.has(
        mapping.question_id
      )
    ) {
      chapterByQuestionId.set(
        mapping.question_id,
        mapping.curriculum_node_id
      );
    }
  }

  /* -------------------------------------------------------
   * 4. Load chapters
   * ------------------------------------------------------- */

  const chapterIds = Array.from(
    new Set(
      Array.from(
        chapterByQuestionId.values()
      )
    )
  );

  const chapterById =
    new Map<
      string,
      {
        id: string;
        display_name: string;
        sequence_order: number | null;
      }
    >();

  if (chapterIds.length > 0) {
    const {
      data: chapters,
      error: chaptersError,
    } = await supabase
      .from("curriculum_nodes")
      .select(`
        id,
        display_name,
        sequence_order
      `)
      .in(
        "id",
        chapterIds
      );

    if (chaptersError) {
      throw new Error(
        `Failed to load Subjective Question chapters: ${chaptersError.message}`
      );
    }

    for (const chapter of chapters ?? []) {
      chapterById.set(
        chapter.id,
        chapter
      );
    }
  }

  /* -------------------------------------------------------
   * 5. Build final result
   * ------------------------------------------------------- */

  const result: AdminSubjectiveQuestionBankItem[] =
    [];

  for (const question of questions) {
    const revisionId =
      question.current_revision_id;

    if (!revisionId) {
      continue;
    }

    const revision =
      revisionById.get(revisionId);

    if (!revision) {
      continue;
    }

    if (
      revision.question_id !==
      question.id
    ) {
      continue;
    }

    if (
      revision.status !==
      question.status
    ) {
      continue;
    }

    const chapterId =
      chapterByQuestionId.get(
        question.id
      ) ?? null;

    const chapter =
      chapterId
        ? chapterById.get(
            chapterId
          )
        : null;

    result.push({
      id: question.id,

      admin_question_number:
        question.admin_question_number,

      question_text:
        revision.question_text,

      question_type:
        question.question_type,

      source_type:
        question.source_type,

      source_reference:
        question.source_reference,

      difficulty:
        question.difficulty,

      marks:
        question.marks,

      estimated_time_minutes:
        question.estimated_time_minutes,

      status:
        question.status,

      current_revision_id:
        question.current_revision_id,

      created_at:
        question.created_at,

      updated_at:
        question.updated_at,

      chapter_id:
        chapter?.id ?? null,

      chapter_name:
        chapter?.display_name ?? null,

      chapter_sequence_order:
        chapter?.sequence_order ?? null,

      revision: {
        id: revision.id,

        revision_number:
          revision.revision_number,

        question_text:
          revision.question_text,

        status:
          revision.status,
      },

      /*
       * This general/legacy function does not need
       * draft revision data.
       *
       * Keeping it null preserves the existing
       * lightweight Question Bank behavior.
       */
      draft_revision: null,
    });
  }

  /* -------------------------------------------------------
   * 6. Stable ordering
   * ------------------------------------------------------- */

  result.sort(
    (a, b) => {
      const chapterOrderA =
        a.chapter_sequence_order ??
        999999;

      const chapterOrderB =
        b.chapter_sequence_order ??
        999999;

      if (
        chapterOrderA !==
        chapterOrderB
      ) {
        return (
          chapterOrderA -
          chapterOrderB
        );
      }

      return (
        a.admin_question_number -
        b.admin_question_number
      );
    }
  );

  return result;
}

/* =========================================================
 * Get Subjective Question Bank Classes
 *
 * Returns only classes that actually contain Subjective
 * questions.
 *
 * IMPORTANT:
 * No question text is loaded here.
 * ========================================================= */

export async function getAdminSubjectiveQuestionBankClasses(): Promise<
  AdminSubjectiveQuestionBankClass[]
> {
  const supabase =
    createAdminSupabaseClient();

  /* -------------------------------------------------------
   * 1. Load active Subjective questions
   * ------------------------------------------------------- */

  const {
    data: questions,
    error: questionsError,
  } = await supabase
    .from("questions")
    .select(`
      id,
      status
    `)
    .eq(
      "question_type",
      "SUBJECTIVE"
    )
    .in(
      "status",
      ["DRAFT", "PUBLISHED"]
    );

  if (questionsError) {
    throw new Error(
      `Failed to load Subjective Question Bank classes: ${questionsError.message}`
    );
  }

  if (
    !questions ||
    questions.length === 0
  ) {
    return [];
  }

  /* -------------------------------------------------------
   * 2. Question → curriculum mapping
   * ------------------------------------------------------- */

  const questionIds =
    questions.map(
      (question) => question.id
    );

  const {
    data: mappings,
    error: mappingsError,
  } = await supabase
    .from(
      "question_curriculum_nodes"
    )
    .select(`
      question_id,
      curriculum_node_id
    `)
    .in(
      "question_id",
      questionIds
    );

  if (mappingsError) {
    throw new Error(
      `Failed to load Subjective curriculum mappings: ${mappingsError.message}`
    );
  }

  if (
    !mappings ||
    mappings.length === 0
  ) {
    return [];
  }

  /* -------------------------------------------------------
   * 3. Chapter IDs
   * ------------------------------------------------------- */

  const chapterIds = Array.from(
    new Set(
      mappings.map(
        (mapping) =>
          mapping.curriculum_node_id
      )
    )
  );

  /* -------------------------------------------------------
   * 4. Chapters → curriculum version
   * ------------------------------------------------------- */

  const {
    data: chapters,
    error: chaptersError,
  } = await supabase
    .from("curriculum_nodes")
    .select(`
      id,
      curriculum_version_id
    `)
    .in(
      "id",
      chapterIds
    );

  if (chaptersError) {
    throw new Error(
      `Failed to load Subjective curriculum chapters: ${chaptersError.message}`
    );
  }

  if (
    !chapters ||
    chapters.length === 0
  ) {
    return [];
  }

  const chapterById =
    new Map<
      string,
      {
        curriculum_version_id: string;
      }
    >();

  for (const chapter of chapters) {
    chapterById.set(
      chapter.id,
      {
        curriculum_version_id:
          chapter.curriculum_version_id,
      }
    );
  }

  /* -------------------------------------------------------
   * 5. Curriculum versions
   * ------------------------------------------------------- */

  const versionIds =
    Array.from(
      new Set(
        chapters.map(
          (chapter) =>
            chapter.curriculum_version_id
        )
      )
    );

  const {
    data: versions,
    error: versionsError,
  } = await supabase
    .from(
      "curriculum_versions"
    )
    .select(`
      id,
      program_id
    `)
    .in(
      "id",
      versionIds
    )
    .eq(
      "status",
      "PUBLISHED"
    );

  if (versionsError) {
    throw new Error(
      `Failed to load Subjective curriculum versions: ${versionsError.message}`
    );
  }

  if (
    !versions ||
    versions.length === 0
  ) {
    return [];
  }

  const versionById =
    new Map<
      string,
      {
        program_id: string;
      }
    >();

  for (const version of versions) {
    versionById.set(
      version.id,
      {
        program_id:
          version.program_id,
      }
    );
  }

  /* -------------------------------------------------------
   * 6. Programs = Classes
   * ------------------------------------------------------- */

  const programIds =
    Array.from(
      new Set(
        versions.map(
          (version) =>
            version.program_id
        )
      )
    );

  const {
    data: programs,
    error: programsError,
  } = await supabase
    .from("programs")
    .select(`
      id,
      name,
      slug
    `)
    .in(
      "id",
      programIds
    );

  if (programsError) {
    throw new Error(
      `Failed to load Subjective Question Bank classes: ${programsError.message}`
    );
  }

  if (
    !programs ||
    programs.length === 0
  ) {
    return [];
  }

  const programById =
    new Map<
      string,
      {
        name: string;
        slug: string;
      }
    >();

  for (const program of programs) {
    programById.set(
      program.id,
      {
        name: program.name,
        slug: program.slug,
      }
    );
  }

  /* -------------------------------------------------------
   * 7. Question lookup
   * ------------------------------------------------------- */

  const questionById =
    new Map<
      string,
      {
        status: string;
      }
    >();

  for (const question of questions) {
    questionById.set(
      question.id,
      {
        status:
          question.status,
      }
    );
  }

  /* -------------------------------------------------------
   * 8. Aggregate class counts
   * ------------------------------------------------------- */

  const classMap =
    new Map<
      string,
      AdminSubjectiveQuestionBankClass
    >();

  for (const mapping of mappings) {
    const question =
      questionById.get(
        mapping.question_id
      );

    if (!question) {
      continue;
    }

    const chapter =
      chapterById.get(
        mapping.curriculum_node_id
      );

    if (!chapter) {
      continue;
    }

    const version =
      versionById.get(
        chapter.curriculum_version_id
      );

    if (!version) {
      continue;
    }

    const program =
      programById.get(
        version.program_id
      );

    if (!program) {
      continue;
    }

    const classSlug =
      program.slug;

    let classItem =
      classMap.get(
        classSlug
      );

    if (!classItem) {
      classItem = {
        class_name:
          program.name,

        class_slug:
          program.slug,

        total_questions:
          0,

        draft_questions:
          0,

        published_questions:
          0,
      };

      classMap.set(
        classSlug,
        classItem
      );
    }

    classItem.total_questions += 1;

    if (
      question.status ===
      "DRAFT"
    ) {
      classItem.draft_questions += 1;
    }

    if (
      question.status ===
      "PUBLISHED"
    ) {
      classItem.published_questions += 1;
    }
  }

  const result =
    Array.from(
      classMap.values()
    );

  result.sort(
    (a, b) =>
      compareText(
        a.class_name,
        b.class_name
      )
  );

  return result;
}

/* =========================================================
 * Get chapters for a particular class
 *
 * IMPORTANT:
 * No question text is loaded here.
 * ========================================================= */

export async function getAdminSubjectiveQuestionBankChapters(
  classSlug: string
): Promise<{
  className: string;
  chapters: AdminSubjectiveQuestionBankChapter[];
}> {
  const normalizedSlug =
    classSlug.trim();

  if (!normalizedSlug) {
    throw new Error(
      "Class slug is required."
    );
  }

  const supabase =
    createAdminSupabaseClient();

  /* -------------------------------------------------------
   * 1. Find class/program
   * ------------------------------------------------------- */

  const {
    data: programs,
    error: programsError,
  } = await supabase
    .from("programs")
    .select(`
      id,
      name,
      slug
    `)
    .eq(
      "slug",
      normalizedSlug
    )
    .limit(1);

  if (programsError) {
    throw new Error(
      `Failed to load Subjective class: ${programsError.message}`
    );
  }

  const program =
    programs?.[0];

  if (!program) {
    throw new Error(
      "Subjective Question Bank class not found."
    );
  }

  /* -------------------------------------------------------
   * 2. Published curriculum versions
   * ------------------------------------------------------- */

  const {
    data: versions,
    error: versionsError,
  } = await supabase
    .from(
      "curriculum_versions"
    )
    .select(`
      id
    `)
    .eq(
      "program_id",
      program.id
    )
    .eq(
      "status",
      "PUBLISHED"
    );

  if (versionsError) {
    throw new Error(
      `Failed to load Subjective curriculum versions: ${versionsError.message}`
    );
  }

  if (
    !versions ||
    versions.length === 0
  ) {
    return {
      className: program.name,
      chapters: [],
    };
  }

  const versionIds =
    versions.map(
      (version) => version.id
    );

  /* -------------------------------------------------------
   * 3. Load chapters
   * ------------------------------------------------------- */

  const {
    data: chapters,
    error: chaptersError,
  } = await supabase
    .from("curriculum_nodes")
    .select(`
      id,
      display_name,
      sequence_order,
      curriculum_version_id
    `)
    .in(
      "curriculum_version_id",
      versionIds
    )
    .eq(
      "status",
      "ACTIVE"
    )
    .not(
      "parent_node_id",
      "is",
      null
    )
    .order(
      "sequence_order",
      {
        ascending: true,
      }
    );

  if (chaptersError) {
    throw new Error(
      `Failed to load Subjective class chapters: ${chaptersError.message}`
    );
  }

  if (
    !chapters ||
    chapters.length === 0
  ) {
    return {
      className: program.name,
      chapters: [],
    };
  }

  const chapterIds =
    chapters.map(
      (chapter) => chapter.id
    );

  /* -------------------------------------------------------
   * 4. Load question mappings for these chapters
   * ------------------------------------------------------- */

  const {
    data: mappings,
    error: mappingsError,
  } = await supabase
    .from(
      "question_curriculum_nodes"
    )
    .select(`
      question_id,
      curriculum_node_id
    `)
    .in(
      "curriculum_node_id",
      chapterIds
    );

  if (mappingsError) {
    throw new Error(
      `Failed to load Subjective chapter questions: ${mappingsError.message}`
    );
  }

  const questionIds =
    Array.from(
      new Set(
        (mappings ?? []).map(
          (mapping) =>
            mapping.question_id
        )
      )
    );

  /* -------------------------------------------------------
   * 5. Load question statuses
   * ------------------------------------------------------- */

  const questionById =
    new Map<
      string,
      {
        status: string;
      }
    >();

  if (
    questionIds.length > 0
  ) {
    const {
      data: questions,
      error: questionsError,
    } = await supabase
      .from("questions")
      .select(`
        id,
        status
      `)
      .in(
        "id",
        questionIds
      )
      .eq(
        "question_type",
        "SUBJECTIVE"
      )
      .in(
        "status",
        ["DRAFT", "PUBLISHED"]
      );

    if (questionsError) {
      throw new Error(
        `Failed to load Subjective chapter question statuses: ${questionsError.message}`
      );
    }

    for (const question of questions ?? []) {
      questionById.set(
        question.id,
        {
          status:
            question.status,
        }
      );
    }
  }

  /* -------------------------------------------------------
   * 6. Count questions per chapter
   * ------------------------------------------------------- */

  const countsByChapter =
    new Map<
      string,
      {
        total: number;
        draft: number;
        published: number;
      }
    >();

  for (const mapping of mappings ?? []) {
    const question =
      questionById.get(
        mapping.question_id
      );

    if (!question) {
      continue;
    }

    let count =
      countsByChapter.get(
        mapping.curriculum_node_id
      );

    if (!count) {
      count = {
        total: 0,
        draft: 0,
        published: 0,
      };

      countsByChapter.set(
        mapping.curriculum_node_id,
        count
      );
    }

    count.total += 1;

    if (
      question.status ===
      "DRAFT"
    ) {
      count.draft += 1;
    }

    if (
      question.status ===
      "PUBLISHED"
    ) {
      count.published += 1;
    }
  }

  /* -------------------------------------------------------
   * 7. Build chapter result
   *
   * Only chapters containing Subjective questions are shown.
   * ------------------------------------------------------- */

  const result: AdminSubjectiveQuestionBankChapter[] =
    [];

  for (const chapter of chapters) {
    const count =
      countsByChapter.get(
        chapter.id
      );

    if (!count) {
      continue;
    }

    result.push({
      id: chapter.id,

      name:
        chapter.display_name,

      sequence_order:
        chapter.sequence_order,

      total_questions:
        count.total,

      draft_questions:
        count.draft,

      published_questions:
        count.published,
    });
  }

  result.sort(
    (a, b) => {
      const orderA =
        a.sequence_order ??
        999999;

      const orderB =
        b.sequence_order ??
        999999;

      if (
        orderA !== orderB
      ) {
        return (
          orderA -
          orderB
        );
      }

      return compareText(
        a.name,
        b.name
      );
    }
  );

  return {
    className:
      program.name,

    chapters:
      result,
  };
}

/* =========================================================
 * Get Questions for Class + Chapter
 *
 * This is the actual drill-down query.
 *
 * Supports:
 *   - ALL
 *   - DRAFT
 *   - PUBLISHED
 *   - search
 * ========================================================= */

export async function getAdminSubjectiveQuestionsForClassChapter(
  classSlug: string,
  chapterId: string,
  statusFilter:
    | "ALL"
    | "DRAFT"
    | "PUBLISHED" = "ALL",
  search = ""
): Promise<{
  className: string;
  chapterName: string;
  questions: AdminSubjectiveQuestionBankItem[];
}> {
  const normalizedSlug =
    classSlug.trim();

  const normalizedChapterId =
    chapterId.trim();

  if (!normalizedSlug) {
    throw new Error(
      "Class slug is required."
    );
  }

  if (!normalizedChapterId) {
    throw new Error(
      "Chapter ID is required."
    );
  }

  const supabase =
    createAdminSupabaseClient();

  /* -------------------------------------------------------
   * 1. Resolve class
   * ------------------------------------------------------- */

  const {
    data: programs,
    error: programsError,
  } = await supabase
    .from("programs")
    .select(`
      id,
      name,
      slug
    `)
    .eq(
      "slug",
      normalizedSlug
    )
    .limit(1);

  if (programsError) {
    throw new Error(
      `Failed to load Subjective class: ${programsError.message}`
    );
  }

  const program =
    programs?.[0];

  if (!program) {
    throw new Error(
      "Subjective Question Bank class not found."
    );
  }

  /* -------------------------------------------------------
   * 2. Resolve selected chapter
   *
   * Ensure the chapter actually belongs to the selected
   * class through a published curriculum version.
   * ------------------------------------------------------- */

  const {
    data: versions,
    error: versionsError,
  } = await supabase
    .from(
      "curriculum_versions"
    )
    .select(`
      id
    `)
    .eq(
      "program_id",
      program.id
    )
    .eq(
      "status",
      "PUBLISHED"
    );

  if (versionsError) {
    throw new Error(
      `Failed to validate Subjective class curriculum: ${versionsError.message}`
    );
  }

  const versionIds =
    (versions ?? []).map(
      (version) => version.id
    );

  if (
    versionIds.length === 0
  ) {
    throw new Error(
      "No published curriculum found for this class."
    );
  }

  const {
    data: chapters,
    error: chapterError,
  } = await supabase
    .from("curriculum_nodes")
    .select(`
      id,
      display_name,
      sequence_order,
      curriculum_version_id
    `)
    .eq(
      "id",
      normalizedChapterId
    )
    .in(
      "curriculum_version_id",
      versionIds
    )
    .eq(
      "status",
      "ACTIVE"
    )
    .limit(1);

  if (chapterError) {
    throw new Error(
      `Failed to validate Subjective chapter: ${chapterError.message}`
    );
  }

  const chapter =
    chapters?.[0];

  if (!chapter) {
    throw new Error(
      "Selected chapter does not belong to this class."
    );
  }

  /* -------------------------------------------------------
   * 3. Find questions mapped to exact chapter
   * ------------------------------------------------------- */

  const {
    data: mappings,
    error: mappingsError,
  } = await supabase
    .from(
      "question_curriculum_nodes"
    )
    .select(`
      question_id
    `)
    .eq(
      "curriculum_node_id",
      normalizedChapterId
    );

  if (mappingsError) {
    throw new Error(
      `Failed to load Subjective chapter mappings: ${mappingsError.message}`
    );
  }

  const questionIds =
    Array.from(
      new Set(
        (mappings ?? []).map(
          (mapping) =>
            mapping.question_id
        )
      )
    );

  if (
    questionIds.length === 0
  ) {
    return {
      className:
        program.name,

      chapterName:
        chapter.display_name,

      questions: [],
    };
  }

  /* -------------------------------------------------------
   * 4. Load questions
   * ------------------------------------------------------- */

  let questionQuery =
    supabase
      .from("questions")
      .select(`
        id,
        admin_question_number,
        question_text,
        question_type,
        source_type,
        source_reference,
        difficulty,
        marks,
        estimated_time_minutes,
        status,
        current_revision_id,
        created_at,
        updated_at
      `)
      .in(
        "id",
        questionIds
      )
      .eq(
        "question_type",
        "SUBJECTIVE"
      )
      .in(
        "status",
        ["DRAFT", "PUBLISHED"]
      );

  if (
    statusFilter ===
    "DRAFT"
  ) {
    questionQuery =
      questionQuery.eq(
        "status",
        "DRAFT"
      );
  }

  if (
    statusFilter ===
    "PUBLISHED"
  ) {
    questionQuery =
      questionQuery.eq(
        "status",
        "PUBLISHED"
      );
  }

  const {
    data: questions,
    error: questionsError,
  } =
    await questionQuery.order(
      "admin_question_number",
      {
        ascending: true,
      }
    );

  if (questionsError) {
    throw new Error(
      `Failed to load Subjective chapter questions: ${questionsError.message}`
    );
  }

  if (
    !questions ||
    questions.length === 0
  ) {
    return {
      className:
        program.name,

      chapterName:
        chapter.display_name,

      questions: [],
    };
  }

  /* -------------------------------------------------------
   * 5. Current revisions
   * ------------------------------------------------------- */

  const revisionIds =
    questions
      .map(
        (question) =>
          question.current_revision_id
      )
      .filter(
        (
          revisionId
        ): revisionId is string =>
          Boolean(revisionId)
      );

  if (
    revisionIds.length === 0
  ) {
    return {
      className:
        program.name,

      chapterName:
        chapter.display_name,

      questions: [],
    };
  }

  const {
    data: revisions,
    error: revisionsError,
  } = await supabase
    .from(
      "question_revisions"
    )
    .select(`
      id,
      question_id,
      revision_number,
      question_text,
      status
    `)
    .in(
      "id",
      revisionIds
    );

  if (revisionsError) {
    throw new Error(
      `Failed to load Subjective question revisions: ${revisionsError.message}`
    );
  }

  const revisionById =
    new Map<
      string,
      {
        id: string;
        question_id: string;
        revision_number: number;
        question_text: string;
        status: string;
      }
    >();

  for (const revision of revisions ?? []) {
    revisionById.set(
      revision.id,
      revision
    );
  }

  /* -------------------------------------------------------
   * 6. Search
   *
   * Search is applied to the authoritative current
   * revision text plus question number.
   * ------------------------------------------------------- */

  const normalizedSearch =
    search
      .trim()
      .toLowerCase();

  const result: AdminSubjectiveQuestionBankItem[] =
    [];

  for (const question of questions) {
    const revisionId =
      question.current_revision_id;

    if (!revisionId) {
      continue;
    }

    const revision =
      revisionById.get(
        revisionId
      );

    if (!revision) {
      continue;
    }

    if (
      revision.question_id !==
      question.id
    ) {
      continue;
    }

    if (
      revision.status !==
      question.status
    ) {
      continue;
    }

    if (
      normalizedSearch
    ) {
      const searchableText =
        [
          String(
            question.admin_question_number
          ),

          revision.question_text,

          question.source_type,

          question.source_reference ??
            "",
        ]
          .join(" ")
          .toLowerCase();

      if (
        !searchableText.includes(
          normalizedSearch
        )
      ) {
        continue;
      }
    }

    result.push({
      id: question.id,

      admin_question_number:
        question.admin_question_number,

      question_text:
        revision.question_text,

      question_type:
        question.question_type,

      source_type:
        question.source_type,

      source_reference:
        question.source_reference,

      difficulty:
        question.difficulty,

      marks:
        question.marks,

      estimated_time_minutes:
        question.estimated_time_minutes,

      status:
        question.status,

      current_revision_id:
        question.current_revision_id,

      created_at:
        question.created_at,

      updated_at:
        question.updated_at,

      chapter_id:
        chapter.id,

      chapter_name:
        chapter.display_name,

      chapter_sequence_order:
        chapter.sequence_order,

      revision: {
        id: revision.id,

        revision_number:
          revision.revision_number,

        question_text:
          revision.question_text,

        status:
          revision.status,
      },

      /*
       * This drill-down function intentionally remains
       * lightweight. Draft revision details are required
       * only on the single-question detail page.
       */
      draft_revision: null,
    });
  }

  result.sort(
    (a, b) =>
      a.admin_question_number -
      b.admin_question_number
  );

  return {
    className:
      program.name,

    chapterName:
      chapter.display_name,

    questions:
      result,
  };
}

/* =========================================================
 * Get a Single Subjective Question by ID
 *
 * Used by:
 *   /admin/subjective/[questionId]
 *   /admin/subjective/[questionId]/edit
 *
 * IMPORTANT:
 * The `revision` field is always the current
 * authoritative revision.
 *
 * The `draft_revision` field is the latest DRAFT
 * revision, if one exists.
 *
 * This separation is essential for revision-safe
 * publishing.
 * ========================================================= */

export async function getAdminSubjectiveQuestionById(
  questionId: string
): Promise<
  AdminSubjectiveQuestionBankItem | null
> {
  const normalizedQuestionId =
    questionId.trim();

  if (!normalizedQuestionId) {
    throw new Error(
      "Subjective Question ID is required."
    );
  }

  const supabase =
    createAdminSupabaseClient();

  /* -------------------------------------------------------
   * 1. Load question
   * ------------------------------------------------------- */

  const {
    data: question,
    error: questionError,
  } = await supabase
    .from("questions")
    .select(`
      id,
      admin_question_number,
      question_text,
      question_type,
      source_type,
      source_reference,
      difficulty,
      marks,
      estimated_time_minutes,
      status,
      current_revision_id,
      created_at,
      updated_at
    `)
    .eq(
      "id",
      normalizedQuestionId
    )
    .eq(
      "question_type",
      "SUBJECTIVE"
    )
    .in(
      "status",
      ["DRAFT", "PUBLISHED"]
    )
    .maybeSingle();

  if (questionError) {
    throw new Error(
      `Failed to load Subjective question: ${questionError.message}`
    );
  }

  if (!question) {
    return null;
  }

  /* -------------------------------------------------------
   * 2. Current authoritative revision
   * ------------------------------------------------------- */

  const revisionId =
    question.current_revision_id;

  if (!revisionId) {
    return null;
  }

  const {
    data: revision,
    error: revisionError,
  } = await supabase
    .from(
      "question_revisions"
    )
    .select(`
      id,
      question_id,
      revision_number,
      question_text,
      solution_text,
      mistake_insight,
      status
    `)
    .eq(
      "id",
      revisionId
    )
    .maybeSingle();

  if (revisionError) {
    throw new Error(
      `Failed to load Subjective question revision: ${revisionError.message}`
    );
  }

  if (!revision) {
    return null;
  }

  /* -------------------------------------------------------
   * 3. Validate question ↔ current revision
   * ------------------------------------------------------- */

  if (
    revision.question_id !==
    question.id
  ) {
    return null;
  }

  if (
    revision.status !==
    question.status
  ) {
    return null;
  }

  /* -------------------------------------------------------
   * 4. Load latest DRAFT revision
   *
   * IMPORTANT:
   *
   * We deliberately do NOT assume that
   * questions.current_revision_id points to the latest
   * draft.
   *
   * During revision creation:
   *
   *   current_revision_id → published revision
   *   latest DRAFT        → new revision
   *
   * Therefore we explicitly query the latest DRAFT.
   * ------------------------------------------------------- */

  const {
    data: draftRevisions,
    error: draftRevisionError,
  } = await supabase
    .from(
      "question_revisions"
    )
    .select(`
      id,
      question_id,
      revision_number,
      question_text,
      solution_text,
      mistake_insight,
      status
    `)
    .eq(
      "question_id",
      question.id
    )
    .eq(
      "status",
      "DRAFT"
    )
    .order(
      "revision_number",
      {
        ascending: false,
      }
    )
    .limit(1);

  if (draftRevisionError) {
    throw new Error(
      `Failed to load Subjective draft revision: ${draftRevisionError.message}`
    );
  }

  const latestDraft =
    draftRevisions?.[0] ?? null;

  /* -------------------------------------------------------
   * 5. Validate latest DRAFT revision
   * ------------------------------------------------------- */

  const draftRevision =
    latestDraft &&
    latestDraft.question_id ===
      question.id
      ? latestDraft
      : null;

  /* -------------------------------------------------------
   * 6. Question → curriculum mapping
   * ------------------------------------------------------- */

  const {
    data: mappings,
    error: mappingsError,
  } = await supabase
    .from(
      "question_curriculum_nodes"
    )
    .select(`
      curriculum_node_id
    `)
    .eq(
      "question_id",
      question.id
    );

  if (mappingsError) {
    throw new Error(
      `Failed to load Subjective question curriculum mapping: ${mappingsError.message}`
    );
  }

  const chapterId =
    mappings?.[0]
      ?.curriculum_node_id ??
    null;

  /* -------------------------------------------------------
   * 7. Chapter
   * ------------------------------------------------------- */

  let chapter: {
    id: string;
    display_name: string;
    sequence_order: number | null;
  } | null = null;

  if (chapterId) {
    const {
      data: chapterData,
      error: chapterError,
    } = await supabase
      .from(
        "curriculum_nodes"
      )
      .select(`
        id,
        display_name,
        sequence_order
      `)
      .eq(
        "id",
        chapterId
      )
      .maybeSingle();

    if (chapterError) {
      throw new Error(
        `Failed to load Subjective question chapter: ${chapterError.message}`
      );
    }

    chapter =
      chapterData;
  }

  /* -------------------------------------------------------
   * 8. Build final result
   * ------------------------------------------------------- */

  return {
    id: question.id,

    admin_question_number:
      question.admin_question_number,

    question_text:
      revision.question_text,

    question_type:
      question.question_type,

    source_type:
      question.source_type,

    source_reference:
      question.source_reference,

    difficulty:
      question.difficulty,

    marks:
      question.marks,

    estimated_time_minutes:
      question.estimated_time_minutes,

    status:
      question.status,

    current_revision_id:
      question.current_revision_id,

    created_at:
      question.created_at,

    updated_at:
      question.updated_at,

    chapter_id:
      chapter?.id ?? null,

    chapter_name:
      chapter?.display_name ?? null,

    chapter_sequence_order:
      chapter?.sequence_order ?? null,

    /* Current authoritative revision */
    revision: {
      id: revision.id,

      revision_number:
        revision.revision_number,

      question_text:
        revision.question_text,

      solution_text:
        revision.solution_text,

      mistake_insight:
        revision.mistake_insight,

      status:
        revision.status,
    },

    /* Latest DRAFT revision */
    draft_revision: draftRevision
      ? {
          id:
            draftRevision.id,

          revision_number:
            draftRevision.revision_number,

          question_text:
            draftRevision.question_text,

          solution_text:
            draftRevision.solution_text,

          mistake_insight:
            draftRevision.mistake_insight,

          status:
            draftRevision.status,
        }
      : null,
  };
}

/* =========================================================
 * Get Subjective Questions available for a Set
 *
 * Existing Set workflow.
 *
 * DO NOT change this behavior.
 * ========================================================= */

export async function getAdminAvailableSubjectiveQuestionsForSet(
  setId: string
): Promise<
  AdminSubjectiveQuestion[]
> {
  const normalizedSetId =
    setId.trim();

  if (!normalizedSetId) {
    throw new Error(
      "Subjective Set ID is required."
    );
  }

  const supabase =
    createAdminSupabaseClient();

  /* -------------------------------------------------------
   * 1. Load Subjective Set
   * ------------------------------------------------------- */

  const {
    data: set,
    error: setError,
  } = await supabase
    .from("subjective_sets")
    .select(`
      id,
      resource_id,
      status
    `)
    .eq(
      "id",
      normalizedSetId
    )
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

  /* -------------------------------------------------------
   * 2. Only DRAFT sets can receive questions
   * ------------------------------------------------------- */

  if (
    set.status !==
    "DRAFT"
  ) {
    return [];
  }

  /* -------------------------------------------------------
   * 3. Resolve Resource → Chapter
   * ------------------------------------------------------- */

  const {
    data: resourceMappings,
    error: resourceMappingsError,
  } = await supabase
    .from(
      "resource_curriculum_nodes"
    )
    .select(`
      curriculum_node_id
    `)
    .eq(
      "resource_id",
      set.resource_id
    );

  if (resourceMappingsError) {
    throw new Error(
      `Failed to load Subjective resource curriculum: ${resourceMappingsError.message}`
    );
  }

  const chapterId =
    resourceMappings?.[0]
      ?.curriculum_node_id ??
    null;

  if (!chapterId) {
    return [];
  }

  /* -------------------------------------------------------
   * 4. Load Chapter
   * ------------------------------------------------------- */

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
    .eq(
      "id",
      chapterId
    )
    .maybeSingle();

  if (chapterError) {
    throw new Error(
      `Failed to load Subjective chapter: ${chapterError.message}`
    );
  }

  if (!chapter) {
    return [];
  }

  /* -------------------------------------------------------
   * 5. Attached questions
   * ------------------------------------------------------- */

  const {
    data: attachedQuestions,
    error: attachedError,
  } = await supabase
    .from(
      "subjective_set_questions"
    )
    .select(`
      question_id
    `)
    .eq(
      "set_id",
      normalizedSetId
    );

  if (attachedError) {
    throw new Error(
      `Failed to load attached Subjective questions: ${attachedError.message}`
    );
  }

  const attachedQuestionIds =
    new Set<string>();

  for (
    const row of
      attachedQuestions ?? []
  ) {
    attachedQuestionIds.add(
      row.question_id
    );
  }

  /* -------------------------------------------------------
   * 6. Questions mapped to chapter
   * ------------------------------------------------------- */

  const {
    data: curriculumMappings,
    error: curriculumMappingsError,
  } = await supabase
    .from(
      "question_curriculum_nodes"
    )
    .select(`
      question_id
    `)
    .eq(
      "curriculum_node_id",
      chapterId
    );

  if (curriculumMappingsError) {
    throw new Error(
      `Failed to load Subjective chapter questions: ${curriculumMappingsError.message}`
    );
  }

  if (
    !curriculumMappings ||
    curriculumMappings.length === 0
  ) {
    return [];
  }

  const availableQuestionIds =
    curriculumMappings
      .map(
        (row) =>
          row.question_id
      )
      .filter(
        (questionId) =>
          !attachedQuestionIds.has(
            questionId
          )
      );

  if (
    availableQuestionIds.length ===
    0
  ) {
    return [];
  }

  /* -------------------------------------------------------
   * 7. Published Subjective questions
   * ------------------------------------------------------- */

  const {
    data: questions,
    error: questionsError,
  } = await supabase
    .from("questions")
    .select(`
      id,
      admin_question_number,
      question_text,
      question_type,
      source_type,
      source_reference,
      difficulty,
      marks,
      estimated_time_minutes,
      status,
      current_revision_id,
      created_at,
      updated_at
    `)
    .in(
      "id",
      availableQuestionIds
    )
    .eq(
      "question_type",
      "SUBJECTIVE"
    )
    .eq(
      "status",
      "PUBLISHED"
    )
    .not(
      "current_revision_id",
      "is",
      null
    )
    .order(
      "admin_question_number",
      {
        ascending: true,
      }
    );

  if (questionsError) {
    throw new Error(
      `Failed to load available Subjective questions: ${questionsError.message}`
    );
  }

  if (
    !questions ||
    questions.length === 0
  ) {
    return [];
  }

  /* -------------------------------------------------------
   * 8. Current revisions
   * ------------------------------------------------------- */

  const revisionIds =
    questions
      .map(
        (question) =>
          question.current_revision_id
      )
      .filter(
        (
          revisionId
        ): revisionId is string =>
          Boolean(revisionId)
      );

  if (
    revisionIds.length === 0
  ) {
    return [];
  }

  const {
    data: revisions,
    error: revisionsError,
  } = await supabase
    .from(
      "question_revisions"
    )
    .select(`
      id,
      question_id,
      revision_number,
      question_text,
      status
    `)
    .in(
      "id",
      revisionIds
    );

  if (revisionsError) {
    throw new Error(
      `Failed to load Subjective question revisions: ${revisionsError.message}`
    );
  }

  const revisionById =
    new Map<
      string,
      {
        id: string;
        question_id: string;
        revision_number: number;
        question_text: string;
        status: string;
      }
    >();

  for (const revision of revisions ?? []) {
    revisionById.set(
      revision.id,
      revision
    );
  }

  /* -------------------------------------------------------
   * 9. Final result
   * ------------------------------------------------------- */

  const result: AdminSubjectiveQuestion[] =
    [];

  for (const question of questions) {
    const revisionId =
      question.current_revision_id;

    if (!revisionId) {
      continue;
    }

    const revision =
      revisionById.get(
        revisionId
      );

    if (!revision) {
      continue;
    }

    if (
      revision.question_id !==
      question.id
    ) {
      continue;
    }

    if (
      revision.status !==
      "PUBLISHED"
    ) {
      continue;
    }

    result.push({
      id: question.id,

      admin_question_number:
        question.admin_question_number,

      question_text:
        revision.question_text,

      question_type:
        question.question_type,

      source_type:
        question.source_type,

      source_reference:
        question.source_reference,

      difficulty:
        question.difficulty,

      marks:
        question.marks,

      estimated_time_minutes:
        question.estimated_time_minutes,

      status:
        question.status,

      current_revision_id:
        question.current_revision_id,

      created_at:
        question.created_at,

      updated_at:
        question.updated_at,

      chapter_id:
        chapter.id,

      chapter_name:
        chapter.display_name,

      chapter_sequence_order:
        chapter.sequence_order,

      revision: {
        id: revision.id,

        revision_number:
          revision.revision_number,

        question_text:
          revision.question_text,

        status:
          revision.status,
      },

      draft_revision: null,
    });
  }

  return result;
}