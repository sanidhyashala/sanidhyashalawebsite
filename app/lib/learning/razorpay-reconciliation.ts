import "server-only";

import { createAdminSupabaseClient } from "@/app/lib/admin/supabase-admin";

type Reconciliation = {
  id: string;
  purchase_id: string;
  provider_order_id: string;
  provider_payment_id: string;
  amount_paise: number;
  currency: string;
  status: string;
  refund_idempotency_key: string;
  provider_refund_id: string | null;
};

type RazorpayRefund = {
  id?: string;
  payment_id?: string;
  amount?: number;
  currency?: string;
  status?: string;
  notes?: Record<string, unknown>;
  error?: {
    code?: string;
    description?: string;
  };
};

type RazorpayRefundList = {
  items?: RazorpayRefund[];
  error?: {
    code?: string;
    description?: string;
  };
};

export type RefundProcessingResult =
  | { status: "REFUNDED"; refundId: string }
  | { status: "REFUND_PENDING"; refundId?: string }
  | { status: "REFUND_FAILED"; message: string }
  | { status: "ALREADY_PROCESSING" }
  | { status: "NOT_FOUND" }
  | { status: "REVIEW_REQUIRED"; message: string };

function razorpayAuthHeader(keyId: string, keySecret: string): string {
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
}

function isValidRefundForRecord(
  refund: RazorpayRefund,
  record: Reconciliation
): boolean {
  return (
    typeof refund.id === "string" &&
    refund.payment_id === record.provider_payment_id &&
    Number(refund.amount) === Number(record.amount_paise) &&
    refund.currency === record.currency
  );
}

async function persistRefundStatus(input: {
  supabase: ReturnType<typeof createAdminSupabaseClient>;
  record: Reconciliation;
  refund: RazorpayRefund;
}): Promise<RefundProcessingResult> {
  const { supabase, record, refund } = input;

  if (!isValidRefundForRecord(refund, record) || !refund.id) {
    const { error } = await supabase
      .from("razorpay_payment_reconciliations")
      .update({
        status: "REVIEW_REQUIRED",
        refund_error: "Razorpay refund details do not match the reconciliation record.",
        refund_payload: refund,
        updated_at: new Date().toISOString(),
      })
      .eq("id", record.id);

    if (error) {
      throw new Error("Could not persist the refund review status.");
    }

    return {
      status: "REVIEW_REQUIRED",
      message: "Razorpay refund details do not match the reconciliation record.",
    };
  }

  let nextStatus: "REFUNDED" | "REFUND_PENDING" | "REFUND_FAILED";
  if (refund.status === "processed") {
    nextStatus = "REFUNDED";
  } else if (refund.status === "pending" || refund.status === "created") {
    nextStatus = "REFUND_PENDING";
  } else if (refund.status === "failed") {
    nextStatus = "REFUND_FAILED";
  } else {
    return {
      status: "REVIEW_REQUIRED",
      message: `Unrecognized Razorpay refund status: ${String(refund.status)}`,
    };
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("razorpay_payment_reconciliations")
    .update({
      status: nextStatus,
      provider_refund_id: refund.id,
      refund_error:
        nextStatus === "REFUND_FAILED"
          ? "Razorpay reports that the refund failed. Review before retrying."
          : null,
      refund_payload: refund,
      refunded_at: nextStatus === "REFUNDED" ? now : null,
      updated_at: now,
    })
    .eq("id", record.id);

  if (error) {
    throw new Error("Could not persist the Razorpay refund status.");
  }

  if (nextStatus === "REFUNDED") {
    return { status: "REFUNDED", refundId: refund.id };
  }
  if (nextStatus === "REFUND_FAILED") {
    return {
      status: "REFUND_FAILED",
      message: "Razorpay reports that the refund failed. Review before retrying.",
    };
  }
  return { status: "REFUND_PENDING", refundId: refund.id };
}

/**
 * Reconcile an already-started refund without creating another one.
 * If Razorpay cannot confirm an existing refund, leave it pending for review.
 */
async function reconcileExistingRefund(input: {
  keyId: string;
  keySecret: string;
  supabase: ReturnType<typeof createAdminSupabaseClient>;
  record: Reconciliation;
}): Promise<RefundProcessingResult> {
  const { keyId, keySecret, supabase, record } = input;

  let response: Response;
  try {
    response = await fetch(
      `https://api.razorpay.com/v1/payments/${encodeURIComponent(
        record.provider_payment_id
      )}/refunds`,
      {
        method: "GET",
        headers: {
          Authorization: razorpayAuthHeader(keyId, keySecret),
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );
  } catch {
    return {
      status: "REFUND_PENDING",
      refundId: record.provider_refund_id ?? undefined,
    };
  }

  const payload = (await response.json().catch(() => ({}))) as RazorpayRefundList;
  if (!response.ok || !Array.isArray(payload.items)) {
    const { error } = await supabase
      .from("razorpay_payment_reconciliations")
      .update({
        refund_error:
          payload.error?.description ??
          `Could not confirm refund status with Razorpay (HTTP ${response.status}).`,
        refund_payload: payload,
        updated_at: new Date().toISOString(),
      })
      .eq("id", record.id);

    if (error) {
      throw new Error("Could not persist the refund status lookup result.");
    }

    return {
      status: "REFUND_PENDING",
      refundId: record.provider_refund_id ?? undefined,
    };
  }

  const matchingRefund = payload.items.find((refund) => {
    if (record.provider_refund_id) {
      return refund.id === record.provider_refund_id;
    }

    return (
      refund.payment_id === record.provider_payment_id &&
      refund.notes?.reconciliation_id === record.id
    );
  });

  if (matchingRefund) {
    return persistRefundStatus({ supabase, record, refund: matchingRefund });
  }

  // A successful list response with no matching refund is not sufficient
  // evidence that retrying is safe. Keep the record pending for review.
  const { error } = await supabase
    .from("razorpay_payment_reconciliations")
    .update({
      refund_error:
        "No matching refund was found in Razorpay. Automatic retry is blocked pending review.",
      refund_payload: payload,
      updated_at: new Date().toISOString(),
    })
    .eq("id", record.id);

  if (error) {
    throw new Error("Could not persist the refund lookup result.");
  }

  return { status: "REFUND_PENDING" };
}

export async function processCancelledPaymentRefund(
  paymentId: string
): Promise<RefundProcessingResult> {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay server configuration is missing.");
  }

  const supabase = createAdminSupabaseClient();

  const { data: reconciliation, error: lookupError } = await supabase
    .from("razorpay_payment_reconciliations")
    .select(
      "id, purchase_id, provider_order_id, provider_payment_id, amount_paise, currency, status, refund_idempotency_key, provider_refund_id"
    )
    .eq("provider_payment_id", paymentId)
    .maybeSingle();

  if (lookupError) {
    throw new Error("Could not load payment reconciliation.");
  }

  if (!reconciliation) {
    return { status: "NOT_FOUND" };
  }

  const record = reconciliation as Reconciliation;

  if (
    !Number.isSafeInteger(Number(record.amount_paise)) ||
    Number(record.amount_paise) <= 0 ||
    record.currency !== "INR"
  ) {
    const { error } = await supabase
      .from("razorpay_payment_reconciliations")
      .update({
        status: "REVIEW_REQUIRED",
        refund_error: "Invalid reconciliation amount or currency.",
        updated_at: new Date().toISOString(),
      })
      .eq("id", record.id);

    if (error) throw new Error("Could not persist reconciliation review status.");

    return {
      status: "REVIEW_REQUIRED",
      message: "Invalid reconciliation amount or currency.",
    };
  }

  if (record.status === "REFUNDED") {
    return record.provider_refund_id
      ? { status: "REFUNDED", refundId: record.provider_refund_id }
      : {
          status: "REVIEW_REQUIRED",
          message: "Record is marked refunded but has no provider refund ID.",
        };
  }

  if (record.status === "REFUND_PENDING") {
    return reconcileExistingRefund({ keyId, keySecret, supabase, record });
  }

  if (record.status === "REFUND_FAILED") {
    return {
      status: "REFUND_FAILED",
      message:
        "The previous refund failed or was reported failed. Review Razorpay before any manual retry.",
    };
  }

  if (record.status !== "REFUND_REQUIRED") {
    return {
      status: "REVIEW_REQUIRED",
      message: `Unexpected reconciliation status: ${record.status}`,
    };
  }

  // Atomically claim the work. If a process crashes after this claim,
  // a later call checks Razorpay's refund list instead of blindly retrying.
  const { data: claimed, error: claimError } = await supabase
    .from("razorpay_payment_reconciliations")
    .update({
      status: "REFUND_PENDING",
      refund_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", record.id)
    .eq("status", "REFUND_REQUIRED")
    .select("id")
    .maybeSingle();

  if (claimError) {
    throw new Error("Could not claim refund processing.");
  }
  if (!claimed) {
    return { status: "ALREADY_PROCESSING" };
  }

  let response: Response;
  try {
    response = await fetch(
      `https://api.razorpay.com/v1/payments/${encodeURIComponent(
        record.provider_payment_id
      )}/refund`,
      {
        method: "POST",
        headers: {
          Authorization: razorpayAuthHeader(keyId, keySecret),
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          amount: Number(record.amount_paise),
          notes: {
            reconciliation_id: record.id,
            purchase_id: record.purchase_id,
            reason: "Cancelled learning purchase",
          },
        }),
        cache: "no-store",
      }
    );
  } catch {
    const { error } = await supabase
      .from("razorpay_payment_reconciliations")
      .update({
        status: "REFUND_PENDING",
        refund_error:
          "Refund request outcome is unknown. The next reconciliation checks Razorpay before any retry.",
        updated_at: new Date().toISOString(),
      })
      .eq("id", record.id);

    if (error) throw new Error("Could not persist the uncertain refund outcome.");
    return { status: "REFUND_PENDING" };
  }

  const result = (await response.json().catch(() => ({}))) as RazorpayRefund;

  if (!response.ok) {
    const message =
      result.error?.description ??
      `Razorpay refund API returned HTTP ${response.status}.`;
    const uncertain = response.status >= 500 || response.status === 409;
    const nextStatus = uncertain ? "REFUND_PENDING" : "REFUND_FAILED";

    const { error } = await supabase
      .from("razorpay_payment_reconciliations")
      .update({
        status: nextStatus,
        refund_error: message,
        refund_payload: result,
        updated_at: new Date().toISOString(),
      })
      .eq("id", record.id);

    if (error) throw new Error("Could not persist the refund API response.");

    if (uncertain) {
      return reconcileExistingRefund({ keyId, keySecret, supabase, record: { ...record, status: "REFUND_PENDING" } });
    }
    return { status: "REFUND_FAILED", message };
  }

  return persistRefundStatus({ supabase, record, refund: result });
}
