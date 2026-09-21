import "server-only";

import { clerkClient } from "@clerk/nextjs/server";

import { requireAdmin } from "@/app/lib/auth/admin";
import { createAdminSupabaseClient } from "@/app/lib/admin/supabase-admin";

export type AdminStudent = {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  programId: string;
  programName: string;
  programSlug: string;
  board: "CBSE" | "ICSE" | "UP_BOARD" | "OTHER" | string;
  schoolName: string | null;
  preferredLanguage: "English" | "Hindi" | "Hinglish" | string;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
};

type StudentProfileRow = {
  id: string;
  user_id: string;
  full_name: string;
  program_id: string;
  board: string;
  school_name: string | null;
  preferred_language: string;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
  programs:
    | {
        id: string;
        name: string;
        slug: string;
      }
    | {
        id: string;
        name: string;
        slug: string;
      }[]
    | null;
};

export async function getAdminStudents(): Promise<AdminStudent[]> {
  await requireAdmin();

  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase
    .from("student_profiles")
    .select(`
      id,
      user_id,
      full_name,
      program_id,
      board,
      school_name,
      preferred_language,
      onboarding_completed,
      created_at,
      updated_at,
      programs!student_profiles_program_id_fkey (
        id,
        name,
        slug
      )
    `)
    .eq("onboarding_completed", true)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw new Error(
      `Failed to load students: ${error.message}`
    );
  }

  const profiles = (data ?? []) as StudentProfileRow[];

  if (profiles.length === 0) {
    return [];
  }

  const clerk = await clerkClient();

  const students = await Promise.all(
    profiles.map(async (profile) => {
      let email = "";

      try {
        const user = await clerk.users.getUser(profile.user_id);

        email =
          user.primaryEmailAddress?.emailAddress?.trim() ??
          user.emailAddresses[0]?.emailAddress?.trim() ??
          "";
      } catch {
        /*
         * A student profile can technically remain in the database
         * even if the corresponding Clerk user is unavailable.
         *
         * We do not fail the entire Students page because of one
         * unavailable Clerk user.
         */
        email = "";
      }

      const program = Array.isArray(profile.programs)
        ? profile.programs[0] ?? null
        : profile.programs;

      return {
        id: profile.id,
        userId: profile.user_id,
        fullName: profile.full_name,
        email,
        programId: profile.program_id,
        programName: program?.name ?? "Unknown Class",
        programSlug: program?.slug ?? "",
        board: profile.board,
        schoolName: profile.school_name,
        preferredLanguage: profile.preferred_language,
        onboardingCompleted: profile.onboarding_completed,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
      };
    })
  );

  return students;
}