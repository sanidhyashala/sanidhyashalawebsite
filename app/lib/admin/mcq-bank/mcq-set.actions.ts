"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/app/lib/auth/admin";
import { createAdminSupabaseClient } from "@/app/lib/admin/supabase-admin";


/* =========================================================
 * Types
 * ========================================================= */

export type CreateAdminMcqSetResult = {
  success: boolean;
  message?: string;

  set?: {
    resourceId: string;
    testId: string;

    title: string;

    /*
     * Chapter-wise MCQ Set number.
     *
     * Example:
     *
     * Class 10 → Probability → Set 1
     * Class 10 → Probability → Set 2
     *
     * Class 11 → Probability → Set 1
     */
    setNumber: number;

    resourceStatus: string;
    testStatus: string;
  };
};


/* =========================================================
 * MCQ Access Type
 * ========================================================= */

type McqAccessType =
  | "FREE"
  | "PREMIUM";


/* =========================================================
 * Create Admin MCQ Set
 * =========================================================
 *
 * Content Creation owns:
 *
 *   1. MCQ Set creation
 *   2. Access Type selection
 *   3. Question attachment
 *   4. Review
 *   5. Publication
 *
 * Access Type:
 *
 *   FREE    → Maximum Attempts = 3
 *   PREMIUM → Maximum Attempts = 7
 *
 * Maximum Attempts are NOT manually configurable.
 *
 * The application derives the value from Access Type,
 * and the database remains the final authority.
 *
 * Pricing itself is handled separately at:
 *
 *   Chapter Product
 *   Subject Product
 *
 * ========================================================= */

export async function createAdminMcqSet(
  formData: FormData
): Promise<CreateAdminMcqSetResult> {

  /* -------------------------------------------------------
   * 1. Admin authentication
   * ------------------------------------------------------- */

  await requireAdmin();


  /* -------------------------------------------------------
   * 2. Read form values
   * ------------------------------------------------------- */

  const title =
    String(
      formData.get("title") ?? ""
    ).trim();


  const description =
    String(
      formData.get("description") ?? ""
    ).trim();


  const accessTypeRaw =
    String(
      formData.get("access_type") ?? ""
    ).trim().toUpperCase();


  const durationRaw =
    String(
      formData.get("duration_minutes") ?? ""
    ).trim();


  const passingPercentageRaw =
    String(
      formData.get("passing_percentage") ?? ""
    ).trim();


  const shuffleQuestions =
    formData.get("shuffle_questions") === "on";


  const shuffleOptions =
    formData.get("shuffle_options") === "on";


  const curriculumNodeId =
    String(
      formData.get("curriculum_node_id") ?? ""
    ).trim();


  /* -------------------------------------------------------
   * 3. Basic validation
   * ------------------------------------------------------- */

  if (!title) {
    return {
      success: false,
      message:
        "MCQ Set title is required.",
    };
  }


  if (!curriculumNodeId) {
    return {
      success: false,
      message:
        "Curriculum chapter is required.",
    };
  }


  /* -------------------------------------------------------
   * 4. Validate Access Type
   * ------------------------------------------------------- */

  if (
    accessTypeRaw !== "FREE" &&
    accessTypeRaw !== "PREMIUM"
  ) {
    return {
      success: false,
      message:
        "Please select a valid MCQ access type.",
    };
  }


  const accessType =
    accessTypeRaw as McqAccessType;


  /* -------------------------------------------------------
   * 5. Derive Maximum Attempts
   * -------------------------------------------------------
   *
   * Maximum Attempts are determined exclusively
   * by Access Type.
   *
   * FREE    → 3
   * PREMIUM → 7
   *
   * No user-entered max_attempts value is trusted.
   * ------------------------------------------------------- */

  const maxAttempts =
    accessType === "FREE"
      ? 3
      : 7;


  /* -------------------------------------------------------
   * 6. Parse numeric values
   * ------------------------------------------------------- */

  const durationMinutes =
    durationRaw === ""
      ? null
      : Number(durationRaw);


  const passingPercentage =
    passingPercentageRaw === ""
      ? null
      : Number(passingPercentageRaw);


  /* -------------------------------------------------------
   * 7. Validate numeric values
   * ------------------------------------------------------- */

  if (
    durationMinutes !== null &&
    (
      !Number.isInteger(durationMinutes) ||
      durationMinutes <= 0
    )
  ) {
    return {
      success: false,
      message:
        "Duration must be a positive whole number.",
    };
  }


  if (
    passingPercentage !== null &&
    (
      !Number.isFinite(passingPercentage) ||
      passingPercentage < 0 ||
      passingPercentage > 100
    )
  ) {
    return {
      success: false,
      message:
        "Passing percentage must be between 0 and 100.",
    };
  }


  /* -------------------------------------------------------
   * 8. Trusted admin Supabase client
   * ------------------------------------------------------- */

  const supabase =
    createAdminSupabaseClient();


  /* -------------------------------------------------------
   * 9. Atomic database operation
   * -------------------------------------------------------
   *
   * The database function:
   *
   *   create_admin_mcq_set()
   *
   * remains the final authority for:
   *
   *   FREE    → 3 attempts
   *   PREMIUM → 7 attempts
   *
   * The application passes the same derived value,
   * but the DB independently derives and enforces it.
   * ------------------------------------------------------- */

  const {
    data,
    error,
  } = await supabase.rpc(
    "create_admin_mcq_set",
    {
      p_title:
        title,

      p_description:
        description || null,

      p_access_type:
        accessType,

      p_duration_minutes:
        durationMinutes,

      p_max_attempts:
        maxAttempts,

      p_passing_percentage:
        passingPercentage,

      p_shuffle_questions:
        shuffleQuestions,

      p_shuffle_options:
        shuffleOptions,

      p_curriculum_node_id:
        curriculumNodeId,
    }
  );


  /* -------------------------------------------------------
   * 10. Database error
   * ------------------------------------------------------- */

  if (error) {
    return {
      success: false,
      message:
        `Failed to create MCQ Set: ${error.message}`,
    };
  }


  /* -------------------------------------------------------
   * 11. Verify RPC result
   * ------------------------------------------------------- */

  if (
    !data ||
    data.length === 0
  ) {
    return {
      success: false,
      message:
        "MCQ Set was not created.",
    };
  }


  const createdSet =
    data[0];


  /* -------------------------------------------------------
   * 12. Load database-generated Set number
   * ------------------------------------------------------- */

  const {
    data: createdResource,
    error: resourceError,
  } = await supabase
    .from("resources")
    .select(
      `
        id,
        set_number
      `
    )
    .eq(
      "id",
      createdSet.resource_id
    )
    .eq(
      "resource_type",
      "MCQ"
    )
    .maybeSingle();


  if (resourceError) {
    return {
      success: false,
      message:
        `MCQ Set was created, but its Set number could not be loaded: ${resourceError.message}`,
    };
  }


  if (
    !createdResource ||
    createdResource.set_number === null ||
    createdResource.set_number === undefined
  ) {
    return {
      success: false,
      message:
        "MCQ Set was created, but its Set number is missing.",
    };
  }


  /* -------------------------------------------------------
   * 13. Revalidate admin pages
   * ------------------------------------------------------- */

  revalidatePath(
    "/admin/mcq-bank"
  );

  revalidatePath(
    "/admin/mcq-bank/sets"
  );


  /* -------------------------------------------------------
   * 14. Return normalized result
   * ------------------------------------------------------- */

  return {
    success: true,

    message:
      `MCQ Set ${createdResource.set_number} created successfully.`,

    set: {
      resourceId:
        createdSet.resource_id,

      testId:
        createdSet.test_id,

      title:
        createdSet.title,

      setNumber:
        createdResource.set_number,

      resourceStatus:
        createdSet.resource_status,

      testStatus:
        createdSet.test_status,
    },
  };
}


/* =========================================================
 * Publish Admin MCQ Set
 * =========================================================
 *
 * IMPORTANT:
 *
 * Publishing is handled entirely by the database RPC:
 *
 *   publish_admin_mcq_set()
 *
 * Content Creation owns the publishing workflow.
 *
 * The database function owns the publication boundary.
 * ========================================================= */

export async function publishAdminMcqSet(
  resourceId: string
): Promise<{
  success: boolean;
  message: string;
}> {

  /* -------------------------------------------------------
   * 1. Admin authentication
   * ------------------------------------------------------- */

  await requireAdmin();


  /* -------------------------------------------------------
   * 2. Validate Resource ID
   * ------------------------------------------------------- */

  const normalizedResourceId =
    resourceId.trim();


  if (!normalizedResourceId) {
    return {
      success: false,
      message:
        "MCQ Set resource ID is required.",
    };
  }


  /* -------------------------------------------------------
   * 3. Trusted admin Supabase client
   * ------------------------------------------------------- */

  const supabase =
    createAdminSupabaseClient();


  /* -------------------------------------------------------
   * 4. Atomic publication RPC
   * ------------------------------------------------------- */

  const {
    data,
    error,
  } = await supabase.rpc(
    "publish_admin_mcq_set",
    {
      p_resource_id:
        normalizedResourceId,
    }
  );


  /* -------------------------------------------------------
   * 5. Database error
   * ------------------------------------------------------- */

  if (error) {
    return {
      success: false,
      message:
        error.message ||
        "Failed to publish MCQ Set.",
    };
  }


  /* -------------------------------------------------------
   * 6. Verify RPC result
   * ------------------------------------------------------- */

  if (
    !data ||
    data.length === 0
  ) {
    return {
      success: false,
      message:
        "MCQ Set was not published.",
    };
  }


  const publishedSet =
    data[0];


  /* -------------------------------------------------------
   * 7. Revalidate admin pages
   * ------------------------------------------------------- */

  revalidatePath(
    "/admin/mcq-bank"
  );

  revalidatePath(
    "/admin/mcq-bank/sets"
  );

  revalidatePath(
    `/admin/mcq-bank/sets/${normalizedResourceId}`
  );

  revalidatePath(
    `/admin/mcq-bank/sets/${normalizedResourceId}/questions`
  );


  /* -------------------------------------------------------
   * 8. Success
   * ------------------------------------------------------- */

  return {
    success: true,
    message:
      `MCQ Set published successfully. ${publishedSet.question_count} question(s) published.`,
  };
}