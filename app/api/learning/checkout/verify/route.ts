
import "server-only";

import { auth } from "@clerk/nextjs/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import Razorpay from "razorpay";

import { createAdminSupabaseClient } from "@/app/lib/admin/supabase-admin";
import { processCancelledPaymentRefund } from "@/app/lib/learning/razorpay-reconciliation";

export const runtime = "nodejs";

type VerifyBody = {
  purchaseId?: unknown;
  razorpay_order_id?: unknown;
  razorpay_payment_id?: unknown;
  razorpay_signature?: unknown;
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

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function verifyCheckoutSignature(
  orderId: string,
  paymentId: string,
  suppliedSignature: string,
  secret: string
): boolean {
  if (!/^[a-f0-9]{64}$/i.test(suppliedSignature)) {
    return false;
  }

  const expectedSignature = createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest();

  const suppliedBuffer = Buffer.from(suppliedSignature, "hex");

  return (
    suppliedBuffer.length === expectedSignature.length &&
    timingSafeEqual(suppliedBuffer, expectedSignature)
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

function jsonError(
  message: string,
  status: number,
  extra?: Record<string, unknown>
) {
  return NextResponse.json(
    {
      success: false,
      message,
      ...extra,
    },
    { status }
  );
}

async function recordCancelledPurchasePayment(input: {
  purchaseId: string;
  orderId: string;
  paymentId: string;
  amountPaise: number;
  currency: string;
  paymentPayload: Record<string, unknown>;
}): Promise<
  | { success: true; record: ReconciliationRecord }
  | { success: false }
> {
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
      payment_payload: input.paymentPayload,
    })
    .select(
      "id, purchase_id, provider_order_id, provider_payment_id, amount_paise, currency, status"
    )
    .maybeSingle();

  if (!insertError && inserted) {
    return {
      success: true,
      record: inserted as ReconciliationRecord,
    };
  }

  // A duplicate payment ID can be a legitimate webhook/checkout retry.
  // Reuse its existing record only if all payment identifiers match.
  if (insertError?.code === "23505") {
    const { data: existing, error: existingError } = await supabase
      .from("razorpay_payment_reconciliations")
      .select(
        "id, purchase_id, provider_order_id, provider_payment_id, amount_paise, currency, status"
      )
      .eq("provider_payment_id", input.paymentId)
      .maybeSingle();

    if (existingError || !existing) {
      console.error(
        "Could not retrieve an existing payment reconciliation record.",
        { purchaseId: input.purchaseId, paymentId: input.paymentId }
      );
      return { success: false };
    }

    const record = existing as ReconciliationRecord;

    if (
      record.purchase_id !== input.purchaseId ||
      record.provider_order_id !== input.orderId ||
      record.provider_payment_id !== input.paymentId ||
      Number(record.amount_paise) !== input.amountPaise ||
      record.currency !== input.currency
    ) {
      console.error(
        "Payment reconciliation identity mismatch.",
        { purchaseId: input.purchaseId, paymentId: input.paymentId }
      );
      return { success: false };
    }

    return { success: true, record };
  }

  console.error("Could not persist payment reconciliation.", {
    purchaseId: input.purchaseId,
    paymentId: input.paymentId,
    error: insertError?.message ?? "No reconciliation record returned",
  });

  return { success: false };
}

export async function POST(request: Request) {
  try {
    const { isAuthenticated, userId } = await auth();

    if (!isAuthenticated || !userId) {
      return jsonError("Please sign in first.", 401);
    }

    let body: VerifyBody;

    try {
      body = (await request.json()) as VerifyBody;
    } catch {
      return jsonError("Invalid request body.", 400);
    }

    const purchaseId = body.purchaseId;
    const orderId = body.razorpay_order_id;
    const paymentId = body.razorpay_payment_id;
    const signature = body.razorpay_signature;

    if (
      !isNonEmptyString(purchaseId) ||
      !isValidUuid(purchaseId) ||
      !isNonEmptyString(orderId) ||
      !isNonEmptyString(paymentId) ||
      !isNonEmptyString(signature)
    ) {
      return jsonError("Invalid payment verification details.", 400);
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      throw new Error("Razorpay server configuration is missing.");
    }

    const supabase = createAdminSupabaseClient();

    const { data: purchase, error: purchaseError } = await supabase
      .from("purchases")
      .select(
        "id, user_id, product_id, resource_id, amount, currency, status, payment_provider, provider_order_id, provider_payment_id"
      )
      .eq("id", purchaseId)
      .eq("user_id", userId)
      .maybeSingle();

    if (purchaseError) {
      throw new Error("Could not load the purchase.");
    }

    if (!purchase) {
      return jsonError("Purchase not found.", 404);
    }

    if (
      !purchase.product_id ||
      purchase.resource_id !== null ||
      purchase.payment_provider !== "razorpay"
    ) {
      return jsonError("This is not a Razorpay product purchase.", 409);
    }

    if (purchase.provider_order_id !== orderId) {
      return jsonError("Order ID does not match the purchase.", 409);
    }

    if (
      purchase.status === "FAILED" ||
      purchase.status === "REFUNDED"
    ) {
      return jsonError("This purchase cannot be confirmed.", 409);
    }

    if (
      purchase.provider_payment_id &&
      purchase.provider_payment_id !== paymentId
    ) {
      return jsonError("Payment ID does not match the purchase.", 409);
    }

    if (
      !verifyCheckoutSignature(
        orderId,
        paymentId,
        signature,
        keySecret
      )
    ) {
      return jsonError("Payment signature verification failed.", 400);
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const payment = await razorpay.payments.fetch(paymentId);

    if (
      payment.id !== paymentId ||
      payment.order_id !== orderId ||
      payment.status !== "captured" ||
      payment.currency !== "INR"
    ) {
      return jsonError(
        "Razorpay payment is not captured or does not match.",
        409
      );
    }

    const paymentAmount = Number(payment.amount);
    const expectedAmountPaise = toPaise(purchase.amount);

    if (
      !Number.isSafeInteger(paymentAmount) ||
      paymentAmount <= 0 ||
      expectedAmountPaise === null ||
      paymentAmount !== expectedAmountPaise ||
      purchase.currency !== "INR"
    ) {
      return jsonError("Payment amount or currency mismatch.", 409);
    }

    // A captured payment for a cancelled purchase must never grant access.
    // Persist the reconciliation record before returning a response.
    if (purchase.status === "CANCELLED") {
      const reconciliation = await recordCancelledPurchasePayment({
        purchaseId: purchase.id,
        orderId,
        paymentId,
        amountPaise: paymentAmount,
        currency: payment.currency,
        paymentPayload: {
          source: "verified_checkout",
          order_id: orderId,
          payment_id: paymentId,
          payment_status: payment.status,
          amount: payment.amount,
          currency: payment.currency,
        },
      });

      if (!reconciliation.success) {
        // The payment is captured, but its reconciliation record was
        // not safely confirmed. Do not grant access; allow retry/support.
        return NextResponse.json(
          {
            success: false,
            paymentCaptured: true,
            needsReconciliation: true,
            message:
              "Payment was captured for an earlier checkout, but reconciliation could not be confirmed. Access has not been granted.",
          },
          { status: 503 }
        );
      }

      // The record is durable now. Attempt the refund through the shared,
      // idempotent reconciliation processor. If processing fails or remains
      // pending, the reconciliation row remains available for recovery.
      let refundResult: Awaited<ReturnType<typeof processCancelledPaymentRefund>>;

      try {
        refundResult = await processCancelledPaymentRefund(paymentId);
      } catch (refundError) {
        console.error("Cancelled purchase refund processing failed.", {
          purchaseId: purchase.id,
          orderId,
          paymentId,
          error:
            refundError instanceof Error
              ? refundError.message
              : "Unknown refund processing error",
        });

        return NextResponse.json(
          {
            success: false,
            paymentCaptured: true,
            accessGranted: false,
            needsReconciliation: true,
            reconciliationStatus: reconciliation.record.status,
            message:
              "Payment was captured for an earlier checkout. Access has not been granted and refund processing needs reconciliation.",
          },
          { status: 503 }
        );
      }

      return jsonError(
        "Payment was captured for an earlier checkout. Access has not been granted; the payment is being reconciled.",
        409,
        {
          paymentCaptured: true,
          accessGranted: false,
          needsReconciliation: true,
          reconciliationStatus: refundResult.status,
          refundId: "refundId" in refundResult ? refundResult.refundId : undefined,
          refundMessage: "message" in refundResult ? refundResult.message : undefined,
        }
      );
    }

    const { data: confirmation, error: confirmationError } =
      await supabase.rpc(
        "confirm_verified_razorpay_product_payment",
        {
          p_purchase_id: purchase.id,
          p_provider_order_id: orderId,
          p_provider_payment_id: paymentId,
          p_amount_paise: payment.amount,
          p_currency: payment.currency,
          p_provider_event_id: `checkout_${paymentId}`,
          p_event_type: "payment.captured",
          p_event_payload: {
            source: "verified_checkout",
            order_id: orderId,
            payment_id: paymentId,
            payment_status: payment.status,
            amount: payment.amount,
            currency: payment.currency,
          },
        }
      );

    if (confirmationError) {
      console.error("Payment confirmation RPC failed.", {
        purchaseId: purchase.id,
        orderId,
        paymentId,
      });

      return NextResponse.json(
        {
          success: false,
          paymentCaptured: true,
          needsReconciliation: true,
          message:
            "Payment was received, but confirmation is pending. Please contact support if the status does not update.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      confirmation,
    });
  } catch (error) {
    console.error("Learning payment verification failed.", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return NextResponse.json(
      {
        success: false,
        message: "Unable to verify payment right now.",
      },
      { status: 500 }
    );
  }
}
