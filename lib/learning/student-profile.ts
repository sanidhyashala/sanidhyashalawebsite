import { createLearningSupabaseClient } from "./supabase-learning";
import { requireLearningAuth } from "./learning-auth";

/* =========================================================
 * Student Profile Types
 * ========================================================= */

export type StudentProfile = {
  exists: boolean;

  id?: string;
  user_id?: string;

  full_name?: string;

  program_id?: string;
  program_name?: string;
  program_slug?: string;

  board?: "CBSE" | "ICSE" | "UP_BOARD" | "OTHER";

  school_name?: string | null;

  preferred_language?: "English" | "Hindi" | "Hinglish";

  onboarding_completed?: boolean;

  created_at?: string;
  updated_at?: string;
};


/* =========================================================
 * Get Current Student Profile
 *
 * Returns:
 *
 *   exists = false
 *       → new student / onboarding required
 *
 *   exists = true
 *       → existing student
 * ========================================================= */

export async function getStudentProfile(): Promise<StudentProfile> {
  await requireLearningAuth();

  const supabase = await createLearningSupabaseClient();

  const { data, error } = await supabase.rpc(
    "get_student_profile"
  );

  if (error) {
    throw new Error(
      `Failed to load student profile: ${error.message}`
    );
  }

  return data as StudentProfile;
}


/* =========================================================
 * Create Student Profile
 * ========================================================= */

export async function createStudentProfile({
  fullName,
  programId,
  board,
  schoolName,
  preferredLanguage,
}: {
  fullName: string;
  programId: string;
  board: "CBSE" | "ICSE" | "UP_BOARD" | "OTHER";
  schoolName?: string | null;
  preferredLanguage?: "English" | "Hindi" | "Hinglish";
}): Promise<StudentProfile> {
  await requireLearningAuth();

  const supabase = await createLearningSupabaseClient();

  const { data, error } = await supabase.rpc(
    "create_student_profile",
    {
      p_full_name: fullName,
      p_program_id: programId,
      p_board: board,
      p_school_name: schoolName ?? null,
      p_preferred_language:
        preferredLanguage ?? "English",
    }
  );

  if (error) {
    throw new Error(
      `Failed to create student profile: ${error.message}`
    );
  }

  return data as StudentProfile;
}


/* =========================================================
 * Update Student Profile
 *
 * user_id is NEVER accepted from the client.
 * Database resolves it from auth.jwt().
 * ========================================================= */

export async function updateStudentProfile({
  fullName,
  programId,
  board,
  schoolName,
  preferredLanguage,
}: {
  fullName: string;
  programId: string;
  board: "CBSE" | "ICSE" | "UP_BOARD" | "OTHER";
  schoolName?: string | null;
  preferredLanguage?: "English" | "Hindi" | "Hinglish";
}): Promise<StudentProfile> {
  await requireLearningAuth();

  const supabase = await createLearningSupabaseClient();

  const { data, error } = await supabase.rpc(
    "update_student_profile",
    {
      p_full_name: fullName,
      p_program_id: programId,
      p_board: board,
      p_school_name: schoolName ?? null,
      p_preferred_language:
        preferredLanguage ?? "English",
    }
  );

  if (error) {
    throw new Error(
      `Failed to update student profile: ${error.message}`
    );
  }

  return data as StudentProfile;
}