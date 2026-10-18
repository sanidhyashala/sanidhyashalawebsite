
import Link from "next/link";

import type { LearningAccessProduct } from "@/lib/learning/access-products";

type ChapterAccessCardProps = {
  product: LearningAccessProduct | undefined;
  returnTo: string;
};

const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

export default function ChapterAccessCard({
  product,
  returnTo,
}: ChapterAccessCardProps) {
  if (!product) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
        <p className="font-semibold text-slate-900 dark:text-slate-100">
          Chapter access is not available yet
        </p>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          A purchase option has not been configured for this chapter.
        </p>
      </div>
    );
  }

  const checkoutHref = `/learning/access?productId=${encodeURIComponent(
    product.id,
  )}&returnTo=${encodeURIComponent(returnTo)}`;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 dark:border-amber-900 dark:bg-amber-950/20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
            Unlock the complete chapter
          </p>

          <h4 className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">
            {product.title}
          </h4>

          {product.description && (
            <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
              {product.description}
            </p>
          )}

          <p className="mt-2 text-xl font-bold text-slate-950 dark:text-white">
            {inrFormatter.format(product.amountPaise / 100)}
          </p>

          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            One chapter product for eligible premium learning resources.
          </p>
        </div>

        <div className="shrink-0">
          <Link
            href={checkoutHref}
            className="inline-flex items-center justify-center rounded-full bg-amber-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
          >
            Unlock Chapter →
          </Link>
        </div>
      </div>
    </div>
  );
}
