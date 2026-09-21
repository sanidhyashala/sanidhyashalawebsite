"use server";

import { auth } from "@clerk/nextjs/server";

import { createLearningSupabaseClient } from "@/lib/learning/supabase-learning";

export type SubjectiveAnnotationType =
  | "PEN"
  | "CIRCLE"
  | "TICK"
  | "CROSS"
  | "ARROW"
  | "TEXT";

export type SubjectiveAnnotation = {
  id?: string;
  evaluation_id?: string;
  page_number: number | null;
  x_position: number | null;
  y_position: number | null;
  annotation_type: SubjectiveAnnotationType;
  content: string;
  created_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };

const ALLOWED_TYPES = new Set<SubjectiveAnnotationType>([
  "PEN",
  "CIRCLE",
  "TICK",
  "CROSS",
  "ARROW",
  "TEXT",
]);

function normalizeAnnotation(value: unknown): SubjectiveAnnotation | null {
  if (!value || typeof value !== "object") return null;

  const row = value as Record<string, unknown>;
  const annotationType = row.annotation_type;
  const content = row.content;

  if (
    typeof annotationType !== "string" ||
    !ALLOWED_TYPES.has(annotationType as SubjectiveAnnotationType) ||
    typeof content !== "string"
  ) {
    return null;
  }

  const page = row.page_number;
  const x = row.x_position;
  const y = row.y_position;

  const pageNumber =
    page === null || page === undefined || page === ""
      ? null
      : Number(page);
  const xPosition =
    x === null || x === undefined || x === "" ? null : Number(x);
  const yPosition =
    y === null || y === undefined || y === "" ? null : Number(y);

  if (
    pageNumber !== null &&
    (!Number.isInteger(pageNumber) || pageNumber < 1)
  ) {
    return null;
  }

  if (
    xPosition !== null &&
    (!Number.isFinite(xPosition) || xPosition < 0 || xPosition > 1)
  ) {
    return null;
  }

  if (
    yPosition !== null &&
    (!Number.isFinite(yPosition) || yPosition < 0 || yPosition > 1)
  ) {
    return null;
  }

  if (content.length === 0 || content.length > 10000) return null;

  return {
    id: typeof row.id === "string" ? row.id : undefined,
    evaluation_id:
      typeof row.evaluation_id === "string" ? row.evaluation_id : undefined,
    page_number: pageNumber,
    x_position: xPosition,
    y_position: yPosition,
    annotation_type: annotationType as SubjectiveAnnotationType,
    content,
  };
}

export async function getSubjectiveEvaluationAnnotations(
  evaluationId: string,
): Promise<Result<SubjectiveAnnotation[]>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Authentication required." };
    }

    const id = evaluationId?.trim();
    if (!id) {
      return { success: false, error: "Evaluation ID is required." };
    }

    const supabase = await createLearningSupabaseClient();
    const { data, error } = await supabase.rpc(
      "get_subjective_evaluation_annotations",
      { p_evaluation_id: id },
    );

    if (error) {
      console.error("Failed to load Subjective annotations:", error);
      return {
        success: false,
        error: error.message || "Unable to load annotations.",
      };
    }

    const raw = Array.isArray(data) ? data : [];
    const annotations = raw
      .map(normalizeAnnotation)
      .filter((item): item is SubjectiveAnnotation => item !== null);

    return { success: true, data: annotations };
  } catch (error) {
    console.error("Unexpected Subjective annotation load error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to load annotations.",
    };
  }
}

export async function saveSubjectiveEvaluationAnnotations(
  evaluationId: string,
  annotations: SubjectiveAnnotation[],
): Promise<Result<SubjectiveAnnotation[]>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: "Authentication required." };
    }

    const id = evaluationId?.trim();
    if (!id) {
      return { success: false, error: "Evaluation ID is required." };
    }

    if (!Array.isArray(annotations) || annotations.length > 500) {
      return {
        success: false,
        error: "A maximum of 500 annotations can be saved at once.",
      };
    }

    const normalized = annotations.map(normalizeAnnotation);

    if (normalized.some((item) => item === null)) {
      return {
        success: false,
        error: "One or more annotations contain invalid data.",
      };
    }

    const payload = normalized.map((item) => {
      const annotation = item as SubjectiveAnnotation;
      return {
        page_number: annotation.page_number,
        x_position: annotation.x_position,
        y_position: annotation.y_position,
        annotation_type: annotation.annotation_type,
        content: annotation.content,
      };
    });

    const supabase = await createLearningSupabaseClient();
    const { data, error } = await supabase.rpc(
      "save_subjective_evaluation_annotations",
      {
        p_evaluation_id: id,
        p_annotations: payload,
      },
    );

    if (error) {
      console.error("Failed to save Subjective annotations:", error);
      return {
        success: false,
        error: error.message || "Unable to save annotations.",
      };
    }

    const raw = Array.isArray(data) ? data : [];
    const saved = raw
      .map(normalizeAnnotation)
      .filter((item): item is SubjectiveAnnotation => item !== null);

    return { success: true, data: saved };
  } catch (error) {
    console.error("Unexpected Subjective annotation save error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to save annotations.",
    };
  }
}
