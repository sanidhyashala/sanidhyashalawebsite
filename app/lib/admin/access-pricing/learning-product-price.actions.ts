"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/app/lib/auth/admin";
import { createAdminSupabaseClient } from "@/app/lib/admin/supabase-admin";

function isValidUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function parseRupeesToPaise(value: string) {
  const normalized = value.trim().replace(/,/g, "");

  if (!normalized) {
    throw new Error("Price is required.");
  }

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    throw new Error(
      "Enter a valid price with up to two decimal places."
    );
  }

  const amount = Number(normalized);

  if (!Number.isFinite(amount)) {
    throw new Error("Enter a valid price.");
  }

  if (amount <= 0) {
    throw new Error("Price must be greater than ₹0.");
  }

  const amountPaise = Math.round(amount * 100);

  if (amountPaise <= 0) {
    throw new Error("Price must be greater than ₹0.");
  }

  return amountPaise;
}

export async function setLearningProductPrice(
  formData: FormData
): Promise<{
  success: boolean;
  message: string;
}> {
  await requireAdmin();

  const productId = String(
    formData.get("product_id") ?? ""
  ).trim();

  const price = String(
    formData.get("price") ?? ""
  ).trim();

  if (!isValidUuid(productId)) {
    return {
      success: false,
      message: "Invalid learning product.",
    };
  }

  let amountPaise: number;

  try {
    amountPaise = parseRupeesToPaise(price);
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Invalid price.",
    };
  }

  const supabase = createAdminSupabaseClient();

  const { error } = await supabase.rpc(
    "admin_set_learning_product_price",
    {
      p_product_id: productId,
      p_amount_paise: amountPaise,
      p_currency: "INR",
    }
  );

  if (error) {
    return {
      success: false,
      message: `Failed to update price: ${error.message}`,
    };
  }

  revalidatePath("/admin/access-pricing");

  return {
    success: true,
    message: "Chapter product price updated successfully.",
  };
}