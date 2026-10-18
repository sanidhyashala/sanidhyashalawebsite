
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FileText,
  Layers3,
} from "lucide-react";

import { createAdminSupabaseClient } from "@/app/lib/admin/supabase-admin";
import {
  getLearningAccessProducts,
  type LearningAccessProductType,
} from "@/lib/learning/access-products";

import LearningAccessCheckout from "./LearningAccessCheckout";

type SearchParams = Promise<{
  productId?: string | string[];
  returnTo?: string | string[];
}>;

function getSingleValue(
  value: string | string[] | undefined,
): string | null {
  return typeof value === "string" ? value : null;
}

function getSafeReturnTo(value: string | null): string {
  if (!value || !value.startsWith("/learning")) {
    return "/learning";
  }

  if (
    value.startsWith("//") ||
    value.includes("\\") ||
    value.includes("\r") ||
    value.includes("\n")
  ) {
    return "/learning";
  }

  try {
    const parsed = new URL(value, "https://sanidhyashala.com");

    if (
      parsed.origin !== "https://sanidhyashala.com" ||
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

function formatPrice(amountPaise: number, currency: string): string {
  return (amountPaise / 100).toLocaleString("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  });
}

function formatExpiry(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid learning product expiry date.");
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }).format(date);
}

function IncludedBenefit({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof BookOpen;
  title: string;
  description: string;
}) {
  return (
    <li className="flex items-start gap-3">
      <div className="mt-0.5 rounded-lg bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
        <Icon aria-hidden="true" className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </p>
        <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
          {description}
        </p>
      </div>

      <CheckCircle2
        aria-hidden="true"
        className="mt-1 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400"
      />
    </li>
  );
}

export default async function LearningAccessPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  const productId = getSingleValue(params.productId);
  const returnTo = getSafeReturnTo(getSingleValue(params.returnTo));

  if (
    !productId ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      productId,
    )
  ) {
    notFound();
  }

  const supabase = createAdminSupabaseClient();

  const { data: product, error } = await supabase
    .from("learning_products")
    .select(
      "id, curriculum_node_id, product_type, title, description, status",
    )
    .eq("id", productId)
    .eq("status", "ACTIVE")
    .maybeSingle();

  if (error) {
    throw new Error("Unable to load the learning access product.");
  }

  if (
    !product ||
    (product.product_type !== "SUBJECT" &&
      product.product_type !== "CHAPTER")
  ) {
    notFound();
  }

  const productType = product.product_type as LearningAccessProductType;

  const productsByNodeId = await getLearningAccessProducts({
    curriculumNodeIds: [product.curriculum_node_id],
    productType,
  });

  const accessProduct = productsByNodeId.get(product.curriculum_node_id);

  if (!accessProduct || accessProduct.id !== product.id) {
    notFound();
  }

  // Use the same database function that determines entitlement expiry.
  const { data: expiryValue, error: expiryError } = await supabase.rpc(
    "learning_product_session_end",
    {
      p_product_id: accessProduct.id,
    },
  );

  if (expiryError || typeof expiryValue !== "string" || !expiryValue) {
    console.error("Unable to determine learning product expiry.");

    throw new Error("Unable to determine the learning access validity.");
  }

  const expiryLabel = formatExpiry(expiryValue);
  const isChapterProduct = accessProduct.productType === "CHAPTER";
  const scopeLabel = isChapterProduct ? "Chapter access" : "Subject access";
  const scopeDescription = isChapterProduct
    ? "Eligible premium learning resources mapped to this chapter."
    : "Eligible premium learning resources mapped to this subject.";

  return (
    <main className="min-h-screen bg-white px-5 py-12 dark:bg-slate-950 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Link
          href={returnTo}
          className="text-sm font-semibold text-blue-700 hover:text-blue-800 dark:text-blue-400"
        >
          ← Back to learning
        </Link>

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-700 dark:text-blue-400">
            SanidhyaShala · Learning access
          </p>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
            {accessProduct.title}
          </h1>

          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            {scopeLabel}
          </p>

          {accessProduct.description && (
            <p className="mt-5 leading-7 text-slate-600 dark:text-slate-300">
              {accessProduct.description}
            </p>
          )}

          <div className="my-8 border-t border-slate-200 dark:border-slate-800" />

          <section
            aria-labelledby="included-benefits-heading"
            className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 dark:border-emerald-900 dark:bg-emerald-950/20 sm:p-6"
          >
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-white p-2 text-emerald-700 shadow-sm dark:bg-slate-900 dark:text-emerald-400">
                <Layers3 aria-hidden="true" className="h-6 w-6" />
              </div>

              <div>
                <h2
                  id="included-benefits-heading"
                  className="text-lg font-bold text-slate-900 dark:text-slate-100"
                >
                  What&apos;s included with your purchase?
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  {scopeDescription}
                </p>
              </div>
            </div>

            <ul className="mt-5 space-y-5">
              <IncludedBenefit
                icon={BookOpen}
                title="Notes"
                description={
                  isChapterProduct
                    ? "Eligible premium notes for this chapter, including new eligible notes added during your access period."
                    : "Eligible premium notes for this subject, including new eligible notes added during your access period."
                }
              />

              <IncludedBenefit
                icon={ClipboardList}
                title="MCQ Practice"
                description={
                  isChapterProduct
                    ? "Eligible premium MCQs for this chapter, including new eligible practice content added during your access period."
                    : "Eligible premium MCQs for this subject, including new eligible practice content added during your access period."
                }
              />

              <IncludedBenefit
                icon={FileText}
                title="Subjective Questions"
                description={
                  isChapterProduct
                    ? "Eligible premium question sets for this chapter, including new eligible sets added during your access period."
                    : "Eligible premium question sets for this subject, including new eligible sets added during your access period."
                }
              />
            </ul>

            <p className="mt-5 border-t border-emerald-200 pt-4 text-xs leading-5 text-slate-600 dark:border-emerald-900 dark:text-slate-400">
              New eligible premium resources mapped to your purchased{" "}
              {isChapterProduct ? "chapter" : "subject"} during the access
              period are included without a separate purchase. Access remains
              subject to the validity period and applicable access rules.
              Free resources remain available under their existing rules.
            </p>
          </section>

          <section className="mt-6 rounded-2xl border border-blue-200 bg-blue-50/60 p-5 dark:border-blue-900 dark:bg-blue-950/20">
            <div className="flex items-start gap-3">
              <CalendarClock
                aria-hidden="true"
                className="mt-0.5 h-6 w-6 shrink-0 text-blue-700 dark:text-blue-400"
              />

              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Your access will be valid until
                </p>

                <p className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">
                  {expiryLabel} IST
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  Access is valid until the end of the applicable academic
                  session. Please review this date before completing payment.
                </p>
              </div>
            </div>
          </section>

          <div className="my-8 border-t border-slate-200 dark:border-slate-800" />

          <p className="text-sm text-slate-500 dark:text-slate-400">
            Current listed price
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">
            {formatPrice(
              accessProduct.amountPaise,
              accessProduct.currency,
            )}
          </p>

          <p className="mt-5 text-sm leading-6 text-slate-600 dark:text-slate-300">
            You can return to your learning space whenever you are ready.
            Available free learning resources remain available under their
            existing access rules.
          </p>

          <LearningAccessCheckout
            productId={accessProduct.id}
            productTitle={accessProduct.title}
            returnTo={returnTo}
          />

          <div className="mt-6">
            <Link
              href={returnTo}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-400 hover:text-blue-700 dark:border-slate-700 dark:text-slate-200 dark:hover:border-blue-500 dark:hover:text-blue-400"
            >
              Continue exploring learning
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
