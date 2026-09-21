"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAdminSupabaseClient } from "@/app/lib/admin/supabase-admin";

const VALID_CATEGORIES = [
  "UNDERSTAND_APPLY",
  "THINK_SOLVE",
  "CASE_BASED",
] as const;

const VALID_ACCESS_TYPES = [
  "FREE",
  "PREMIUM",
] as const;

type SubjectiveCategory =
  (typeof VALID_CATEGORIES)[number];

type SubjectiveAccessType =
  (typeof VALID_ACCESS_TYPES)[number];

export async function createSubjectiveSet(
  formData: FormData
) {
  /* -------------------------------------------------------
   * 1. Clerk authentication
   * ------------------------------------------------------- */

  const { userId } = await auth();

  if (!userId) {
    throw new Error("Authentication required.");
  }

  /* -------------------------------------------------------
   * 2. Trusted admin client
   * ------------------------------------------------------- */

  const supabase = createAdminSupabaseClient();

  /* -------------------------------------------------------
   * 3. Application-level ADMIN authorization
   * ------------------------------------------------------- */

  const {
    data: access,
    error: accessError,
  } = await supabase
    .from("teacher_access")
    .select("user_id, role, is_active")
    .eq("user_id", userId)
    .eq("role", "ADMIN")
    .eq("is_active", true)
    .maybeSingle();

  if (accessError) {
    throw new Error(
      `Failed to verify admin access: ${accessError.message}`
    );
  }

  if (!access) {
    throw new Error(
      "You are not authorized to create Subjective Sets."
    );
  }

  /* -------------------------------------------------------
   * 4. Read form values
   * ------------------------------------------------------- */

  const resourceId = String(
    formData.get("resource_id") ?? ""
  ).trim();

  const category = String(
    formData.get("category") ?? ""
  ).trim() as SubjectiveCategory;

  const title = String(
    formData.get("title") ?? ""
  ).trim();

  const descriptionValue = String(
    formData.get("description") ?? ""
  ).trim();

  const accessType = String(
    formData.get("access_type") ?? ""
  ).trim() as SubjectiveAccessType;

  /* -------------------------------------------------------
   * 5. Basic validation
   * ------------------------------------------------------- */

  if (!resourceId) {
    throw new Error("Subjective resource is required.");
  }

  if (!VALID_CATEGORIES.includes(category)) {
    throw new Error("Invalid Subjective category.");
  }

  if (!VALID_ACCESS_TYPES.includes(accessType)) {
    throw new Error(
      "Invalid Subjective access type."
    );
  }

  if (!title) {
    throw new Error("Set title is required.");
  }

  if (title.length > 200) {
    throw new Error(
      "Set title must be 200 characters or fewer."
    );
  }

  const description =
    descriptionValue || null;

  /* -------------------------------------------------------
   * 6. Verify resource identity
   *
   * IMPORTANT:
   * The resource must be SUBJECTIVE.
   * ------------------------------------------------------- */

  const {
    data: resource,
    error: resourceError,
  } = await supabase
    .from("resources")
    .select("id, resource_type")
    .eq("id", resourceId)
    .maybeSingle();

  if (resourceError) {
    throw new Error(
      `Failed to verify Subjective resource: ${resourceError.message}`
    );
  }

  if (!resource) {
    throw new Error("Resource not found.");
  }

  if (resource.resource_type !== "SUBJECTIVE") {
    throw new Error(
      "The selected resource is not a Subjective resource."
    );
  }

  /* -------------------------------------------------------
   * 7. Determine next Set Number
   *
   * IMPORTANT:
   * Numbering is independent for each category.
   *
   * Example:
   *
   * UNDERSTAND_APPLY → 1, 2, 3...
   * THINK_SOLVE      → 1, 2, 3...
   * CASE_BASED       → 1, 2, 3...
   *
   * We NEVER trust a client-supplied set number.
   * ------------------------------------------------------- */

  const {
    data: latestSet,
    error: latestSetError,
  } = await supabase
    .from("subjective_sets")
    .select("set_number")
    .eq("resource_id", resourceId)
    .eq("category", category)
    .order("set_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestSetError) {
    throw new Error(
      `Failed to determine next Subjective Set number: ${latestSetError.message}`
    );
  }

  const setNumber =
    (latestSet?.set_number ?? 0) + 1;

  /* -------------------------------------------------------
   * 8. Create Subjective Set through locked RPC
   *
   * Access type is selected during creation.
   * Set is always created as DRAFT.
   * ------------------------------------------------------- */

  const {
    data,
    error: rpcError,
  } = await supabase.rpc(
    "create_admin_subjective_set",
    {
      p_resource_id: resourceId,
      p_category: category,
      p_title: title,
      p_description: description,
      p_set_number: setNumber,
      p_access_type: accessType,
    }
  );

  if (rpcError) {
    throw new Error(
      `Failed to create Subjective Set: ${rpcError.message}`
    );
  }

  const createdSet = data?.[0];

  if (!createdSet?.set_id) {
    throw new Error(
      "Subjective Set was not created correctly."
    );
  }

  /* -------------------------------------------------------
   * 9. Refresh affected pages
   * ------------------------------------------------------- */

  revalidatePath(
    `/admin/learning/subjective/${resourceId}`
  );

  revalidatePath("/admin/learning");

  /* -------------------------------------------------------
   * 10. Open newly created Set
   * ------------------------------------------------------- */

  redirect(
    `/admin/learning/subjective/${resourceId}/sets/${createdSet.set_id}`
  );
}