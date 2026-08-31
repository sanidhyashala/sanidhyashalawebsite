import "server-only";

import { createAdminSupabaseClient } from "@/app/lib/admin/supabase-admin";
import { getStudentProfile } from "@/lib/learning/student-profile";

/* =========================================================
 * Student MCQ Resource
 * ========================================================= */

export type StudentMcqResource = {
  resourceId: string;

  title: string;

  description: string | null;

  accessType: string;

  setNumber: number | null;

  testId: string;

  durationMinutes: number | null;

  maxAttempts: number;

  passingPercentage: number | null;

  shuffleQuestions: boolean;

  shuffleOptions: boolean;

  questionCount: number;

  chapterName: string | null;

  chapterSequence: number | null;

  session: string | null;

  className: string | null;
};

/* =========================================================
 * Student MCQ Practice
 * ========================================================= */

export type StudentMcqPracticeOption = {
  optionKey: string;
  optionText: string;
};

export type StudentMcqPracticeQuestion = {
  questionId: string;

  questionOrder: number;

  marks: number | null;

  questionText: string;

  options: StudentMcqPracticeOption[];
};

export type StudentMcqPractice = {
  resourceId: string;

  title: string;

  description: string | null;

  setNumber: number | null;

  testId: string;

  durationMinutes: number | null;

  maxAttempts: number;

  passingPercentage: number | null;

  shuffleQuestions: boolean;

  shuffleOptions: boolean;

  chapterName: string | null;

  chapterSequence: number | null;

  session: string | null;

  className: string | null;

  questions: StudentMcqPracticeQuestion[];
};

/* =========================================================
 * Get published MCQ resource for student
 * ========================================================= */

export async function getStudentMcqResource(
  resourceId: string
): Promise<StudentMcqResource | null> {
  const normalizedResourceId = resourceId.trim();

  if (!normalizedResourceId) {
    return null;
  }

  const supabase = createAdminSupabaseClient();

  const profile = await getStudentProfile();

  if (!profile.exists || !profile.program_id) {
    return null;
  }

  /* -------------------------------------------------------
   * 1. Published MCQ resource
   * ------------------------------------------------------- */

  const {
    data: resource,
    error: resourceError,
  } = await supabase
    .from("resources")
    .select(
      `
        id,
        title,
        description,
        access_type,
        status,
        resource_type,
        set_number
      `
    )
    .eq("id", normalizedResourceId)
    .eq("resource_type", "MCQ")
    .eq("status", "PUBLISHED")
    .maybeSingle();

  if (resourceError) {
    throw new Error(
      `Failed to load MCQ resource: ${resourceError.message}`
    );
  }

  if (!resource) {
    return null;
  }

  /* -------------------------------------------------------
   * 2. Published MCQ test
   * ------------------------------------------------------- */

  const {
    data: test,
    error: testError,
  } = await supabase
    .from("tests")
    .select(
      `
        id,
        title,
        test_type,
        duration_minutes,
        max_attempts,
        passing_percentage,
        shuffle_questions,
        shuffle_options,
        status,
        access_type
      `
    )
    .eq("resource_id", resource.id)
    .eq("test_type", "MCQ")
    .eq("status", "PUBLISHED")
    .maybeSingle();

  if (testError) {
    throw new Error(
      `Failed to load MCQ test: ${testError.message}`
    );
  }

  if (!test) {
    return null;
  }

  /* -------------------------------------------------------
   * 3. Count attached questions
   * ------------------------------------------------------- */

  const {
    data: questionRows,
    error: questionRowsError,
  } = await supabase
    .from("test_questions")
    .select("question_id")
    .eq("test_id", test.id);

  if (questionRowsError) {
    throw new Error(
      `Failed to load MCQ questions: ${questionRowsError.message}`
    );
  }

  const questionCount = questionRows?.length ?? 0;

  if (questionCount <= 0) {
    return null;
  }

  /* -------------------------------------------------------
   * 4. Curriculum mapping
   * ------------------------------------------------------- */

  const {
    data: curriculumMapping,
    error: curriculumMappingError,
  } = await supabase
    .from("resource_curriculum_nodes")
    .select("curriculum_node_id")
    .eq("resource_id", resource.id)
    .maybeSingle();

  if (curriculumMappingError) {
    throw new Error(
      `Failed to load MCQ curriculum mapping: ${curriculumMappingError.message}`
    );
  }

  let chapterName: string | null = null;

  let chapterSequence: number | null = null;

  let session: string | null = null;

  let className: string | null = null;

  /* -------------------------------------------------------
   * 5. Chapter → Version → Program
   * ------------------------------------------------------- */

  if (curriculumMapping) {
    const {
      data: chapter,
      error: chapterError,
    } = await supabase
      .from("curriculum_nodes")
      .select(
        `
          id,
          display_name,
          sequence_order,
          curriculum_version_id
        `
      )
      .eq("id", curriculumMapping.curriculum_node_id)
      .maybeSingle();

    if (chapterError) {
      throw new Error(
        `Failed to load MCQ chapter: ${chapterError.message}`
      );
    }

    if (chapter) {
      chapterName = chapter.display_name;

      chapterSequence = chapter.sequence_order;

      const {
        data: version,
        error: versionError,
      } = await supabase
        .from("curriculum_versions")
        .select(
          `
            id,
            session,
            program_id
          `
        )
        .eq("id", chapter.curriculum_version_id)
        .maybeSingle();

      if (versionError) {
        throw new Error(
          `Failed to load curriculum version: ${versionError.message}`
        );
      }

      if (version) {
        if (version.program_id !== profile.program_id) {
          return null;
        }

        session = version.session;

        const {
          data: program,
          error: programError,
        } = await supabase
          .from("programs")
          .select("id, name")
          .eq("id", version.program_id)
          .maybeSingle();

        if (programError) {
          throw new Error(
            `Failed to load curriculum program: ${programError.message}`
          );
        }

        if (program) {
          className = program.name;
        }
      }
    }
  }

  /* -------------------------------------------------------
   * 6. Return normalized resource
   * ------------------------------------------------------- */

  return {
    resourceId: resource.id,

    title: resource.title,

    description: resource.description,

    accessType:
      test.access_type ??
      resource.access_type,

    setNumber: resource.set_number,

    testId: test.id,

    durationMinutes:
      test.duration_minutes,

    maxAttempts:
      test.max_attempts,

    passingPercentage:
      test.passing_percentage,

    shuffleQuestions:
      test.shuffle_questions,

    shuffleOptions:
      test.shuffle_options,

    questionCount,

    chapterName,

    chapterSequence,

    session,

    className,
  };
}

/* =========================================================
 * Get published MCQ practice
 *
 * IMPORTANT:
 *
 * The student-facing question is resolved from the exact
 * question_revision_id attached to test_questions.
 *
 * Flow:
 *
 *   Resource
 *      ↓
 *   Published Test
 *      ↓
 *   test_questions
 *      ↓
 *   question_revision_id
 *      ↓
 *   Published question_revisions
 *      ↓
 *   question_revision_options
 * ========================================================= */

export async function getStudentMcqPractice(
  resourceId: string
): Promise<StudentMcqPractice | null> {
  const normalizedResourceId = resourceId.trim();

  if (!normalizedResourceId) {
    return null;
  }

  const supabase = createAdminSupabaseClient();

  /* -------------------------------------------------------
   * 1. Published MCQ resource
   * ------------------------------------------------------- */

  const {
    data: resource,
    error: resourceError,
  } = await supabase
    .from("resources")
    .select(
      `
        id,
        title,
        description,
        access_type,
        set_number,
        resource_type,
        status
      `
    )
    .eq("id", normalizedResourceId)
    .eq("resource_type", "MCQ")
    .eq("status", "PUBLISHED")
    .maybeSingle();

  if (resourceError) {
    throw new Error(
      `Failed to load MCQ practice resource: ${resourceError.message}`
    );
  }

  if (!resource) {
    return null;
  }

  /* -------------------------------------------------------
   * 2. Published MCQ test
   * ------------------------------------------------------- */

  const {
    data: test,
    error: testError,
  } = await supabase
    .from("tests")
    .select(
      `
        id,
        title,
        test_type,
        duration_minutes,
        max_attempts,
        passing_percentage,
        shuffle_questions,
        shuffle_options,
        status,
        access_type
      `
    )
    .eq("resource_id", resource.id)
    .eq("test_type", "MCQ")
    .eq("status", "PUBLISHED")
    .maybeSingle();

  if (testError) {
    throw new Error(
      `Failed to load MCQ practice test: ${testError.message}`
    );
  }

  if (!test) {
    return null;
  }

  /* -------------------------------------------------------
   * 3. Load attached test questions
   * ------------------------------------------------------- */

  const {
    data: testQuestions,
    error: testQuestionsError,
  } = await supabase
    .from("test_questions")
    .select(
      `
        question_id,
        question_order,
        question_revision_id,
        marks
      `
    )
    .eq("test_id", test.id)
    .order("question_order", {
      ascending: true,
    });

  if (testQuestionsError) {
    throw new Error(
      `Failed to load MCQ test questions: ${testQuestionsError.message}`
    );
  }

  if (!testQuestions || testQuestions.length === 0) {
    return null;
  }

  /* -------------------------------------------------------
   * 4. Collect exact revision IDs
   * ------------------------------------------------------- */

  const revisionIds = testQuestions.map(
    (row) => row.question_revision_id
  );

  /* -------------------------------------------------------
   * 5. Load exact published revisions
   * ------------------------------------------------------- */

  const {
    data: revisions,
    error: revisionsError,
  } = await supabase
    .from("question_revisions")
    .select(
      `
        id,
        question_id,
        revision_number,
        question_text,
        status
      `
    )
    .in("id", revisionIds)
    .eq("status", "PUBLISHED");

  if (revisionsError) {
    throw new Error(
      `Failed to load MCQ revisions: ${revisionsError.message}`
    );
  }

  /* -------------------------------------------------------
   * 6. Load revision options
   * ------------------------------------------------------- */

  const {
    data: revisionOptions,
    error: revisionOptionsError,
  } = await supabase
    .from("question_revision_options")
    .select(
      `
        revision_id,
        option_key,
        option_text,
        display_order
      `
    )
    .in("revision_id", revisionIds)
    .order("display_order", {
      ascending: true,
    });

  if (revisionOptionsError) {
    throw new Error(
      `Failed to load MCQ options: ${revisionOptionsError.message}`
    );
  }

  /* -------------------------------------------------------
   * 7. Explicit local types
   * ------------------------------------------------------- */

  type RevisionRow = {
    id: string;
    question_id: string;
    revision_number: number;
    question_text: string;
    status: string;
  };

  type OptionRow = {
    revision_id: string;
    option_key: string;
    option_text: string;
    display_order: number;
  };

  const typedRevisions =
    (revisions ?? []) as RevisionRow[];

  const typedOptions =
    (revisionOptions ?? []) as OptionRow[];

  /* -------------------------------------------------------
   * 8. Build revision lookup
   * ------------------------------------------------------- */

  const revisionById =
    new Map<string, RevisionRow>(
      typedRevisions.map(
        (revision) => [
          revision.id,
          revision,
        ]
      )
    );

  /* -------------------------------------------------------
   * 9. Build option lookup
   * ------------------------------------------------------- */

  const optionsByRevisionId =
    new Map<
      string,
      StudentMcqPracticeOption[]
    >();

  for (const option of typedOptions) {
    const existing =
      optionsByRevisionId.get(
        option.revision_id
      ) ?? [];

    existing.push({
      optionKey: option.option_key,

      optionText: option.option_text,
    });

    optionsByRevisionId.set(
      option.revision_id,
      existing
    );
  }

  /* -------------------------------------------------------
   * 10. Normalize test questions
   * ------------------------------------------------------- */

  const normalizedQuestions: StudentMcqPracticeQuestion[] = [];

  for (const testQuestion of testQuestions) {
    const revision =
      revisionById.get(
        testQuestion.question_revision_id
      );

    if (!revision) {
      throw new Error(
        `Published revision not found for question ${testQuestion.question_id}.`
      );
    }

    /*
     * Defensive validation:
     *
     * A valid MCQ must have exactly four options.
     */

    const options =
      optionsByRevisionId.get(
        testQuestion.question_revision_id
      ) ?? [];

    if (options.length !== 4) {
      throw new Error(
        `Invalid MCQ option count for question ${testQuestion.question_id}. Expected 4 options, found ${options.length}.`
      );
    }

    normalizedQuestions.push({
      questionId:
        testQuestion.question_id,

      questionOrder:
        testQuestion.question_order,

      marks:
        testQuestion.marks,

      /*
       * The exact published revision attached
       * to the test is authoritative.
       */

      questionText:
        revision.question_text,

      options,
    });
  }

  /* -------------------------------------------------------
   * 11. Curriculum mapping
   * ------------------------------------------------------- */

  const {
    data: curriculumMapping,
    error: curriculumMappingError,
  } = await supabase
    .from("resource_curriculum_nodes")
    .select("curriculum_node_id")
    .eq("resource_id", resource.id)
    .maybeSingle();

  if (curriculumMappingError) {
    throw new Error(
      `Failed to load MCQ curriculum mapping: ${curriculumMappingError.message}`
    );
  }

  let chapterName: string | null = null;

  let chapterSequence: number | null = null;

  let session: string | null = null;

  let className: string | null = null;

  /* -------------------------------------------------------
   * 12. Chapter → Version → Program
   * ------------------------------------------------------- */

  if (curriculumMapping) {
    const {
      data: chapter,
      error: chapterError,
    } = await supabase
      .from("curriculum_nodes")
      .select(
        `
          id,
          display_name,
          sequence_order,
          curriculum_version_id
        `
      )
      .eq(
        "id",
        curriculumMapping.curriculum_node_id
      )
      .maybeSingle();

    if (chapterError) {
      throw new Error(
        `Failed to load MCQ chapter: ${chapterError.message}`
      );
    }

    if (chapter) {
      chapterName =
        chapter.display_name;

      chapterSequence =
        chapter.sequence_order;

      const {
        data: version,
        error: versionError,
      } = await supabase
        .from("curriculum_versions")
        .select(
          `
            id,
            session,
            program_id
          `
        )
        .eq(
          "id",
          chapter.curriculum_version_id
        )
        .maybeSingle();

      if (versionError) {
        throw new Error(
          `Failed to load curriculum version: ${versionError.message}`
        );
      }

      if (version) {
        session =
          version.session;

        const {
          data: program,
          error: programError,
        } = await supabase
          .from("programs")
          .select("id, name")
          .eq(
            "id",
            version.program_id
          )
          .maybeSingle();

        if (programError) {
          throw new Error(
            `Failed to load curriculum program: ${programError.message}`
          );
        }

        if (program) {
          className =
            program.name;
        }
      }
    }
  }

  /* -------------------------------------------------------
   * 13. Return student practice
   * ------------------------------------------------------- */

  return {
    resourceId:
      resource.id,

    title:
      resource.title,

    description:
      resource.description,

    setNumber:
      resource.set_number,

    testId:
      test.id,

    durationMinutes:
      test.duration_minutes,

    maxAttempts:
      test.max_attempts,

    passingPercentage:
      test.passing_percentage,

    shuffleQuestions:
      test.shuffle_questions,

    shuffleOptions:
      test.shuffle_options,

    chapterName,

    chapterSequence,

    session,

    className,

    questions:
      normalizedQuestions,
  };
}