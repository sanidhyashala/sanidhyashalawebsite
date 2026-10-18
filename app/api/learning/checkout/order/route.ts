import "server-only";

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { randomUUID } from "node:crypto";

import { createAdminSupabaseClient } from "@/app/lib/admin/supabase-admin";

export const runtime = "nodejs";

type CreateOrderBody = {
  productId?: unknown;
};

type LearningProduct = {
  id: string;
  title: string;
  status: string;
  product_type: string;
  curriculum_node_id: string;
};

type RazorpayOrderResponse = {
  success: true;
  purchaseId: string;
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  product: {
    id: string;
    title: string;
  };
};

type RazorpayPaymentList = {
  items?: Array<{
    id?: string;
    status?: string;
    amount?: number;
    currency?: string;
  }>;
};

function getRazorpayClient() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay server configuration is missing.");
  }

  return {
    keyId,
    client: new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    }),
  };
}

function isValidProductId(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function jsonError(message: string, status: number) {
  return NextResponse.json(
    { success: false, message },
    { status }
  );
}

function toPaise(amount: unknown): number | null {
  const rupees = Number(amount);

  if (!Number.isFinite(rupees) || rupees <= 0) {
    return null;
  }

  const paise = Math.round(rupees * 100);

  if (
    !Number.isSafeInteger(paise) ||
    Math.abs(rupees * 100 - paise) > 0.000001
  ) {
    return null;
  }

  return paise;
}

export async function POST(request: Request) {
  try {
    const { isAuthenticated, userId } = await auth();

    if (!isAuthenticated || !userId) {
      return jsonError("Please sign in first.", 401);
    }

    let body: CreateOrderBody;

    try {
      body = (await request.json()) as CreateOrderBody;
    } catch {
      return jsonError("Invalid request body.", 400);
    }

    const productId =
      typeof body.productId === "string"
        ? body.productId.trim()
        : "";

    if (!isValidProductId(productId)) {
      return jsonError("Invalid learning product.", 400);
    }

    const supabase = createAdminSupabaseClient();

    // 1. Resolve the product from the database.
    const { data: productData, error: productError } = await supabase
      .from("learning_products")
      .select("id, title, status, product_type, curriculum_node_id")
      .eq("id", productId)
      .maybeSingle();

    if (productError) {
      throw new Error("Could not validate the learning product.");
    }

    const product = productData as LearningProduct | null;

    if (
      !product ||
      product.status !== "ACTIVE" ||
      !["SUBJECT", "CHAPTER"].includes(product.product_type)
    ) {
      return jsonError(
        "This product is not available for purchase.",
        404
      );
    }

    // 2. Validate the curriculum hierarchy.
    const { data: node, error: nodeError } = await supabase
      .from("curriculum_nodes")
      .select("id, status, curriculum_version_id")
      .eq("id", product.curriculum_node_id)
      .maybeSingle();

    if (nodeError) {
      throw new Error("Could not validate the curriculum node.");
    }

    if (!node || node.status !== "ACTIVE") {
      return jsonError(
        "This learning product is not currently available.",
        409
      );
    }

    const { data: version, error: versionError } = await supabase
      .from("curriculum_versions")
      .select("id, program_id, status")
      .eq("id", node.curriculum_version_id)
      .maybeSingle();

    if (versionError) {
      throw new Error("Could not validate the curriculum version.");
    }

    if (!version || version.status !== "PUBLISHED") {
      return jsonError("This curriculum is not published.", 409);
    }

    const { data: program, error: programError } = await supabase
      .from("programs")
      .select("id, status")
      .eq("id", version.program_id)
      .maybeSingle();

    if (programError) {
      throw new Error("Could not validate the learning program.");
    }

    if (!program || program.status !== "PUBLISHED") {
      return jsonError(
        "This learning program is not available.",
        409
      );
    }

    // 3. Stop checkout if the user already has valid access.
    const now = new Date().toISOString();

    const { data: entitlements, error: entitlementError } =
      await supabase
        .from("learning_product_entitlements")
        .select("id")
        .eq("user_id", userId)
        .eq("product_id", product.id)
        .eq("status", "ACTIVE")
        .or(`expires_at.is.null,expires_at.gt.${now}`)
        .limit(1);

    if (entitlementError) {
      throw new Error("Could not verify existing product access.");
    }

    if (entitlements && entitlements.length > 0) {
      return jsonError(
        "You already have access to this product.",
        409
      );
    }

    // 4. Load the current active database price.
    const { data: prices, error: priceError } = await supabase
      .from("learning_product_prices")
      .select(
        "id, product_id, amount_paise, currency, valid_from, valid_until"
      )
      .eq("product_id", product.id)
      .eq("active", true)
      .lte("valid_from", now)
      .or(`valid_until.is.null,valid_until.gt.${now}`)
      .order("valid_from", { ascending: false })
      .limit(2);

    if (priceError) {
      throw new Error("Could not load the current product price.");
    }

    if (!prices || prices.length !== 1) {
      return jsonError(
        prices && prices.length > 1
          ? "Product pricing needs administrative review."
          : "This product does not have a currently valid price.",
        409
      );
    }

    const price = prices[0];

    if (
      !Number.isSafeInteger(price.amount_paise) ||
      price.amount_paise <= 0 ||
      price.currency !== "INR"
    ) {
      return jsonError(
        "The configured product price is invalid.",
        409
      );
    }

    const { keyId, client: razorpay } = getRazorpayClient();

    // 5. Find the existing pending purchase, if any.
    const { data: pendingPurchases, error: pendingError } =
      await supabase
        .from("purchases")
        .select("id, amount, currency, provider_order_id")
        .eq("user_id", userId)
        .eq("product_id", product.id)
        .eq("payment_provider", "razorpay")
        .eq("status", "PENDING")
        .eq("fulfillment_status", "PENDING")
        .is("resource_id", null)
        .order("created_at", { ascending: false })
        .limit(1);

    if (pendingError) {
      throw new Error("Could not check pending purchases.");
    }

    const pending = pendingPurchases?.[0];

    if (pending) {
      if (!pending.provider_order_id) {
        return jsonError(
          "An earlier checkout needs review. Please contact support before retrying.",
          409
        );
      }

      let existingOrder;

      try {
        existingOrder = await razorpay.orders.fetch(
          pending.provider_order_id
        );
      } catch {
        return jsonError(
          "An earlier checkout could not be verified. Please try again shortly.",
          409
        );
      }

      const pendingAmountPaise = toPaise(pending.amount);

      // First verify that the Razorpay order matches its own purchase.
      if (
        pendingAmountPaise === null ||
        pending.currency !== "INR" ||
        Number(existingOrder.amount) !== pendingAmountPaise ||
        existingOrder.currency !== "INR"
      ) {
        return jsonError(
          "The earlier checkout does not match its recorded amount. Please contact support before retrying.",
          409
        );
      }

      if (existingOrder.status === "paid") {
        return jsonError(
          "An earlier payment may already be complete. Please wait for verification before retrying.",
          409
        );
      }

      if (
        existingOrder.status !== "created" &&
        existingOrder.status !== "attempted"
      ) {
        return jsonError(
          "An earlier checkout needs verification before another order can be created.",
          409
        );
      }

      // If the active price has not changed, reuse the existing order.
      if (pendingAmountPaise === price.amount_paise) {
        const response: RazorpayOrderResponse = {
          success: true,
          purchaseId: pending.id,
          orderId: existingOrder.id,
          amount: Number(existingOrder.amount),
          currency: existingOrder.currency,
          keyId,
          product: {
            id: product.id,
            title: product.title,
          },
        };

        return NextResponse.json(response);
      }

      // The active price has changed. Before superseding the old
      // purchase, check Razorpay for payments against the old order.
      let paymentList: RazorpayPaymentList;

      try {
        paymentList = (await razorpay.orders.fetchPayments(
          pending.provider_order_id
        )) as RazorpayPaymentList;
      } catch {
        return jsonError(
          "The earlier checkout payment status could not be checked. Please retry shortly.",
          409
        );
      }

      const payments = paymentList.items ?? [];

      // Never supersede an order that has a payment which is not
      // definitively failed. It needs verification/reconciliation first.
      const hasUnresolvedPayment = payments.some(
        (payment) => payment.status !== "failed"
      );

      if (hasUnresolvedPayment) {
        return jsonError(
          "A payment attempt exists for the earlier price. Please finish verification or contact support before retrying.",
          409
        );
      }

      // Retire the local pending purchase so the unique pending-purchase
      // index can allow a new purchase at the current database price.
      // This does NOT cancel the Razorpay order itself. Late-payment
      // handling must be implemented in verify and webhook routes.
      const { data: retiredPurchase, error: retireError } =
        await supabase
          .from("purchases")
          .update({ status: "CANCELLED" })
          .eq("id", pending.id)
          .eq("user_id", userId)
          .eq("status", "PENDING")
          .eq("fulfillment_status", "PENDING")
          .select("id")
          .maybeSingle();

      if (retireError) {
        throw new Error("Could not retire the outdated pending purchase.");
      }

      if (!retiredPurchase) {
        return jsonError(
          "The earlier checkout changed while you were retrying. Please try again.",
          409
        );
      }
    }

    // 6. Create a new Razorpay order at the CURRENT database price.
    const receipt = `ss_${randomUUID().replace(/-/g, "")}`;

    const order = await razorpay.orders.create({
      amount: price.amount_paise,
      currency: "INR",
      receipt,
      notes: {
        product_id: product.id,
        clerk_user_id: userId,
      },
    });

    if (
      order.currency !== "INR" ||
      Number(order.amount) !== price.amount_paise ||
      order.status !== "created"
    ) {
      throw new Error("Razorpay returned an unexpected order.");
    }

    const { data: purchase, error: purchaseError } = await supabase
      .from("purchases")
      .insert({
        user_id: userId,
        product_id: product.id,
        resource_id: null,
        amount: price.amount_paise / 100,
        currency: "INR",
        payment_provider: "razorpay",
        provider_order_id: order.id,
        status: "PENDING",
        fulfillment_status: "PENDING",
      })
      .select("id")
      .single();

    if (purchaseError) {
      // A concurrent checkout may have created a pending purchase.
      // Do not return a stale order at an outdated price.
      if (purchaseError.code === "23505") {
        const { data: existingPending, error: existingError } =
          await supabase
            .from("purchases")
            .select("id, amount, currency, provider_order_id")
            .eq("user_id", userId)
            .eq("product_id", product.id)
            .eq("payment_provider", "razorpay")
            .eq("status", "PENDING")
            .eq("fulfillment_status", "PENDING")
            .is("resource_id", null)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

        if (existingError) {
          throw new Error(
            "Could not retrieve the existing pending purchase."
          );
        }

        if (existingPending?.provider_order_id) {
          const concurrentAmountPaise = toPaise(
            existingPending.amount
          );

          if (
            concurrentAmountPaise === price.amount_paise &&
            existingPending.currency === "INR"
          ) {
            let concurrentOrder;

            try {
              concurrentOrder = await razorpay.orders.fetch(
                existingPending.provider_order_id
              );
            } catch {
              return jsonError(
                "An earlier checkout could not be verified. Please retry shortly.",
                409
              );
            }

            if (
              concurrentOrder.currency === "INR" &&
              Number(concurrentOrder.amount) === price.amount_paise &&
              (concurrentOrder.status === "created" ||
                concurrentOrder.status === "attempted")
            ) {
              const response: RazorpayOrderResponse = {
                success: true,
                purchaseId: existingPending.id,
                orderId: concurrentOrder.id,
                amount: Number(concurrentOrder.amount),
                currency: concurrentOrder.currency,
                keyId,
                product: {
                  id: product.id,
                  title: product.title,
                },
              };

              return NextResponse.json(response);
            }
          }
        }

        return jsonError(
          "Another checkout is being processed. Please retry in a moment.",
          409
        );
      }

      throw new Error("Could not record the pending purchase.");
    }

    if (!purchase) {
      throw new Error("Could not record the pending purchase.");
    }

    const response: RazorpayOrderResponse = {
      success: true,
      purchaseId: purchase.id,
      orderId: order.id,
      amount: Number(order.amount),
      currency: order.currency,
      keyId,
      product: {
        id: product.id,
        title: product.title,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error(
      "Learning checkout order creation failed:",
      error instanceof Error ? error.message : "Unknown error"
    );

    return NextResponse.json(
      {
        success: false,
        message: "Unable to start checkout. Please try again.",
      },
      { status: 500 }
    );
  }
}