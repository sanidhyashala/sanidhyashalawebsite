import "server-only";

import { createAdminSupabaseClient } from "@/app/lib/admin/supabase-admin";

import type {
  SubjectiveCategory,
  SubjectiveSetStatus,
  SubjectiveSetSummary,
} from "@/app/lib/learning/subjective/types";

/* =========================================================
 * Admin Subjective Sets
 * ========================================================= */

export async function getAdminSubjectiveSets(
  resourceId: string
): Promise<SubjectiveSetSummary[]> {
  const normalizedResourceId = resourceId.trim();

  if (!normalizedResourceId) {
    return [];
  }

  const supabase = createAdminSupabaseClient();

  /* -------------------------------------------------------
   * 1. Verify Subjective resource
   * ------------------------------------------------------- */

  const {
    data: resource,
    error: resourceError,
  } = await supabase
    .from("resources")
    .select(
      `
        id,
        resource_type
      `
    )
    .eq("id", normalizedResourceId)
    .eq("resource_type", "SUBJECTIVE")
    .maybeSingle();

  if (resourceError) {
    throw new Error(
      `Failed to load Subjective resource: ${resourceError.message}`
    );
  }

  if (!resource) {
    return [];
  }

  /* -------------------------------------------------------
   * 2. Load Subjective sets
   * ------------------------------------------------------- */

  const {
    data: sets,
    error: setsError,
  } = await supabase
    .from("subjective_sets")
    .select(
      `
        id,
        resource_id,
        category,
        title,
        description,
        set_number,
        display_order,
        status,
        access_type
      `
    )
    .eq("resource_id", resource.id)
    .order("display_order", {
      ascending: true,
    })
    .order("set_number", {
      ascending: true,
    });

  if (setsError) {
    throw new Error(
      `Failed to load Subjective sets: ${setsError.message}`
    );
  }

  if (!sets || sets.length === 0) {
    return [];
  }

  /* -------------------------------------------------------
   * 3. Load question counts
   * ------------------------------------------------------- */

  const setIds = sets.map((set) => set.id);

  const {
    data: questionRows,
    error: questionRowsError,
  } = await supabase
    .from("subjective_set_questions")
    .select("set_id")
    .in("set_id", setIds);

  if (questionRowsError) {
    throw new Error(
      `Failed to load Subjective question counts: ${questionRowsError.message}`
    );
  }

  const questionCountBySetId = new Map<string, number>();

  for (const row of questionRows ?? []) {
    questionCountBySetId.set(
      row.set_id,
      (questionCountBySetId.get(row.set_id) ?? 0) + 1
    );
  }

  /* -------------------------------------------------------
   * 4. Normalize
   * ------------------------------------------------------- */

  return sets.map((set) => ({
    id: set.id,
    resourceId: set.resource_id,

    category: set.category as SubjectiveCategory,

    title: set.title,
    description: set.description,

    setNumber: set.set_number,
    displayOrder: set.display_order,

    status: set.status as SubjectiveSetStatus,
    accessType: set.access_type,

    questionCount:
      questionCountBySetId.get(set.id) ?? 0,
  }));
}