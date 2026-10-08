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
      sectionDescription="Choose a class to manage its subject products, individual science subjects, and chapter products."
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
            No active curriculum is currently available
            for Access & Pricing.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {classes.map((classItem) => {
            const mathematicsSubject =
              classItem.subjects.find(
                (subject) =>
                  subject.parentNodeId === null &&
                  subject.name === "Mathematics"
              ) ?? null;

            const scienceSubject =
              classItem.subjects.find(
                (subject) =>
                  subject.parentNodeId === null &&
                  subject.name === "Science"
              ) ?? null;

            const scienceChildren =
              scienceSubject
                ? classItem.subjects.filter(
                    (subject) =>
                      subject.parentNodeId ===
                      scienceSubject.id
                  )
                : [];

            const topLevelSubjects =
              classItem.subjects.filter(
                (subject) =>
                  subject.parentNodeId === null &&
                  subject.name !== "Science" &&
                  subject.name !== "Mathematics"
              );

            const mathematicsProduct =
              mathematicsSubject?.product ?? null;

            const mathematicsPrice =
              mathematicsProduct?.price ?? null;

            const scienceProduct =
              scienceSubject?.product ?? null;

            const sciencePrice =
              scienceProduct?.price ?? null;

            const hasMathematicsProduct =
              Boolean(mathematicsProduct);

            const hasMathematicsPrice =
              Boolean(mathematicsPrice);

            const hasScienceProduct =
              Boolean(scienceProduct);

            const hasSciencePrice =
              Boolean(sciencePrice);

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
                    Subject Products
                ------------------------------------------------- */}

                <div className="mt-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                        Subject Products
                      </p>

                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Subject-level access and pricing
                      </p>
                    </div>

                    <span
                      className="
                        rounded-full
                        bg-slate-100
                        px-2.5
                        py-1
                        text-[10px]
                        font-bold
                        text-slate-600
                        dark:bg-slate-800
                        dark:text-slate-300
                      "
                    >
                      {classItem.subjects.length}
                    </span>
                  </div>

                  {/* -------------------------------------------------
                      Mathematics
                  ------------------------------------------------- */}

                  {mathematicsSubject ? (
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
                            Subject
                          </p>

                          <p className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
                            {mathematicsSubject.name}
                          </p>
                        </div>

                        {hasMathematicsProduct ? (
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

                      <div className="mt-4 flex items-end justify-between gap-4">
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Subject Price
                          </p>

                          <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                            {hasMathematicsPrice &&
                            mathematicsPrice
                              ? formatPrice(
                                  mathematicsPrice.amountPaise,
                                  mathematicsPrice.currency
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
                              mathematicsProduct?.status ===
                              "ACTIVE"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                            }
                          `}
                        >
                          {mathematicsProduct
                            ? mathematicsProduct.status
                            : "MISSING"}
                        </span>
                      </div>

                      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                        {hasMathematicsPrice
                          ? "Active subject-level price"
                          : "Subject price needs configuration"}
                      </p>
                    </div>
                  ) : null}

                  {/* -------------------------------------------------
                      Science Bundle
                  ------------------------------------------------- */}

                  {scienceSubject ? (
                    <div
                      className="
                        mt-4
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
                            Subject Bundle
                          </p>

                          <p className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
                            {scienceSubject.name}
                          </p>
                        </div>

                        {hasScienceProduct ? (
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

                      <div className="mt-4 flex items-end justify-between gap-4">
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            PCB Bundle Price
                          </p>

                          <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                            {hasSciencePrice &&
                            sciencePrice
                              ? formatPrice(
                                  sciencePrice.amountPaise,
                                  sciencePrice.currency
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
                              scienceProduct?.status ===
                              "ACTIVE"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                            }
                          `}
                        >
                          {scienceProduct
                            ? scienceProduct.status
                            : "MISSING"}
                        </span>
                      </div>

                      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                        {hasSciencePrice
                          ? "Science product includes Physics, Chemistry and Biology access"
                          : "Science bundle price needs configuration"}
                      </p>

                      {/* -------------------------------------------------
                          Individual Science Subjects
                      ------------------------------------------------- */}

                      {scienceChildren.length > 0 ? (
                        <div className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-700">
                          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                            Individual Science Products
                          </p>

                          <div className="mt-3 space-y-2">
                            {scienceChildren.map(
                              (subject) => {
                                const product =
                                  subject.product;

                                const price =
                                  product?.price ??
                                  null;

                                return (
                                  <div
                                    key={subject.id}
                                    className="
                                      flex
                                      items-center
                                      justify-between
                                      gap-3
                                      rounded-xl
                                      border
                                      border-slate-200
                                      bg-white
                                      px-3
                                      py-3
                                      dark:border-slate-700
                                      dark:bg-slate-900/60
                                    "
                                  >
                                    <div className="min-w-0">
                                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                        {subject.name}
                                      </p>

                                      <p className="mt-0.5 text-[11px] text-slate-400">
                                        Individual subject access
                                      </p>
                                    </div>

                                    <div className="shrink-0 text-right">
                                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                                        {price
                                          ? formatPrice(
                                              price.amountPaise,
                                              price.currency
                                            )
                                          : "Not configured"}
                                      </p>

                                      <p
                                        className={`
                                          mt-0.5
                                          text-[10px]
                                          font-semibold
                                          ${
                                            product?.status ===
                                            "ACTIVE"
                                              ? "text-emerald-600 dark:text-emerald-400"
                                              : "text-slate-400"
                                          }
                                        `}
                                      >
                                        {product
                                          ? product.status
                                          : "Product missing"}
                                      </p>
                                    </div>
                                  </div>
                                );
                              }
                            )}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {/* -------------------------------------------------
                      Other top-level subjects
                  ------------------------------------------------- */}

                  {topLevelSubjects.length > 0 ? (
                    <div className="mt-4 space-y-3">
                      {topLevelSubjects.map(
                        (subject) => {
                          const product =
                            subject.product;

                          const price =
                            product?.price ?? null;

                          return (
                            <div
                              key={subject.id}
                              className="
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
                                    Subject
                                  </p>

                                  <p className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
                                    {subject.name}
                                  </p>
                                </div>

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
                              </div>

                              <div className="mt-4">
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  Subject Price
                                </p>

                                <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                                  {price
                                    ? formatPrice(
                                        price.amountPaise,
                                        price.currency
                                      )
                                    : "Not configured"}
                                </p>
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  ) : null}
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
                      Mathematics Chapters
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
                      {classItem.subjects.length} subject
                      products available
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