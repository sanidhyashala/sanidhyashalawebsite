
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

type ReconciliationStatus =
  | "REFUND_REQUIRED"
  | "REFUND_PENDING"
  | "REFUNDED"
  | "REFUND_FAILED"
  | "REVIEW_REQUIRED";

export type RefundProcessingResult =
  | { status: "REFUNDED"; refundId: string }
  | { status: "REFUND_PENDING"; refundId?: string }
  | { status: "REFUND_FAILED"; message: string }
  | { status: "ALREADY_PROCESSING" }
  | { status: "NOT_FOUND" }
  | { status: "REVIEW_REQUIRED"; message: string };

type SupabaseAdmin = ReturnType<typeof createAdminSupabaseClient>;

function razorpayAuthHeader(keyId: string, keySecret: string): string {
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
}

function isValidRefundForRecord(
  refund: RazorpayRefund,
  record: Reconciliation
): boolean {
  return (
    typeof refund.id === "string" &&
    refund.id.trim().length > 0 &&
    refund.payment_id === record.provider_payment_id &&
    Number.isSafeInteger(Number(refund.amount)) &&
    Number(refund.amount) === Number(record.amount_paise) &&
    refund.currency === record.currency
  );
}

function reviewResult(message: string): RefundProcessingResult {
  return { status: "REVIEW_REQUIRED", message };
}

function pendingResult(
  refundId?: string | null
): RefundProcessingResult {
  return {
    status: "REFUND_PENDING",
    ...(refundId ? { refundId } : {}),
  };
}

function isTerminalOrManualStatus(status: string): boolean {
  return (
    status === "REFUNDED" ||
    status === "REFUND_FAILED" ||
    status === "REVIEW_REQUIRED"
  );
}

/**
 * Reads the latest state before deciding whether a refund status can change.
 * Never overwrite a confirmed refund or a record that requires manual review.
 */
async function getCurrentReconciliation(
  supabase: SupabaseAdmin,
  recordId: string
): Promise<{
  status: string;
  provider_refund_id: string | null;
} | null> {
  const { data, error } = await supabase
    .from("razorpay_payment_reconciliations")
    .select("status, provider_refund_id")
    .eq("id", recordId)
    .maybeSingle();

  if (error) {
    throw new Error("Could not verify the current refund reconciliation.");
  }

  return data;
}

/**
 * Store a manual-review state without overwriting a confirmed refund.
 */
async function markReviewRequired(
  supabase: SupabaseAdmin,
  record: Reconciliation,
  message: string,
  payload?: unknown
): Promise<RefundProcessingResult> {
  const current = await getCurrentReconciliation(supabase, record.id);

  if (!current) {
    return { status: "NOT_FOUND" };
  }

  if (current.status === "REFUNDED") {
    if (current.provider_refund_id) {
      return {
        status: "REFUNDED",
        refundId: current.provider_refund_id,
      };
    }

    return reviewResult(
      "The record is marked refunded but has no provider refund ID."
    );
  }

  const updateQuery = supabase
    .from("razorpay_payment_reconciliations")
    .update({
      status: "REVIEW_REQUIRED",
      refund_error: message,
      ...(payload === undefined ? {} : { refund_payload: payload }),
      updated_at: new Date().toISOString(),
    })
    .eq("id", record.id)
    .neq("status", "REFUNDED");

  const { error } = await updateQuery;

  if (error) {
    throw new Error("Could not persist the refund review status.");
  }

  // Re-read to detect a concurrent successful refund.
  const afterUpdate = await getCurrentReconciliation(supabase, record.id);

  if (afterUpdate?.status === "REFUNDED") {
    if (afterUpdate.provider_refund_id) {
      return {
        status: "REFUNDED",
        refundId: afterUpdate.provider_refund_id,
      };
    }

    return reviewResult(
      "The record is marked refunded but has no provider refund ID."
    );
  }

  return reviewResult(message);
}

/**
 * Persist a Razorpay refund result only when the record is in a state
 * that can safely accept the transition.
 *
 * A delayed event must not downgrade REFUNDED, REFUND_FAILED, or
 * REVIEW_REQUIRED to REFUND_PENDING.
 */
async function persistRefundStatus(input: {
  supabase: SupabaseAdmin;
  record: Reconciliation;
  refund: RazorpayRefund;
}): Promise<RefundProcessingResult> {
  const { supabase, record, refund } = input;

  if (!isValidRefundForRecord(refund, record) || !refund.id) {
    return markReviewRequired(
      supabase,
      record,
      "Razorpay refund details do not match the reconciliation record.",
      refund
    );
  }

  const current = await getCurrentReconciliation(supabase, record.id);

  if (!current) {
    return { status: "NOT_FOUND" };
  }

  if (current.status === "REFUNDED") {
    if (current.provider_refund_id === refund.id) {
      return { status: "REFUNDED", refundId: refund.id };
    }

    return markReviewRequired(
      supabase,
      record,
      "The reconciliation is already marked refunded with a different or missing refund ID.",
      refund
    );
  }

  if (
    current.provider_refund_id &&
    current.provider_refund_id !== refund.id
  ) {
    return markReviewRequired(
      supabase,
      record,
      "A different refund ID is already associated with this payment. Manual review is required.",
      refund
    );
  }

  if (current.status === "REVIEW_REQUIRED") {
    return reviewResult(
      "This reconciliation already requires manual review. The incoming refund result was not allowed to overwrite that state."
    );
  }

  if (current.status === "REFUND_FAILED") {
    // Do not automatically revive a failed refund based on a delayed event.
    // A human should verify the provider dashboard before changing this state.
    return reviewResult(
      "The reconciliation is already marked REFUND_FAILED. Verify the refund in Razorpay before changing its status."
    );
  }

  if (
    current.status !== "REFUND_PENDING" &&
    current.status !== "REFUND_REQUIRED"
  ) {
    return markReviewRequired(
      supabase,
      record,
      `Refund status cannot be updated from ${current.status}.`,
      refund
    );
  }

  let nextStatus: "REFUNDED" | "REFUND_PENDING" | "REFUND_FAILED";

  if (refund.status === "processed") {
    nextStatus = "REFUNDED";
  } else if (refund.status === "pending" || refund.status === "created") {
    nextStatus = "REFUND_PENDING";
  } else if (refund.status === "failed") {
    nextStatus = "REFUND_FAILED";
  } else {
    return markReviewRequired(
      supabase,
      record,
      `Unrecognized Razorpay refund status: ${String(refund.status)}`,
      refund
    );
  }

  const now = new Date().toISOString();

  const updateValues: Record<string, unknown> = {
    status: nextStatus,
    provider_refund_id: refund.id,
    refund_error:
      nextStatus === "REFUND_FAILED"
        ? "Razorpay reports that the refund failed. Verify the provider dashboard before any retry."
        : null,
    refund_payload: refund,
    updated_at: now,
  };

  if (nextStatus === "REFUNDED") {
    updateValues.refunded_at = now;
  }

  // Compare-and-set: only update the exact status we just read.
  // This prevents a stale request from overwriting a concurrent transition.
  const { data: updated, error: updateError } = await supabase
    .from("razorpay_payment_reconciliations")
    .update(updateValues)
    .eq("id", record.id)
    .eq("status", current.status)
    .select("status, provider_refund_id")
    .maybeSingle();

  if (updateError) {
    throw new Error("Could not persist the Razorpay refund status.");
  }

  if (!updated) {
    const latest = await getCurrentReconciliation(supabase, record.id);

    if (!latest) {
      return { status: "NOT_FOUND" };
    }

    if (
      latest.status === "REFUNDED" &&
      latest.provider_refund_id === refund.id
    ) {
      return { status: "REFUNDED", refundId: refund.id };
    }

    if (latest.status === "REFUND_PENDING") {
      return pendingResult(latest.provider_refund_id);
    }

    return reviewResult(
      "The reconciliation changed while the refund result was being saved. Manual verification is required."
    );
  }

  if (nextStatus === "REFUNDED") {
    return { status: "REFUNDED", refundId: refund.id };
  }

  if (nextStatus === "REFUND_FAILED") {
    return {
      status: "REFUND_FAILED",
      message:
        "Razorpay reports that the refund failed. Verify the provider dashboard before any retry.",
    };
  }

  return pendingResult(refund.id);
}

/**
 * Reconcile an already-started refund without creating another one.
 * If Razorpay cannot confirm the refund, leave it pending.
 * This function never issues a new refund request.
 */
async function reconcileExistingRefund(input: {
  keyId: string;
  keySecret: string;
  supabase: SupabaseAdmin;
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
    return pendingResult(record.provider_refund_id);
  }

  const payload = (await response
    .json()
    .catch(() => ({}))) as RazorpayRefundList;

  if (!response.ok || !Array.isArray(payload.items)) {
    const current = await getCurrentReconciliation(supabase, record.id);

    if (!current) {
      return { status: "NOT_FOUND" };
    }

    if (current.status === "REFUNDED") {
      return current.provider_refund_id
        ? {
            status: "REFUNDED",
            refundId: current.provider_refund_id,
          }
        : reviewResult(
            "The record is marked refunded but has no provider refund ID."
          );
    }

    // Update diagnostic information only. Do not change the status.
    const { error } = await supabase
      .from("razorpay_payment_reconciliations")
      .update({
        refund_error:
          payload.error?.description ??
          `Could not confirm refund status with Razorpay (HTTP ${response.status}).`,
        refund_payload: payload,
        updated_at: new Date().toISOString(),
      })
      .eq("id", record.id)
      .eq("status", current.status)
      .neq("status", "REFUNDED");

    if (error) {
      throw new Error("Could not persist the refund status lookup result.");
    }

    if (current.status === "REVIEW_REQUIRED") {
      return reviewResult(
        "The reconciliation requires manual review; the Razorpay lookup could not confirm the refund."
      );
    }

    if (current.status === "REFUND_FAILED") {
      return {
        status: "REFUND_FAILED",
        message:
          "The previous refund is marked failed. Verify Razorpay before any retry.",
      };
    }

    return pendingResult(current.provider_refund_id);
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
    return persistRefundStatus({
      supabase,
      record,
      refund: matchingRefund,
    });
  }

  const current = await getCurrentReconciliation(supabase, record.id);

  if (!current) {
    return { status: "NOT_FOUND" };
  }

  if (current.status === "REFUNDED") {
    return current.provider_refund_id
      ? {
          status: "REFUNDED",
          refundId: current.provider_refund_id,
        }
      : reviewResult(
          "The record is marked refunded but has no provider refund ID."
        );
  }

  if (current.status === "REVIEW_REQUIRED") {
    return reviewResult(
      "The reconciliation requires manual review and no matching refund was found."
    );
  }

  if (current.status === "REFUND_FAILED") {
    return {
      status: "REFUND_FAILED",
      message:
        "The reconciliation is marked failed and no matching refund was found. Verify Razorpay before any retry.",
    };
  }

  // An empty list does not prove that an earlier request was never accepted.
  // Do not reset the status to REFUND_REQUIRED or automatically retry.
  const { error } = await supabase
    .from("razorpay_payment_reconciliations")
    .update({
      refund_error:
        "No matching refund was found in Razorpay. Automatic retry is blocked pending manual review.",
      refund_payload: payload,
      updated_at: new Date().toISOString(),
    })
    .eq("id", record.id)
    .eq("status", current.status)
    .neq("status", "REFUNDED");

  if (error) {
    throw new Error("Could not persist the refund lookup result.");
  }

  return pendingResult(current.provider_refund_id);
}

export async function processCancelledPaymentRefund(
  paymentId: string
): Promise<RefundProcessingResult> {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay server configuration is missing.");
  }

  if (
    typeof paymentId !== "string" ||
    paymentId.trim().length === 0 ||
    paymentId !== paymentId.trim()
  ) {
    return reviewResult("A valid Razorpay payment ID is required.");
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
    record.currency !== "INR" ||
    record.provider_payment_id !== paymentId
  ) {
    return markReviewRequired(
      supabase,
      record,
      "Invalid reconciliation amount, payment ID, or currency."
    );
  }

  const { data: purchase, error: purchaseError } = await supabase
    .from("purchases")
    .select(
      "id, status, payment_provider, provider_order_id, provider_payment_id, amount, currency"
    )
    .eq("id", record.purchase_id)
    .maybeSingle();

  if (purchaseError) {
    throw new Error("Could not verify the purchase for refund reconciliation.");
  }

  if (!purchase) {
    return markReviewRequired(
      supabase,
      record,
      "The purchase referenced by the reconciliation record was not found."
    );
  }

  const purchaseAmount = Number(purchase.amount);
  const expectedAmountPaise = Math.round(purchaseAmount * 100);

  if (
    purchase.payment_provider !== "razorpay" ||
    purchase.provider_order_id !== record.provider_order_id ||
    purchase.currency !== "INR" ||
    !Number.isFinite(purchaseAmount) ||
    expectedAmountPaise !== Number(record.amount_paise) ||
    (purchase.provider_payment_id &&
      purchase.provider_payment_id !== record.provider_payment_id)
  ) {
    return markReviewRequired(
      supabase,
      record,
      "Purchase and reconciliation payment details do not match."
    );
  }

  // A purchase already marked REFUNDED must never trigger another refund.
  // If reconciliation disagrees, stop and require manual review.
  if (purchase.status === "REFUNDED") {
    if (
      record.status === "REFUNDED" &&
      record.provider_refund_id
    ) {
      return {
        status: "REFUNDED",
        refundId: record.provider_refund_id,
      };
    }

    return markReviewRequired(
      supabase,
      record,
      "The purchase is already marked refunded but the reconciliation is not consistently finalized. No new refund was created."
    );
  }

  // This routine may create a refund only for a cancelled purchase.
  // Normal paid-purchase refunds must use the separate refund flow.
  if (purchase.status !== "CANCELLED") {
    return markReviewRequired(
      supabase,
      record,
      `This routine only handles cancelled purchases; current purchase status is ${String(
        purchase.status
      )}.`
    );
  }

  if (record.status === "REFUNDED") {
    return record.provider_refund_id
      ? {
          status: "REFUNDED",
          refundId: record.provider_refund_id,
        }
      : reviewResult(
          "The record is marked refunded but has no provider refund ID."
        );
  }

  if (record.status === "REFUND_PENDING") {
    return reconcileExistingRefund({
      keyId,
      keySecret,
      supabase,
      record,
    });
  }

  if (record.status === "REFUND_FAILED") {
    return {
      status: "REFUND_FAILED",
      message:
        "The previous refund failed or was reported failed. Verify Razorpay before any manual retry.",
    };
  }

  if (record.status === "REVIEW_REQUIRED") {
    return reviewResult(
      "This reconciliation requires manual review. No automatic refund was created."
    );
  }

  if (record.status !== "REFUND_REQUIRED") {
    return reviewResult(
      `Unexpected reconciliation status: ${record.status}`
    );
  }

  // Atomically claim the record. Only one concurrent caller can move it
  // from REFUND_REQUIRED to REFUND_PENDING and issue the refund request.
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
          "The refund request outcome is unknown. Check Razorpay before any retry.",
        updated_at: new Date().toISOString(),
      })
      .eq("id", record.id)
      .eq("status", "REFUND_PENDING")
      .neq("status", "REFUNDED");

    if (error) {
      throw new Error("Could not persist the uncertain refund outcome.");
    }

    return pendingResult();
  }

  const result = (await response
    .json()
    .catch(() => ({}))) as RazorpayRefund;

  if (!response.ok) {
    const message =
      result.error?.description ??
      `Razorpay refund API returned HTTP ${response.status}.`;

    // A conflict or server error can mean the request was accepted even if
    // the response was not usable. Query Razorpay; never blindly retry.
    const uncertain = response.status >= 500 || response.status === 409;

    if (uncertain) {
      const { error } = await supabase
        .from("razorpay_payment_reconciliations")
        .update({
          status: "REFUND_PENDING",
          refund_error: message,
          refund_payload: result,
          updated_at: new Date().toISOString(),
        })
        .eq("id", record.id)
        .eq("status", "REFUND_PENDING")
        .neq("status", "REFUNDED");

      if (error) {
        throw new Error(
          "Could not persist the uncertain refund API response."
        );
      }

      return reconcileExistingRefund({
        keyId,
        keySecret,
        supabase,
        record: {
          ...record,
          status: "REFUND_PENDING",
        },
      });
    }

    // Do not change a record that a concurrent request has already finalized.
    const { data: failed, error: failureError } = await supabase
      .from("razorpay_payment_reconciliations")
      .update({
        status: "REFUND_FAILED",
        refund_error: message,
        refund_payload: result,
        updated_at: new Date().toISOString(),
      })
      .eq("id", record.id)
      .eq("status", "REFUND_PENDING")
      .select("id")
      .maybeSingle();

    if (failureError) {
      throw new Error("Could not persist the refund API response.");
    }

    if (!failed) {
      const latest = await getCurrentReconciliation(supabase, record.id);

      if (
        latest?.status === "REFUNDED" &&
        latest.provider_refund_id
      ) {
        return {
          status: "REFUNDED",
          refundId: latest.provider_refund_id,
        };
      }

      if (latest?.status === "REVIEW_REQUIRED") {
        return reviewResult(
          "The reconciliation changed during refund processing. Manual review is required."
        );
      }

      if (latest?.status === "REFUND_PENDING") {
        return pendingResult(latest.provider_refund_id);
      }

      return reviewResult(
        "The refund failure could not be safely applied to the current reconciliation state."
      );
    }

    return {
      status: "REFUND_FAILED",
      message,
    };
  }

  return persistRefundStatus({
    supabase,
    record: {
      ...record,
      status: "REFUND_PENDING",
    },
    refund: result,
  });
}
