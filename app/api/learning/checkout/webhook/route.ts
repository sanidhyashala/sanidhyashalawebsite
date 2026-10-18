
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

  // Checkout verification and webhook delivery can race.
  // The unique provider_payment_id makes this lookup idempotent.
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


async function handleRefundWebhook(
  event: "refund.created" | "refund.processed" | "refund.failed",
  body: RazorpayWebhookPayload,
  eventId: string
) {
  const refund = body.payload?.refund?.entity;

  if (
    typeof refund?.id !== "string" ||
    typeof refund.payment_id !== "string" ||
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

  const supabase = createAdminSupabaseClient();
  const { data: record, error: lookupError } = await supabase
    .from("razorpay_payment_reconciliations")
    .select(
      "id, purchase_id, provider_order_id, provider_payment_id, amount_paise, currency, status, provider_refund_id"
    )
    .eq("provider_payment_id", refund.payment_id)
    .maybeSingle();

  if (lookupError) {
    console.error("Could not look up refund reconciliation.", { eventId });
    return jsonError("Unable to look up refund reconciliation.", 503);
  }

  // This endpoint may receive refunds unrelated to cancelled learning
  // purchases. Acknowledge those events without mutating unrelated data.
  if (!record) {
    return NextResponse.json({ success: true, ignored: true, event });
  }

  if (
    record.currency !== refund.currency ||
    Number(record.amount_paise) !== refund.amount ||
    (record.provider_refund_id && record.provider_refund_id !== refund.id)
  ) {
    const { error: reviewError } = await supabase
      .from("razorpay_payment_reconciliations")
      .update({
        status: "REVIEW_REQUIRED",
        refund_error: "Refund webhook identifiers, amount, or currency do not match the reconciliation record.",
        refund_payload: { event, event_id: eventId, refund },
        updated_at: new Date().toISOString(),
      })
      .eq("id", record.id);

    if (reviewError) {
      return jsonError("Could not persist refund review status.", 503);
    }

    return NextResponse.json({
      success: true,
      needsReconciliation: true,
      reconciliationStatus: "REVIEW_REQUIRED",
    });
  }

  // Never let a delayed created/failed event downgrade a refund already
  // confirmed as processed. Webhook deliveries can arrive out of order.
  let nextStatus: "REFUNDED" | "REFUND_PENDING" | "REFUND_FAILED";
  if (record.status === "REFUNDED") {
    nextStatus = "REFUNDED";
  } else if (
    record.status === "REFUND_FAILED" &&
    event !== "refund.processed" &&
    refund.status !== "processed"
  ) {
    // Ignore delayed created events after a terminal failure.
    nextStatus = "REFUND_FAILED";
  } else if (event === "refund.failed" || refund.status === "failed") {
    nextStatus = "REFUND_FAILED";
  } else if (refund.status === "processed" || event === "refund.processed") {
    nextStatus = "REFUNDED";
  } else if (
    refund.status === "created" ||
    refund.status === "pending" ||
    event === "refund.created"
  ) {
    nextStatus = "REFUND_PENDING";
  } else {
    return jsonError("Unrecognized refund status.", 503);
  }

  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("razorpay_payment_reconciliations")
    .update({
      status: nextStatus,
      provider_refund_id: refund.id,
      refund_error:
        nextStatus === "REFUND_FAILED"
          ? "Razorpay reported that the refund failed. Review before any manual retry."
          : null,
      refund_payload: { event, event_id: eventId, refund },
      refunded_at: nextStatus === "REFUNDED" ? now : null,
      updated_at: now,
    })
    .eq("id", record.id);

  if (updateError) {
    console.error("Could not persist refund webhook status.", { eventId });
    return jsonError("Could not persist refund status.", 503);
  }

  return NextResponse.json({
    success: true,
    event,
    reconciliationStatus: nextStatus,
    refundId: refund.id,
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

    if (!signature || !eventId) {
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
      typeof payment.order_id !== "string" ||
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
        // Do not acknowledge a captured payment whose reconciliation
        // record could not be persisted or safely retrieved.
        return jsonError(
          "Payment reconciliation could not be persisted.",
          503
        );
      }

      // A cancelled purchase must never grant access. Persist the captured
      // payment first, then attempt the idempotent refund workflow.
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

        // The reconciliation record is already durable. Return 503 so
        // Razorpay may retry delivery; never grant access in this branch.
        return jsonError(
          "Payment was recorded, but refund processing needs retry.",
          503
        );
      }

      // A successful webhook response acknowledges receipt, not necessarily
      // a completed refund. The reconciliation table remains authoritative.
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

      // Do not grant access or falsely report that a refund occurred.
      // These exceptional states require separate reconciliation.
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
