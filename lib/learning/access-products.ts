import "server-only";

import { createAdminSupabaseClient } from "@/app/lib/admin/supabase-admin";

export type LearningAccessProductType =
  | "SUBJECT"
  | "CHAPTER";

export type LearningAccessProduct = {
  id: string;
  curriculumNodeId: string;
  productType: LearningAccessProductType;
  title: string;
  description: string | null;
  amountPaise: number;
  currency: "INR";
};

type ProductRow = {
  id: string;
  curriculum_node_id: string;
  product_type: LearningAccessProductType;
  title: string;
  description: string | null;
  status: string;
};

type PriceRow = {
  id: string;
  product_id: string;
  amount_paise: number;
  currency: string;
  active: boolean;
  valid_from: string;
  valid_until: string | null;
};

export async function getLearningAccessProducts({
  curriculumNodeIds,
  productType,
}: {
  curriculumNodeIds: string[];
  productType: LearningAccessProductType;
}): Promise<Map<string, LearningAccessProduct>> {
  const result = new Map<string, LearningAccessProduct>();

  const nodeIds = [
    ...new Set(
      curriculumNodeIds
        .map((id) => id.trim())
        .filter(Boolean),
    ),
  ];

  if (nodeIds.length === 0) {
    return result;
  }

  const supabase = createAdminSupabaseClient();
  const now = new Date().toISOString();

  const { data: productRows, error: productError } =
    await supabase
      .from("learning_products")
      .select(
        `
          id,
          curriculum_node_id,
          product_type,
          title,
          description,
          status
        `,
      )
      .in("curriculum_node_id", nodeIds)
      .eq("product_type", productType)
      .eq("status", "ACTIVE");

  if (productError) {
    throw new Error(
      `Failed to load learning access products: ${productError.message}`,
    );
  }

  const products = (productRows ?? []) as ProductRow[];

  if (products.length === 0) {
    return result;
  }

  const productIds = products.map((product) => product.id);

  const { data: priceRows, error: priceError } =
    await supabase
      .from("learning_product_prices")
      .select(
        `
          id,
          product_id,
          amount_paise,
          currency,
          active,
          valid_from,
          valid_until
        `,
      )
      .in("product_id", productIds)
      .eq("active", true)
      .eq("currency", "INR")
      .lte("valid_from", now)
      .or(`valid_until.is.null,valid_until.gt.${now}`)
      .order("valid_from", { ascending: false });

  if (priceError) {
    throw new Error(
      `Failed to load learning access prices: ${priceError.message}`,
    );
  }

  const validPricesByProduct = new Map<string, PriceRow>();

  for (const row of (priceRows ?? []) as PriceRow[]) {
    if (
      !Number.isSafeInteger(row.amount_paise) ||
      row.amount_paise <= 0
    ) {
      continue;
    }

    // Newest valid price first. Keep only one price per product.
    if (!validPricesByProduct.has(row.product_id)) {
      validPricesByProduct.set(row.product_id, row);
    }
  }

  for (const product of products) {
    const price = validPricesByProduct.get(product.id);

    if (!price) {
      continue;
    }

    // Fail closed if unexpected duplicate products exist for a node.
    if (result.has(product.curriculum_node_id)) {
      throw new Error(
        `Multiple active ${productType} products found for curriculum node ${product.curriculum_node_id}.`,
      );
    }

    result.set(product.curriculum_node_id, {
      id: product.id,
      curriculumNodeId: product.curriculum_node_id,
      productType,
      title: product.title,
      description: product.description,
      amountPaise: price.amount_paise,
      currency: "INR",
    });
  }

  return result;
}