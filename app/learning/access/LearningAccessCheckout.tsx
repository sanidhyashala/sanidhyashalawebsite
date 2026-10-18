
"use client";

import { useState } from "react";

type Props = {
  productId: string;
  productTitle: string;
  returnTo: string;
};

type OrderResponse = {
  success: boolean;
  message?: string;
  purchaseId?: string;
  orderId?: string;
  amount?: number;
  currency?: string;
  keyId?: string;
  product?: {
    id: string;
    title: string;
  };
};

type VerifyResponse = {
  success: boolean;
  paymentCaptured?: boolean;
  message?: string;
};

type RazorpaySuccessResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpaySuccessResponse) => void | Promise<void>;
  modal?: {
    ondismiss?: () => void;
  };
  theme?: {
    color?: string;
  };
};

type RazorpayInstance = {
  open: () => void;
  on: (event: string, callback: (response: unknown) => void) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

let razorpayScriptPromise: Promise<void> | null = null;

function loadRazorpayScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Checkout is available in the browser only."));
  }

  if (window.Razorpay) {
    return Promise.resolve();
  }

  if (razorpayScriptPromise) {
    return razorpayScriptPromise;
  }

  razorpayScriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");

    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;

    script.onload = () => {
      if (window.Razorpay) {
        resolve();
      } else {
        razorpayScriptPromise = null;
        reject(new Error("Razorpay Checkout could not be initialized."));
      }
    };

    script.onerror = () => {
      razorpayScriptPromise = null;
      reject(new Error("Could not load Razorpay Checkout."));
    };

    document.head.appendChild(script);
  });

  return razorpayScriptPromise;
}

function getSafeReturnTo(value: string): string {
  if (
    !value.startsWith("/learning") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\r\n]/.test(value)
  ) {
    return "/learning";
  }

  try {
    const parsed = new URL(value, window.location.origin);

    if (
      parsed.origin !== window.location.origin ||
      (parsed.pathname !== "/learning" &&
        !parsed.pathname.startsWith("/learning/"))
    ) {
      return "/learning";
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return "/learning";
  }
}

export default function LearningAccessCheckout({
  productId,
  productTitle,
  returnTo,
}: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<
    "error" | "info" | "success"
  >("info");

  async function startCheckout() {
    if (isLoading) return;

    setIsLoading(true);
    setMessage("");
    setMessageType("info");

    try {
      const scriptLoaded = await loadRazorpayScript();

      void scriptLoaded;

      if (!window.Razorpay) {
        throw new Error("Razorpay Checkout is not available. Please try again.");
      }

      const orderResponse = await fetch("/api/learning/checkout/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId }),
      });

      const order = (await orderResponse.json()) as OrderResponse;

      if (
        !orderResponse.ok ||
        !order.success ||
        !order.purchaseId ||
        !order.orderId ||
        !order.keyId ||
        !Number.isSafeInteger(order.amount) ||
        (order.amount ?? 0) <= 0 ||
        order.currency !== "INR"
      ) {
        throw new Error(
          order.message || "Unable to start checkout. Please try again."
        );
      }

      const orderAmount = order.amount;

if (
  typeof orderAmount !== "number" ||
  !Number.isSafeInteger(orderAmount) ||
  orderAmount <= 0
) {
  throw new Error("Invalid payment amount received from the server.");
}

      const razorpay = new window.Razorpay({
        key: order.keyId,
        amount: orderAmount,
        currency: order.currency,
        name: "SanidhyaShala",
        description: order.product?.title || productTitle,
        order_id: order.orderId,
        theme: {
          color: "#334155",
        },
        handler: async (paymentResponse) => {
          setIsLoading(true);
          setMessage("Payment received. Verifying it securely...");
          setMessageType("info");

          try {
            const verifyResponse = await fetch(
              "/api/learning/checkout/verify",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  purchaseId: order.purchaseId,
                  razorpay_order_id: paymentResponse.razorpay_order_id,
                  razorpay_payment_id: paymentResponse.razorpay_payment_id,
                  razorpay_signature: paymentResponse.razorpay_signature,
                }),
              }
            );

            const verification =
              (await verifyResponse.json()) as VerifyResponse;

            if (!verifyResponse.ok || !verification.success) {
              setMessageType("error");
              setMessage(
                verification.message ||
                  (verification.paymentCaptured
                    ? "Payment captured, but confirmation is pending. Please check your access status or contact support."
                    : "We could not confirm the payment. Please check the purchase status before trying again.")
              );
              return;
            }

            setMessageType("success");
            setMessage("Payment verified. Returning to your learning page...");

            window.location.assign(getSafeReturnTo(returnTo));
          } catch {
            setMessageType("error");
            setMessage(
              "Payment verification could not be completed. Your payment may have been received; please check the purchase status before trying again."
            );
          } finally {
            setIsLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsLoading(false);
            setMessageType("info");
            setMessage(
              "Checkout was closed. No access has been granted by this action. You can try again whenever you're ready."
            );
          },
        },
      });

      razorpay.on("payment.failed", () => {
        setIsLoading(false);
        setMessageType("error");
        setMessage(
          "The payment did not complete successfully. If money was debited, check the transaction status before trying again."
        );
      });

      razorpay.open();
    } catch (error) {
      setMessageType("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to start checkout. Please try again."
      );
      setIsLoading(false);
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-border bg-card p-5">
      <h2 className="text-lg font-semibold text-foreground">
        Continue with secure payment
      </h2>

      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        You will be redirected to Razorpay Checkout to complete your payment.
        Your access will be confirmed only after server-side verification.
      </p>

      {message ? (
        <p
          role="status"
          aria-live="polite"
          className={`mt-4 rounded-xl border p-3 text-sm leading-6 ${
            messageType === "error"
              ? "border-red-300 text-red-700"
              : messageType === "success"
                ? "border-emerald-300 text-emerald-700"
                : "border-border text-muted-foreground"
          }`}
        >
          {message}
        </p>
      ) : null}

      <button
        type="button"
        onClick={startCheckout}
        disabled={isLoading}
        className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-foreground px-5 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? "Please wait..." : "Proceed to secure payment"}
      </button>

      <p className="mt-3 text-xs leading-5 text-muted-foreground">
        Never share your OTP, PIN, or banking credentials with anyone.
      </p>
    </div>
  );
}