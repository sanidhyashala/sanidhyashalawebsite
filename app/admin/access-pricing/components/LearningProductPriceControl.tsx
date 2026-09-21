"use client";

import { FormEvent, useState } from "react";

import { setLearningProductPrice } from "@/app/lib/admin/access-pricing/learning-product-price.actions";

type LearningProductPriceControlProps = {
  productId: string;
  currentAmountPaise?: number | string | null;
  currency?: string | null;
};

function formatCurrentPrice(
  amountPaise: number | string | null | undefined,
  currency: string | null | undefined
) {
  if (
    amountPaise === null ||
    amountPaise === undefined
  ) {
    return "Not configured";
  }

  const amount = Number(amountPaise) / 100;

  if (!Number.isFinite(amount)) {
    return "Not configured";
  }

  if ((currency ?? "INR").toUpperCase() === "INR") {
    return `₹${amount.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  return `${(
    currency ?? "INR"
  ).toUpperCase()} ${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function LearningProductPriceControl({
  productId,
  currentAmountPaise,
  currency,
}: LearningProductPriceControlProps) {
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");
    setIsSuccess(false);
    setIsSaving(true);

    try {
      const formData = new FormData(event.currentTarget);

      const result =
        await setLearningProductPrice(formData);

      setMessage(result.message);
      setIsSuccess(result.success);

      if (result.success) {
        setPrice("");
      }
    } catch {
      setMessage(
        "Something went wrong while updating the price."
      );
      setIsSuccess(false);
    } finally {
      setIsSaving(false);
    }
  }

  const currentPrice = formatCurrentPrice(
    currentAmountPaise,
    currency
  );

  return (
    <div
      className="
        rounded-2xl
        border
        border-slate-200
        bg-white
        p-5
        dark:border-slate-700
        dark:bg-slate-900
      "
    >
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
          Chapter Product Price
        </p>

        <div className="mt-2 flex flex-wrap items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-900 dark:text-white">
            {currentPrice}
          </span>

          {currentAmountPaise !== null &&
            currentAmountPaise !== undefined && (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                active price
              </span>
            )}
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <input
          type="hidden"
          name="product_id"
          value={productId}
        />

        <div>
          <label
            htmlFor={`learning-product-price-${productId}`}
            className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
          >
            {currentAmountPaise !== null &&
            currentAmountPaise !== undefined
              ? "Update Price"
              : "Set Price"}
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex flex-1 items-center overflow-hidden rounded-xl border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950">
              <span className="border-r border-slate-200 px-4 py-3 text-sm font-semibold text-slate-500 dark:border-slate-700 dark:text-slate-400">
                ₹
              </span>

              <input
                id={`learning-product-price-${productId}`}
                name="price"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                placeholder="e.g. 299"
                value={price}
                onChange={(event) =>
                  setPrice(event.target.value)
                }
                className="
                  min-w-0
                  flex-1
                  bg-transparent
                  px-4
                  py-3
                  text-sm
                  text-slate-900
                  outline-none
                  placeholder:text-slate-400
                  dark:text-white
                "
              />
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="
                inline-flex
                items-center
                justify-center
                rounded-xl
                bg-slate-900
                px-5
                py-3
                text-sm
                font-semibold
                text-white
                transition
                hover:bg-slate-800
                disabled:cursor-not-allowed
                disabled:opacity-60
                dark:bg-white
                dark:text-slate-900
                dark:hover:bg-slate-200
              "
            >
              {isSaving
                ? "Saving..."
                : currentAmountPaise !== null &&
                    currentAmountPaise !== undefined
                  ? "Update Price"
                  : "Set Price"}
            </button>
          </div>
        </div>

        {message && (
          <div
            className={`
              rounded-xl
              border
              px-4
              py-3
              text-sm
              ${
                isSuccess
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
              }
            `}
          >
            {message}
          </div>
        )}
      </form>

      <p className="mt-4 text-xs leading-5 text-slate-400">
        The new price becomes the active price for this
        chapter product. Previous active pricing is
        automatically deactivated by the database.
      </p>
    </div>
  );
}