import Link from "next/link";

import AdminPage from "@/app/admin/components/layout/AdminPage";

import { getAccessPricingClasses } from "@/app/lib/admin/access-pricing/access-pricing.service";

function formatPrice(
  amountPaise: number | null,
  currency: string | null
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

  const normalizedCurrency =
    (currency ?? "INR").toUpperCase();

  if (normalizedCurrency === "INR") {
    return `₹${amount.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  return `${normalizedCurrency} ${amount.toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;
}

export default async function AccessPricingPage() {
  const classes = await getAccessPricingClasses();

  return (
    <AdminPage
      title="Access & Pricing"
      description="Manage subject-level and chapter-level learning access and pricing from one central place."
      sectionTitle="Classes"
      sectionDescription="Choose a class to manage its Mathematics subject product and chapter products."
    >
      {classes.length === 0 ? (
        <div
          className="
            rounded-2xl
            border
            border-dashed
            border-slate-300
            bg-white
            p-10
            text-center
            dark:border-slate-700
            dark:bg-slate-900
          "
        >
          <div className="text-4xl">📚</div>

          <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
            No Classes Available
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
            No active Mathematics curriculum is currently
            available for Access & Pricing.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {classes.map((classItem) => {
            const subjectProduct =
              classItem.subject.product;

            const subjectPrice =
              subjectProduct?.price ?? null;

            const hasSubjectProduct =
              Boolean(subjectProduct);

            const hasSubjectPrice =
              Boolean(subjectPrice);

            return (
              <Link
                key={classItem.id}
                href={`/admin/access-pricing/${classItem.id}`}
                className="
                  group
                  rounded-2xl
                  border
                  border-slate-200
                  bg-white
                  p-6
                  shadow-sm
                  transition-all
                  duration-200
                  hover:-translate-y-0.5
                  hover:border-slate-300
                  hover:shadow-md
                  dark:border-slate-800
                  dark:bg-slate-900
                  dark:hover:border-slate-700
                "
              >
                {/* -------------------------------------------------
                    Class Header
                ------------------------------------------------- */}

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                      Class
                    </p>

                    <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                      {classItem.name}
                    </h2>
                  </div>

                  <div
                    className="
                      flex
                      h-10
                      w-10
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      bg-slate-100
                      text-lg
                      transition-colors
                      group-hover:bg-slate-900
                      group-hover:text-white
                      dark:bg-slate-800
                      dark:group-hover:bg-white
                      dark:group-hover:text-slate-900
                    "
                    aria-hidden="true"
                  >
                    →
                  </div>
                </div>

                {/* -------------------------------------------------
                    Subject
                ------------------------------------------------- */}

                <div className="mt-8">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Subject
                      </p>

                      <p className="mt-1 text-base font-semibold text-slate-800 dark:text-slate-200">
                        {classItem.subject.name}
                      </p>
                    </div>

                    {hasSubjectProduct ? (
                      <span
                        className="
                          rounded-full
                          bg-emerald-50
                          px-2.5
                          py-1
                          text-[10px]
                          font-bold
                          text-emerald-700
                          dark:bg-emerald-950
                          dark:text-emerald-300
                        "
                      >
                        PRODUCT
                      </span>
                    ) : (
                      <span
                        className="
                          rounded-full
                          bg-amber-50
                          px-2.5
                          py-1
                          text-[10px]
                          font-bold
                          text-amber-700
                          dark:bg-amber-950
                          dark:text-amber-300
                        "
                      >
                        NOT SET
                      </span>
                    )}
                  </div>
                </div>

                {/* -------------------------------------------------
                    Subject Product
                ------------------------------------------------- */}

                <div
                  className="
                    mt-5
                    rounded-2xl
                    border
                    border-slate-200
                    bg-slate-50
                    p-4
                    dark:border-slate-700
                    dark:bg-slate-800/60
                  "
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
                        Subject Product
                      </p>

                      <p className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
                        {hasSubjectPrice &&
                        subjectPrice
                          ? formatPrice(
                              subjectPrice.amountPaise,
                              subjectPrice.currency
                            )
                          : "Not configured"}
                      </p>
                    </div>

                    <span
                      className={`
                        rounded-full
                        px-2.5
                        py-1
                        text-[10px]
                        font-bold
                        ${
                          subjectProduct?.status ===
                          "ACTIVE"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                        }
                      `}
                    >
                      {subjectProduct
                        ? subjectProduct.status
                        : "MISSING"}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    {hasSubjectPrice
                      ? "Active subject-level price"
                      : "Subject price needs configuration"}
                  </p>
                </div>

                {/* -------------------------------------------------
                    Curriculum Info
                ------------------------------------------------- */}

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div
                    className="
                      rounded-xl
                      bg-slate-50
                      p-3
                      dark:bg-slate-800/70
                    "
                  >
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Chapters
                    </p>

                    <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                      {classItem.chapterCount}
                    </p>
                  </div>

                  <div
                    className="
                      rounded-xl
                      bg-slate-50
                      p-3
                      dark:bg-slate-800/70
                    "
                  >
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Session
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                      {classItem.session}
                    </p>
                  </div>
                </div>

                {/* -------------------------------------------------
                    Footer
                ------------------------------------------------- */}

                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5 dark:border-slate-800">
                  <div>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {classItem.programStatus}
                    </span>

                    <p className="mt-1 text-[11px] text-slate-400">
                      {hasSubjectPrice
                        ? "Subject pricing configured"
                        : "Subject pricing pending"}
                    </p>
                  </div>

                  <span
                    className="
                      text-sm
                      font-semibold
                      text-slate-700
                      transition-colors
                      group-hover:text-slate-950
                      dark:text-slate-300
                      dark:group-hover:text-white
                    "
                  >
                    Manage →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </AdminPage>
  );
}