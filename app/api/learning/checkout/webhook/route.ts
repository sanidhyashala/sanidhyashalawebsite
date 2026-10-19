import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { createAdminSupabaseClient } from "@/app/lib/admin/supabase-admin";
import { processCancelledPaymentRefund } from "@/app/lib/learning/razorpay-reconciliation";

export const runtime = "nodejs";

type RazorpayWebhookPayload = {
  event?: unknown;
  payload?: {
    payment?: {
      entity?: {
        id?: unknown;
        order_id?: unknown;
        amount?: unknown;
        currency?: unknown;
        status?: unknown;
      };
    };
    refund?: {
      entity?: {
        id?: unknown;
        payment_id?: unknown;
        amount?: unknown;
        currency?: unknown;
        status?: unknown;
      };
    };
  };
};

type ReconciliationRecord = {
  id: string;
  purchase_id: string;
  provider_order_id: string;
  provider_payment_id: string;
  amount_paise: number;
  currency: string;
  status: string;
};

function verifyWebhookSignature(
  rawBody: string,
  suppliedSignature: string,
  secret: string
): boolean {
  if (!/^[a-f0-9]{64}$/i.test(suppliedSignature)) {
    return false;
  }

  const expected = createHmac("sha256", secret)
    .update(rawBody)
    .digest();

  const supplied = Buffer.from(suppliedSignature, "hex");

  return (
    supplied.length === expected.length &&
    timingSafeEqual(supplied, expected)
  );
}

function jsonError(message: string, status: number) {
  return NextResponse.json(
    { success: false, message },
    { status }
  );
}

/**
 * Records a verified Razorpay payment.failed event.
 *
 * Important:
 * - A failed payment event does not automatically fail the purchase.
 * - This function never grants entitlements.
 * - The Razorpay event ID makes delivery idempotent.
 */
async function handleFailedPaymentWebhook(
  body: RazorpayWebhookPayload,
  eventId: string
) {
  const payment = body.payload?.payment?.entity;

  if (
    typeof payment?.id !== "string" ||
    !payment.id.trim() ||
    typeof payment.order_id !== "string" ||
    !payment.order_id.trim() ||
    typeof payment.amount !== "number" ||
    typeof payment.currency !== "string" ||
    payment.status !== "failed"
  ) {
    return jsonError("Invalid failed payment webhook payload.", 400);
  }

  if (
    !Number.isSafeInteger(payment.amount) ||
    payment.amount <= 0 ||
    payment.currency !== "INR"
  ) {
    return jsonError("Invalid failed payment amount or currency.", 400);
  }

  const supabase = createAdminSupabaseClient();

  const { data: purchase, error: purchaseError } = await supabase
    .from("purchases")
    .select(
      "id, product_id, resource_id, amount, currency, status, payment_provider, provider_order_id"
    )
    .eq("provider_order_id", payment.order_id)
    .eq("payment_provider", "razorpay")
    .maybeSingle();

  if (purchaseError) {
    console.error("Could not look up failed-payment purchase.", {
      eventId,
      orderId: payment.order_id,
      paymentId: payment.id,
    });

    return jsonError("Unable to look up purchase.", 503);
  }

  // Keep the event retryable if the order is not visible yet.
  if (!purchase) {
    console.error("Purchase not found for failed-payment event.", {
      eventId,
      orderId: payment.order_id,
      paymentId: payment.id,
    });

    return jsonError("Purchase not found yet.", 503);
  }

  if (
    !purchase.product_id ||
    purchase.resource_id !== null ||
    purchase.provider_order_id !== payment.order_id
  ) {
    return jsonError(
      "Failed payment does not match a product purchase.",
      409
    );
  }

  const expectedAmountPaise = Math.round(Number(purchase.amount) * 100);

  if (
    purchase.currency !== "INR" ||
    !Number.isSafeInteger(expectedAmountPaise) ||
    expectedAmountPaise !== payment.amount
  ) {
    console.error("Failed-payment amount mismatch.", {
      eventId,
      purchaseId: purchase.id,
      orderId: payment.order_id,
      paymentId: payment.id,
    });

    return jsonError(
      "Failed payment amount or currency does not match the purchase.",
      409
    );
  }

  const now = new Date().toISOString();

  const eventPayload = {
    ...body,
    processing_context: {
      source: "razorpay_webhook",
      outcome: "payment_failed",
      access_granted: false,
    },
  } as unknown as Record<string, unknown>;

  const { error: insertError } = await supabase
    .from("payment_events")
    .insert({
      purchase_id: purchase.id,
      payment_provider: "razorpay",
      provider_event_id: eventId,
      event_type: "payment.failed",
      event_payload: eventPayload,
      status: "PROCESSED",
      processed_at: now,
    });

  if (insertError?.code === "23505") {
    // A duplicate delivery is safe only when the existing event
    // refers to the same purchase and event type.
    const { data: existing, error: existingError } = await supabase
      .from("payment_events")
      .select("purchase_id, event_type, status")
      .eq("payment_provider", "razorpay")
      .eq("provider_event_id", eventId)
      .maybeSingle();

    if (existingError || !existing) {
      console.error("Could not verify duplicate payment event.", {
        eventId,
        purchaseId: purchase.id,
      });

      return jsonError("Could not verify duplicate event.", 503);
    }

    if (
      existing.purchase_id !== purchase.id ||
      existing.event_type !== "payment.failed"
    ) {
      console.error("Duplicate webhook event identity mismatch.", {
        eventId,
        purchaseId: purchase.id,
      });

      return jsonError("Webhook event identity mismatch.", 409);
    }

    return NextResponse.json({
      success: true,
      duplicate: true,
      event: "payment.failed",
      eventStatus: existing.status,
      purchaseStatus: purchase.status,
      accessGranted: false,
    });
  }

  if (insertError) {
    console.error("Could not record failed payment event.", {
      eventId,
      purchaseId: purchase.id,
      orderId: payment.order_id,
      paymentId: payment.id,
      error: insertError.message,
    });

    return jsonError("Could not record failed payment event.", 503);
  }

  // Do not update purchases.status here. A failed payment attempt
  // must not block a later successful payment for the same purchase.
  // This handler never calls the entitlement-granting RPC.
  return NextResponse.json({
    success: true,
    event: "payment.failed",
    eventStatus: "PROCESSED",
    purchaseStatus: purchase.status,
    accessGranted: false,
  });
}

async function recordCancelledPayment(input: {
  purchaseId: string;
  orderId: string;
  paymentId: string;
  amountPaise: number;
  currency: string;
  eventId: string;
  paymentPayload: Record<string, unknown>;
}): Promise<ReconciliationRecord | null> {
  const supabase = createAdminSupabaseClient();

  const { data: inserted, error: insertError } = await supabase
    .from("razorpay_payment_reconciliations")
    .insert({
      purchase_id: input.purchaseId,
      provider_order_id: input.orderId,
      provider_payment_id: input.paymentId,
      amount_paise: input.amountPaise,
      currency: input.currency,
      reason: "PAYMENT_CAPTURED_FOR_CANCELLED_PURCHASE",
      status: "REFUND_REQUIRED",
      refund_idempotency_key: `sanidhyashala-refund-${input.paymentId}`,
      payment_payload: {
        ...input.paymentPayload,
        webhook_event_id: input.eventId,
      },
    })
    .select(
      "id, purchase_id, provider_order_id, provider_payment_id, amount_paise, currency, status"
    )
    .maybeSingle();

  if (!insertError && inserted) {
    return inserted as ReconciliationRecord;
  }

  if (insertError?.code === "23505") {
    const { data: existing, error: existingError } = await supabase
      .from("razorpay_payment_reconciliations")
      .select(
        "id, purchase_id, provider_order_id, provider_payment_id, amount_paise, currency, status"
      )
      .eq("provider_payment_id", input.paymentId)
      .maybeSingle();

    if (existingError || !existing) {
      console.error("Could not retrieve existing reconciliation.", {
        purchaseId: input.purchaseId,
        paymentId: input.paymentId,
      });

      return null;
    }

    const record = existing as ReconciliationRecord;

    if (
      record.purchase_id !== input.purchaseId ||
      record.provider_order_id !== input.orderId ||
      record.provider_payment_id !== input.paymentId ||
      Number(record.amount_paise) !== input.amountPaise ||
      record.currency !== input.currency
    ) {
      console.error("Reconciliation identity mismatch.", {
        purchaseId: input.purchaseId,
        paymentId: input.paymentId,
      });

      return null;
    }

    return record;
  }

  console.error("Could not persist cancelled-payment reconciliation.", {
    purchaseId: input.purchaseId,
    orderId: input.orderId,
    paymentId: input.paymentId,
    error: insertError?.message ?? "No record returned",
  });

  return null;
}


/**
 * Idempotency wrapper for Razorpay refund webhooks.
 *
 * The provider event ID is unique in payment_events. New events are first
 * recorded as RECEIVED. A duplicate already marked PROCESSED is acknowledged
 * without replaying the refund state transitions. If processing previously
 * returned an error, the RECEIVED row is reused on retry.
 */
async function handleRefundWebhook(
  event: "refund.created" | "refund.processed" | "refund.failed",
  body: RazorpayWebhookPayload,
  eventId: string
) {
  const supabase = createAdminSupabaseClient();
  const eventPayload = body as unknown as Record<string, unknown>;

  const { error: insertError } = await supabase.from("payment_events").insert({
    purchase_id: null,
    payment_provider: "razorpay",
    provider_event_id: eventId,
    event_type: event,
    event_payload: eventPayload,
    status: "RECEIVED",
  });

  if (insertError?.code === "23505") {
    const { data: existing, error: existingError } = await supabase
      .from("payment_events")
      .select("event_type, status")
      .eq("payment_provider", "razorpay")
      .eq("provider_event_id", eventId)
      .maybeSingle();

    if (existingError || !existing) {
      console.error("Could not verify duplicate refund webhook event.", {
        eventId,
        event,
      });
      return jsonError("Could not verify duplicate refund event.", 503);
    }

    if (existing.event_type !== event) {
      console.error("Refund webhook event identity mismatch.", {
        eventId,
        receivedEvent: event,
        recordedEvent: existing.event_type,
      });
      return jsonError("Webhook event identity mismatch.", 409);
    }

    if (existing.status === "PROCESSED") {
      return NextResponse.json({
        success: true,
        duplicate: true,
        event,
        eventStatus: "PROCESSED",
      });
    }
  } else if (insertError) {
    console.error("Could not record refund webhook event.", {
      eventId,
      event,
      error: insertError.message,
    });
    return jsonError("Could not record refund webhook event.", 503);
  }

  const response = await processRefundWebhook(event, body, eventId);

  if (!response.ok) {
    // Leave the event RECEIVED so a provider retry can attempt processing again.
    return response;
  }

  const processedAt = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("payment_events")
    .update({
      status: "PROCESSED",
      processed_at: processedAt,
      updated_at: processedAt,
    })
    .eq("payment_provider", "razorpay")
    .eq("provider_event_id", eventId)
    .eq("event_type", event)
    .neq("status", "PROCESSED");

  if (updateError) {
    console.error("Could not mark refund webhook event as processed.", {
      eventId,
      event,
      error: updateError.message,
    });
    return jsonError("Refund was handled but event logging needs retry.", 503);
  }

  return response;
}

async function processRefundWebhook(
  event: "refund.created" | "refund.processed" | "refund.failed",
  body: RazorpayWebhookPayload,
  eventId: string
) {
  const refund = body.payload?.refund?.entity;

  if (
    typeof refund?.id !== "string" ||
    !refund.id.trim() ||
    refund.id !== refund.id.trim() ||
    typeof refund.payment_id !== "string" ||
    !refund.payment_id.trim() ||
    refund.payment_id !== refund.payment_id.trim() ||
    typeof refund.amount !== "number" ||
    typeof refund.currency !== "string" ||
    typeof refund.status !== "string"
  ) {
    return jsonError("Invalid refund webhook payload.", 400);
  }

  if (
    !Number.isSafeInteger(refund.amount) ||
    refund.amount <= 0 ||
    refund.currency !== "INR"
  ) {
    return jsonError("Invalid refund amount or currency.", 400);
  }

  if (
    (event === "refund.created" &&
      !["created", "pending"].includes(refund.status)) ||
    (event === "refund.processed" && refund.status !== "processed") ||
    (event === "refund.failed" && refund.status !== "failed")
  ) {
    return jsonError("Refund event and status do not match.", 409);
  }

  const supabase = createAdminSupabaseClient();
  const now = new Date().toISOString();

  const { data: directPurchase, error: directLookupError } = await supabase
    .from("purchases")
    .select(
      "id, product_id, resource_id, amount, currency, status, payment_provider, provider_order_id, provider_payment_id"
    )
    .eq("payment_provider", "razorpay")
    .eq("provider_payment_id", refund.payment_id)
    .maybeSingle();

  if (directLookupError) {
    console.error("Refund purchase lookup failed.", {
      eventId,
      paymentId: refund.payment_id,
    });
    return jsonError("Unable to look up refund purchase.", 503);
  }

  const { data: record, error: recordLookupError } = await supabase
    .from("razorpay_payment_reconciliations")
    .select(
      "id, purchase_id, provider_order_id, provider_payment_id, amount_paise, currency, status, provider_refund_id"
    )
    .eq("provider_payment_id", refund.payment_id)
    .maybeSingle();

  if (recordLookupError) {
    console.error("Refund reconciliation lookup failed.", {
      eventId,
      paymentId: refund.payment_id,
    });
    return jsonError("Unable to look up refund reconciliation.", 503);
  }

  let purchase = directPurchase;

  if (!purchase && record) {
    const { data: reconciledPurchase, error } = await supabase
      .from("purchases")
      .select(
        "id, product_id, resource_id, amount, currency, status, payment_provider, provider_order_id, provider_payment_id"
      )
      .eq("id", record.purchase_id)
      .maybeSingle();

    if (error) {
      return jsonError("Unable to look up reconciled purchase.", 503);
    }

    purchase = reconciledPurchase;
  }

  if (!purchase) {
    console.error("Purchase not found for refund event.", {
      eventId,
      paymentId: refund.payment_id,
      refundId: refund.id,
    });
    return jsonError("Refund purchase not found; retry required.", 503);
  }

  if (
    purchase.payment_provider !== "razorpay" ||
    !purchase.provider_order_id ||
    purchase.currency !== "INR" ||
    (purchase.provider_payment_id &&
      purchase.provider_payment_id !== refund.payment_id)
  ) {
    return jsonError("Refund purchase identity mismatch.", 409);
  }

  const expectedAmountPaise = Math.round(Number(purchase.amount) * 100);

  if (!Number.isSafeInteger(expectedAmountPaise) || expectedAmountPaise <= 0) {
    return jsonError("Invalid original purchase amount.", 409);
  }

  if (
    record &&
    (
      record.purchase_id !== purchase.id ||
      record.provider_order_id !== purchase.provider_order_id ||
      Number(record.amount_paise) !== expectedAmountPaise ||
      record.currency !== "INR"
    )
  ) {
    return jsonError("Refund reconciliation identity mismatch.", 409);
  }

  if (
    record?.provider_refund_id &&
    record.provider_refund_id !== refund.id
  ) {
    if (record.status !== "REFUNDED") {
      const { error } = await supabase
        .from("razorpay_payment_reconciliations")
        .update({
          status: "REVIEW_REQUIRED",
          refund_error: "Conflicting refund IDs require manual review.",
          refund_payload: { event, event_id: eventId, refund },
          updated_at: now,
        })
        .eq("id", record.id);

      if (error) {
        return jsonError("Could not record refund review status.", 503);
      }
    }

    return NextResponse.json({
      success: true,
      needsReconciliation: true,
      reconciliationStatus:
        record.status === "REFUNDED" ? "REFUNDED" : "REVIEW_REQUIRED",
    });
  }

  const isFullRefund = refund.amount === expectedAmountPaise;

  if (!isFullRefund) {
    if (record?.status === "REFUNDED") {
      return NextResponse.json({
        success: true,
        duplicateOrOutOfOrder: true,
        reconciliationStatus: "REFUNDED",
      });
    }

    const partialPayload = { event, event_id: eventId, refund };

    if (record) {
      const { error } = await supabase
        .from("razorpay_payment_reconciliations")
        .update({
          status: "REVIEW_REQUIRED",
          provider_refund_id: refund.id,
          refund_error:
            "Partial refund requires manual review; access was not revoked.",
          refund_payload: partialPayload,
          updated_at: now,
        })
        .eq("id", record.id);

      if (error) {
        return jsonError("Could not record partial refund review.", 503);
      }
    } else {
      const { error } = await supabase
        .from("razorpay_payment_reconciliations")
        .insert({
          purchase_id: purchase.id,
          provider_order_id: purchase.provider_order_id,
          provider_payment_id: refund.payment_id,
          amount_paise: expectedAmountPaise,
          currency: "INR",
          reason: "PARTIAL_REFUND_REQUIRES_MANUAL_REVIEW",
          status: "REVIEW_REQUIRED",
          provider_refund_id: refund.id,
          refund_idempotency_key:
            `sanidhyashala-refund-${refund.payment_id}`,
          payment_payload: {
            source: "razorpay_refund_webhook",
            payment_id: refund.payment_id,
            order_id: purchase.provider_order_id,
          },
          refund_payload: partialPayload,
          refund_error:
            "Partial refund requires manual review; access was not revoked.",
          updated_at: now,
        });

      if (error) {
        console.error("Could not record partial refund.", {
          eventId,
          purchaseId: purchase.id,
          error: error.message,
        });
        return jsonError("Could not record partial refund review.", 503);
      }
    }

    return NextResponse.json({
      success: true,
      event,
      reconciliationStatus: "REVIEW_REQUIRED",
      accessRevoked: false,
    });
  }

  if (event === "refund.failed") {
    if (record?.status === "REFUNDED" || purchase.status === "REFUNDED") {
      return NextResponse.json({
        success: true,
        duplicateOrOutOfOrder: true,
        reconciliationStatus: "REFUNDED",
      });
    }

    // Never overwrite a manual-review decision with a delayed failure event.
    if (record?.status === "REVIEW_REQUIRED") {
      return NextResponse.json({
        success: true,
        needsReconciliation: true,
        reconciliationStatus: "REVIEW_REQUIRED",
      });
    }

    if (record) {
      const { error } = await supabase
        .from("razorpay_payment_reconciliations")
        .update({
          status: "REFUND_FAILED",
          provider_refund_id: refund.id,
          refund_error: "Razorpay reported that the refund failed.",
          refund_payload: { event, event_id: eventId, refund },
          updated_at: now,
        })
        .eq("id", record.id);

      if (error) {
        return jsonError("Could not record failed refund.", 503);
      }
    } else {
      const { error } = await supabase
        .from("razorpay_payment_reconciliations")
        .insert({
          purchase_id: purchase.id,
          provider_order_id: purchase.provider_order_id,
          provider_payment_id: refund.payment_id,
          amount_paise: expectedAmountPaise,
          currency: "INR",
          reason: "REFUND_FAILED_REQUIRES_REVIEW",
          status: "REFUND_FAILED",
          provider_refund_id: refund.id,
          refund_idempotency_key:
            `sanidhyashala-refund-${refund.payment_id}`,
          payment_payload: {
            source: "razorpay_refund_webhook",
            payment_id: refund.payment_id,
            order_id: purchase.provider_order_id,
          },
          refund_payload: { event, event_id: eventId, refund },
          refund_error: "Razorpay reported that the refund failed.",
          updated_at: now,
        });

      if (error) {
        return jsonError("Could not record failed refund.", 503);
      }
    }

    return NextResponse.json({
      success: true,
      event,
      reconciliationStatus: "REFUND_FAILED",
      accessRevoked: false,
    });
  }

  if (event === "refund.created") {
    if (record?.status === "REFUNDED") {
      return NextResponse.json({
        success: true,
        duplicateOrOutOfOrder: true,
        reconciliationStatus: "REFUNDED",
      });
    }

    if (record?.status === "REVIEW_REQUIRED") {
      return NextResponse.json({
        success: true,
        needsReconciliation: true,
        reconciliationStatus: "REVIEW_REQUIRED",
      });
    }

    // A delayed refund.created event must not downgrade a failed refund.
    if (record?.status === "REFUND_FAILED") {
      return NextResponse.json({
        success: true,
        duplicateOrOutOfOrder: true,
        reconciliationStatus: "REFUND_FAILED",
      });
    }

    const pendingPayload = { event, event_id: eventId, refund };

    if (record) {
      const { error } = await supabase
        .from("razorpay_payment_reconciliations")
        .update({
          status: "REFUND_PENDING",
          provider_refund_id: refund.id,
          refund_error: null,
          refund_payload: pendingPayload,
          updated_at: now,
        })
        .eq("id", record.id);

      if (error) {
        return jsonError("Could not record pending refund.", 503);
      }
    } else {
      const { error } = await supabase
        .from("razorpay_payment_reconciliations")
        .insert({
          purchase_id: purchase.id,
          provider_order_id: purchase.provider_order_id,
          provider_payment_id: refund.payment_id,
          amount_paise: expectedAmountPaise,
          currency: "INR",
          reason: "FULL_REFUND_FOR_PURCHASE",
          status: "REFUND_PENDING",
          provider_refund_id: refund.id,
          refund_idempotency_key:
            `sanidhyashala-refund-${refund.payment_id}`,
          payment_payload: {
            source: "razorpay_refund_webhook",
            payment_id: refund.payment_id,
            order_id: purchase.provider_order_id,
          },
          refund_payload: pendingPayload,
          updated_at: now,
        });

      if (error) {
        console.error("Could not create pending refund record.", {
          eventId,
          purchaseId: purchase.id,
          error: error.message,
        });
        return jsonError("Could not record pending refund.", 503);
      }
    }

    return NextResponse.json({
      success: true,
      event,
      reconciliationStatus: "REFUND_PENDING",
      accessRevoked: false,
    });
  }

  // A cancelled purchase must never use the normal paid-purchase finalizer.
  // Its entitlement was not granted by this webhook flow; record the confirmed
  // full refund in reconciliation while leaving purchases.status as CANCELLED.
  if (purchase.status === "CANCELLED") {
    const refundPayload = { event, event_id: eventId, refund };

    if (record?.status === "REVIEW_REQUIRED") {
      return NextResponse.json({
        success: true,
        needsReconciliation: true,
        reconciliationStatus: "REVIEW_REQUIRED",
        message:
          "The cancelled purchase reconciliation requires manual review; no state was overwritten.",
      });
    }

    if (record) {
      const { data: updated, error: updateError } = await supabase
        .from("razorpay_payment_reconciliations")
        .update({
          status: "REFUNDED",
          provider_refund_id: refund.id,
          refund_error: null,
          refund_payload: refundPayload,
          refunded_at: now,
          updated_at: now,
        })
        .eq("id", record.id)
        .neq("status", "REVIEW_REQUIRED")
        .select("id, status, provider_refund_id")
        .maybeSingle();

      if (updateError) {
        console.error("Could not finalize cancelled-purchase refund.", {
          eventId,
          purchaseId: purchase.id,
          paymentId: refund.payment_id,
          refundId: refund.id,
          error: updateError.message,
        });
        return jsonError("Cancelled-purchase refund finalization requires retry.", 503);
      }

      if (!updated) {
        const { data: latest, error: latestError } = await supabase
          .from("razorpay_payment_reconciliations")
          .select("status, provider_refund_id")
          .eq("id", record.id)
          .maybeSingle();

        if (latestError) {
          return jsonError("Could not verify cancelled-purchase refund status.", 503);
        }

        if (latest?.status === "REFUNDED" && latest.provider_refund_id === refund.id) {
          return NextResponse.json({
            success: true,
            event,
            refundId: refund.id,
            refundStatus: "REFUNDED",
            purchaseStatus: "CANCELLED",
            accessRevoked: false,
            duplicate: true,
          });
        }

        return NextResponse.json({
          success: true,
          needsReconciliation: true,
          reconciliationStatus: latest?.status ?? "REVIEW_REQUIRED",
        });
      }
    } else {
      // refund.processed can arrive before refund.created. Create a terminal
      // reconciliation directly, with the provider's confirmed refund ID.
      const { error: insertError } = await supabase
        .from("razorpay_payment_reconciliations")
        .insert({
          purchase_id: purchase.id,
          provider_order_id: purchase.provider_order_id,
          provider_payment_id: refund.payment_id,
          amount_paise: expectedAmountPaise,
          currency: "INR",
          reason: "FULL_REFUND_FOR_CANCELLED_PURCHASE",
          status: "REFUNDED",
          provider_refund_id: refund.id,
          refund_idempotency_key: `sanidhyashala-refund-${refund.payment_id}`,
          payment_payload: {
            source: "razorpay_refund_webhook",
            payment_id: refund.payment_id,
            order_id: purchase.provider_order_id,
          },
          refund_payload: refundPayload,
          refunded_at: now,
          updated_at: now,
        });

      if (insertError) {
        // A concurrent webhook may have inserted the row. Verify identity and
        // terminal state instead of assuming that the insert was successful.
        const { data: latest, error: latestError } = await supabase
          .from("razorpay_payment_reconciliations")
          .select("purchase_id, provider_order_id, provider_payment_id, amount_paise, currency, status, provider_refund_id")
          .eq("provider_payment_id", refund.payment_id)
          .maybeSingle();

        if (latestError || !latest) {
          return jsonError("Could not persist cancelled-purchase refund.", 503);
        }

        if (
          latest.purchase_id !== purchase.id ||
          latest.provider_order_id !== purchase.provider_order_id ||
          Number(latest.amount_paise) !== expectedAmountPaise ||
          latest.currency !== "INR" ||
          latest.status !== "REFUNDED" ||
          latest.provider_refund_id !== refund.id
        ) {
          return NextResponse.json({
            success: true,
            needsReconciliation: true,
            reconciliationStatus: "REVIEW_REQUIRED",
            message: "Refund reconciliation identity conflict requires manual review.",
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      event,
      refundId: refund.id,
      refundStatus: "REFUNDED",
      purchaseStatus: "CANCELLED",
      accessRevoked: false,
    });
  }

  if (purchase.status !== "PAID" && purchase.status !== "REFUNDED") {
    return jsonError(
      "Purchase status is not eligible for refund finalization.",
      409
    );
  }

  const { data: finalized, error: finalizeError } = await supabase.rpc(
    "finalize_razorpay_full_refund",
    {
      p_purchase_id: purchase.id,
      p_provider_payment_id: refund.payment_id,
      p_provider_refund_id: refund.id,
      p_refund_amount_paise: refund.amount,
      p_currency: refund.currency,
      p_refund_payload: { event, event_id: eventId, refund },
    }
  );

  if (finalizeError) {
    console.error("Full refund finalization failed.", {
      eventId,
      purchaseId: purchase.id,
      paymentId: refund.payment_id,
      refundId: refund.id,
      error: finalizeError.message,
    });
    return jsonError("Refund finalization requires retry.", 503);
  }

  return NextResponse.json({
    success: true,
    event,
    refundId: refund.id,
    refundStatus: "REFUNDED",
    finalization: finalized,
  });
}

export async function POST(request: Request) {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("Razorpay webhook secret is not configured.");
      return jsonError("Webhook configuration is missing.", 500);
    }

    const signature = request.headers.get("x-razorpay-signature");
    const eventId = request.headers.get("x-razorpay-event-id");

    if (!signature || !eventId || !eventId.trim()) {
      return jsonError("Missing webhook headers.", 400);
    }

    const rawBody = await request.text();

    if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
      return jsonError("Invalid webhook signature.", 400);
    }

    let body: RazorpayWebhookPayload;

    try {
      body = JSON.parse(rawBody) as RazorpayWebhookPayload;
    } catch {
      return jsonError("Invalid webhook JSON.", 400);
    }

    if (
      body.event === "refund.created" ||
      body.event === "refund.processed" ||
      body.event === "refund.failed"
    ) {
      return await handleRefundWebhook(body.event, body, eventId);
    }

    // Handle failed payment attempts separately. Never grant access here.
    if (body.event === "payment.failed") {
      return await handleFailedPaymentWebhook(body, eventId);
    }

    if (body.event !== "payment.captured") {
      return NextResponse.json({
        success: true,
        ignored: true,
        message: "Event type is not handled by this endpoint.",
      });
    }

    const payment = body.payload?.payment?.entity;

    if (
      typeof payment?.id !== "string" ||
      !payment.id.trim() ||
      typeof payment.order_id !== "string" ||
      !payment.order_id.trim() ||
      typeof payment.amount !== "number" ||
      typeof payment.currency !== "string" ||
      payment.status !== "captured"
    ) {
      return jsonError("Invalid captured payment payload.", 400);
    }

    if (
      !Number.isSafeInteger(payment.amount) ||
      payment.amount <= 0 ||
      payment.currency !== "INR"
    ) {
      return jsonError("Invalid payment amount or currency.", 400);
    }

    const supabase = createAdminSupabaseClient();

    const { data: purchase, error: purchaseError } = await supabase
      .from("purchases")
      .select(
        "id, product_id, resource_id, payment_provider, amount, currency, status, provider_order_id, provider_payment_id"
      )
      .eq("provider_order_id", payment.order_id)
      .eq("payment_provider", "razorpay")
      .maybeSingle();

    if (purchaseError) {
      console.error("Could not look up webhook purchase.");
      return jsonError("Unable to look up purchase.", 503);
    }

    if (!purchase) {
      return jsonError("Purchase not found yet.", 503);
    }

    if (
      !purchase.product_id ||
      purchase.resource_id !== null ||
      purchase.provider_order_id !== payment.order_id
    ) {
      return jsonError(
        "Purchase is not a matching product purchase.",
        409
      );
    }

    const recordedAmountPaise = Math.round(
      Number(purchase.amount) * 100
    );

    if (
      purchase.currency !== "INR" ||
      !Number.isSafeInteger(recordedAmountPaise) ||
      recordedAmountPaise !== payment.amount
    ) {
      console.error("Webhook amount mismatch.", {
        purchaseId: purchase.id,
        orderId: payment.order_id,
        paymentId: payment.id,
      });

      return jsonError(
        "Payment amount or currency does not match the purchase.",
        409
      );
    }

    if (
      purchase.provider_payment_id &&
      purchase.provider_payment_id !== payment.id
    ) {
      console.error("Webhook payment ID mismatch.", {
        purchaseId: purchase.id,
        orderId: payment.order_id,
        paymentId: payment.id,
      });

      return jsonError("Payment ID does not match the purchase.", 409);
    }

    if (purchase.status === "CANCELLED") {
      const reconciliation = await recordCancelledPayment({
        purchaseId: purchase.id,
        orderId: payment.order_id,
        paymentId: payment.id,
        amountPaise: payment.amount,
        currency: payment.currency,
        eventId,
        paymentPayload: {
          source: "razorpay_webhook",
          order_id: payment.order_id,
          payment_id: payment.id,
          payment_status: payment.status,
          amount: payment.amount,
          currency: payment.currency,
        },
      });

      if (!reconciliation) {
        return jsonError(
          "Payment reconciliation could not be persisted.",
          503
        );
      }

      let refundResult:
        | Awaited<ReturnType<typeof processCancelledPaymentRefund>>
        | null = null;

      try {
        refundResult = await processCancelledPaymentRefund(payment.id);
      } catch (refundError) {
        console.error("Cancelled-purchase refund processing failed.", {
          eventId,
          purchaseId: purchase.id,
          orderId: payment.order_id,
          paymentId: payment.id,
          error:
            refundError instanceof Error
              ? refundError.message
              : "Unknown refund-processing error",
        });

        return jsonError(
          "Payment was recorded, but refund processing needs retry.",
          503
        );
      }

      return NextResponse.json({
        success: true,
        needsReconciliation: refundResult.status !== "REFUNDED",
        paymentCaptured: true,
        accessGranted: false,
        reconciliationStatus: reconciliation.status,
        refundStatus: refundResult.status,
        refundResult,
      });
    }

    if (
      purchase.status === "FAILED" ||
      purchase.status === "REFUNDED"
    ) {
      console.error(
        "Captured payment belongs to a non-confirmable purchase.",
        {
          eventId,
          purchaseId: purchase.id,
          orderId: payment.order_id,
          paymentId: payment.id,
          purchaseStatus: purchase.status,
        }
      );

      return jsonError(
        "Captured payment requires manual reconciliation.",
        503
      );
    }

    const { data: confirmation, error: confirmationError } =
      await supabase.rpc(
        "confirm_verified_razorpay_product_payment",
        {
          p_purchase_id: purchase.id,
          p_provider_order_id: payment.order_id,
          p_provider_payment_id: payment.id,
          p_amount_paise: payment.amount,
          p_currency: payment.currency,
          p_provider_event_id: eventId,
          p_event_type: "payment.captured",
          p_event_payload: {
            source: "razorpay_webhook",
            order_id: payment.order_id,
            payment_id: payment.id,
            payment_status: payment.status,
            amount: payment.amount,
            currency: payment.currency,
          },
        }
      );

    if (confirmationError) {
      console.error("Webhook confirmation RPC failed.", {
        eventId,
        purchaseId: purchase.id,
        orderId: payment.order_id,
        paymentId: payment.id,
      });

      return jsonError("Payment confirmation is pending.", 503);
    }

    return NextResponse.json({
      success: true,
      confirmation,
    });
  } catch (error) {
    console.error("Razorpay webhook processing failed.", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return jsonError("Webhook processing failed.", 500);
  }
}