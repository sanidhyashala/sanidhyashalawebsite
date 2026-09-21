"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/app/lib/auth/admin";
import { createAdminSupabaseClient } from "@/app/lib/admin/supabase-admin";

function isValidUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

export async function publishSubjectiveSet(
  formData: FormData
): Promise<void> {
  await requireAdmin();

  const setId = String(
    formData.get("set_id") ?? ""
  ).trim();

  if (!setId) {
    throw new Error("Subjective Set ID is required.");
  }

  if (!isValidUuid(setId)) {
    throw new Error("Invalid Subjective Set ID.");
  }

  const supabase =
    createAdminSupabaseClient();

  /* -------------------------------------------------------
   * Publish Subjective Set
   *
   * The database function is the final publishing authority.
   * It validates:
   * - set state
   * - parent resource
   * - attached questions
   * - published question revisions
   * - access configuration
   * ------------------------------------------------------- */

  const {
    data,
    error,
  } = await supabase.rpc(
    "admin_publish_subjective_set",
    {
      p_set_id: setId,
    }
  );

  if (error) {
    throw new Error(
      `Failed to publish Subjective Set: ${error.message}`
    );
  }

  const result = data?.[0];

  if (!result?.set_id) {
    throw new Error(
      "Subjective Set was not published correctly."
    );
  }

  /* -------------------------------------------------------
   * Refresh affected admin pages
   * ------------------------------------------------------- */

  revalidatePath("/admin/learning");

  revalidatePath(
    `/admin/learning/subjective/${result.resource_id}`
  );

  revalidatePath(
    `/admin/learning/subjective/${result.resource_id}/sets/${result.set_id}`
  );

  /* -------------------------------------------------------
   * Redirect back to the published Set workspace.
   *
   * IMPORTANT:
   * redirect() makes this Server Action compatible with
   * <form action={publishSubjectiveSet}> because the action
   * does not return an object.
   * ------------------------------------------------------- */

  redirect(
    `/admin/learning/subjective/${result.resource_id}/sets/${result.set_id}`
  );
}