import { createAdminSupabaseClient } from "@/app/lib/admin/supabase-admin";
import { createLearningSupabaseClient } from "@/lib/learning/supabase-learning";
import { getStudentProfile } from "@/lib/learning/student-profile";
import { auth } from "@clerk/nextjs/server";

export type StudentSubjectiveAnnotation = {
  id?: string;
  evaluation_id?: string;
  page_number: number | null;
  x_position: number | null;
  y_position: number | null;
  annotation_type:
    | "PEN"
    | "CIRCLE"
    | "TICK"
    | "CROSS"
    | "ARROW"
    | "TEXT";
  content: string;
  created_at?: string | null;
};

export type StudentSubjectiveFile = {
  id: string;
  file_path: string;
  file_name: string;
  mime_type: string;
  file_size_bytes: number | null;
  page_number: number | null;
  signed_url?: string | null;
};

export type StudentSubjectiveEvaluationSummary = {
  attempt_id: string;
  set_id: string;
  set_title: string;
  attempt_number: number;
  attempt_type: string;
  evaluated_at: string | null;
  teacher_note: string | null;
  question_count: number;
  max_marks: number;
  final_marks: number;
};

export type StudentSubjectiveEvaluationQuestion = {
  attempt_question_id: string;
  question_id: string;
  question_revision_id: string;
  question_order: number;
  marks: number;
  question_text: string;
  ideal_solution: string | null;

  submission: {
    id: string;
    answer_text: string | null;
    status: string;
    submitted_at: string | null;
  } | null;

  evaluation: {
    id: string;
    marks_obtained: number | null;
    teacher_feedback: string | null;
    teacher_note: string | null;
    evaluated_at: string | null;
  } | null;

  files: StudentSubjectiveFile[];
  annotations: StudentSubjectiveAnnotation[];
};

export type StudentSubjectiveEvaluationDetail = {
  attempt: {
    id: string;
    set_id: string;
    attempt_number: number;
    attempt_type: string;
    evaluated_at: string | null;
    teacher_note: string | null;
  };

  set: {
    id: string;
    title: string;
    description: string | null;
    category: string;
    set_number: number;
  };

  questions: StudentSubjectiveEvaluationQuestion[];
};

const SIGNED_URL_SECONDS = 10 * 60;
const STORAGE_BUCKET = "subjective-answers";

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);

    return Number.isFinite(parsed)
      ? parsed
      : null;
  }

  return null;
}

function normalizeAnnotations(
  value: unknown,
): StudentSubjectiveAnnotation[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const row = item as Record<string, unknown>;

    const type = row.annotation_type;
    const content = row.content;

    if (
      typeof type !== "string" ||
      ![
        "PEN",
        "CIRCLE",
        "TICK",
        "CROSS",
        "ARROW",
        "TEXT",
      ].includes(type) ||
      typeof content !== "string"
    ) {
      return [];
    }

    return [
      {
        id: asString(row.id) ?? undefined,
        evaluation_id:
          asString(row.evaluation_id) ??
          undefined,
        page_number: asNumber(
          row.page_number,
        ),
        x_position: asNumber(
          row.x_position,
        ),
        y_position: asNumber(
          row.y_position,
        ),
        annotation_type:
          type as StudentSubjectiveAnnotation["annotation_type"],
        content,
        created_at:
          asString(row.created_at),
      },
    ];
  });
}

function normalizeFiles(
  value: unknown,
): StudentSubjectiveFile[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const row =
      item as Record<string, unknown>;

    const id = asString(row.id);
    const filePath =
      asString(row.file_path);
    const fileName =
      asString(row.file_name);
    const mimeType =
      asString(row.mime_type);

    if (
      !id ||
      !filePath ||
      !fileName ||
      !mimeType
    ) {
      return [];
    }

    return [
      {
        id,
        file_path: filePath,
        file_name: fileName,
        mime_type: mimeType,
        file_size_bytes:
          asNumber(
            row.file_size_bytes,
          ),
        page_number:
          asNumber(row.page_number),
      },
    ];
  });
}

/* =========================================================
 * Resolve Subjective Sets belonging to the student's
 * CURRENT published curriculum.
 *
 * This is intentionally independent of the evaluation RPC.
 *
 * Flow:
 *
 * Student Profile
 *   ↓
 * Current Program
 *   ↓
 * Published Curriculum Version
 *   ↓
 * Active Curriculum Nodes
 *   ↓
 * Resources mapped to those nodes
 *   ↓
 * Published SUBJECTIVE resources
 *   ↓
 * Subjective Sets
 * ========================================================= */

async function getCurrentCurriculumSubjectiveSetIds(
  supabase: Awaited<
    ReturnType<typeof createLearningSupabaseClient>
  >,
): Promise<Set<string>> {
  const profile =
    await getStudentProfile();

  if (
    !profile.exists ||
    !profile.program_id
  ) {
    return new Set();
  }

  /* ---------------------------------------------------------
   * 1. Current published curriculum
   * --------------------------------------------------------- */

  const {
    data: curriculum,
    error: curriculumError,
  } = await supabase
    .from("curriculum_versions")
    .select(
      `
        id,
        program_id,
        status
      `,
    )
    .eq(
      "program_id",
      profile.program_id,
    )
    .eq(
      "status",
      "PUBLISHED",
    )
    .maybeSingle();

  if (curriculumError) {
    console.error(
      "Failed to resolve current Subjective curriculum:",
      curriculumError,
    );

    return new Set();
  }

  if (!curriculum) {
    return new Set();
  }

  /* ---------------------------------------------------------
   * 2. Active curriculum nodes
   * --------------------------------------------------------- */

  const {
    data: curriculumNodes,
    error: nodesError,
  } = await supabase
    .from("curriculum_nodes")
    .select(
      "id",
    )
    .eq(
      "curriculum_version_id",
      curriculum.id,
    )
    .eq(
      "status",
      "ACTIVE",
    );

  if (nodesError) {
    console.error(
      "Failed to load current Subjective curriculum nodes:",
      nodesError,
    );

    return new Set();
  }

  const nodeIds =
    (curriculumNodes ?? []).map(
      (node) => node.id,
    );

  if (nodeIds.length === 0) {
    return new Set();
  }

  /* ---------------------------------------------------------
   * 3. Resources mapped to current curriculum nodes
   * --------------------------------------------------------- */

  const {
    data: resourceMappings,
    error: resourceMappingsError,
  } = await supabase
    .from(
      "resource_curriculum_nodes",
    )
    .select(
      `
        resource_id,
        curriculum_node_id
      `,
    )
    .in(
      "curriculum_node_id",
      nodeIds,
    );

  if (resourceMappingsError) {
    console.error(
      "Failed to load current Subjective resource mappings:",
      resourceMappingsError,
    );

    return new Set();
  }

  const resourceIds =
    Array.from(
      new Set(
        (resourceMappings ?? []).map(
          (mapping) =>
            mapping.resource_id,
        ),
      ),
    );

  if (resourceIds.length === 0) {
    return new Set();
  }

  /* ---------------------------------------------------------
   * 4. Only published Subjective resources
   * --------------------------------------------------------- */

  const {
    data: subjectiveResources,
    error: resourcesError,
  } = await supabase
    .from("resources")
    .select(
      `
        id,
        resource_type,
        status
      `,
    )
    .in(
      "id",
      resourceIds,
    )
    .eq(
      "resource_type",
      "SUBJECTIVE",
    )
    .eq(
      "status",
      "PUBLISHED",
    );

  if (resourcesError) {
    console.error(
      "Failed to load current Subjective resources:",
      resourcesError,
    );

    return new Set();
  }

  const subjectiveResourceIds =
    (subjectiveResources ?? []).map(
      (resource) => resource.id,
    );

  if (
    subjectiveResourceIds.length === 0
  ) {
    return new Set();
  }

  /* ---------------------------------------------------------
   * 5. Subjective Sets under those resources
   * --------------------------------------------------------- */

  const {
    data: subjectiveSets,
    error: setsError,
  } = await supabase
    .from("subjective_sets")
    .select(
      `
        id,
        resource_id,
        status
      `,
    )
    .in(
      "resource_id",
      subjectiveResourceIds,
    );

  if (setsError) {
    console.error(
      "Failed to load current Subjective Sets:",
      setsError,
    );

    return new Set();
  }

  return new Set(
    (subjectiveSets ?? [])
      .filter(
        (set) =>
          set.status ===
          "PUBLISHED",
      )
      .map(
        (set) => set.id,
      ),
  );
}

/* =========================================================
 * Student Subjective Evaluations
 * ========================================================= */

export async function getStudentSubjectiveEvaluations(): Promise<
  StudentSubjectiveEvaluationSummary[]
> {
  const { userId } =
    await auth();

  if (!userId) {
    return [];
  }

  const supabase =
    await createLearningSupabaseClient();

  /* ---------------------------------------------------------
   * Resolve which Subjective Sets belong to the student's
   * current published curriculum.
   *
   * This prevents historical evaluations from an old class
   * appearing in the current student's dashboard.
   * --------------------------------------------------------- */

  const currentSetIds =
    await getCurrentCurriculumSubjectiveSetIds(
      supabase,
    );

  if (currentSetIds.size === 0) {
    return [];
  }

  /* ---------------------------------------------------------
   * Load authenticated student's evaluated attempts
   * --------------------------------------------------------- */

  const {
    data,
    error,
  } = await supabase.rpc(
    "get_student_subjective_evaluations",
  );

  if (error) {
    console.error(
      "Failed to load student Subjective evaluations:",
      error,
    );

    return [];
  }

  if (!Array.isArray(data)) {
    return [];
  }

  /* ---------------------------------------------------------
   * IMPORTANT:
   *
   * The RPC is trusted for student ownership/evaluation
   * visibility, but the returned historical set list is
   * additionally constrained here to the student's CURRENT
   * published curriculum.
   * --------------------------------------------------------- */

  return data.flatMap((item) => {
    if (
      !item ||
      typeof item !== "object"
    ) {
      return [];
    }

    const row =
      item as Record<
        string,
        unknown
      >;

    const attemptId =
      asString(row.attempt_id);

    const setId =
      asString(row.set_id);

    const setTitle =
      asString(row.set_title);

    if (
      !attemptId ||
      !setId ||
      !setTitle
    ) {
      return [];
    }

    if (
      !currentSetIds.has(setId)
    ) {
      return [];
    }

    return [
      {
        attempt_id: attemptId,
        set_id: setId,
        set_title: setTitle,
        attempt_number:
          asNumber(
            row.attempt_number,
          ) ?? 1,
        attempt_type:
          asString(
            row.attempt_type,
          ) ?? "PRACTICE",
        evaluated_at:
          asString(
            row.evaluated_at,
          ),
        teacher_note:
          asString(
            row.teacher_note,
          ),
        question_count:
          asNumber(
            row.question_count,
          ) ?? 0,
        max_marks:
          asNumber(
            row.max_marks,
          ) ?? 0,
        final_marks:
          asNumber(
            row.final_marks,
          ) ?? 0,
      },
    ];
  });
}

/* =========================================================
 * Student Subjective Evaluation Detail
 * ========================================================= */

export async function getStudentSubjectiveEvaluation(
  attemptId: string,
): Promise<
  StudentSubjectiveEvaluationDetail | null
> {
  const { userId } =
    await auth();

  if (!userId) {
    return null;
  }

  const normalizedAttemptId =
    attemptId?.trim();

  if (!normalizedAttemptId) {
    return null;
  }

  const supabase =
    await createLearningSupabaseClient();

  const {
    data,
    error,
  } = await supabase.rpc(
    "get_student_subjective_evaluation",
    {
      p_attempt_id:
        normalizedAttemptId,
    },
  );

  if (error) {
    console.error(
      "Failed to load student Subjective evaluation:",
      error,
    );

    return null;
  }

  if (
    !data ||
    typeof data !== "object"
  ) {
    return null;
  }

  const raw =
    data as Record<
      string,
      unknown
    >;

  const rawAttempt =
    raw.attempt;

  const rawSet =
    raw.set;

  const rawQuestions =
    raw.questions;

  if (
    !rawAttempt ||
    typeof rawAttempt !==
      "object" ||
    !rawSet ||
    typeof rawSet !==
      "object"
  ) {
    return null;
  }

  const attemptRow =
    rawAttempt as Record<
      string,
      unknown
    >;

  const setRow =
    rawSet as Record<
      string,
      unknown
    >;

  const id =
    asString(
      attemptRow.id,
    );

  const setId =
    asString(
      attemptRow.set_id,
    );

  const setTitle =
    asString(
      setRow.title,
    );

  if (
    !id ||
    !setId ||
    !setTitle
  ) {
    return null;
  }

  const questions:
    StudentSubjectiveEvaluationQuestion[] =
    Array.isArray(rawQuestions)
      ? rawQuestions.flatMap(
          (item) => {
            if (
              !item ||
              typeof item !==
                "object"
            ) {
              return [];
            }

            const row =
              item as Record<
                string,
                unknown
              >;

            const attemptQuestionId =
              asString(
                row.attempt_question_id,
              );

            const questionId =
              asString(
                row.question_id,
              );

            const revisionId =
              asString(
                row.question_revision_id,
              );

            const questionText =
              asString(
                row.question_text,
              );

            if (
              !attemptQuestionId ||
              !questionId ||
              !revisionId ||
              !questionText
            ) {
              return [];
            }

            let submission:
              StudentSubjectiveEvaluationQuestion["submission"] =
              null;

            if (
              row.submission &&
              typeof row.submission ===
                "object"
            ) {
              const sub =
                row.submission as Record<
                  string,
                  unknown
                >;

              const submissionId =
                asString(
                  sub.id,
                );

              if (
                submissionId
              ) {
                submission = {
                  id: submissionId,
                  answer_text:
                    asString(
                      sub.answer_text,
                    ),
                  status:
                    asString(
                      sub.status,
                    ) ??
                    "SUBMITTED",
                  submitted_at:
                    asString(
                      sub.submitted_at,
                    ),
                };
              }
            }

            let evaluation:
              StudentSubjectiveEvaluationQuestion["evaluation"] =
              null;

            if (
              row.evaluation &&
              typeof row.evaluation ===
                "object"
            ) {
              const ev =
                row.evaluation as Record<
                  string,
                  unknown
                >;

              const evaluationId =
                asString(
                  ev.id,
                );

              if (
                evaluationId
              ) {
                evaluation = {
                  id: evaluationId,
                  marks_obtained:
                    asNumber(
                      ev.marks_obtained,
                    ),
                  teacher_feedback:
                    asString(
                      ev.teacher_feedback,
                    ),
                  teacher_note:
                    asString(
                      ev.teacher_note,
                    ),
                  evaluated_at:
                    asString(
                      ev.evaluated_at,
                    ),
                };
              }
            }

            return [
              {
                attempt_question_id:
                  attemptQuestionId,
                question_id:
                  questionId,
                question_revision_id:
                  revisionId,
                question_order:
                  asNumber(
                    row.question_order,
                  ) ?? 0,
                marks:
                  asNumber(
                    row.marks,
                  ) ?? 0,
                question_text:
                  questionText,
                ideal_solution:
                  asString(
                    row.ideal_solution,
                  ),
                submission,
                evaluation,
                files:
                  normalizeFiles(
                    row.files,
                  ),
                annotations:
                  normalizeAnnotations(
                    row.annotations,
                  ),
              },
            ];
          },
        )
      : [];

  /*
   * The RPC has already verified that this attempt belongs to
   * the authenticated student and is EVALUATED.
   *
   * Storage files are signed only after the authenticated,
   * ownership-checked RPC has returned them.
   */

  const adminSupabase =
    createAdminSupabaseClient();

  for (const question of questions) {
    for (const file of question.files) {
      const {
        data: signed,
        error: signedError,
      } = await adminSupabase.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(
          file.file_path,
          SIGNED_URL_SECONDS,
        );

      if (
        !signedError &&
        signed?.signedUrl
      ) {
        file.signed_url =
          signed.signedUrl;
      } else {
        console.error(
          "Failed to sign student Subjective file:",
          {
            attemptId:
              normalizedAttemptId,
            fileId: file.id,
            error: signedError,
          },
        );
      }
    }
  }

  return {
    attempt: {
      id,
      set_id: setId,
      attempt_number:
        asNumber(
          attemptRow.attempt_number,
        ) ?? 1,
      attempt_type:
        asString(
          attemptRow.attempt_type,
        ) ?? "PRACTICE",
      evaluated_at:
        asString(
          attemptRow.evaluated_at,
        ),
      teacher_note:
        asString(
          attemptRow.teacher_note,
        ),
    },

    set: {
      id:
        asString(
          setRow.id,
        ) ?? setId,

      title:
        setTitle,

      description:
        asString(
          setRow.description,
        ),

      category:
        asString(
          setRow.category,
        ) ?? "",

      set_number:
        asNumber(
          setRow.set_number,
        ) ?? 0,
    },

    questions,
  };
}