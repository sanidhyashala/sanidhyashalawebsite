import { createLearningSupabaseClient } from "./supabase-learning";
import { requireLearningAuth } from "./learning-auth";

/* =========================================================
 * Get all published learning programs
 *
 * Used only where a list of programs is genuinely required.
 * Student-facing personalized entry should use
 * getLearningProgramById() instead.
 * ========================================================= */

export async function getLearningPrograms() {
  await requireLearningAuth();

  const supabase = await createLearningSupabaseClient();

  const { data, error } = await supabase
    .from("programs")
    .select(
      `
        id,
        name,
        slug,
        description,
        cover_image_url,
        status
      `
    )
    .eq("status", "PUBLISHED")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(
      `Failed to load learning programs: ${error.message}`
    );
  }

  return data;
}

/* =========================================================
 * Get one published learning program
 *
 * This is the personalized student-facing lookup.
 * ========================================================= */

export async function getLearningProgramById(
  programId: string
) {
  await requireLearningAuth();

  const normalizedProgramId = programId.trim();

  if (!normalizedProgramId) {
    return null;
  }

  const supabase = await createLearningSupabaseClient();

  const { data, error } = await supabase
    .from("programs")
    .select(
      `
        id,
        name,
        slug,
        description,
        cover_image_url,
        status
      `
    )
    .eq("id", normalizedProgramId)
    .eq("status", "PUBLISHED")
    .maybeSingle();

  if (error) {
    throw new Error(
      `Failed to load learning program: ${error.message}`
    );
  }

  return data;
}