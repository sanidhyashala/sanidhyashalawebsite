import Link from "next/link";
import { notFound } from "next/navigation";

import AdminPage from "@/app/admin/components/layout/AdminPage";
import LearningProductPriceControl from "@/app/admin/access-pricing/components/LearningProductPriceControl";

import { createAdminSupabaseClient } from "@/app/lib/admin/supabase-admin";

type PageProps = {
  params: Promise<{
    classId: string;
  }>;
};

type Program = {
  id: string;
  name: string;
  slug: string;
  status: string;
};

type CurriculumVersion = {
  id: string;
  program_id: string;
  session: string;
  status: string;
};

type CurriculumNode = {
  id: string;
  curriculum_version_id: string;
  parent_node_id: string | null;
  display_name: string;
  description: string | null;
  sequence_order: number | null;
  status: string;
};

type LearningProduct = {
  id: string;
  curriculum_node_id: string;
  product_type: "SUBJECT" | "CHAPTER";
  title: string;
  description: string | null;
  status: "ACTIVE" | "INACTIVE" | "ARCHIVED";
};

type LearningProductPrice = {
  id: string;
  product_id: string;
  amount_paise: number | string;
  currency: string;
  active: boolean;
  valid_from: string;
  valid_until: string | null;
};

function formatPrice(
  amountPaise: number | string,
  currency: string
) {
  const amount = Number(amountPaise) / 100;

  if (!Number.isFinite(amount)) {
    return "Not configured";
  }

  if (currency.toUpperCase() === "INR") {
    return `₹${amount.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  return `${currency.toUpperCase()} ${amount.toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;
}

export default async function AccessPricingClassPage({
  params,
}: PageProps) {
  const { classId } = await params;

  const normalizedClassId = classId.trim();

  if (!normalizedClassId) {
    notFound();
  }

  const supabase = createAdminSupabaseClient();

  /* ---------------------------------------------------------
   * 1. Load Class / Program
   * --------------------------------------------------------- */

  const { data: program, error: programError } =
    await supabase
      .from("programs")
      .select(
        `
          id,
          name,
          slug,
          status
        `
      )
      .eq("id", normalizedClassId)
      .maybeSingle();

  if (programError) {
    throw new Error(
      `Failed to load class: ${programError.message}`
    );
  }

  if (!program) {
    notFound();
  }

  const typedProgram = program as Program;

  /* ---------------------------------------------------------
   * 2. Load latest curriculum version
   * --------------------------------------------------------- */

  const {
    data: curriculumVersions,
    error: curriculumVersionsError,
  } = await supabase
    .from("curriculum_versions")
    .select(
      `
        id,
        program_id,
        session,
        status
      `
    )
    .eq("program_id", typedProgram.id)
    .in("status", ["DRAFT", "PUBLISHED"]);

  if (curriculumVersionsError) {
    throw new Error(
      `Failed to load curriculum version: ${curriculumVersionsError.message}`
    );
  }

  if (
    !curriculumVersions ||
    curriculumVersions.length === 0
  ) {
    return (
      <AdminPage
        title={typedProgram.name}
        description="Manage Mathematics learning access and pricing for this class."
        sectionTitle="Mathematics"
        sectionDescription="No active curriculum version is currently available."
      >
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
            No Curriculum Available
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
            This class does not currently have an active
            Mathematics curriculum version.
          </p>
        </div>
      </AdminPage>
    );
  }

  const latestVersion =
    [...curriculumVersions]
      .sort((a, b) =>
        b.session.localeCompare(a.session)
      )[0] as CurriculumVersion;

  /* ---------------------------------------------------------
   * 3. Load curriculum nodes
   * --------------------------------------------------------- */

  const {
    data: curriculumNodes,
    error: curriculumNodesError,
  } = await supabase
    .from("curriculum_nodes")
    .select(
      `
        id,
        curriculum_version_id,
        parent_node_id,
        display_name,
        description,
        sequence_order,
        status
      `
    )
    .eq(
      "curriculum_version_id",
      latestVersion.id
    )
    .eq("status", "ACTIVE")
    .order("sequence_order", {
      ascending: true,
    });

  if (curriculumNodesError) {
    throw new Error(
      `Failed to load curriculum chapters: ${curriculumNodesError.message}`
    );
  }

  const typedNodes =
    (curriculumNodes ?? []) as CurriculumNode[];

  /* ---------------------------------------------------------
   * 4. Find Mathematics root node
   * --------------------------------------------------------- */

  const mathematicsNode = typedNodes.find(
    (node) =>
      node.parent_node_id === null &&
      node.display_name === "Mathematics"
  );

  if (!mathematicsNode) {
    return (
      <AdminPage
        title={typedProgram.name}
        description="Manage Mathematics learning access and pricing for this class."
        sectionTitle="Mathematics"
        sectionDescription="The Mathematics curriculum node could not be found."
      >
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
          <div className="text-4xl">📐</div>

          <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
            Mathematics Curriculum Not Found
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
            The selected class does not currently contain a
            Mathematics curriculum root node.
          </p>
        </div>
      </AdminPage>
    );
  }

  /* ---------------------------------------------------------
   * 5. Load Mathematics Subject Product
   *
   * The Mathematics root node owns the SUBJECT product.
   * This product represents the subject-level commercial
   * access layer for the current curriculum.
   * --------------------------------------------------------- */

  const {
    data: subjectProduct,
    error: subjectProductError,
  } = await supabase
    .from("learning_products")
    .select(
      `
        id,
        curriculum_node_id,
        product_type,
        title,
        description,
        status
      `
    )
    .eq(
      "curriculum_node_id",
      mathematicsNode.id
    )
    .eq("product_type", "SUBJECT")
    .maybeSingle();

  if (subjectProductError) {
    throw new Error(
      `Failed to load Mathematics subject product: ${subjectProductError.message}`
    );
  }

  const typedSubjectProduct =
    subjectProduct as LearningProduct | null;

  /* ---------------------------------------------------------
   * 6. Load active Subject Product Price
   * --------------------------------------------------------- */

  let subjectProductPrice:
    | LearningProductPrice
    | null = null;

  if (typedSubjectProduct) {
    const {
      data: price,
      error: priceError,
    } = await supabase
      .from("learning_product_prices")
      .select(
        `
          id,
          product_id,
          amount_paise,
          currency,
          active,
          valid_from,
          valid_until
        `
      )
      .eq(
        "product_id",
        typedSubjectProduct.id
      )
      .eq("active", true)
      .order("valid_from", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (priceError) {
      throw new Error(
        `Failed to load Mathematics subject product price: ${priceError.message}`
      );
    }

    subjectProductPrice =
      (price as LearningProductPrice | null) ?? null;
  }

  /* ---------------------------------------------------------
   * 7. Find Mathematics chapters
   * --------------------------------------------------------- */

  const chapters = typedNodes
    .filter(
      (node) =>
        node.parent_node_id === mathematicsNode.id
    )
    .sort((a, b) => {
      const aOrder =
        a.sequence_order ??
        Number.MAX_SAFE_INTEGER;

      const bOrder =
        b.sequence_order ??
        Number.MAX_SAFE_INTEGER;

      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }

      return a.display_name.localeCompare(
        b.display_name
      );
    });

  return (
    <AdminPage
      title={typedProgram.name}
      description="Manage Mathematics subject-level and chapter-level access and pricing for this class."
      sectionTitle="Mathematics"
      sectionDescription={`${chapters.length} chapters · Session ${latestVersion.session}`}
    >
      {/* -----------------------------------------------------
          Back
      ----------------------------------------------------- */}

      <div className="mb-6">
        <Link
          href="/admin/access-pricing"
          className="
            text-sm
            font-semibold
            text-blue-700
            hover:text-blue-900
            dark:text-blue-400
            dark:hover:text-blue-300
          "
        >
          ← Back to Classes
        </Link>
      </div>

      {/* -----------------------------------------------------
          Subject Header
      ----------------------------------------------------- */}

      <div
        className="
          mb-8
          rounded-2xl
          border
          border-slate-200
          bg-white
          p-6
          shadow-sm
          dark:border-slate-800
          dark:bg-slate-900
        "
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Subject
            </p>

            <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
              {mathematicsNode.display_name}
            </h2>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Curriculum session: {latestVersion.session}
            </p>
          </div>

          <div
            className="
              inline-flex
              w-fit
              items-center
              rounded-full
              bg-slate-100
              px-4
              py-2
              text-xs
              font-semibold
              text-slate-600
              dark:bg-slate-800
              dark:text-slate-300
            "
          >
            {chapters.length} Chapters
          </div>
        </div>
      </div>

      {/* -----------------------------------------------------
          Subject Product
      ----------------------------------------------------- */}

      <section className="mb-10">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Mathematics Subject Product
          </h2>

          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            This product provides subject-level paid access
            across the Mathematics curriculum. Chapter products
            remain independently configurable.
          </p>
        </div>

        <div
          className="
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-6
            shadow-sm
            dark:border-slate-800
            dark:bg-slate-900
          "
        >
          {!typedSubjectProduct ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-base font-bold text-slate-900 dark:text-white">
                  Subject Product Not Found
                </p>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  No SUBJECT learning product is currently
                  attached to the Mathematics curriculum node.
                </p>
              </div>

              <span
                className="
                  inline-flex
                  w-fit
                  rounded-full
                  bg-amber-50
                  px-3
                  py-1
                  text-xs
                  font-semibold
                  text-amber-700
                  dark:bg-amber-950
                  dark:text-amber-300
                "
              >
                NOT CONFIGURED
              </span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Product Summary */}

              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="
                        rounded-full
                        bg-blue-50
                        px-3
                        py-1
                        text-xs
                        font-semibold
                        text-blue-700
                        dark:bg-blue-950
                        dark:text-blue-300
                      "
                    >
                      SUBJECT PRODUCT
                    </span>

                    <span
                      className={`
                        rounded-full
                        px-3
                        py-1
                        text-xs
                        font-semibold
                        ${
                          typedSubjectProduct.status ===
                          "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        }
                      `}
                    >
                      {typedSubjectProduct.status}
                    </span>
                  </div>

                  <h3 className="mt-3 text-lg font-bold text-slate-900 dark:text-white">
                    {typedSubjectProduct.title}
                  </h3>

                  {typedSubjectProduct.description && (
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                      {typedSubjectProduct.description}
                    </p>
                  )}

                  <p className="mt-3 break-all text-xs text-slate-400">
                    Product ID: {typedSubjectProduct.id}
                  </p>
                </div>

                <div className="shrink-0 rounded-2xl border border-slate-200 bg-slate-50 px-6 py-5 dark:border-slate-700 dark:bg-slate-800/60">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Current Price
                  </p>

                  <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                    {subjectProductPrice
                      ? formatPrice(
                          subjectProductPrice.amount_paise,
                          subjectProductPrice.currency
                        )
                      : "Not configured"}
                  </p>

                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {subjectProductPrice
                      ? "Active price"
                      : "No active price configured"}
                  </p>
                </div>
              </div>

              {/* Product Information */}

              <div
                className="
                  grid
                  gap-3
                  border-t
                  border-slate-200
                  pt-5
                  sm:grid-cols-2
                  dark:border-slate-800
                "
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
                    Product Type
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Mathematics Subject
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">
                    Pricing Status
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {subjectProductPrice
                      ? "Configured"
                      : "Not configured"}
                  </p>
                </div>
              </div>

              {/* Pricing Authority */}

              <div
                className="
                  rounded-xl
                  border
                  border-dashed
                  border-slate-300
                  bg-slate-50
                  px-4
                  py-3
                  text-sm
                  text-slate-600
                  dark:border-slate-700
                  dark:bg-slate-800/40
                  dark:text-slate-400
                "
              >
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Pricing authority:
                </span>{" "}
                Mathematics Subject Product. Chapter and
                individual resource prices do not determine this
                subject product price.
              </div>

              {/* Price Control */}

              <LearningProductPriceControl
                productId={typedSubjectProduct.id}
                currentAmountPaise={
                  subjectProductPrice?.amount_paise ??
                  null
                }
                currency={
                  subjectProductPrice?.currency ??
                  "INR"
                }
              />
            </div>
          )}
        </div>
      </section>

      {/* -----------------------------------------------------
          Chapter Products
      ----------------------------------------------------- */}

      <section>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Chapter Products
          </h2>

          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            Each Mathematics chapter has its own chapter-level
            product and pricing configuration.
          </p>
        </div>

        {chapters.length === 0 ? (
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
            <div className="text-4xl">📖</div>

            <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
              No Chapters Available
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
              No active Mathematics chapters are currently
              available for this class.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {chapters.map((chapter) => (
              <Link
                key={chapter.id}
                href={`/admin/access-pricing/${typedProgram.id}/${chapter.id}`}
                className="
                  group
                  rounded-2xl
                  border
                  border-slate-200
                  bg-white
                  p-5
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
                <div className="flex items-start gap-4">
                  {/* Chapter Number */}

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
                      text-sm
                      font-bold
                      text-slate-700
                      transition-colors
                      group-hover:bg-slate-900
                      group-hover:text-white
                      dark:bg-slate-800
                      dark:text-slate-300
                      dark:group-hover:bg-white
                      dark:group-hover:text-slate-900
                    "
                  >
                    {chapter.sequence_order ?? "—"}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Chapter {chapter.sequence_order ?? "—"}
                    </p>

                    <h3 className="mt-1 text-base font-bold leading-6 text-slate-900 dark:text-white">
                      {chapter.display_name}
                    </h3>

                    {chapter.description && (
                      <p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-500 dark:text-slate-400">
                        {chapter.description}
                      </p>
                    )}

                    <div className="mt-4 flex items-center gap-2">
                      <span
                        className="
                          rounded-full
                          bg-slate-100
                          px-3
                          py-1
                          text-xs
                          font-semibold
                          text-slate-600
                          dark:bg-slate-800
                          dark:text-slate-300
                        "
                      >
                        Chapter Product
                      </span>

                      <span className="text-xs font-semibold text-slate-400 transition-colors group-hover:text-slate-700 dark:group-hover:text-slate-200">
                        Manage →
                      </span>
                    </div>
                  </div>

                  <span
                    className="
                      shrink-0
                      text-lg
                      text-slate-400
                      transition-transform
                      duration-200
                      group-hover:translate-x-0.5
                      group-hover:text-slate-700
                      dark:group-hover:text-white
                    "
                    aria-hidden="true"
                  >
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </AdminPage>
  );
}